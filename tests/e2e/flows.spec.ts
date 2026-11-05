import { expect, test } from "@playwright/test";
import { DEMO_PASSWORD } from "../../content/demo";
import { HIRE_ALEX, HIRE_SOFIA, loginAs, MANAGER_NADIA, watchErrors, xpOf } from "./helpers";
import { INJECTIONS, leaks } from "./ai-helpers";

test.describe("(b) manager", () => {
  test("team list shows Nadia flagged at risk", async ({ page }) => {
    await loginAs(page, "manager");
    await expect(page.getByRole("heading", { name: /Your team/ })).toBeVisible();
    const nadia = page.locator(`a[href="/team/${MANAGER_NADIA}"]`).filter({ hasText: "Nadia Haddad" }).first();
    await expect(nadia).toContainText(/At risk/);
    await page.screenshot({ path: "tests/e2e/screenshots/team.png", fullPage: true });
  });

  test("clicking a hire opens the detail page (client-side navigation)", async ({ page }) => {
    await loginAs(page, "manager");
    await page.waitForLoadState("networkidle");
    await page.locator(`a[href="/team/${MANAGER_NADIA}"]`).filter({ hasText: "Nadia Haddad" }).first().click();
    await page.waitForURL(`**/team/${MANAGER_NADIA}`, { timeout: 10_000 });
  });

  test("hire detail sections render (direct load)", async ({ page }) => {
    await loginAs(page, "manager");
    await page.goto(`/team/${MANAGER_NADIA}`);
    await expect(page.getByRole("heading", { name: "Nadia Haddad" })).toBeVisible();
    for (const h of ["Progress", "Check-ins", "Certification", "QA sampling", "Day-90 sign-off"]) {
      await expect(page.getByRole("heading", { name: h, exact: true }).first(), `section ${h}`).toBeVisible();
    }
    await expect(page.getByText("Low pulse score")).toBeVisible();
    await page.screenshot({ path: "tests/e2e/screenshots/team-detail.png", fullPage: true });
  });
});

test.describe("(c) buddy", () => {
  test("confirming a quest gives the hire XP", async ({ page }) => {
    await loginAs(page, "hire");
    const before = await xpOf(page);
    await loginAs(page, "buddy");
    const confirms = page.getByRole("button", { name: /^Confirm:/ });
    const n = await confirms.count();
    expect(n).toBeGreaterThan(0);
    await confirms.first().click();
    await expect(confirms).toHaveCount(n - 1);
    await loginAs(page, "hire");
    const after = await xpOf(page);
    expect(after, `hire XP before=${before} after=${after}`).toBeGreaterThan(before);
  });
});

