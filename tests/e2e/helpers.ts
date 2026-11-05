import { expect, type BrowserContext, type Page } from "@playwright/test";

export type Role = "hire" | "manager" | "buddy";
const HOME: Record<Role, RegExp> = { hire: /\/today/, manager: /\/team/, buddy: /\/buddy/ };

/** Quick-login with a demo card. Clears any previous session first. */
export async function loginAs(page: Page, role: Role) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByTestId(`demo-login-${role}`).click();
  await page.waitForURL(HOME[role]);
}

/** Collect console errors and uncaught page errors. Call before navigating. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()} @ ${m.location().url}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 500) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  return errors;
}

export async function xpOf(page: Page): Promise<number> {
  await page.goto("/today");
  await expect(page.getByText(/\d[\d,]*\s*\/\s*[\d,]+\s*XP/).first()).toBeVisible();
  const text = await page.locator("body").innerText();
  const m = text.match(/(\d[\d,]*)\s*\/\s*[\d,]+\s*XP/)!;
  return Number(m[1].replace(/,/g, ""));
}

export async function noHorizontalScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

export async function setDark(page: Page, dark: boolean, ctx?: BrowserContext) {
  void ctx;
  await page.evaluate((d) => document.documentElement.setAttribute("data-theme", d ? "dark" : "light"), dark);
}

export const MANAGER_NADIA = "00000000-0000-4000-8000-000000000015";
export const HIRE_ALEX = "00000000-0000-4000-8000-000000000010";
export const HIRE_SOFIA = "00000000-0000-4000-8000-000000000013";
