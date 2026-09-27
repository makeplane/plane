/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, test } from "vitest";
import type { TAnalyticsQueryV2 } from "@plane/types";

import {
  WORKSPACE_DASHBOARD_CARDS,
  WORKSPACE_DASHBOARD_SECTIONS,
  autoDateGrouping,
  defaultCardPreference,
  getCardDefinition,
  getCardsBySection,
  reconcileCardPreference,
} from "@/components/dashboards/v3/card-registry";
import {
  DEFAULT_GLOBAL_SCOPE,
  buildCardQuery,
  buildDashboardBatchRequest,
  dashboardCardIds,
  intersectFilters,
  isDashboardDataEmpty,
  normalizeDashboardBatchResponse,
} from "@/components/dashboards/v3/batch-composer";

/**
 * §10.2 / §40 — the engine's own `AnalyticsQueryV2.from_payload` contract,
 * re-stated here so a card default cannot drift from it. The backend validates
 * version, source, metric/dimension registries, ≤2 dimensions, ≤100 limit,
 * display/normalization vocabularies and split-equal support.
 */
const METRIC_KEYS = new Set([
  "work_item_count",
  "estimate_points",
  "pending_work_items",
  "completed_work_items",
  "in_progress_work_items",
  "due_today",
  "due_this_week",
  "blocked_work_items",
  "overdue_work_items",
  "unassigned_work_items",
  "allocated_work_item_count",
  "allocated_estimate_points",
]);
const DIMENSION_KEYS = new Set([
  "state",
  "state_group",
  "project",
  "priority",
  "assignees",
  "created_by",
  "labels",
  "cycle",
  "module",
  "work_item_type",
  "estimate_point",
  "created_date",
  "completed_date",
  "start_date",
  "due_date",
]);
const NORMALIZATIONS = new Set(["none", "group_total", "series_total", "grand_total"]);
const DISPLAYS = new Set(["value", "percentage", "value_and_percentage"]);
const ALLOCATIONS = new Set(["full_credit", "split_equal", "none"]);

const assertValidQueryV2 = (query: Record<string, unknown>) => {
  expect(query.version).toBe(1);
  expect(query.source).toBe("work_items");
  expect(Array.isArray(query.metrics)).toBe(true);
  expect((query.metrics as unknown[]).length).toBeGreaterThan(0);
  for (const metric of query.metrics as { key: string }[]) expect(METRIC_KEYS.has(metric.key)).toBe(true);
  expect((query.dimensions as unknown[]).length).toBeLessThanOrEqual(2);
  for (const dimension of query.dimensions as { key: string }[]) expect(DIMENSION_KEYS.has(dimension.key)).toBe(true);
  expect(NORMALIZATIONS.has(query.normalization as string)).toBe(true);
  expect(DISPLAYS.has(query.display as string)).toBe(true);
  expect(ALLOCATIONS.has(query.allocation as string)).toBe(true);
  expect((query.limit as number) <= 100).toBe(true);
  expect(query).toHaveProperty("key");
  // Round-trips through JSON the way the batch endpoint receives it.
  expect(JSON.parse(JSON.stringify(query))).toEqual(query);
};