test.describe("(a) hire time-skip", () => {
  const vis = (l: import("@playwright/test").Locator) => l.locator("visible=true");
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "hire");
    await vis(page.getByRole("button", { name: /Reset/ })).click();
    await page.waitForTimeout(800);
  });

  // Reset is a full reset (day 0, progress, XP, trophies back to the seed), so beforeEach makes every test independent of order.
  test("skipping days past a stage start does NOT unlock it until the previous stage is complete (documents gating)", async ({ page }) => {
    await vis(page.getByRole("button", { name: "+7 days" })).click();
    await page.waitForTimeout(800);
    await vis(page.getByRole("button", { name: "+7 days" })).click();
    await page.waitForTimeout(800);
    await page.goto("/roadmap");
    // Day 14+ but required pre-boarding steps are undone: still pre-boarding.
    await expect(page.getByRole("img", { name: /Pre-boarding: / })).toBeVisible();
    const labels = await page.getByRole("img").evaluateAll((e) => e.map((x) => x.getAttribute("aria-label") ?? ""));
    expect(labels.find((l) => l.startsWith("Weeks 1-2")), labels.join(" / ")).toMatch(/Locked/i);
  });

  test("+1 / +7 days move the program day; reset restores it", async ({ page }) => {
    const dayOf = async () => {
      await page.goto("/today");
      // Right after a server action, /today can be at the loading skeleton when `load` fires: wait for the real header.
      await expect(page.locator("main")).toContainText(/DAY \d+|BEFORE YOU START(?!:)/i);
      const t = await page.locator("main").innerText();
      return Number(t.match(/DAY (\d+)/i)?.[1] ?? 0); // day 0 shows "Before you start"
    };
    const d0 = await dayOf();
    await vis(page.getByRole("button", { name: "+7 days" })).click();
    await expect(page.getByText(/Moved to day/).first()).toBeVisible();
    expect(await dayOf()).toBe(d0 + 7);
    await vis(page.getByRole("button", { name: "+1 day" })).click();
    await page.waitForTimeout(800);
    expect(await dayOf()).toBe(d0 + 8);
    await vis(page.getByRole("button", { name: /Reset/ })).click();
    await page.waitForTimeout(800);
    expect(await dayOf()).toBe(d0);
  });

  test("jump to stage makes it the active stage, earlier stages Done", async ({ page }) => {
    await vis(page.getByLabel("Jump to stage")).selectOption({ label: "Days 8-30 (certify)" });
    await vis(page.getByRole("button", { name: "Go", exact: true })).click();
    await page.waitForTimeout(2000);
    await page.goto("/roadmap");
    await expect(page.getByRole("img", { name: /Days 8-30 \(certify\): In progress/ })).toBeVisible();
    await expect(page.getByRole("img", { name: /Weeks 1-2: (Done|Complete)/ })).toBeVisible();
    await page.screenshot({ path: "tests/e2e/screenshots/roadmap-jumped.png", fullPage: true });
  });

});

test.describe("labs (Harry)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "hire");
    await page.getByLabel("Jump to stage").locator("visible=true").selectOption({ label: "Days 8-30 (certify)" });
    await page.getByRole("button", { name: "Go", exact: true }).locator("visible=true").click();
    await page.waitForTimeout(1500);
  });
  for (const id of ["phishing-sim", "redline-lab", "signature-story", "data-handling-drills", "translator-drills"]) {
    test(`/labs/${id} renders`, async ({ page }) => {
      const errs: string[] = [];
      page.on("pageerror", (e) => errs.push(e.message));
      const res = await page.goto(`/labs/${id}`);
      expect(res?.status()).toBeLessThan(400);
      await expect(page.locator("main")).not.toBeEmpty();
      await page.screenshot({ path: `tests/e2e/screenshots/lab-${id}.png`, fullPage: true });
      expect(errs).toEqual([]);
    });
  }
});

const GOOD_REPLIES = [
  "Thank you for raising that, I understand the concern. Our scope is agreed and authorised in writing before any pen test starts, and we report in a clear methodology-based report.",
  "I can't promise or guarantee the result, it depends on the scope. Let me confirm that with our engineer and get back to you. We'd use a secure portal, with encryption and an NDA, never personal email.",
  "Happy to help. Next step: I will send you a proposal by Friday and book a call next week to follow up. I'll escalate the technical question to a colleague on the SOC team.",
];

async function resetAndJumpToCertify(page: import("@playwright/test").Page) {
  await loginAs(page, "hire");
  const vis = (l: import("@playwright/test").Locator) => l.locator("visible=true");
  await vis(page.getByRole("button", { name: /Reset/ })).click();
  await page.waitForTimeout(800);
  await vis(page.getByLabel("Jump to stage")).selectOption({ label: "Days 8-30 (certify)" });
  await vis(page.getByRole("button", { name: "Go", exact: true })).click();
  await page.waitForTimeout(1500);
  // jump lands on day 15; the certification and practice calls open on days 18-22
  await vis(page.getByRole("button", { name: "+7 days" })).click();
  await expect(page.getByText(/Moved to day 22/).first()).toBeVisible();
}

