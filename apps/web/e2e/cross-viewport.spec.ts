import { devices, expect, test } from "@playwright/test";

/**
 * Emulated-viewport rendering checks (Playwright device presets, not real
 * hardware) — verifies the core layout doesn't break or horizontally
 * overflow at mobile and desktop widths. Not a substitute for testing on
 * an actual phone/tablet/desktop, which this environment cannot do.
 */
const VIEWPORTS = [
  { name: "mobile", ...devices["iPhone 14"] },
  { name: "desktop", viewport: { width: 1440, height: 900 } },
];

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} viewport`, () => {
    test.use({ viewport: viewport.viewport });

    test("home renders without horizontal overflow and bottom nav is reachable", async ({ page }) => {
      await page.goto("/home");
      await expect(page.getByRole("heading", { name: "Alex Morgan" })).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);

      await expect(page.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    });

    test("onboarding wizard fits the viewport without overflow", async ({ page }) => {
      await page.goto("/onboarding");
      await expect(page.getByText("Let's personalize your journey")).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });

    test("resume editor renders without horizontal overflow", async ({ page }) => {
      await page.goto("/resume");
      await expect(page.getByRole("heading", { name: "Resumes" })).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  });
}
