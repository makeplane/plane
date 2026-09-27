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

const defaultStorage: TDashboardOperationsStorage = (() => {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  // SSR fallback (no persistence; reads always return null).
  const stub = new Map<string, string>();
  return {
    getItem: (key) => stub.get(key) ?? null,
    setItem: (key, value) => {
      stub.set(key, value);
    },
    removeItem: (key) => {
      stub.delete(key);
    },
  };
})();

let _store: DashboardOperationsStore | null = null;

export function createDashboardOperationsStore(storage?: TDashboardOperationsStorage): DashboardOperationsStore {
  return new DashboardOperationsStore(storage ?? defaultStorage);
}

function getStore(): DashboardOperationsStore {
  if (_store === null) _store = createDashboardOperationsStore();
  return _store;
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