async function talk(page: import("@playwright/test").Page, replies: string[]) {
  const box = page.getByLabel("Your reply");
  for (const [i, r] of replies.entries()) {
    await box.fill(r);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    // the reply streams in; the turn counter drops once the exchange is stored
    await expect(page.getByText(`${12 - (i + 1)} turns left`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Send", exact: true })).toBeDisabled(); // empty draft again, not streaming
  }
}

test.describe("(a) hire to certification (AI fallback, no OpenAI key)", () => {
  test("/practice/roleplay: chat, finish, graded fallback result", async ({ page }) => {
    const errs = watchErrors(page);
    await resetAndJumpToCertify(page);
    await page.goto("/practice/roleplay");
    // Click can race hydration/soft navigation on a cold server; fall back to the link's href if the URL does not change.
    const link = page.locator('a[href^="/practice/roleplay?persona="]').first();
    const href = await link.getAttribute("href");
    await link.click();
    await page.waitForURL(/persona=/, { timeout: 8_000 }).catch(() => page.goto(href!));
    await expect(page.getByLabel("Your reply")).toBeVisible();
    await expect(page.getByRole("button", { name: /End & score/ })).toBeDisabled();
    await talk(page, GOOD_REPLIES.slice(0, 2));
    await page.getByRole("button", { name: /End & score/ }).click();
    await expect(page.getByText("Strongest:").first()).toBeVisible({ timeout: 20_000 }); // fallback summary text
    await expect(page.getByText(/Quick automatic check/).first()).toBeVisible();
    await expect(page.getByText(/^(Pass|Not yet)$/).first()).toBeVisible();
    await page.screenshot({ path: "tests/e2e/screenshots/roleplay-result.png", fullPage: true });
    expect(errs.filter((e) => !/favicon/.test(e))).toEqual([]);
  });

});

// Alex can't reach certification by time-skip: it needs every required day 8-30 task done (labs, walkthroughs, 3 practice calls).
// Sofia is seeded one step short (day 22, two practice calls done, "business owner after a breach" still Ready) and already holds a
// pending AI score of 84. Her state is NOT covered by Demo Reset (demo hire only), so this chain is single-shot per server
// (playwright.config.ts starts a fresh server each run unless PW_REUSE=1). The tests depend on each other, so they are serial:
// unlock -> API certification checks -> manager observation + PDF.
test.describe.serial("Sofia certification chain (AI fallback, no OpenAI key)", () => {
  async function loginSofia(page: import("@playwright/test").Page) {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email").fill("sofia@beryll.demo");
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL(/\/today/);
  }
  const certTurn = (page: import("@playwright/test").Page, data: object) => page.request.post("/api/ai/roleplay", { data: { action: "turn", personaId: "bank-ciso", ...data } });

  test("1. locked until the last practice call is finished", async ({ page }) => {
    await loginSofia(page);
    await page.goto("/certification");
    await expect(page.getByText("Locked", { exact: true }).first()).toBeVisible(); // one practice call still open
    expect((await page.request.get("/api/certificate/day30")).status()).toBe(403);
    // the server enforces the same rule
    const r = await certTurn(page, { certification: true, message: "Hello, thanks for your time." });
    expect(r.status()).toBe(403);
    expect((await r.json()).code).toBe("cert_locked");

    await page.goto("/practice/roleplay?persona=sme-owner-breach");
    await talk(page, GOOD_REPLIES);
    await page.getByRole("button", { name: /End & score/ }).click();
    await expect(page.getByText(/Quick automatic check/).first()).toBeVisible({ timeout: 20_000 });

    await page.goto("/certification");
    await expect(page.getByText("Locked", { exact: true })).toHaveCount(0);
    await expect(page.getByText(/Your AI role-play passed with \d+/)).toBeVisible(); // seeded AI part (84)
    await expect(page.getByText("Pending", { exact: true })).toBeVisible();
  });

  test("2. fallback certification result is capped at 74, needs an AI grade, and never overwrites the stored AI score", async ({ page }) => {
    await loginSofia(page);
    const t1 = await certTurn(page, { certification: true, message: GOOD_REPLIES[0] });
    expect(t1.status()).toBe(200);
    expect(t1.headers()["x-ai-mode"]).toBeTruthy();
    const sid = t1.headers()["x-session-id"];
    expect(sid).toMatch(/^[0-9a-f-]{36}$/);
    expect(t1.headers()["x-turns-left"]).toBe("11");
    expect((await t1.text()).length).toBeGreaterThan(10);
    expect((await certTurn(page, { sessionId: sid, message: GOOD_REPLIES[1] })).status()).toBe(200);
    expect((await certTurn(page, { sessionId: sid, message: GOOD_REPLIES[2] })).status()).toBe(200);
    const end = await page.request.post("/api/ai/roleplay", { data: { action: "end", sessionId: sid } });
    expect(end.status()).toBe(200);
    const j = await end.json();
    expect(j.assessment).toBe("scored");
    expect(j.result.scores).toHaveLength(6);
    expect(j.result.overall).toBeLessThanOrEqual(74);
    expect(j.result.passed).toBe(false);
    expect(j.result.summary).toMatch(/Quick automatic check/);
    expect(j.certification.needsAiGrade).toBe(true);
    expect(["pending", "retest"]).toContain(j.certification.status);
    // second end returns the stored grade, no re-grade
    const again = await page.request.post("/api/ai/roleplay", { data: { action: "end", sessionId: sid } });
    expect((await again.json()).result.overall).toBe(j.result.overall);
    expect((await certTurn(page, { sessionId: sid, message: "hello again" })).status()).toBe(409);
    // the stored AI score (84) survives the weaker fallback grade
    await page.goto("/certification");
    await expect(page.getByText(/Your AI role-play passed with 84/)).toBeVisible();
  });

  test("3. certification injection turns and graded result leak nothing and cannot pass", async ({ page }) => {
    await loginSofia(page);
    const seen: string[] = [];
    let sid: string | undefined;
    for (const [i, m] of INJECTIONS.slice(0, 6).entries()) {
      const r = await certTurn(page, sid ? { sessionId: sid, message: m } : { certification: true, message: m });
      if (r.status() === 429) break;
      expect(r.status(), `turn ${i}`).toBe(200);
      sid = r.headers()["x-session-id"];
      seen.push(await r.text());
    }
    expect(leaks(seen.join("\n")), "cert replies leaked").toEqual([]);
    if (!sid) return;
    const end = await page.request.post("/api/ai/roleplay", { data: { action: "end", sessionId: sid } });
    if (end.status() === 429) return; // daily certification cap
    expect(end.status()).toBe(200);
    const body = await end.text();
    expect(leaks(body), "end result leaked").toEqual([]);
    const j = JSON.parse(body);
    expect(j.result.passed).toBe(false);
    expect(j.certification?.status ?? "pending").not.toBe("passed");
  });

  test("4. manager observation >= 3/5 certifies; hire downloads the day-30 PDF", async ({ page, browser }) => {
    await loginSofia(page);
    // Manager records an observation (all criteria 4/5)
    const mctx = await browser.newContext({ baseURL: "http://localhost:3210" });
    const mpage = await mctx.newPage();
    await loginAs(mpage, "manager");
    await mpage.goto(`/team/${HIRE_SOFIA}`);
    const groups = mpage.locator('[role="radiogroup"]');
    const n = await groups.count();
    expect(n).toBe(6);
    for (let i = 0; i < n; i++) await groups.nth(i).locator("label", { hasText: /^4$/ }).click();
    await mpage.getByRole("button", { name: "Save observation" }).click();
    await expect(mpage.getByText(/Certified for solo client contact/)).toBeVisible({ timeout: 15_000 });
    await mctx.close();

    // Hire sees certified and can download the PDF
    await page.goto("/certification");
    await expect(page.getByText("Passed", { exact: true }).first()).toBeVisible();
    const res = await page.request.get("/api/certificate/day30");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");
    const body = await res.body();
    expect(body.length).toBeGreaterThan(2_000);
    expect(body.subarray(0, 5).toString()).toBe("%PDF-");
    // day 90 not reached
    expect((await page.request.get("/api/certificate/day90")).status()).toBe(403);
  });
});

test("hire detail id sanity", () => {
  expect(HIRE_ALEX).toBeTruthy();
});
