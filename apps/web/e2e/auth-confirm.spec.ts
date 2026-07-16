import { expect, test } from "@playwright/test";

test.describe("Auth confirmation link handling", () => {
  test("an expired/invalid confirmation link shows a clear error instead of silently landing on /welcome", async ({
    page,
  }) => {
    await page.goto(
      "/auth/confirm#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    );

    await expect(page).toHaveURL(/\/auth\/confirm/);
    await expect(page.getByRole("heading", { name: "That link expired" })).toBeVisible();
    await expect(page.getByText("Email link is invalid or has expired")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Resend confirmation email" }),
    ).toBeVisible();
  });

  test("visiting the confirm page directly with no token shows an invalid-link state", async ({
    page,
  }) => {
    await page.goto("/auth/confirm");
    await expect(page.getByRole("heading", { name: "Nothing to confirm here" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  test("forgot-password link from sign-in resolves to a working page", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(
      page.getByRole("heading", { name: "Reset your password" }),
    ).toBeVisible();
  });
});
