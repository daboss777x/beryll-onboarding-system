import { expect, test, type Page } from "@playwright/test";
import { loginAs } from "./helpers";
import { INJECTIONS, SECRETS, leaks } from "./ai-helpers";


async function coach(page: Page, question: string) {
  const r = await page.request.post("/api/ai/coach", { data: { question } });
  return { status: r.status(), text: await r.text() };
}

test.describe("AI guardrails (fallback mode)", () => {
  test("secret strings were loaded for grepping", () => {
    expect(SECRETS.length, "parsed secret strings from content/server").toBeGreaterThan(30);
  });

  test("coach: injection prompts never surface hidden goals, rubric or answer keys", async ({ page }) => {
    await loginAs(page, "hire");
    for (const q of INJECTIONS) {
      const { status, text } = await coach(page, q);
      expect([200, 400, 429], `${status} for ${q}`).toContain(status);
      expect(leaks(text), `coach leaked for: ${q}`).toEqual([]);
      expect(text).not.toMatch(/sk-[A-Za-z0-9]{10,}|OPENAI_API_KEY\s*=|DEMO_SESSION_SECRET|stack|at \S+ \(.*:\d+:\d+\)/i);
    }
  });

  test("coach: validation errors are clean JSON, not stack traces", async ({ page }) => {
    await loginAs(page, "hire");
    for (const body of [{}, { question: "" }, { question: "x" }, { question: "a".repeat(5000) }, { question: "ok question", history: "nope" }]) {
      const r = await page.request.post("/api/ai/coach", { data: body });
      expect(r.status()).toBe(400);
      const t = await r.text();
      expect(t).not.toMatch(/at \S+ \(.*:\d+:\d+\)|node_modules|ZodError/);
    }
    expect((await page.request.post("/api/ai/coach", { headers: { "content-type": "application/json" }, data: "{not json" })).status()).toBe(400);
  });

  test("coach and roleplay refuse anonymous callers", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    expect((await anon.post("/api/ai/coach", { data: { question: "hello there" } })).status()).toBe(401);
    expect((await anon.post("/api/ai/roleplay", { data: { action: "turn", personaId: "bank-ciso", message: "hi" } })).status()).toBe(401);
    expect((await anon.get("/api/certificate/day30")).status()).toBe(401);
    await anon.dispose();
  });

  test("role-play (practice): injection turns and the graded result leak nothing", async ({ page }) => {
    await loginAs(page, "hire");
    // The certification variant needs an unlocked hire (Sofia) and lives in flows.spec.ts ("Sofia certification chain").
    for (const cert of [false]) {
      let sid: string | undefined;
      const seen: string[] = [];
      for (const [i, m] of INJECTIONS.slice(0, 6).entries()) {
        const r = await page.request.post("/api/ai/roleplay", { data: { action: "turn", personaId: "bank-ciso", message: m, ...(sid ? { sessionId: sid } : cert ? { certification: true } : {}) } });
        if (r.status() === 429) break;
        expect(r.status(), `turn ${i} cert=${cert}`).toBe(200);
        sid = r.headers()["x-session-id"];
        seen.push(await r.text());
      }
      expect(leaks(seen.join("\n")), `role-play replies leaked (cert=${cert})`).toEqual([]);
      if (!sid) continue;
      const end = await page.request.post("/api/ai/roleplay", { data: { action: "end", sessionId: sid } });
      if (end.status() === 429) continue; // daily certification cap reached by earlier tests
      expect(end.status()).toBe(200);
      const body = await end.text();
      expect(leaks(body), `end result leaked (cert=${cert})`).toEqual([]);
      const j = JSON.parse(body);
      // Abuse turns must not score well: no free pass for injection spam.
      expect(j.result.passed, `injection-only transcript passed (cert=${cert}, overall=${j.result.overall})`).toBe(false);
      expect(j.certification?.status ?? "pending").not.toBe("passed");
    }
  });

  test("certification is refused server-side while locked (Alex)", async ({ page }) => {
    await loginAs(page, "hire");
    const r = await page.request.post("/api/ai/roleplay", { data: { action: "turn", personaId: "bank-ciso", certification: true, message: "Hello, thanks for your time." } });
    expect(r.status()).toBe(403);
    expect((await r.json()).code).toBe("cert_locked");
    expect(r.headers()["x-session-id"]).toBeUndefined();
    // a forged end for a session id that was never created is also refused cleanly
    const e = await page.request.post("/api/ai/roleplay", { data: { action: "end", sessionId: "00000000-0000-4000-8000-0000000000aa" } });
    expect(e.status()).toBe(404);
  });

  test("role-play: other users' sessions are not reachable", async ({ page, browser }) => {
    await loginAs(page, "hire");
    const r = await page.request.post("/api/ai/roleplay", { data: { action: "turn", personaId: "bank-ciso", message: "Hello, thanks for your time." } });
    const sid = r.headers()["x-session-id"];
    const other = await browser.newContext({ baseURL: "http://localhost:3210" });
    const op = await other.newPage();
    await op.goto("/login");
    const { DEMO_PASSWORD } = await import("../../content/demo");
    await op.getByLabel("Email").fill("sofia@beryll.demo");
    await op.getByLabel("Password").fill(DEMO_PASSWORD);
    await op.getByRole("button", { name: "Sign in", exact: true }).click();
    await op.waitForURL(/\/today/);
    expect((await op.request.post("/api/ai/roleplay", { data: { action: "end", sessionId: sid } })).status()).toBe(404);
    expect((await op.request.post("/api/ai/roleplay", { data: { action: "turn", personaId: "bank-ciso", sessionId: sid, message: "hi" } })).status()).toBe(404);
    await other.close();
  });

  test("rendered HTML of AI pages carries no secret strings", async ({ page }) => {
    await loginAs(page, "hire");
    for (const path of ["/practice/roleplay", "/practice/roleplay?persona=bank-ciso", "/certification", "/today", "/learn"]) {
      const r = await page.request.get(path);
      const html = await r.text();
      expect(leaks(html), `HTML of ${path}`).toEqual([]);
    }
  });

  // Hardened by Joel: keyword lists earn nothing, and with no creditable sentence the call is "not_assessed" (score 0, session stays open).
  test("fallback grader: a keyword-salad transcript is not assessed, never passed", async ({ page }) => {
    await loginAs(page, "hire");
    const salad =
      "thank you, i understand, happy to, of course. scope authorised report retest engineer methodology window. escalate to a colleague, get back to you. secure portal encrypt nda. can't promise, depends on, realistic. next steps: send you a proposal, book a call, follow up by friday.";
    const t = await page.request.post("/api/ai/roleplay", { data: { action: "turn", personaId: "bank-ciso", message: salad } });
    expect(t.status()).toBe(200);
    const sid = t.headers()["x-session-id"];
    const end = await page.request.post("/api/ai/roleplay", { data: { action: "end", sessionId: sid } });
    expect(end.status()).toBe(200);
    const j = await end.json();
    expect(j.assessment).toBe("not_assessed");
    expect(j.result.passed).toBe(false);
    expect(j.result.overall).toBe(0);
    expect(j.result.scores.every((x: { score: number }) => x.score === 0)).toBe(true);
    expect(j.certification).toBeUndefined();
  });
});
