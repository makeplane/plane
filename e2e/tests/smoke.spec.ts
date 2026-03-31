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

import { test, expect } from "@playwright/test";

const WEB_URL = process.env.E2E_WEB_URL ?? "http://localhost:3000";
const ADMIN_URL = process.env.E2E_ADMIN_URL ?? "http://localhost:3001";
const SPACE_URL = process.env.E2E_SPACE_URL ?? "http://localhost:3002";

test.describe("Smoke Tests @smoke", () => {
  test("web app loads successfully", async ({ page }) => {
    const response = await page.goto(WEB_URL);
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/.+/);
  });

  test("admin app loads successfully", async ({ page }) => {
    const response = await page.goto(ADMIN_URL);
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/.+/);
  });

  test("space app loads successfully", async ({ page }) => {
    const response = await page.goto(SPACE_URL);
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/.+/);
  });
});
