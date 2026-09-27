/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Builds the AnalyticsQuery V2 payload for Customized Insights (§11, §18).
 *
 * Pure and dependency-free so it can be unit-tested (§49.6) and reused
 * verbatim by "Save to dashboard" (§18.2) — the persisted widget stores this
 * query configuration, never a snapshot of the results.
 */

import type {
  TAnalyticsAllocation,
  TAnalyticsDateBasis,
  TAnalyticsDateGrouping,
  TAnalyticsDisplay,
  TAnalyticsNormalization,
  TAnalyticsQueryV2,
  TAnalyticsTimePreset,
  TBusinessFilters,
} from "@plane/types";
import { ChartXAxisProperty, ChartYAxisMetric } from "@plane/types";

import { isDateDimension, toDimensionKey, toMetricKey, toTimePreset } from "./mapping";

/** §40.1 — the engine refuses `limit > 100`. */
const DATE_DIMENSION_LIMIT = 100;
const CATEGORICAL_DIMENSION_LIMIT = 50;

/**
 * Canonical dashboard scope override. When supplied, the V2
 * query is built from THIS scope — the analytics store is never
 * consulted. The mapping is exact:
 *
 * - `period_preset` → `time.preset` (one-to-one, no silent coercion
 *   of `this_month` to `last_30_days`, etc.).
 * - `date_bucket` → `time.group` (granularity only; `dateBasis`
 *   below is a separate axis).
 * - `dateBasis` → `time.basis` (created_at / completed_at / etc.).
 * - `projectIds` → `project_ids` (overrides, never falls back to
 *   the analytics store's `selectedProjects`).
 * - `businessFilters` → `filters` (cycle_id / module_id /
 *   label_id / assignee_id / state_group / priority) only when
 *   the dashboard actually carries them.
 *
 * The Customized Insights controls (x_axis, y_axis, group_by,
 * date_grouping, normalization, allocation) are unaffected —
 * they remain local user choices.
 */
export interface TInsightInheritedScope {
  period_preset: TAnalyticsTimePreset;
  date_bucket: TAnalyticsDateGrouping;
  dateBasis: TAnalyticsDateBasis;
  projectIds: string[];
  businessFilters?: TBusinessFilters;
}

export interface TInsightQueryInput {
  /** Legacy form selections (§4 baseline vocabulary). */
  xAxis: ChartXAxisProperty;
  yAxis: ChartYAxisMetric;
  groupBy?: ChartXAxisProperty | null;
  /** §9.3 date grouping; only sent when the primary dimension is a date. */
  dateGrouping?: TAnalyticsDateGrouping;
  /** §17.4 */
  display?: TAnalyticsDisplay;
  /** §17 */
  normalization?: TAnalyticsNormalization;
  /** §15 */
  allocation?: TAnalyticsAllocation;
  /** §9 — legacy duration key from the analytics header. */
  duration?: string | null;
  /** §9.1 */
  dateBasis?: TAnalyticsDateBasis;
  /** Workspace Analytics header filters. */
  projectIds?: string[];
  cycleId?: string | null;
  moduleId?: string | null;
  /**
   * Optional canonical scope from the dashboard. When supplied,
   * the V2 query is built from this — the analytics store's
   * selectedDuration / selectedDateBasis / selectedProjects /
   * selectedCycle / selectedModule are NOT consulted. Local
   * analysis controls (x_axis, y_axis, etc.) remain user-editable.
   */
  inheritedScope?: TInsightInheritedScope | null;
}

/**
 * §17 + §17.4: a percentage display is meaningless without a normalisation
 * base, so `Percentage` / `Value + Percentage` forces `grand_total` when the
 * base is `None`. Kept in one place so the form state and the persisted widget
 * query can never disagree.
 */
export function reconcileDisplayNormalization(
  display: TAnalyticsDisplay,
  normalization: TAnalyticsNormalization
): { display: TAnalyticsDisplay; normalization: TAnalyticsNormalization } {
  if (display !== "value" && normalization === "none") {
    return { display, normalization: "grand_total" };
  }
  return { display, normalization };
}

/**
 * Returns the V2 query, or `null` when the selected dimension has no P0
 * equivalent in the engine registry (§12).
 */
export function buildInsightQuery(input: TInsightQueryInput): TAnalyticsQueryV2 | null {
  const primaryKey = toDimensionKey(input.xAxis);
  if (!primaryKey) return null;

  const seriesKey = input.groupBy ? toDimensionKey(input.groupBy) : null;
  if (input.groupBy && !seriesKey) return null;

  const dimensions = [{ key: primaryKey }];
  if (seriesKey) dimensions.push({ key: seriesKey });

  const filters: Record<string, string[]> = {};
  // When an inherited scope is supplied, the dashboard's business
  // filters (incl. any cycle_id / module_id / assignee_id / etc.)
  // are the SOLE source. We deliberately do NOT fall back to the
  // analytics store's selectedCycle / selectedModule — that would
  // leak global filter state into the dashboard tab.
  if (input.inheritedScope) {
    const bf = input.inheritedScope.businessFilters ?? {};
    for (const [key, values] of Object.entries(bf)) {
      if (!values || values.length === 0) continue;
      filters[key] = [...values];
    }
    if (input.inheritedScope.projectIds.length > 0) {
      // already applied via project_ids below
    }
  } else {
    if (input.cycleId) filters.cycle_id = [input.cycleId];
    if (input.moduleId) filters.module_id = [input.moduleId];
  }

  const { display, normalization } = reconcileDisplayNormalization(
    input.display ?? "value",
    input.normalization ?? "none"
  );

  // Time axis: inherited scope is authoritative when supplied.
  // `period_preset` is mapped to the V2 time preset one-to-one
  // (this_month != last_30_days; custom and none pass through).
  // `date_basis` is a separate axis (created_at / completed_at /
  // etc.); the dashboard scope doesn't pin this so the V2 default
  // (`created_at`) is honoured.
  const inherited = input.inheritedScope;
  const timePreset: TAnalyticsTimePreset = inherited
    ? inherited.period_preset
    : toTimePreset(input.duration ?? undefined);
  const timeBasis: TAnalyticsDateBasis = inherited
    ? inherited.dateBasis
    : input.dateBasis ?? "created_at";
  const timeGroup: TAnalyticsDateGrouping | undefined = isDateDimension(primaryKey)
    ? (inherited?.date_bucket ?? input.dateGrouping ?? "day")
    : undefined;

  const time: TAnalyticsQueryV2["time"] = {
    preset: timePreset,
    basis: timeBasis,
  };
  if (timeGroup) time.group = timeGroup;

  const metricKey = toMetricKey(input.yAxis);

  // Project IDs: inherited scope is authoritative. When the
  // dashboard has project_ids selected, only THOSE flow through;
  // the analytics store's selectedProjects is ignored.
  const projectIds = inherited
    ? inherited.projectIds
    : (input.projectIds ?? []).filter(Boolean);

  return {
    version: 1,
    source: "work_items",
    project_ids: projectIds,
    metrics: [{ key: metricKey }],
    dimensions,
    filters,
    time,
    comparison: { type: "none" },
    normalization,
    display,
    allocation: input.allocation ?? "full_credit",
    sort: [{ metric: metricKey, direction: "desc" }],
    limit: isDateDimension(primaryKey) ? DATE_DIMENSION_LIMIT : CATEGORICAL_DIMENSION_LIMIT,
  };
}