describe("card registry — the thirteen built-in cards (§7)", () => {
  test("has exactly the §7 card set, in reading order", () => {
    expect(WORKSPACE_DASHBOARD_CARDS).toHaveLength(13);
    expect(WORKSPACE_DASHBOARD_CARDS.map((card) => card.letter)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "M",
      "J",
      "K",
      "L",
    ]);
    expect(new Set(dashboardCardIds()).size).toBe(13);
  });

  test("every card is in a declared section and every section has cards", () => {
    const sections = new Set(WORKSPACE_DASHBOARD_SECTIONS.map((section) => section.id));
    for (const card of WORKSPACE_DASHBOARD_CARDS) expect(sections.has(card.section)).toBe(true);
    for (const section of WORKSPACE_DASHBOARD_SECTIONS) {
      expect(getCardsBySection(section.id).length).toBeGreaterThan(0);
    }
  });

  test("defaults round-trip through the canonical AnalyticsQueryV2 schema", () => {
    for (const card of WORKSPACE_DASHBOARD_CARDS) {
      const query = buildCardQuery(card, defaultCardPreference(card.id), DEFAULT_GLOBAL_SCOPE);
      assertValidQueryV2(query as unknown as Record<string, unknown>);
      expect(query.key).toBe(card.id);
    }
  });

  test("every default value is inside the card's own allow-list", () => {
    for (const card of WORKSPACE_DASHBOARD_CARDS) {
      expect(card.allowedMetrics).toContain(card.defaults.metric);
      expect(card.allowedRenderers).toContain(card.defaults.renderer);
      if (card.defaults.dimension) expect(card.allowedDimensions).toContain(card.defaults.dimension);
      if (card.defaults.breakdown) expect(card.allowedBreakdowns).toContain(card.defaults.breakdown);
      for (const control of card.controls) {
        if (control === "metric") expect(card.allowedMetrics).toContain(card.defaults.metric);
        if (control === "renderer") expect(card.allowedRenderers).toContain(card.defaults.renderer);
      }
    }
  });

  test("§7.1 — a current-state KPI ignores the global time range", () => {
    const scope = { ...DEFAULT_GLOBAL_SCOPE, timePreset: "last_30_days" as const };
    for (const id of ["open_work_items", "in_progress", "overdue", "blocked"] as const) {
      const card = getCardDefinition(id);
      expect(card?.timeDependent).toBe(false);
      expect(buildCardQuery(card!, undefined, scope).time).toEqual({ preset: "none" });
    }
  });

  test("§7.1/§8.2 — Completed follows the selected range on the completed date", () => {
    const card = getCardDefinition("completed")!;
    const query = buildCardQuery(card, undefined, { ...DEFAULT_GLOBAL_SCOPE, timePreset: "last_30_days" });
    expect(query.time).toEqual({ preset: "last_30_days", basis: "completed_at" });
  });

  test("§8.1 — a custom range reaches the engine as ISO dates, on period cards only", () => {
    const scope = {
      ...DEFAULT_GLOBAL_SCOPE,
      timePreset: "custom" as const,
      customRange: { start: "2026-09-01", end: "2026-09-26" },
    };
    expect(buildCardQuery(getCardDefinition("completed")!, undefined, scope).time).toMatchObject({
      preset: "custom",
      start: "2026-09-01",
      end: "2026-09-26",
    });
    // A current-state KPI still reports now, not the window.
    expect(buildCardQuery(getCardDefinition("open_work_items")!, undefined, scope).time).toEqual({ preset: "none" });
  });

  test("§7.2 — the trend card buckets a date dimension", () => {
    const card = getCardDefinition("created_vs_completed_trend")!;
    const query = buildCardQuery(card, undefined, { ...DEFAULT_GLOBAL_SCOPE, timePreset: "this_month" });
    expect(query.dimensions).toEqual([{ key: "created_date" }]);
    expect(query.time?.group).toBe("week");
  });

  test("§7.3 — the matrix defaults to assignee × project, split equally", () => {
    const card = getCardDefinition("workload_allocation_matrix")!;
    const query = buildCardQuery(card, undefined, DEFAULT_GLOBAL_SCOPE);
    expect(query.dimensions).toEqual([{ key: "assignees" }, { key: "project" }]);
    expect(query.allocation).toBe("split_equal");
    expect(card?.allowedBreakdowns).toContain("labels");
  });

  test("§7.5 — the attention card is a work-item table with a deterministic filter", () => {
    const card = getCardDefinition("attention_required")!;
    expect(card?.defaults.renderer).toBe("work_item_table");
    expect(buildCardQuery(card, undefined, DEFAULT_GLOBAL_SCOPE).filters).toEqual({ priority: ["urgent"] });
  });

  test("§7 — workload section contains workload_by_labels (M)", () => {
    const card = getCardDefinition("workload_by_labels");
    expect(card).toBeDefined();
    expect(card?.letter).toBe("M");
    expect(card?.section).toBe("workload");
    expect(card?.defaults.dimension).toBe("labels");
    expect(card?.allowedDimensions).toContain("labels");
  });
});

