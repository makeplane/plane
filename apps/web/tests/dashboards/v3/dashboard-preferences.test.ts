/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { beforeEach, describe, expect, test } from "vitest";

import {
  DASHBOARD_PREFERENCES_SCHEMA_VERSION,
  DashboardPreferencesStore,
  dashboardPreferencesStorageKey,
  sanitizeDashboardPreferences,
  type TDashboardPreferencesStorage,
} from "@/store/dashboard-preferences.store";

const memoryStorage = (): TDashboardPreferencesStorage & { dump: () => Record<string, string> } => {
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

describe("dashboard preference storage key (§15.1)", () => {
  test("is scoped by workspace and user", () => {
    expect(dashboardPreferencesStorageKey("ws-1", "user-1")).toBe("plane-dashboard-preferences:ws-1:user-1");
    expect(dashboardPreferencesStorageKey("ws-1", "user-2")).not.toBe(dashboardPreferencesStorageKey("ws-1", "user-1"));
    expect(dashboardPreferencesStorageKey("ws-2", "user-1")).not.toBe(dashboardPreferencesStorageKey("ws-1", "user-1"));
  });
});

describe("dashboard preferences store", () => {
  let storage: ReturnType<typeof memoryStorage>;
  let store: DashboardPreferencesStore;

  beforeEach(() => {
    storage = memoryStorage();
    store = new DashboardPreferencesStore(storage);
    store.setIdentity("ws-1", "user-1");
  });

  test("starts from product defaults for all twelve cards", () => {
    const snapshot = store.getSnapshot();
    expect(snapshot.schema_version).toBe(DASHBOARD_PREFERENCES_SCHEMA_VERSION);
    expect(Object.keys(snapshot.cards)).toHaveLength(13);
    expect(snapshot.global.timePreset).toBe("this_quarter");
  });

  test("a card change survives a reload", () => {
    store.setCardPreference("workload_by_assignee", { metric: "estimate_points", renderer: "matrix" });

    const reloaded = new DashboardPreferencesStore(storage);
    reloaded.setIdentity("ws-1", "user-1");
    expect(reloaded.getCardPreference("workload_by_assignee").metric).toBe("estimate_points");
    expect(reloaded.getCardPreference("workload_by_assignee").renderer).toBe("matrix");
  });

  test("a global change survives a reload", () => {
    store.setGlobalScope({ timePreset: "last_30_days", filters: { priority: ["urgent"] } });

    const reloaded = new DashboardPreferencesStore(storage);
    reloaded.setIdentity("ws-1", "user-1");
    expect(reloaded.getGlobalScope().timePreset).toBe("last_30_days");
    expect(reloaded.getGlobalScope().filters).toEqual({ priority: ["urgent"] });
  });

  test("§15.2 — one user's preferences are isolated from another's", () => {
    store.setCardPreference("priority_distribution", { metric: "estimate_points" });

    const other = new DashboardPreferencesStore(storage);
    other.setIdentity("ws-1", "user-2");
    expect(other.getCardPreference("priority_distribution").metric).toBe("work_item_count");
  });

  test("§15.2 — one workspace's preferences are isolated from another's", () => {
    store.setGlobalScope({ timePreset: "last_7_days" });

    const other = new DashboardPreferencesStore(storage);
    other.setIdentity("ws-2", "user-1");
    expect(other.getGlobalScope().timePreset).toBe("this_quarter");
  });

  test("switching identity swaps the whole bag in memory", () => {
    store.setCardPreference("work_by_project", { dimension: "module" });
    store.setIdentity("ws-2", "user-1");
    expect(store.getCardPreference("work_by_project").dimension).toBe("project");
    store.setIdentity("ws-1", "user-1");
    expect(store.getCardPreference("work_by_project").dimension).toBe("module");
  });

  test("§8.4 — reset returns every card and the global scope to product defaults", () => {
    store.setCardPreference("workload_by_assignee", { metric: "estimate_points" });
    store.setGlobalScope({ timePreset: "last_7_days" });
    store.reset();

    const snapshot = store.getSnapshot();
    expect(snapshot.global.timePreset).toBe("this_quarter");
    expect(snapshot.cards.workload_by_assignee.metric).toBe("work_item_count");
  });

  test("§8.4 — resetCard touches only that card", () => {
    store.setCardPreference("workload_by_assignee", { metric: "estimate_points" });
    store.setCardPreference("work_by_project", { metric: "estimate_points" });
    store.resetCard("workload_by_assignee");

    expect(store.getCardPreference("workload_by_assignee").metric).toBe("work_item_count");
    expect(store.getCardPreference("work_by_project").metric).toBe("estimate_points");
  });

  test("notifies subscribers so React re-renders", () => {
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    store.setCardPreference("work_by_project", { metric: "estimate_points" });
    expect(calls).toBe(1);
    unsubscribe();
    store.setCardPreference("work_by_project", { metric: "work_item_count" });
    expect(calls).toBe(1);
  });

  test("ignores a card id that is not in the registry", () => {
    store.setCardPreference("markdown_notes", { metric: "estimate_points" } as never);
    expect(store.getSnapshot().cards).not.toHaveProperty("markdown_notes");
  });

  test("survives storage being unavailable", () => {
    const broken = new DashboardPreferencesStore({
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => undefined,
    });
    broken.setIdentity("ws-1", "user-1");
    expect(() => broken.setCardPreference("work_by_project", { metric: "estimate_points" })).not.toThrow();
    expect(broken.getCardPreference("work_by_project").metric).toBe("estimate_points");
  });
});

describe("preference sanitisation (§15.3)", () => {
  test("a payload from an older schema_version is discarded", () => {
    const sanitized = sanitizeDashboardPreferences({
      schema_version: 0,
      cards: { open_work_items: { metric: "estimate_points" } },
    });
    expect(sanitized.cards.open_work_items.metric).toBe("pending_work_items");
  });

  test("unknown card ids are ignored, known ones survive", () => {
    const sanitized = sanitizeDashboardPreferences({
      schema_version: DASHBOARD_PREFERENCES_SCHEMA_VERSION,
      cards: { removed_card: { metric: "estimate_points" }, work_by_project: { metric: "estimate_points" } },
    });
    expect(sanitized.cards).not.toHaveProperty("removed_card");
    expect(sanitized.cards.work_by_project.metric).toBe("estimate_points");
    expect(Object.keys(sanitized.cards)).toHaveLength(13);
  });

  test("a stale renderer the card dropped falls back to the product default", () => {
    const sanitized = sanitizeDashboardPreferences({
      schema_version: DASHBOARD_PREFERENCES_SCHEMA_VERSION,
      cards: { attention_required: { renderer: "line" } },
    });
    expect(sanitized.cards.attention_required.renderer).toBe("work_item_table");
  });

  test("garbage input never produces an invalid query", () => {
    const sanitized = sanitizeDashboardPreferences({
      schema_version: DASHBOARD_PREFERENCES_SCHEMA_VERSION,
      global: 7,
      cards: "nope",
    });
    expect(sanitized.global.timePreset).toBe("this_quarter");
    expect(Object.keys(sanitized.cards)).toHaveLength(13);
  });
});
