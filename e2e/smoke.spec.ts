import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("landing page loads and shows GitScout heading", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/GitScout/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "GitScout"
    );
  });

  test("landing page shows feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Analyze", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Scout", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Contribute", exact: true })
    ).toBeVisible();
  });

  test("Get Started link points to /login", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: "Get Started" });
    await expect(link).toHaveAttribute("href", "/login");
  });
});
