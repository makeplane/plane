/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Central scope payload builder for the Team Operations Dashboard.
 *
 * Every tab (overview / attention / workload / projects / timeline /
 * items / insights) and the shell must produce its request payload from
 * this single helper. Centralising it guarantees:
 *
 * 1. ``view_mode === "my_work"`` always injects
 *    ``business_filters.assignee_id = [currentUserId]`` and a switch
 *    back to "team" removes the filter. Without this, the wire
 *    payload would silently disagree with the user's view choice and
 *    the workload / items / attention rows would not narrow.
 *
 * 2. ``period_preset === "custom"`` always carries the resolved
 *    half-open ``start`` / ``end`` from the store. The store's
 *    ``customStart`` / ``customEnd`` live separately from the prefs
 *    blob; without this funnel the tabs would forget the date range.
 *
 * 3. ``project_ids`` is copied (never aliased) and only emitted when
 *    the user explicitly selected a subset; the backend treats an
 *    absent field as "all visible projects".
 *
 * The returned payload is JSON-safe: same reference on identical
 * inputs (useMemo / React equality still work). The function is pure
 * — it reads nothing mutable and touches no I/O.
 */

import type { TBusinessFilters, TDashboardScopePayload, TPeriodPreset } from "@plane/types";

import { withAssigneeFilter } from "./operations-store";

export interface TBuildScopePayloadArgs {
  /** Full prefs snapshot from the store (`store.getSnapshot()`). */
  prefs: {
    view_mode: "team" | "my_work";
    period_preset: TPeriodPreset;
    business_filters: TBusinessFilters;
    date_bucket: "day" | "week" | "month";
  };
  /** Custom half-open range; required when period_preset === "custom". */
  customRange?: { start: string | null; end: string | null };
  /** Selected project IDs (empty array means no filter). */
  projectIds?: readonly string[];
  /** Current user id; required when view_mode === "my_work". */
  currentUserId?: string | null;
}

/**
 * Build the canonical `TDashboardScopePayload` for one dashboard
 * request. The result is the single source of truth that the wire
 * endpoint, the scope signature, and the URL state all derive from.
 */
export function buildScopePayload(args: TBuildScopePayloadArgs): TDashboardScopePayload {
  const { prefs, customRange, projectIds, currentUserId } = args;
  const effectiveFilters = withAssigneeFilter(prefs.business_filters, prefs.view_mode, currentUserId ?? null);
  const isCustom = prefs.period_preset === "custom";
  const payload: TDashboardScopePayload = {
    period_preset: prefs.period_preset,
    start: isCustom ? (customRange?.start ?? null) : null,
    end: isCustom ? (customRange?.end ?? null) : null,
    business_filters: effectiveFilters,
    date_bucket: prefs.date_bucket,
  };
  if (projectIds && projectIds.length > 0) {
    payload.project_ids = projectIds.slice();
  }
  return payload;
}

/**
 * Build a stable string key for the request. Two requests with the
 * same key are byte-identical; the shell uses this key as the
 * debounce trigger so a re-render that does not change the payload
 * never re-fires the request.
 *
 * The key canonicalises array ordering (project_ids, business_filter
 * values) so a re-render with the same scope in a different order
 * produces the same key. This matches `buildScopeSignature`'s
 * canonicalisation: both must agree on byte-equality for the same
 * scope.
 */
export function buildRequestKey(payload: TDashboardScopePayload): string {
  const filters: Record<string, string[] | undefined> = {};
  for (const key of Object.keys(payload.business_filters ?? {}).sort()) {
    const list = payload.business_filters?.[key as keyof TBusinessFilters];
    if (!list) continue;
    filters[key] = [...list].sort();
  }
  return JSON.stringify({
    period_preset: payload.period_preset ?? null,
    start: payload.start ?? null,
    end: payload.end ?? null,
    date_bucket: payload.date_bucket ?? null,
    business_filters: filters,
    project_ids: payload.project_ids ? payload.project_ids.slice().sort() : null,
  });
}
