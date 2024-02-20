import { test, Page } from "@playwright/test";

export const login = async (page: Page) => {
  if (!process.env.PLAYWRIGHT_USERNAME || !process.env.PLAYWRIGHT_PASSWORD) {
    test.fail(true, "User name or password not set");
    return;
  }

  await page.goto("/");
  await page.getByPlaceholder("name@company.com").click();
  await page.getByPlaceholder("name@company.com").fill(process.env.PLAYWRIGHT_USERNAME);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByPlaceholder("Enter password").fill(process.env.PLAYWRIGHT_PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();
};
