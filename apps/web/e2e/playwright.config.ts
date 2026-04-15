import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env.e2e をこの config の横から読み込む(存在しなくてもエラーにしない)
dotenv.config({ path: path.join(__dirname, ".env.e2e") });

const AUTH_STATE = path.join(__dirname, "..", "playwright", ".auth", "user.json");

export default defineConfig({
  testDir: path.join(__dirname, "specs"),
  // 初期は逐次実行。共有のテストプロジェクトなので並列はデータ競合を招く
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: path.join(__dirname, "..", "playwright-report") }]],
  outputDir: path.join(__dirname, "..", "test-results"),
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*auth\.setup\.ts/,
      testDir: path.join(__dirname, "auth"),
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_STATE,
      },
    },
  ],
});
