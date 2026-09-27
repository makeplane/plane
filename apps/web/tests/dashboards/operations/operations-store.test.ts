/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, test, beforeEach } from "vitest";

import {
  DASHBOARD_OPERATIONS_SCHEMA_VERSION,
  DashboardOperationsStore,
  dashboardOperationsStorageKey,
  defaultDashboardOperationsPreferences,
  readDashboardUrlState,
  writeDashboardUrlState,
  buildScopeSignature,
  type TDashboardOperationsStorage,
  type TDashboardScopeSignature,
} from "@plane/shared-state";

const memoryStorage = (): TDashboardOperationsStorage & { dump: () => Record<string, string> } => {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
    dump: () => Object.fromEntries(items),
  };
};

describe("dashboard operations storage key (§15.1)", () => {
  test("is scoped by workspace and user", () => {
    expect(dashboardOperationsStorageKey("ws-1", "user-1")).toBe("plane-dashboard-operations-preferences:ws-1:user-1");
    expect(dashboardOperationsStorageKey("ws-1", "user-2")).not.toBe(dashboardOperationsStorageKey("ws-1", "user-1"));
    expect(dashboardOperationsStorageKey("ws-2", "user-1")).not.toBe(dashboardOperationsStorageKey("ws-1", "user-1"));
  });
});

describe("dashboard operations store — defaults", () => {
  let storage: ReturnType<typeof memoryStorage>;
  let store: DashboardOperationsStore;

  beforeEach(() => {
    storage = memoryStorage();
    store = new DashboardOperationsStore(storage);
  });

  test("before setIdentity is called, the snapshot is the product default", () => {
    expect(store.getSnapshot()).toEqual(defaultDashboardOperationsPreferences());
    expect(store.getSnapshot().schema_version).toBe(DASHBOARD_OPERATIONS_SCHEMA_VERSION);
    expect(store.getTab()).toBe("overview");
    expect(store.getViewMode()).toBe("team");
    expect(store.getPeriodPreset()).toBe("this_month");
    expect(store.getDateBucket()).toBe("day");
    expect(store.getBusinessFilters()).toEqual({});
    expect(store.getProjectIds()).toEqual([]);
  });

  test("setIdentity then setBusinessFilters persists", () => {
    store.setIdentity("ws-1", "user-1");
    store.addBusinessFilter("priority", "urgent");
    store.addBusinessFilter("priority", "high");
    store.addBusinessFilter("assignee_id", "u-42");

    expect(store.getBusinessFilters()).toEqual({
      priority: ["urgent", "high"],
      assignee_id: ["u-42"],
    });

    const reloaded = new DashboardOperationsStore(storage);
    reloaded.setIdentity("ws-1", "user-1");
    expect(reloaded.getBusinessFilters()).toEqual({
      priority: ["urgent", "high"],
      assignee_id: ["u-42"],
    });
  });

  test("§15.2 — one user's preferences are isolated from another's", () => {
    store.setIdentity("ws-1", "user-1");
    store.addBusinessFilter("priority", "urgent");

    const other = new DashboardOperationsStore(storage);
    other.setIdentity("ws-1", "user-2");
    expect(other.getBusinessFilters()).toEqual({});
  });

  test("workspace switch resets the whole store (§4)", () => {
    store.setIdentity("ws-1", "user-1");
    store.addBusinessFilter("priority", "urgent");
    store.setTab("workload");

    store.setIdentity("ws-2", "user-1");
    expect(store.getBusinessFilters()).toEqual({});
    expect(store.getTab()).toBe("overview");
  });

  test("corrupted payload falls back to defaults and bumps schema", () => {
    storage.setItem(dashboardOperationsStorageKey("ws-1", "user-1"), "{not json");
    const reloaded = new DashboardOperationsStore(storage);
    reloaded.setIdentity("ws-1", "user-1");
    expect(reloaded.getSnapshot()).toEqual(defaultDashboardOperationsPreferences());
  });
});

describe("dashboard operations store — clear / reset", () => {
  let storage: ReturnType<typeof memoryStorage>;
  let store: DashboardOperationsStore;

  beforeEach(() => {
    storage = memoryStorage();
    store = new DashboardOperationsStore(storage);
    store.setIdentity("ws-1", "user-1");
  });

  test("clearFilters keeps period/tab", () => {
    store.addBusinessFilter("priority", "urgent");
    store.setPeriodPreset("last_7_days");
    store.setTab("projects");

    store.clearFilters();
    expect(store.getBusinessFilters()).toEqual({});
    expect(store.getPeriodPreset()).toBe("last_7_days");
    expect(store.getTab()).toBe("projects");
  });

  test("resetView restores every default", () => {
    store.addBusinessFilter("priority", "urgent");
    store.setPeriodPreset("last_7_days");
    store.setTab("workload");
    store.setProjectIds(["p1", "p2"]);
    store.setCustomRange("2026-09-01T00:00:00Z", "2026-09-30T00:00:00Z");

    store.resetView();
    expect(store.getBusinessFilters()).toEqual({});
    expect(store.getPeriodPreset()).toBe("this_month");
    expect(store.getTab()).toBe("overview");
    expect(store.getProjectIds()).toEqual([]);
    expect(store.getCustomRange()).toEqual({ start: null, end: null });
  });

  test("removeBusinessFilter without value clears the whole key", () => {
    store.addBusinessFilter("priority", "urgent");
    store.addBusinessFilter("priority", "high");
    store.removeBusinessFilter("priority");
    expect(store.getBusinessFilters()).toEqual({});
  });

  test("removeBusinessFilter with value drops only that value", () => {
    store.addBusinessFilter("priority", "urgent");
    store.addBusinessFilter("priority", "high");
    store.removeBusinessFilter("priority", "urgent");
    expect(store.getBusinessFilters()).toEqual({ priority: ["high"] });
  });
});

