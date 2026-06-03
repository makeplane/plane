/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
import { UsageMonitorService } from "@plane/services";
import type { TDepartmentsResponse, TUsageUsersResponse } from "@plane/types";
// types
import type { TUsageFilters, TUsagePreset } from "./usage-monitor.types";
// root store
import type { RootStore } from "@/store/root.store";

export interface IUsageMonitorStore {
  // observables
  filters: TUsageFilters;
  users: TUsageUsersResponse | null;
  departments: TDepartmentsResponse | null;
  isLoading: Record<string, boolean>;
  error: Record<string, string | null>;
  // actions
  setFilters: (partial: Partial<TUsageFilters>) => void;
  fetchUsers: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
}

// Number of days each preset spans; all stay within the 92-day daily-grain cap.
const PRESET_DAYS: Record<Exclude<TUsagePreset, "custom">, number> = {
  week: 7,
  month: 30,
  "3-month": 92,
};

// Build YYYY-MM-DD from local date parts (NOT toISOString, which is UTC). The
// backend stores naive project-local dates, so a UTC-based window would drop a
// sliver of recent data in regions ahead of UTC.
const toISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Resolve a preset to an explicit [date_from, date_to] window ending today. */
const presetRange = (preset: Exclude<TUsagePreset, "custom">): { date_from: string; date_to: string } => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - PRESET_DAYS[preset]);
  return { date_from: toISODate(from), date_to: toISODate(to) };
};

export class UsageMonitorStore implements IUsageMonitorStore {
  filters: TUsageFilters;
  users: TUsageUsersResponse | null = null;
  departments: TDepartmentsResponse | null = null;
  isLoading: Record<string, boolean> = {};
  error: Record<string, string | null> = {};
  // service
  usageMonitorService;

  constructor(_store: RootStore) {
    const { date_from, date_to } = presetRange("month");
    this.filters = { granularity: "day", preset: "month", date_from, date_to };

    makeObservable(this, {
      filters: observable,
      users: observable,
      departments: observable,
      isLoading: observable.ref,
      error: observable.ref,
      setFilters: action,
      fetchUsers: action,
      fetchDepartments: action,
    });

    this.usageMonitorService = new UsageMonitorService();
  }

  /**
   * Single source of truth for filter state. Selecting a non-custom preset
   * re-resolves the date window; "custom" keeps caller-supplied dates.
   */
  setFilters = (partial: Partial<TUsageFilters>) => {
    const next: TUsageFilters = { ...this.filters, ...partial };
    if (partial.preset && partial.preset !== "custom") {
      const range = presetRange(partial.preset);
      next.date_from = range.date_from;
      next.date_to = range.date_to;
    }
    this.filters = next;
  };

  // The only place request params are assembled from filter state.
  private buildParams = (): Record<string, string> => {
    const params: Record<string, string> = {
      granularity: this.filters.granularity,
      date_from: this.filters.date_from,
      date_to: this.filters.date_to,
    };
    if (this.filters.workspace_id) params.workspace_id = this.filters.workspace_id;
    return params;
  };

  fetchUsers = async () => {
    try {
      this.isLoading = { ...this.isLoading, users: true };
      this.error = { ...this.error, users: null };
      const response = await this.usageMonitorService.fetchUsers(this.buildParams());
      runInAction(() => {
        this.users = response;
        this.isLoading = { ...this.isLoading, users: false };
      });
    } catch (_error) {
      runInAction(() => {
        this.isLoading = { ...this.isLoading, users: false };
        this.error = { ...this.error, users: "Failed to fetch usage metrics" };
      });
    }
  };

  fetchDepartments = async () => {
    try {
      this.isLoading = { ...this.isLoading, departments: true };
      this.error = { ...this.error, departments: null };
      const response = await this.usageMonitorService.fetchDepartments(this.buildParams());
      runInAction(() => {
        this.departments = response;
        this.isLoading = { ...this.isLoading, departments: false };
      });
    } catch (_error) {
      runInAction(() => {
        this.isLoading = { ...this.isLoading, departments: false };
        this.error = { ...this.error, departments: "Failed to fetch department metrics" };
      });
    }
  };
}
