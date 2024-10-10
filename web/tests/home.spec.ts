import { test, expect } from "@playwright/test";

test("should check home page loads properly", async ({ page }) => {
  // Start from the index page (the baseURL is set via the webServer in the playwright.config.ts)
  await page.goto("/");
  // Check for heading login is present
  await expect(page.locator("h3")).toContainText("Log in or Sign up");
});
