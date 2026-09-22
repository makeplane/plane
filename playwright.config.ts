import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  use: {
    baseURL: "http://localhost:3000",
    headless: !!process.env.CI,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
    launchOptions: {
      slowMo: process.env.CI ? 0 : 800,
    },
  },

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
