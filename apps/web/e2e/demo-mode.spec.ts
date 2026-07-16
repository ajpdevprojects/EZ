import { expect, test } from "@playwright/test";

test.describe("Demo mode (no Supabase configured)", () => {
  test("root redirects into the Daily Briefing", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole("heading", { name: "Alex Morgan" })).toBeVisible();
    await expect(page.getByText("Recommended for you")).toBeVisible();
  });

  test("welcome screen introduces Elizabeth", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page.getByRole("heading", { name: /Elizabeth/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Started" })).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });

  test("search filters the job list by query", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText(/\d+ results/)).toBeVisible();

    await page.getByPlaceholder("Search jobs, companies…").fill("Frontend");
    await expect(page.getByText("1 results")).toBeVisible();
    await expect(page.getByText("Senior Frontend Engineer")).toBeVisible();
  });

  test("applications pipeline filters by status tab", async ({ page }) => {
    await page.goto("/applications");
    await expect(page.getByText("Product Designer")).toBeVisible();

    await page.getByRole("tab", { name: "Interviews" }).click();
    await expect(page.getByText("UI/UX Designer")).toBeVisible();
    await expect(page.getByText("Product Designer")).not.toBeVisible();
  });

  test("navigating from home to a job shows its details", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("link", { name: /Product Designer/ }).first().click();
    await expect(page).toHaveURL(/\/jobs\/job-1$/);
    await expect(page.getByRole("heading", { name: "Product Designer" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply Now" })).toBeVisible();
  });
});
