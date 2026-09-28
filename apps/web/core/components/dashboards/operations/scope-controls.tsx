/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Scope / period / filter controls for the Team Operations Dashboard.
 *
 * Two tiers (spec §4.2):
 * - Tier 1: Dashboard · workspace · updated-at · Refresh · New work item
 * - Tier 2: tabs · scope (Team / My work) · period · filters popover
 *
 * "URL > versioned preference > default" applies here: an external
 * navigation that flips a URL param wins over the stored preference.
 */

import { useCallback } from "react";
import type {
  TBusinessFilterKey,
  TDateBucket,
  TPeriodPreset,
  TWorkItemsGroupBy,
  TWorkloadBreakdownBy,
} from "@plane/types";
import {
  useDashboardBusinessFilters,
  useDashboardOperationsStore,
  useDashboardOverviewGroupBy,
  useDashboardPeriod,
  useDashboardTab,
  useDashboardViewMode,
  useDashboardWorkloadBreakdownBy,
} from "./use-operations-store";
import { DASHBOARD_TABS, type TDashboardTab } from "@plane/shared-state";

const VIEW_MODE_OPTIONS: Array<{ value: "team" | "my_work"; label: string; testId: string }> = [
  { value: "team", label: "Team", testId: "team" },
  { value: "my_work", label: "My work", testId: "my-work" },
];

const PERIOD_OPTIONS: Array<{ value: TPeriodPreset; label: string }> = [
  { value: "this_month", label: "This month" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "none", label: "None" },
  { value: "custom", label: "Custom" },
];

const GROUP_BY_OPTIONS: Array<{ value: TWorkItemsGroupBy; label: string }> = [
  { value: "label", label: "Nhãn" },
  { value: "project", label: "Dự án" },
  { value: "module", label: "Module" },
  { value: "cycle", label: "Chu kỳ" },
];

const WORKLOAD_BREAKDOWN_OPTIONS: Array<{ value: TWorkloadBreakdownBy; label: string }> = [
  { value: "project", label: "Dự án" },
  { value: "label", label: "Nhãn" },
];

