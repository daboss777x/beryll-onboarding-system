import { expect, test } from "@playwright/test";
import { loginAs, MANAGER_NADIA, watchErrors } from "./helpers";

const HIRE_ROUTES = ["/today", "/roadmap", "/me", "/me/story", "/pulse/7", "/people", "/people/matcher", "/missions/fix-one-sop", "/review/due", "/contracts"];

test("hire routes render with no console errors", async ({ page }) => {
  const errors = watchErrors(page);
  let current = "login";
  page.on("pageerror", (e) => errors.push(`[on ${current}] ${e.message.slice(0, 80)}`));
  await loginAs(page, "hire");
  // find a checklist id from the app itself
  await page.goto("/today");
  const href = await page.locator("a[href^='/checklist/']").first().getAttribute("href").catch(() => null);
  const routes = [...HIRE_ROUTES, href ?? "/checklist/preboarding"];
  const bad: string[] = [];
  for (const r of routes) {
    current = r;
    const res = await page.goto(r);
    await page.waitForLoadState("networkidle");
    const status = res?.status() ?? 0;
    const body = (await page.locator("body").innerText()).slice(0, 4000);
    if (status >= 400 || /Application error|This page could not be found|Something went wrong/i.test(body)) bad.push(`${r} -> ${status} ${body.slice(0, 120).replace(/\n/g, " ")}`);
  }
  expect(bad, bad.join("\n")).toEqual([]);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("manager and buddy routes render with no console errors", async ({ page }) => {
  const errors = watchErrors(page);
  await loginAs(page, "manager");
  for (const r of ["/team", `/team/${MANAGER_NADIA}`]) {
    const res = await page.goto(r);
    expect(res?.status(), r).toBeLessThan(400);
    await page.waitForLoadState("networkidle");
  }
  await loginAs(page, "buddy");
  const res = await page.goto("/buddy");
  expect(res?.status()).toBeLessThan(400);
  await page.waitForLoadState("networkidle");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("role guards: hire cannot open /team, buddy cannot open /today", async ({ page }) => {
  await loginAs(page, "hire");
  await page.goto("/team");
  expect(page.url()).not.toMatch(/\/team$/);
  await loginAs(page, "buddy");
  await page.goto("/today");
  expect(page.url()).not.toMatch(/\/today$/);
});

test("Ask Beryl answers in fallback mode with citation chips", async ({ page }) => {
  await loginAs(page, "hire");
  await page.getByRole("button", { name: "Ask Beryl" }).first().click();
  const box = page.getByPlaceholder(/Who approves a 10% discount/);
  await expect(box).toBeVisible();
  await box.fill("Can I discount a SOW by 15%?");
  await box.press("Enter");
  const sources = page.getByRole("list", { name: "Sources" });
  await expect(sources).toBeVisible({ timeout: 30_000 });
  expect(await sources.locator("li").count()).toBeGreaterThan(0);
  await page.screenshot({ path: "tests/e2e/screenshots/ask-beryl.png" });
  // off-SOP question should not cite
  await box.fill("What is the best pizza topping?");
  await box.press("Enter");
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "tests/e2e/screenshots/ask-beryl-offsop.png" });
});

test("Ask Beryl is fully keyboard-operable (open, focus in panel, type, send, Esc closes, focus returns)", async ({ page }) => {
  await loginAs(page, "hire");
  await page.waitForLoadState("networkidle");
  const opener = page.getByRole("button", { name: "Ask Beryl" }).locator("visible=true").first();
  await opener.focus();
  await page.keyboard.press("Enter");
  const box = page.getByPlaceholder(/Who approves a 10% discount/);
  await expect(box).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName), { message: "focus should move into the panel textarea" }).toBe("TEXTAREA");
  await page.keyboard.type("Who approves a 10% discount?");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("list", { name: "Sources" })).toBeVisible({ timeout: 30_000 });
  // Panel contents must be reachable with Tab and focus must stay trapped inside the dialog
  const inside: boolean[] = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    inside.push(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]")));
  }
  expect(inside, "Tab must not escape the open panel").not.toContain(false);
  await page.keyboard.press("Escape");
  await expect(box).toBeHidden();
  const back = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent?.trim());
  expect(back, "focus should return to the opener").toMatch(/Ask Beryl/);
});
