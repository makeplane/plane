/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useSyncExternalStore } from "react";
import type { TBusinessFilters, TDateBucket, TPeriodPreset } from "@plane/types";
import {
  DashboardOperationsStore,
  type IDashboardOperationsStore,
  type TDashboardOperationsPreferences,
  type TDashboardOperationsStorage,
  type TDashboardTab,
} from "@plane/shared-state";

/**
 * Singleton hook for the per-session `DashboardOperationsStore`.
 *
 * One store instance lives for the lifetime of the React tree; it is
 * created lazily on first call. The store scopes by
 * `(workspace_id, user_id)` so two workspaces / two viewers do not
 * share state.
 *
 * Tests use the explicit `createDashboardOperationsStore()` factory
 * instead, which lets them pass an in-memory storage.
 */

// Test-env persistence: a module-scoped Map mirrors localStorage
// semantics when `window.localStorage` is unavailable. Tests reset
// this via `__resetDashboardOperationsStoreForTests` so a prior
// test's persisted `setViewMode` / `setPeriodPreset` /
// `setCustomRange` don't bleed into the next test.
let inMemoryStub: Map<string, string> | null = null;
function getInMemoryStub(): Map<string, string> {
  if (inMemoryStub === null) inMemoryStub = new Map<string, string>();
  return inMemoryStub;
}

function getDefaultStorage(): TDashboardOperationsStorage {
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  // SSR / Vitest fallback.
  const stub = getInMemoryStub();
  return {
    getItem: (key) => stub.get(key) ?? null,
    setItem: (key, value) => {
      stub.set(key, value);
    },
    removeItem: (key) => {
      stub.delete(key);
    },
  };
}

let _store: DashboardOperationsStore | null = null;

export function createDashboardOperationsStore(storage?: TDashboardOperationsStorage): DashboardOperationsStore {
  return new DashboardOperationsStore(storage ?? getDefaultStorage());
}

function getStore(): DashboardOperationsStore {
  if (_store === null) _store = createDashboardOperationsStore();
  return _store;
}

/**
 * Non-hook accessor for the singleton store. Tests that need to
 * seed custom range / project IDs / view mode from outside a
 * component render call this directly so they don't trip React's
 * "hooks can only be called inside a function component" guard.
 */
export function getDashboardOperationsStoreSingleton(): DashboardOperationsStore {
  return getStore();
}

/**
 * Test-only: reset the singleton store. Production code should
 * never call this — the store lives for the lifetime of the
 * React tree (one store per browser session).
 *
 * Also clears the in-memory storage (localStorage in jsdom) so a
 * previous test's persisted `setViewMode` / `setPeriodPreset` /
 * `setCustomRange` don't bleed into the next test.
 */
export function __resetDashboardOperationsStoreForTests(): void {
  _store = null;
  inMemoryStub = null;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.clear();
    } catch {
      // localStorage may be unavailable (private mode); the reset
      // is best-effort in that case.
    }
  }
}

export function useDashboardOperationsStore(): IDashboardOperationsStore {
  return useMemo(getStore, []);
}

export function useDashboardOperationsSnapshot(): TDashboardOperationsPreferences {
  const store = useDashboardOperationsStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getSnapshot(),
    () => store.getSnapshot()
  );
}

export function useDashboardTab(): TDashboardTab {
  const store = useDashboardOperationsStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getTab(),
    () => store.getTab()
  );
}

export function useDashboardViewMode(): "team" | "my_work" {
  const store = useDashboardOperationsStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getViewMode(),
    () => store.getViewMode()
  );
}

export function useDashboardPeriod(): {
  preset: TPeriodPreset;
  start: string | null;
  end: string | null;
  dateBucket: TDateBucket;
} {
  const store = useDashboardOperationsStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getPeriodSnapshot(),
    () => store.getPeriodSnapshot()
  );
}

export function useDashboardBusinessFilters(): TBusinessFilters {
  const store = useDashboardOperationsStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getBusinessFilters(),
    () => store.getBusinessFilters()
  );
}

export function useDashboardRequestGeneration(): number {
  const store = useDashboardOperationsStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getRequestGeneration(),
    () => store.getRequestGeneration()
  );
}

/**
 * Selected project IDs — used by the central scope payload builder.
 */
export function useDashboardProjectIds(): readonly string[] {
  const store = useDashboardOperationsStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getProjectIds(),
    () => store.getProjectIds()
  );
}

/**
 * Custom half-open range — used by the central scope payload
 * builder. Empty (`{start:null,end:null}`) when the user is not on a
 * custom period.
 */
export function useDashboardCustomRange(): { start: string | null; end: string | null } {
  const store = useDashboardOperationsStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getCustomRange(),
    () => store.getCustomRange()
  );
}
