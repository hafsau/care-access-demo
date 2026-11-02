import { expect, test } from "@playwright/test";

// 320px is WCAG 1.4.10 reflow (and 1280px at 400% zoom); the mobile project also covers a Pixel 7.
test.use({ viewport: { width: 320, height: 720 } });

for (const path of ["/", "/prescreen", "/coordinator", "/states", "/system", "/case-study"]) {
  test(`no horizontal scroll at 320px on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(sw).toBeLessThanOrEqual(cw);
  });
}

test("the consent cards reflow at 320px with text spacing increased (WCAG 1.4.12)", async ({ page }) => {
  await page.goto("/prescreen");
  await page.addStyleTag({ content: "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }" });
  await page.getByRole("button", { name: "Start" }).click();
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
});

test.describe("200% zoom", () => {
  // A 1280x800 window at 200% zoom lays out like a 640x400 viewport.
  test.use({ viewport: { width: 640, height: 400 } });
  for (const path of ["/", "/prescreen", "/coordinator"]) {
    test(`no horizontal scroll at 200% zoom on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(sw).toBeLessThanOrEqual(cw);
    });
  }
});
