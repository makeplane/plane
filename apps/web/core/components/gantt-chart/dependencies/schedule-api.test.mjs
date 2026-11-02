/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { schedulePreviewFromResponse } from "./schedule-api.ts";

test("maps a server conflict preview including nullable dates and warnings", () => {
  assert.deepEqual(
    schedulePreviewFromResponse({
      updates: [{ id: "B", old_start: null, old_end: "2026-11-04", new_start: null, new_end: "2026-11-06" }],
      warnings: [{ id: "C", reason: "missing_dates" }],
    }),
    {
      updates: [{ id: "B", oldStart: null, oldEnd: "2026-11-04", newStart: null, newEnd: "2026-11-06" }],
      warnings: [{ id: "C", reason: "missing_dates" }],
      labels: {},
    }
  );
});

test("a cycle conflict without a new preview is not treated as a schedule mismatch", () => {
  assert.equal(schedulePreviewFromResponse({ message: "Circular dependency", cycle: ["A", "B", "A"] }), null);
});

test("preserves cross-project labels and no-permission warnings", () => {
  const issues = { B: { name: "External task", sequence_id: 12, project_id: "other", project_identifier: "PRJ" } };
  const warnings = [{ id: "B", reason: "no_permission" }];
  assert.deepEqual(schedulePreviewFromResponse({ updates: [], warnings, issues }), {
    updates: [],
    warnings,
    labels: issues,
  });
});
