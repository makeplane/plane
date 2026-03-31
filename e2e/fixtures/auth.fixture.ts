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

import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

/**
 * Extend the base test with auth fixtures that provide pre-authenticated
 * browser contexts for the web app and admin app.
 */
/* eslint-disable react-hooks/rules-of-hooks -- Playwright fixtures, not React hooks */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "playwright/.auth/user.json",
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "playwright/.auth/admin.json",
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});
/* eslint-enable react-hooks/rules-of-hooks */

export { expect } from "@playwright/test";
