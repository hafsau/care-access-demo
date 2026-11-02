import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

for (const path of ["/", "/prescreen", "/prescreen?lang=es", "/coordinator", "/coordinator?id=CA-24109", "/states", "/system", "/case-study"]) {
  test(`no WCAG 2.2 AA violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await axe(page);
  });
}

test("the consent step and an open call panel are accessible", async ({ page }) => {
  await page.goto("/prescreen");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByLabel("ZIP code").fill("90022");
  await page.getByRole("radio", { name: /Maple Street/ }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "Me", exact: true }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Month").fill("3");
  await page.getByLabel("Day").fill("14");
  await page.getByLabel("Year").fill("1968");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click(); // with errors showing
  await axe(page);

  await page.goto("/coordinator?id=CA-24098");
  await page.getByRole("button", { name: "Call in English" }).click();
  await axe(page);
});

test("pinch-zoom is allowed", async ({ page }) => {
  await page.goto("/prescreen");
  const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(viewport).not.toMatch(/user-scalable=no|maximum-scale/);
});
