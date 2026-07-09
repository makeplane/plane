/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Provide the minimal environment expected by `src/env.ts` so that importing
// any module in the service graph does not trigger `process.exit(1)` during
// tests. These values are never used to reach a real backend — HTTP calls are
// mocked in the individual test files.
process.env.API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000";
process.env.LIVE_SERVER_SECRET_KEY = process.env.LIVE_SERVER_SECRET_KEY ?? "test-secret";
