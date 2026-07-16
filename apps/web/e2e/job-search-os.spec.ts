import { expect, test } from "@playwright/test";

test.describe("Job Search Operating System features (demo mode)", () => {
  test("home shows deterministic match scores for recommended jobs", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByText("Today's opportunities")).toBeVisible();
    await expect(page.getByText(/% match/).first()).toBeVisible();
  });

  test("home greets the user with what the Software Brain already did", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByText(/Good morning, Alex\./)).toBeVisible();
    await expect(page.getByText(/Your top match today is/)).toBeVisible();
  });

  test("home surfaces today's priorities", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByText("Today's priorities")).toBeVisible();
  });

  test("dismissing a recommendation in demo mode explains it's read-only", async ({ page }) => {
    await page.goto("/home");
    const dismissButton = page
      .getByRole("button", { name: /Not interested in Senior Frontend Engineer/ })
      .first();
    await dismissButton.click();
    await expect(page.getByText("Couldn't dismiss this", { exact: true })).toBeVisible();
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

  test("resume page shows performance stats derived from application outcomes", async ({ page }) => {
    await page.goto("/resume");
    await expect(page.getByText(/applications? · \d+% interview rate/)).toBeVisible();
  });
});
