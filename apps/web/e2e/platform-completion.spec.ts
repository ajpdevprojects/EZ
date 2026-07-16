import { expect, test } from "@playwright/test";

test.describe("Platform Completion Mode features (demo mode)", () => {
  test("resume list and editor are reachable", async ({ page }) => {
    await page.goto("/resume");
    await expect(page.getByRole("heading", { name: "Resumes" })).toBeVisible();
    await expect(page.getByText("Product Designer Resume")).toBeVisible();

    await page.getByText("Product Designer Resume").click();
    await expect(page).toHaveURL(/\/resume\/resume-1$/);
    await expect(page.getByLabel("Full name")).toHaveValue("Alex Morgan");
  });

  test("interview center lists upcoming and past interviews", async ({ page }) => {
    await page.goto("/interviews");
    await expect(page.getByRole("heading", { name: "Interview Center" })).toBeVisible();
    await expect(page.getByText("Upcoming")).toBeVisible();
    await expect(page.getByText("UI/UX Designer")).toBeVisible();
  });

  test("career coach shows the goals editor and checklist", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.getByRole("heading", { name: "Career Coach" })).toBeVisible();
    await expect(page.getByText("Your next steps")).toBeVisible();
    await expect(page.getByText("What brings you here?")).toBeVisible();
  });

  test("career journey shows active and archived journeys", async ({ page }) => {
    await page.goto("/journey");
    await expect(page.getByText("Active journeys")).toBeVisible();
    await expect(page.getByText("Journey Archive")).toBeVisible();
  });

  test("learning hub lists resources and can mark one complete", async ({ page }) => {
    await page.goto("/learning");
    await expect(page.getByRole("heading", { name: "Learning Hub" })).toBeVisible();
    await expect(page.getByText("Mastering the STAR Method")).toBeVisible();
  });

  test("documents center shows resumes, cover letters, and uploads", async ({ page }) => {
    await page.goto("/documents");
    await expect(page.getByRole("heading", { name: "Documents Center" })).toBeVisible();
    await expect(page.getByText("Acme Inc. — Product Designer")).toBeVisible();
  });

  test("notifications center lists journey notifications", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await expect(page.getByText("Interview scheduled").first()).toBeVisible();
  });

  test("analytics shows the pipeline and response rate", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
    await expect(page.getByText("Response rate")).toBeVisible();
  });

  test("integrations page lists all four providers as not connected", async ({ page }) => {
    await page.goto("/settings/integrations");
    await expect(page.getByText("Gmail", { exact: true })).toBeVisible();
    await expect(page.getByText("Google Calendar", { exact: true })).toBeVisible();
    await expect(page.getByText("Google Drive", { exact: true })).toBeVisible();
    await expect(page.getByText("LinkedIn", { exact: true })).toBeVisible();
  });

  test("integrations page is honest that no provider actually syncs yet", async ({ page }) => {
    await page.goto("/settings/integrations");
    await expect(page.getByText("Sync coming soon").first()).toBeVisible();
    expect(await page.getByText("Sync coming soon").count()).toBe(4);
  });

  test("company workspace groups applications by company", async ({ page }) => {
    await page.goto("/companies");
    await expect(page.getByRole("heading", { name: "Company Workspace" })).toBeVisible();
    await page.getByText("Vertex").first().click();
    await expect(page).toHaveURL(/\/companies\/Vertex$/);
    await expect(page.getByRole("heading", { name: "Vertex" })).toBeVisible();
  });

  test("job details page shows match analysis and apply state", async ({ page }) => {
    await page.goto("/jobs/job-1");
    await expect(page.getByText("Elizabeth's match analysis")).toBeVisible();
    await expect(page.getByText("92/100")).toBeVisible();
    await expect(page.getByRole("button", { name: "Applied" })).toBeVisible();
  });

  test("profile hub links to every feature area", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("link", { name: /Resumes/ })).toHaveAttribute("href", "/resume");
    await expect(page.getByRole("link", { name: /Company Workspace/ })).toHaveAttribute("href", "/companies");
    await expect(page.getByRole("link", { name: /Integrations/ })).toHaveAttribute(
      "href",
      "/settings/integrations",
    );
  });
});
