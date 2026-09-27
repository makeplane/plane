/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, test } from "vitest";

import {
  buildRequestKey,
  buildScopePayload,
  buildScopeSignature,
  defaultDashboardOperationsPreferences,
  withAssigneeFilter,
} from "@plane/shared-state";

describe("withAssigneeFilter — My-work view_mode injection", () => {
  test("view_mode=team preserves user-supplied filters and never injects assignee_id", () => {
    const out = withAssigneeFilter({ priority: ["urgent"] }, "team", "u-42");
    expect(out).toEqual({ priority: ["urgent"] });
    expect(out.assignee_id).toBeUndefined();
  });

  test("view_mode=team STRIPS a stale assignee_id (user flipped from My work back)", () => {
    const out = withAssigneeFilter({ assignee_id: ["u-1"], priority: ["urgent"] }, "team", "u-1");
    expect(out).toEqual({ priority: ["urgent"] });
    expect("assignee_id" in out).toBe(false);
  });

  test("view_mode=my_work injects assignee_id=[currentUserId]", () => {
    const out = withAssigneeFilter({ priority: ["urgent"] }, "my_work", "u-42");
    expect(out).toEqual({ priority: ["urgent"], assignee_id: ["u-42"] });
  });

  test("view_mode=my_work overrides any pre-existing assignee_id selection", () => {
    const out = withAssigneeFilter({ assignee_id: ["someone-else"] }, "my_work", "u-42");
    expect(out.assignee_id).toEqual(["u-42"]);
  });

  test("view_mode=my_work + currentUserId=null omits the filter (unassigned union)", () => {
    const out = withAssigneeFilter({ priority: ["urgent"] }, "my_work", null);
    expect(out).toEqual({ priority: ["urgent"] });
    expect("assignee_id" in out).toBe(false);
  });
});

describe("buildScopePayload — central wire payload", () => {
  test("team view, no project filter, no custom range — emits canonical fields only", () => {
    const payload = buildScopePayload({
      prefs: defaultDashboardOperationsPreferences(),
    });
    expect(payload).toEqual({
      period_preset: "this_month",
      start: null,
      end: null,
      business_filters: {},
      date_bucket: "day",
    });
    expect(payload.project_ids).toBeUndefined();
  });

  test("my_work view injects assignee_id when currentUserId is provided", () => {
    const payload = buildScopePayload({
      prefs: { ...defaultDashboardOperationsPreferences(), view_mode: "my_work" },
      currentUserId: "u-1",
    });
    expect(payload.business_filters).toEqual({ assignee_id: ["u-1"] });
  });

  test("custom period wires start/end to the payload", () => {
    const payload = buildScopePayload({
      prefs: { ...defaultDashboardOperationsPreferences(), period_preset: "custom" },
      customRange: { start: "2026-09-01T00:00:00Z", end: "2026-10-01T00:00:00Z" },
    });
    expect(payload.start).toBe("2026-09-01T00:00:00Z");
    expect(payload.end).toBe("2026-10-01T00:00:00Z");
  });

  test("non-custom period NEVER carries start/end (even if customRange is set)", () => {
    const payload = buildScopePayload({
      prefs: { ...defaultDashboardOperationsPreferences(), period_preset: "this_month" },
      customRange: { start: "2026-09-01T00:00:00Z", end: "2026-10-01T00:00:00Z" },
    });
    expect(payload.start).toBeNull();
    expect(payload.end).toBeNull();
  });

  test("projectIds are copied (not aliased) and only emitted when non-empty", () => {
    const projectIds = ["p1", "p2"];
    const payload = buildScopePayload({
      prefs: defaultDashboardOperationsPreferences(),
      projectIds,
    });
    expect(payload.project_ids).toEqual(["p1", "p2"]);
    // Mutating the source must not affect the payload.
    projectIds.push("p3");
    expect(payload.project_ids).toEqual(["p1", "p2"]);

    const empty = buildScopePayload({
      prefs: defaultDashboardOperationsPreferences(),
      projectIds: [],
    });
    expect(empty.project_ids).toBeUndefined();
  });

  test("user-supplied filters survive a switch to My work (with assignee_id merged in)", () => {
    const payload = buildScopePayload({
      prefs: {
        ...defaultDashboardOperationsPreferences(),
        view_mode: "my_work",
        business_filters: { priority: ["urgent"] },
      },
      currentUserId: "u-9",
    });
    expect(payload.business_filters).toEqual({
      priority: ["urgent"],
      assignee_id: ["u-9"],
    });
  });
});

