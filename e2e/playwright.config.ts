/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { defineConfig, devices } from "@playwright/test";

const BASE_URL_WEB = process.env.E2E_WEB_URL ?? "http://localhost:3000";
const BASE_URL_ADMIN = process.env.E2E_ADMIN_URL ?? "http://localhost:3001";
const BASE_URL_SPACE = process.env.E2E_SPACE_URL ?? "http://localhost:3002";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"], ...(process.env.CI ? [["github" as const]] : [])],

  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },

  projects: [
    // Web app tests
    {
      name: "web",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: BASE_URL_WEB,
      },
      testMatch: /tests\/web\/.*/,
    },

    // Admin app tests
    {
      name: "admin",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: BASE_URL_ADMIN,
      },
      testMatch: /tests\/admin\/.*/,
    },

    // Space app tests
    {
      name: "space",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: BASE_URL_SPACE,
      },
      testMatch: /tests\/space\/.*/,
    },

    // Cross-app tests
    {
      name: "cross-app",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: /tests\/cross-app\/.*/,
    },

    // Smoke tests — run across all apps, no auth needed
    {
      name: "smoke",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: /tests\/smoke\..*/,
    },
  ],

  webServer: [
    {
      command: "pnpm --filter web dev",
      url: BASE_URL_WEB,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter admin dev",
      url: BASE_URL_ADMIN,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter space dev",
      url: BASE_URL_SPACE,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
