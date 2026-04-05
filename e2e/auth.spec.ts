import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page shows sign in button", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /Sign in to GitScout/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Sign in with GitHub/i })
    ).toBeVisible();
  });

  test("unauthenticated user accessing /dashboard gets redirected", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // Should redirect to login page
    await page.waitForURL(/\/(login|api\/auth)/);
  });
});
