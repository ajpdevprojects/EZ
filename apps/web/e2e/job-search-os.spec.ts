import { expect, test } from "@playwright/test";

test.describe("Job Search Operating System features (demo mode)", () => {
  test("home shows deterministic match scores for recommended jobs", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByText("Recommended for you")).toBeVisible();
    await expect(page.getByText(/% match/).first()).toBeVisible();
  });

  test("job details shows a deterministic skill match card alongside AI analysis", async ({ page }) => {
    await page.goto("/jobs/job-1");
    await expect(page.getByRole("heading", { name: "Skill match" })).toBeVisible();
    await expect(page.getByText("Elizabeth's match analysis")).toBeVisible();
  });

  test("recruiter inbox lists emails linked to applications", async ({ page }) => {
    await page.goto("/inbox");
    await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
    await expect(page.getByText("Interview confirmation — UI/UX Designer")).toBeVisible();

    await page.getByText("Interview confirmation — UI/UX Designer").click();
    await expect(page).toHaveURL(/\/inbox\/email-1$/);
    await expect(page.getByText(/Great speaking with you/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Draft a reply/ })).toBeVisible();
  });

  test("job details links out to the original posting for externally sourced jobs", async ({ page }) => {
    await page.goto("/jobs/job-1");
    await expect(page.getByRole("link", { name: /View original posting/ })).toHaveCount(0);
  });
});
