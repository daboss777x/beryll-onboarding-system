import { expect, test } from "@playwright/test";
import { loginAs, MANAGER_NADIA, noHorizontalScroll } from "./helpers";

const HIRE = ["/today", "/roadmap", "/me", "/me/story", "/pulse/7", "/people", "/people/matcher", "/contracts", "/labs/redline-lab", "/labs/phishing-sim", "/missions/fix-one-sop"];
const MANAGER = ["/team", `/team/${MANAGER_NADIA}`];
const BUDDY = ["/buddy"];
const slug = (r: string) => r.replace(/\W+/g, "_").replace(/^_|_$/g, "");

const SETS = [
  { role: "hire" as const, routes: HIRE },
  { role: "manager" as const, routes: MANAGER },
  { role: "buddy" as const, routes: BUDDY },
];

for (const theme of ["light", "dark"] as const) {
  test(`360px ${theme}: no horizontal scroll, screenshots`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 360, height: 740 });
    const problems: string[] = [];
    for (const { role, routes } of SETS) {
      await loginAs(page, role);
      for (const r of routes) {
        await page.goto(r);
        await page.waitForLoadState("networkidle");
        await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
        await page.waitForTimeout(250);
        const over = await noHorizontalScroll(page);
        if (over > 0) {
          const culprits = await page.evaluate(() =>
            [...document.querySelectorAll("body *")]
              .filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
              .slice(0, 3)
              .map((e) => `${e.tagName.toLowerCase()}.${(e.getAttribute("class") || "").slice(0, 60)}`),
          );
          problems.push(`${role} ${r} (${theme}): horizontal overflow ${over}px; e.g. ${culprits.join(" | ")}`);
        }
        await page.screenshot({ path: `tests/e2e/screenshots/m360-${theme}-${slug(r)}.png`, fullPage: true });
      }
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });
}

test("desktop dark screenshots of key pages", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const { role, routes } of SETS) {
    await loginAs(page, role);
    for (const r of routes.slice(0, 4)) {
      await page.goto(r);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
      await page.waitForTimeout(250);
      await page.screenshot({ path: `tests/e2e/screenshots/d1280-dark-${slug(r)}.png`, fullPage: true });
    }
  }
});
