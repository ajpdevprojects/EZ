import { expect, test } from "@playwright/test";

test.describe("Form validation UX", () => {
  test("sign-up form shows field errors for empty submission and mismatched passwords", async ({
    page,
  }) => {
    await page.goto("/sign-up");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Full name is required")).toBeVisible();
    await expect(page.getByText("Email is required")).toBeVisible();

    await page.getByLabel("Password", { exact: true }).fill("supersecret1");
    await page.getByLabel("Confirm password").fill("different");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("sign-in form rejects an invalid email format before hitting the server", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("x");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Enter a valid email address")).toBeVisible();
  });

  test("onboarding wizard keeps Next disabled until the current step is valid", async ({ page }) => {
    await page.goto("/onboarding");
    const nextButton = page.getByRole("button", { name: "Next" });
    await nextButton.click(); // past the Welcome step, which has no validation

    await expect(nextButton).toBeDisabled();

    await page.getByRole("button", { name: "Find a new job" }).click();
    await expect(nextButton).toBeEnabled();
  });
});
