/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { beforeEach, describe, expect, test } from "vitest";

import { DashboardPreferencesStore, type TDashboardPreferencesStorage } from "@/store/dashboard-preferences.store";

const seed = (): Record<string, string> => ({});

describe("DashboardPreferencesStore — comparison + viewMode", () => {
  let items: Record<string, string>;
  let store: DashboardPreferencesStore;

  beforeEach(() => {
    items = seed();
    const storage: TDashboardPreferencesStorage = {
      getItem: (k) => items[k] ?? null,
      setItem: (k, v) => {
        items[k] = v;
      },
      removeItem: (k) => {
        delete items[k];
      },
    };
    store = new DashboardPreferencesStore(storage);
    store.setIdentity("ws-1", "user-1");
  });

  test("global comparison defaults to 'none'", () => {
    expect(store.getGlobalScope().comparison).toBe("none");
  });

  test("setGlobalScope persists comparison via provided setItem", () => {
    store.setGlobalScope({ comparison: "previous_week" });
    expect(items["plane-dashboard-preferences:ws-1:user-1"]).toContain("previous_week");
  });

  test("hydrate restores persisted comparison on setIdentity", () => {
    items["plane-dashboard-preferences:ws-1:user-1"] = JSON.stringify({
      schema_version: 1,
      viewMode: null,
      global: {
        timePreset: "this_quarter",
        dateBasis: "lifecycle_overlap",
        filters: {},
        projectIds: [],
        comparison: "previous_week",
      },
      cards: {},
    });
    // Use a fresh store so setIdentity actually reads the payload
    // (setIdentity early-returns when the identity is unchanged).
    const fresh = new DashboardPreferencesStore({
      getItem: (k) => items[k] ?? null,
      setItem: (k, v) => {
        items[k] = v;
      },
      removeItem: (k) => {
        delete items[k];
      },
    });
    fresh.setIdentity("ws-1", "user-1");
    expect(fresh.getGlobalScope().comparison).toBe("previous_week");
  });

  test("setViewMode(team) clears the assignee filter from scope", () => {
    store.setGlobalScope({ filters: { assignees: ["u-1"] } });
    store.setViewMode("team");
    expect(store.getViewMode()).toBe("team");
    expect(store.getGlobalScope().filters.assignees).toBeUndefined();
  });

  test("setViewMode(personal) keeps the assignee filter alone", () => {
    store.setGlobalScope({ filters: { assignees: ["u-2"] } });
    store.setViewMode("personal");
    expect(store.getGlobalScope().filters.assignees).toEqual(["u-2"]);
  });

  test("malformed stored comparison falls back to 'none'", () => {
    items["plane-dashboard-preferences:ws-1:user-1"] = JSON.stringify({
      schema_version: 1,
      viewMode: null,
      global: {
        timePreset: "this_quarter",
        dateBasis: "lifecycle_overlap",
        filters: {},
        projectIds: [],
        comparison: "BOGUS",
      },
      cards: {},
    });
    const fresh = new DashboardPreferencesStore({
      getItem: (k) => items[k] ?? null,
      setItem: (k, v) => {
        items[k] = v;
      },
      removeItem: (k) => {
        delete items[k];
      },
    });
    fresh.setIdentity("ws-1", "user-1");
    expect(fresh.getGlobalScope().comparison).toBe("none");
  });

  test("truncated stored timePreset falls back to default", () => {
    // §15.3 — sanitization must reject values outside the engine vocab so a
    // previous-release or corrupted payload never reaches the analytics batch.
    items["plane-dashboard-preferences:ws-1:user-1"] = JSON.stringify({
      schema_version: 1,
      viewMode: null,
      global: {
        timePreset: "t",
        dateBasis: "lifecycle_overlap",
        filters: {},
        projectIds: [],
        comparison: "none",
      },
      cards: {},
    });
    const fresh = new DashboardPreferencesStore({
      getItem: (k) => items[k] ?? null,
      setItem: (k, v) => {
        items[k] = v;
      },
      removeItem: (k) => {
        delete items[k];
      },
    });
    fresh.setIdentity("ws-1", "user-1");
    expect(fresh.getGlobalScope().timePreset).toBe("this_quarter");
  });

  test("truncated stored dateBasis falls back to default", () => {
    items["plane-dashboard-preferences:ws-1:user-1"] = JSON.stringify({
      schema_version: 1,
      viewMode: null,
      global: {
        timePreset: "this_quarter",
        dateBasis: "c",
        filters: {},
        projectIds: [],
        comparison: "none",
      },
      cards: {},
    });
    const fresh = new DashboardPreferencesStore({
      getItem: (k) => items[k] ?? null,
      setItem: (k, v) => {
        items[k] = v;
      },
      removeItem: (k) => {
        delete items[k];
      },
    });
    fresh.setIdentity("ws-1", "user-1");
    expect(fresh.getGlobalScope().dateBasis).toBe("lifecycle_overlap");
  });

  test("setGlobalScope preserves fields not in the update", () => {
    store.setGlobalScope({ filters: { assignees: ["u-1"] } });
    const scope = store.getGlobalScope();
    expect(scope.timePreset).toBe("this_quarter");
    expect(scope.dateBasis).toBe("lifecycle_overlap");
    expect(scope.comparison).toBe("none");
    expect(scope.filters.assignees).toEqual(["u-1"]);
  });

  test("setGlobalScope rejects unknown timePreset and falls back to default", () => {
    store.setGlobalScope({ timePreset: "t" as never });
    expect(store.getGlobalScope().timePreset).toBe("this_quarter");
  });

  test("setGlobalScope rejects unknown dateBasis and falls back to default", () => {
    store.setGlobalScope({ dateBasis: "c" as never });
    expect(store.getGlobalScope().dateBasis).toBe("lifecycle_overlap");
  });
});
