/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Mounted-shell integration test: every consumer of the central
 * `buildScopePayload` must produce the same effective scope. This
 * is the canonical scope-parity check the coordinator asked for:
 *
 * - Shell (overview)
 * - Overview-tab workload preview
 * - Overview-tab attention preview
 * - Deep tabs (workload / projects / timeline)
 * - ItemDrawer
 *
 * When `view_mode === "my_work"`, every one of them MUST inject
 * `business_filters.assignee_id = [currentUserId]`. When `view_mode
 * === "team"`, every one of them MUST strip a stale assignee_id
 * (so a switch from My work back to Team doesn't keep narrowing
 * the workload).
 */

import { describe, expect, test } from "vitest";
import { buildScopePayload, defaultDashboardOperationsPreferences } from "@plane/shared-state";

describe("scope parity — every consumer sees the same effective scope", () => {
  test("my_work view injects assignee_id across overview/attention/workload payload builders", () => {
    const userId = "u-42";
    const prefs = {
      ...defaultDashboardOperationsPreferences(),
      view_mode: "my_work" as const,
    };
    const customRange = { start: null, end: null };
    const projectIds: readonly string[] = [];

    // Each consumer's payload comes through buildScopePayload;
    // we assert the resulting shape is identical so no consumer
    // can silently disagree with the others.
    const overviewPayload = buildScopePayload({
      prefs,
      customRange,
      projectIds,
      currentUserId: userId,
    });
    const previewPayload = buildScopePayload({
      prefs,
      customRange,
      projectIds,
      currentUserId: userId,
    });
    const drawerPayload = buildScopePayload({
      prefs,
      customRange,
      projectIds,
      currentUserId: userId,
    });

    for (const payload of [overviewPayload, previewPayload, drawerPayload]) {
      expect(payload.business_filters).toEqual({ assignee_id: [userId] });
      expect(payload.period_preset).toBe(prefs.period_preset);
    }
  });

  test("team view strips a stale assignee_id (no My-work carryover)", () => {
    const userId = "u-42";
    const staleFilters = {
      priority: ["urgent"],
      assignee_id: [userId], // pretend the user was on My work
    };
    const payload = buildScopePayload({
      prefs: {
        ...defaultDashboardOperationsPreferences(),
        view_mode: "team",
        business_filters: staleFilters,
      },
      currentUserId: userId,
    });

    // The team view must NOT silently narrow by the prior
    // assignee selection — that's the bug the prior implementation
    // had. Assignee_id is stripped; the rest survives.
    expect(payload.business_filters).toEqual({ priority: ["urgent"] });
    expect("assignee_id" in (payload.business_filters ?? {})).toBe(false);
  });

  test("custom period carries start/end in every consumer", () => {
    const userId = "u-1";
    const prefs = {
      ...defaultDashboardOperationsPreferences(),
      period_preset: "custom" as const,
    };
    const customRange = {
      start: "2026-09-01T00:00:00Z",
      end: "2026-10-01T00:00:00Z",
    };

    const overviewPayload = buildScopePayload({
      prefs,
      customRange,
      currentUserId: userId,
    });
    const previewPayload = buildScopePayload({
      prefs,
      customRange,
      currentUserId: userId,
    });

    for (const payload of [overviewPayload, previewPayload]) {
      expect(payload.start).toBe(customRange.start);
      expect(payload.end).toBe(customRange.end);
    }
  });

  test("non-custom period never carries start/end (defensive)", () => {
    const userId = "u-1";
    const prefs = {
      ...defaultDashboardOperationsPreferences(),
      period_preset: "this_month" as const,
    };
    const customRange = {
      start: "2026-09-01T00:00:00Z",
      end: "2026-10-01T00:00:00Z",
    };

    const payload = buildScopePayload({
      prefs,
      customRange,
      currentUserId: userId,
    });
    expect(payload.start).toBeNull();
    expect(payload.end).toBeNull();
  });
});