describe("buildScopeSignature — view_mode and custom range", () => {
  test("my_work view includes assignee_id in the business_filters_key", () => {
    const team = buildScopeSignature({
      prefs: { ...defaultDashboardOperationsPreferences(), view_mode: "team" },
      projectIds: [],
      currentUserId: "u-1",
    });
    const myWork = buildScopeSignature({
      prefs: { ...defaultDashboardOperationsPreferences(), view_mode: "my_work" },
      projectIds: [],
      currentUserId: "u-1",
    });
    expect(team.business_filters_key).not.toBe(myWork.business_filters_key);
    expect(myWork.business_filters_key).toContain("u-1");
  });

  test("custom range participates in the signature", () => {
    const a = buildScopeSignature({
      prefs: { ...defaultDashboardOperationsPreferences(), period_preset: "custom" },
      projectIds: [],
      customRange: { start: "2026-09-01T00:00:00Z", end: "2026-10-01T00:00:00Z" },
    });
    const b = buildScopeSignature({
      prefs: { ...defaultDashboardOperationsPreferences(), period_preset: "custom" },
      projectIds: [],
      customRange: { start: "2026-09-08T00:00:00Z", end: "2026-10-08T00:00:00Z" },
    });
    expect(a.start).not.toBe(b.start);
    expect(a.end).not.toBe(b.end);
  });

  test("non-custom period never reads custom range", () => {
    const sig = buildScopeSignature({
      prefs: { ...defaultDashboardOperationsPreferences(), period_preset: "this_month" },
      projectIds: [],
      customRange: { start: "2026-09-01T00:00:00Z", end: "2026-10-01T00:00:00Z" },
    });
    expect(sig.start).toBeNull();
    expect(sig.end).toBeNull();
  });

  test("view_mode change re-keys the signature even when project list is stable", () => {
    const team = buildScopeSignature({
      prefs: { ...defaultDashboardOperationsPreferences(), view_mode: "team" },
      projectIds: ["p1"],
      currentUserId: "u-1",
    });
    const myWork = buildScopeSignature({
      prefs: { ...defaultDashboardOperationsPreferences(), view_mode: "my_work" },
      projectIds: ["p1"],
      currentUserId: "u-1",
    });
    expect(team.business_filters_key).not.toBe(myWork.business_filters_key);
  });
});

describe("buildRequestKey — debounce trigger", () => {
  test("equal payloads produce equal keys (re-renders don't re-fire)", () => {
    const a = buildScopePayload({ prefs: defaultDashboardOperationsPreferences() });
    const b = buildScopePayload({ prefs: defaultDashboardOperationsPreferences() });
    expect(buildRequestKey(a)).toBe(buildRequestKey(b));
  });

  test("filter order does not change the key", () => {
    const a = buildScopePayload({
      prefs: { ...defaultDashboardOperationsPreferences(), business_filters: { priority: ["urgent", "high"] } },
    });
    const b = buildScopePayload({
      prefs: { ...defaultDashboardOperationsPreferences(), business_filters: { priority: ["high", "urgent"] } },
    });
    expect(buildRequestKey(a)).toBe(buildRequestKey(b));
  });

  test("project order is canonical (sorted) in the key", () => {
    const a = buildScopePayload({ prefs: defaultDashboardOperationsPreferences(), projectIds: ["p1", "p2"] });
    const b = buildScopePayload({ prefs: defaultDashboardOperationsPreferences(), projectIds: ["p2", "p1"] });
    expect(buildRequestKey(a)).toBe(buildRequestKey(b));
  });

  test("a my_work view_mode change changes the key", () => {
    const team = buildScopePayload({
      prefs: { ...defaultDashboardOperationsPreferences(), view_mode: "team" },
      currentUserId: "u-1",
    });
    const myWork = buildScopePayload({
      prefs: { ...defaultDashboardOperationsPreferences(), view_mode: "my_work" },
      currentUserId: "u-1",
    });
    expect(buildRequestKey(team)).not.toBe(buildRequestKey(myWork));
  });
});