describe("dashboard operations store — request lifecycle", () => {
  let storage: ReturnType<typeof memoryStorage>;
  let store: DashboardOperationsStore;

  beforeEach(() => {
    storage = memoryStorage();
    store = new DashboardOperationsStore(storage);
    store.setIdentity("ws-1", "user-1");
  });

  test("beginRequest bumps the generation counter", () => {
    const a = buildScopeSignature(store.getSnapshot(), store.getProjectIds());
    const gen1 = store.beginRequest(a);
    const gen2 = store.beginRequest(a);
    expect(gen2).toBeGreaterThan(gen1);
  });

  test("commitResponse is rejected when generation is stale", () => {
    const sig = buildScopeSignature(store.getSnapshot(), store.getProjectIds());
    const gen1 = store.beginRequest(sig);
    const gen2 = store.beginRequest(sig);
    // A new request supersedes gen1; gen1's response is stale.
    expect(store.commitResponse(gen1, sig)).toBe(false);
    expect(store.commitResponse(gen2, sig)).toBe(true);
  });

  test("subscribe fires on every emit and unsubscribe stops firing", () => {
    const sig = buildScopeSignature(store.getSnapshot(), store.getProjectIds());
    let count = 0;
    const listener = (): void => {
      count += 1;
    };
    const off = store.subscribe(listener);
    store.beginRequest(sig);
    store.beginRequest(sig);
    off();
    store.beginRequest(sig);
    expect(count).toBe(2);
  });
});

describe("dashboard operations store — URL state", () => {
  test("readDashboardUrlState parses tab/scope/period/filter/drawer", () => {
    const params = new URLSearchParams();
    params.set("tab", "workload");
    params.set("scope", "my_work");
    params.set("period", "last_30_days");
    params.set("bucket", "week");
    params.append("filter", "priority=urgent,high");
    params.append("filter", "state_id=uuid-1,uuid-2");
    params.set("drawer", "overdue:page=2:size=50");

    const state = readDashboardUrlState(params);
    expect(state.tab).toBe("workload");
    expect(state.view_mode).toBe("my_work");
    expect(state.period_preset).toBe("last_30_days");
    expect(state.date_bucket).toBe("week");
    expect(state.business_filters).toEqual({
      priority: ["urgent", "high"],
      state_id: ["uuid-1", "uuid-2"],
    });
    expect(state.drawer_selection).toEqual({
      metric: "overdue",
      page: 2,
      page_size: 50,
    });
  });

  test("readDashboardUrlState ignores unknown filter keys", () => {
    const params = new URLSearchParams();
    params.append("filter", "not_allowlisted=evil");
    const state = readDashboardUrlState(params);
    expect(state.business_filters).toEqual({});
  });

  test("writeDashboardUrlState round-trips", () => {
    const state = {
      tab: "insights" as const,
      view_mode: "my_work" as const,
      period_preset: "custom" as const,
      start: "2026-09-01T00:00:00Z",
      end: "2026-09-30T00:00:00Z",
      date_bucket: "month" as const,
      business_filters: { priority: ["urgent"] },
      drawer_selection: null,
    };
    const params = writeDashboardUrlState(state);
    const round = readDashboardUrlState(params);
    expect(round.tab).toBe("insights");
    expect(round.view_mode).toBe("my_work");
    expect(round.period_preset).toBe("custom");
    expect(round.date_bucket).toBe("month");
    expect(round.business_filters).toEqual({ priority: ["urgent"] });
  });

  test("applyUrlState overrides preference when present", () => {
    const storage = memoryStorage();
    const store = new DashboardOperationsStore(storage);
    store.setIdentity("ws-1", "user-1");
    const url = readDashboardUrlState(new URLSearchParams("tab=timeline&scope=my_work&bucket=month"));
    store.applyUrlState(url);
    expect(store.getTab()).toBe("timeline");
    expect(store.getViewMode()).toBe("my_work");
    expect(store.getDateBucket()).toBe("month");
  });

  test("scope signatures ignore filter ordering", () => {
    const sigA = buildScopeSignature(
      { ...defaultDashboardOperationsPreferences(), business_filters: { priority: ["urgent", "high"] } },
      ["p1"]
    );
    const sigB = buildScopeSignature(
      { ...defaultDashboardOperationsPreferences(), business_filters: { priority: ["high", "urgent"] } },
      ["p1"]
    );
    expect(sigA.business_filters_key).toBe(sigB.business_filters_key);
  });

  test("scope signatures treat project order as canonical", () => {
    const sigA: TDashboardScopeSignature = buildScopeSignature(defaultDashboardOperationsPreferences(), ["p1", "p2"]);
    const sigB: TDashboardScopeSignature = buildScopeSignature(defaultDashboardOperationsPreferences(), ["p2", "p1"]);
    expect(sigA.project_ids_key).toBe(sigB.project_ids_key);
  });
});
