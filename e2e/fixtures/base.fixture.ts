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

/**
 * Base fixture that combines all shared fixtures.
 * Import this in test files instead of @playwright/test directly.
 *
 * Usage:
 *   import { test, expect } from '../../fixtures/base.fixture';
 */
export { test, expect } from "./auth.fixture";