describe("date-grouping auto-resolution (§7.2 F)", () => {
  test("resolves day / week / month from the range length", () => {
    expect(autoDateGrouping("last_7_days")).toBe("day");
    expect(autoDateGrouping("this_week")).toBe("day");
    expect(autoDateGrouping("this_month")).toBe("week");
    expect(autoDateGrouping("this_quarter")).toBe("month");
    expect(autoDateGrouping("last_90_days")).toBe("month");
  });
});

describe("preference reconciliation (§15.3)", () => {
  test("falls back to product defaults for values the card no longer allows", () => {
    const card = getCardDefinition("workload_by_assignee")!;
    const reconciled = reconcileCardPreference(card, {
      metric: "overdue_work_items" as never,
      dimension: "created_date" as never,
      renderer: "pie" as never,
    });
    expect(reconciled.metric).toBe(card.defaults.metric);
    expect(reconciled.dimension).toBe(card.defaults.dimension);
    expect(reconciled.renderer).toBe(card.defaults.renderer);
  });

  test("keeps a renderer the card declares", () => {
    const card = getCardDefinition("workload_by_assignee")!;
    expect(reconcileCardPreference(card, { renderer: "matrix" }).renderer).toBe("matrix");
  });
});

describe("global filter intersection (§8.3)", () => {
  test("narrows rather than widens", () => {
    expect(intersectFilters({ priority: ["urgent", "high"] }, { priority: ["urgent"] })).toEqual({
      priority: ["urgent"],
    });
    expect(intersectFilters({ priority: ["low"] }, { priority: ["urgent"] })).toEqual({
      priority: ["__no_matching_value__"],
    });
    expect(intersectFilters({ state_group: ["started"] }, {})).toEqual({ state_group: ["started"] });
    expect(intersectFilters({}, { priority: ["urgent"] })).toEqual({ priority: ["urgent"] });
  });
});

describe("batch request composition (§11, §20)", () => {
  test("produces the RD-480 contract shape: one entry per card, key = card id", () => {
    const request = buildDashboardBatchRequest(undefined, DEFAULT_GLOBAL_SCOPE);
    expect(request.queries).toHaveLength(13);
    for (const query of request.queries) assertValidQueryV2(query as unknown as Record<string, unknown>);
    expect(request.queries.map((query) => query.key)).toEqual(dashboardCardIds());
  });

  test("stays inside the backend batch cap of 20", () => {
    // MAX_BATCH_QUERIES in plane/analytics/v2/query.py.
    expect(buildDashboardBatchRequest(undefined, DEFAULT_GLOBAL_SCOPE).queries.length).toBeLessThanOrEqual(20);
  });

  test("carries viewer-scoped projects as the canonical project_ids field", () => {
    const request = buildDashboardBatchRequest(undefined, {
      ...DEFAULT_GLOBAL_SCOPE,
      projectIds: ["proj-1", "proj-2"],
    });
    for (const query of request.queries) expect(query.project_ids).toEqual(["proj-1", "proj-2"]);
  });

  test("a card-local change moves only that card's slice of the payload", () => {
    const scope = DEFAULT_GLOBAL_SCOPE;
    const before = buildDashboardBatchRequest(undefined, scope).queries;
    const after = buildDashboardBatchRequest({ workload_by_assignee: { metric: "estimate_points" } }, scope).queries;

    const beforeByKey = Object.fromEntries(before.map((query) => [String(query.key), query]));
    const afterByKey = Object.fromEntries(after.map((query) => [String(query.key), query]));

    for (const cardId of dashboardCardIds()) {
      if (cardId === "workload_by_assignee") continue;
      expect(afterByKey[cardId]).toEqual(beforeByKey[cardId]);
    }
    expect(afterByKey.workload_by_assignee).not.toEqual(beforeByKey.workload_by_assignee);
    expect(afterByKey.workload_by_assignee.metrics).toEqual([{ key: "estimate_points" }]);
  });

  test("a global change moves every card consistently", () => {
    const after = buildDashboardBatchRequest(undefined, {
      ...DEFAULT_GLOBAL_SCOPE,
      timePreset: "last_7_days",
      dateBasis: "created_at",
      filters: { state_group: ["started"] },
    }).queries;
    for (const query of after) {
      const typed = query as unknown as TAnalyticsQueryV2;
      if (typed.time?.preset === "none") continue;
      expect(typed.time?.preset).toBe("last_7_days");
      expect(typed.filters).toMatchObject({ state_group: ["started"] });
    }
  });

  test("a percentage display always carries a denominator (§17.4/§19.3)", () => {
    const card = getCardDefinition("work_state_distribution")!;
    const query = buildCardQuery(card, { display: "percentage", normalization: "none" }, DEFAULT_GLOBAL_SCOPE);
    expect(query.display).toBe("percentage");
    expect(query.normalization).toBe("grand_total");
  });
});

