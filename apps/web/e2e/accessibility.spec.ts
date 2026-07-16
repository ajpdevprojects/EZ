import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Automated WCAG 2.x AA scan (axe-core) across the primary demo-mode
 * screens. This is real, executable coverage — not a substitute for a
 * screen-reader/keyboard walkthrough with an actual assistive-technology
 * user, which this environment cannot perform.
 */
const PAGES = [
  "/welcome",
  "/sign-in",
  "/sign-up",
  "/home",
  "/search",
  "/applications",
  "/interviews",
  "/journey",
  "/inbox",
  "/resume",
  "/documents",
  "/learning",
  "/notifications",
  "/analytics",
  "/companies",
  "/coach",
  "/profile",
  "/settings/integrations",
];

for (const path of PAGES) {
  test(`${path} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    if (results.violations.length > 0) {
      const summary = results.violations
        .map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} node(s)`)
        .join("\n");
      throw new Error(`Accessibility violations on ${path}:\n${summary}`);
    }

    expect(results.violations).toEqual([]);
  });
}