const BUCKET_OPTIONS: Array<{ value: TDateBucket; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const FILTER_KEYS: Array<{ key: TBusinessFilterKey; label: string }> = [
  { key: "priority", label: "Priority" },
  { key: "state_id", label: "State" },
  { key: "assignee_id", label: "Assignee" },
  { key: "label_id", label: "Label" },
  { key: "cycle_id", label: "Cycle" },
  { key: "module_id", label: "Module" },
  { key: "created_by", label: "Created by" },
  { key: "state_group", label: "State group" },
  { key: "work_item_type", label: "Type" },
];

interface Props {
  workspaceSlug: string;
  updatedAt: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onClearFilters: () => void;
  onResetView: () => void;
  onCreateWorkItem: () => void;
}

export function OperationsScopeControls(props: Props): React.ReactElement {
  const { updatedAt, isRefreshing, onRefresh, onClearFilters, onResetView, onCreateWorkItem } = props;

  const tab = useDashboardTab();
  const viewMode = useDashboardViewMode();
  const period = useDashboardPeriod();
  const filters = useDashboardBusinessFilters();
  const overviewGroupBy = useDashboardOverviewGroupBy();
  const workloadBreakdownBy = useDashboardWorkloadBreakdownBy();
  const store = useDashboardOperationsStore();

  const setTab = useCallback((next: TDashboardTab) => store.setTab(next), [store]);
  const setViewMode = useCallback((mode: "team" | "my_work") => store.setViewMode(mode), [store]);
  const setPeriod = useCallback((preset: TPeriodPreset) => store.setPeriodPreset(preset), [store]);
  const setBucket = useCallback((bucket: TDateBucket) => store.setDateBucket(bucket), [store]);
  const setOverviewGroupBy = useCallback((groupBy: TWorkItemsGroupBy) => store.setOverviewGroupBy(groupBy), [store]);
  const setWorkloadBreakdownBy = useCallback(
    (breakdownBy: TWorkloadBreakdownBy) => store.setWorkloadBreakdownBy(breakdownBy),
    [store]
  );
  const removeFilter = useCallback(
    (key: TBusinessFilterKey, value?: string) => store.removeBusinessFilter(key, value),
    [store]
  );

  const filterCount = Object.values(filters).reduce<string[]>(
    (sum: string[], list) => sum.concat(list ?? []),
    []
  ).length;

  return (
    <div
      className="flex flex-col gap-3 border-b border-subtle bg-layer-1 px-5 py-3"
      data-testid="operations-scope-controls"
    >
      {/* Tier 1: title + actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-16 font-semibold text-primary">Dashboard</h1>
          <span className="text-12 text-tertiary" data-testid="operations-updated-at">
            {updatedAt ? `Updated ${formatRelative(updatedAt)}` : "Loading…"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-sm border border-subtle bg-layer-2 px-3 py-1.5 text-12 text-secondary hover:bg-layer-3"
            onClick={onRefresh}
            disabled={isRefreshing}
            data-testid="operations-refresh"
          >
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            className="rounded-sm border border-subtle bg-layer-2 px-3 py-1.5 text-12 text-secondary hover:bg-layer-3"
            onClick={onCreateWorkItem}
            data-testid="operations-create-work-item"
          >
            + Work item
          </button>
        </div>
      </div>

      {/* Tier 2: tabs + scope / period / filters */}
      <div className="flex flex-wrap items-center gap-2">
        <nav className="flex items-center gap-1" aria-label="Dashboard tabs" data-testid="operations-tabs">
          {DASHBOARD_TABS.map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setTab(tabKey)}
              className={`rounded-sm px-3 py-1.5 text-12 ${
                tab === tabKey ? "bg-layer-3 font-medium text-primary" : "text-secondary hover:bg-layer-2"
              }`}
              data-testid={`operations-tab-${tabKey}`}
              aria-current={tab === tabKey ? "page" : undefined}
            >
              {labelForTab(tabKey)}
            </button>
          ))}
        </nav>

        <div className="bg-subtle mx-2 h-5 w-px" aria-hidden="true" />

        <fieldset className="flex items-center gap-1" aria-label="Scope" data-testid="operations-view-mode">
          {VIEW_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setViewMode(option.value)}
              className={`rounded-sm px-2.5 py-1 text-12 ${
                viewMode === option.value ? "bg-layer-3 font-medium text-primary" : "text-secondary hover:bg-layer-2"
              }`}
              aria-pressed={viewMode === option.value}
              data-testid={`operations-view-mode-${option.testId}`}
            >
              {option.label}
            </button>
          ))}
        </fieldset>

        <label className="flex items-center gap-1.5 text-12 text-secondary">
          <span>Period</span>
          <select
            className="rounded-sm border border-subtle bg-layer-1 px-2 py-1 text-12 text-primary"
            value={period.preset}
            onChange={(event) => setPeriod(event.target.value as TPeriodPreset)}
            data-testid="operations-period"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {tab === "overview" ? (
          <label className="flex items-center gap-1.5 text-12 text-secondary">
            <span>Nhóm việc theo</span>
            <select
              className="rounded-sm border border-subtle bg-layer-1 px-2 py-1 text-12 text-primary"
              value={overviewGroupBy}
              onChange={(event) => setOverviewGroupBy(event.target.value as TWorkItemsGroupBy)}
              data-testid="operations-overview-group-by"
            >
              {GROUP_BY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {tab === "workload" ? (
          <label className="flex items-center gap-1.5 text-12 text-secondary">
            <span>Phân bổ theo</span>
            <select
              className="rounded-sm border border-subtle bg-layer-1 px-2 py-1 text-12 text-primary"
              value={workloadBreakdownBy}
              onChange={(event) => setWorkloadBreakdownBy(event.target.value as TWorkloadBreakdownBy)}
              data-testid="operations-workload-breakdown-by"
            >
              {WORKLOAD_BREAKDOWN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="flex items-center gap-1.5 text-12 text-secondary">
          <span>Bucket</span>
          <select
            className="rounded-sm border border-subtle bg-layer-1 px-2 py-1 text-12 text-primary"
            value={period.dateBucket}
            onChange={(event) => setBucket(event.target.value as TDateBucket)}
            data-testid="operations-bucket"
          >
            {BUCKET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="rounded-sm border border-subtle bg-layer-1 px-3 py-1 text-12 text-secondary hover:bg-layer-2"
          data-testid="operations-filters-popover"
          aria-label={`Filters (${filterCount} active)`}
        >
          Filters {filterCount > 0 ? `· ${filterCount}` : ""}
        </button>

        <button
          type="button"
          onClick={onClearFilters}
          disabled={filterCount === 0}
          className="rounded-sm px-2 py-1 text-12 text-secondary hover:bg-layer-2 disabled:text-disabled"
          data-testid="operations-clear-filters"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onResetView}
          className="rounded-sm px-2 py-1 text-12 text-secondary hover:bg-layer-2"
          data-testid="operations-reset-view"
        >
          Reset view
        </button>
      </div>

      {/* Active filter chips */}
      {filterCount > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5" data-testid="operations-filter-chips">
          {FILTER_KEYS.flatMap(({ key, label }) => {
            const values = filters[key] ?? [];
            if (values.length === 0) return [];
            return values.map((value: string) => (
              <span
                key={`${String(key)}:${value}`}
                className="inline-flex items-center gap-1 rounded-sm border border-subtle bg-layer-2 px-2 py-0.5 text-11 text-secondary"
              >
                <span className="text-tertiary">{label}:</span>
                <span className="text-primary">{value}</span>
                <button
                  type="button"
                  className="ml-0.5 text-tertiary hover:text-primary"
                  onClick={() => removeFilter(key, value)}
                  aria-label={`Remove ${label} ${value}`}
                  data-testid={`operations-filter-remove-${String(key)}-${value}`}
                >
                  ×
                </button>
              </span>
            ));
          })}
        </div>
      ) : null}
    </div>
  );
}

function labelForTab(tab: TDashboardTab): string {
  switch (tab) {
    case "overview":
      return "Overview";
    case "projects":
      return "Projects";
    case "workload":
      return "Workload";
    case "timeline":
      return "Timeline";
    case "insights":
      return "Insights";
    default:
      return tab;
  }
}

function formatRelative(iso: string): string {
  const updated = new Date(iso);
  if (Number.isNaN(updated.getTime())) return iso;
  const diffMs = Date.now() - updated.getTime();
  if (diffMs < 60_000) return "just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return updated.toLocaleString();
}