describe("batch response normalisation (§11, §24.2.15)", () => {
  const ok = (key: string) => ({
    key,
    status: "ok" as const,
    data: {
      query: { version: 1 } as TAnalyticsQueryV2,
      resolved: {},
      schema: { metrics: [], dimensions: [] },
      data: [],
      totals: {},
      warnings: [],
    },
  });

  test("one failed card does not blank the other eleven", () => {
    const results = [
      ...dashboardCardIds()
        .filter((id) => id !== "attention_required")
        .map(ok),
      {
        key: "attention_required",
        status: "error" as const,
        error: { code: "INVALID_QUERY", message: "Invalid query" },
      },
    ];
    const batch = normalizeDashboardBatchResponse(results);
    expect(Object.keys(batch)).toHaveLength(13);
    expect(batch.attention_required).toEqual({
      status: "error",
      error: { code: "INVALID_QUERY", message: "Invalid query" },
    });
    expect(batch.open_work_items?.status).toBe("ok");
  });

  test("a card the engine never answered gets its own error entry", () => {
    const batch = normalizeDashboardBatchResponse([ok("open_work_items")]);
    expect(batch.open_work_items?.status).toBe("ok");
    expect(batch.completed).toEqual({
      status: "error",
      error: { code: "NO_RESULT", message: "No result returned for this card" },
    });
  });

  test("a failed request is still a per-card state, never a blank page", () => {
    const batch = normalizeDashboardBatchResponse(undefined);
    expect(Object.keys(batch)).toHaveLength(13);
    expect(Object.values(batch).every((result) => result.status === "error")).toBe(true);
    expect(isDashboardDataEmpty(batch)).toBe(false);
  });
});

describe("data-empty detection (§4.2)", () => {
  const emptyResponse = {
    query: { version: 1, source: "work_items", metrics: [{ key: "work_item_count" as const }], dimensions: [] },
    resolved: {},
    schema: { metrics: [], dimensions: [] },
    data: [],
    totals: {},
    warnings: [],
  };

  test("an empty workspace is data-empty, not a setup prompt", () => {
    const batch = normalizeDashboardBatchResponse(
      dashboardCardIds().map((id) => ({ key: id, status: "ok" as const, data: emptyResponse }))
    );
    expect(isDashboardDataEmpty(batch)).toBe(true);
  });

  test("one populated card is enough to leave the data-empty state", () => {
    const batch = normalizeDashboardBatchResponse(
      dashboardCardIds().map((id) =>
        id === "open_work_items"
          ? { key: id, status: "ok" as const, data: { ...emptyResponse, totals: { pending_work_items: 4 } } }
          : { key: id, status: "ok" as const, data: emptyResponse }
      )
    );
    expect(isDashboardDataEmpty(batch)).toBe(false);
  });
});
