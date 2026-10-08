/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
// plane imports
import { TIME_DATE_PRESETS, TIME_DEFAULT_DATE_PRESET } from "@plane/constants";
import type { TTimeDatePreset, TTimeEntryFilters, TTimeEntryOrderBy, TTimeEntrySource } from "@plane/types";
import { getDatePresetRange, getTodayISODate } from "@plane/utils";
// hooks
import { useUser, useUserProfile } from "@/hooks/store/user";

const ARRAY_KEYS = [
  "user_ids",
  "logged_by_ids",
  "project_ids",
  "issue_ids",
  "label_ids",
  "state_ids",
  "state_groups",
  "cycle_ids",
  "module_ids",
  "priorities",
  "assignee_ids",
] as const;
const BOOLEAN_KEYS = ["has_issue", "is_billable", "needs_review"] as const;
const NUMBER_KEYS = ["min_duration", "max_duration"] as const;
const STRING_KEYS = ["search", "source", "order_by"] as const;
const DATE_KEYS = ["date_from", "date_to"] as const;

/** every query parameter the filter bar owns (others, like a tab's own settings, are left alone) */
export const TIME_TRACKING_FILTER_PARAMS = [
  "date_preset",
  ...DATE_KEYS,
  ...ARRAY_KEYS,
  ...BOOLEAN_KEYS,
  ...NUMBER_KEYS,
  ...STRING_KEYS,
] as const;

export type TTimeTrackingFilterState = Omit<TTimeEntryFilters, "date_from" | "date_to"> & {
  date_preset: TTimeDatePreset;
  /** only meaningful with the "custom" preset */
  date_from?: string;
  date_to?: string;
};

export type TTimeTrackingFilterPatch = Partial<{
  [K in keyof TTimeTrackingFilterState]: TTimeTrackingFilterState[K] | null;
}>;

const PRESET_KEYS = new Set<string>(TIME_DATE_PRESETS.map((preset) => preset.key));
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** URL query → filter state. Unknown or malformed values are ignored rather than sent to the API. */
export const parseTimeTrackingFilters = (params: URLSearchParams): TTimeTrackingFilterState => {
  const state: TTimeTrackingFilterState = { date_preset: TIME_DEFAULT_DATE_PRESET };

  const preset = params.get("date_preset");
  const dateFrom = params.get("date_from");
  const dateTo = params.get("date_to");
  if (preset && PRESET_KEYS.has(preset)) state.date_preset = preset as TTimeDatePreset;
  else if (dateFrom || dateTo) state.date_preset = "custom";
  if (state.date_preset === "custom") {
    if (dateFrom && ISO_DATE.test(dateFrom)) state.date_from = dateFrom;
    if (dateTo && ISO_DATE.test(dateTo)) state.date_to = dateTo;
  }

  const mutable = state as Record<string, unknown>;
  for (const key of ARRAY_KEYS) {
    const value = params.get(key);
    if (value) mutable[key] = value.split(",").filter(Boolean);
  }
  for (const key of BOOLEAN_KEYS) {
    const value = params.get(key);
    if (value === "true" || value === "false") mutable[key] = value === "true";
  }
  for (const key of NUMBER_KEYS) {
    const value = Number(params.get(key));
    if (params.get(key) && Number.isFinite(value) && value >= 0) mutable[key] = value;
  }
  const search = params.get("search");
  if (search) state.search = search;
  const source = params.get("source");
  if (source === "timer" || source === "manual") state.source = source as TTimeEntrySource;
  const orderBy = params.get("order_by");
  if (orderBy) state.order_by = orderBy as TTimeEntryOrderBy;
  return state;
};

/** filter state → URL query values (null removes the parameter) */
const toParamValue = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value)) return value.length ? value.join(",") : null;
  return String(value);
};

/**
 * Time tracking filters, with the URL query string as the single source of truth (plan 9.5.1).
 * `apiFilters` has the date preset resolved to explicit dates in the viewer's timezone and week start.
 */
export const useTimeTrackingFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: currentUser } = useUser();
  const { data: profile } = useUserProfile();
  const startOfWeek = profile?.start_of_the_week ?? 0;
  const today = getTodayISODate(currentUser?.user_timezone);

  const filters = useMemo(() => parseTimeTrackingFilters(searchParams), [searchParams]);

  const apiFilters = useMemo<TTimeEntryFilters>(() => {
    const { date_preset: preset, date_from, date_to, ...rest } = filters;
    if (preset === "all_time") return rest;
    if (preset === "custom") return { ...rest, date_from, date_to };
    const range = getDatePresetRange(preset, { today, startOfWeek });
    return { ...rest, date_from: range.from, date_to: range.to };
  }, [filters, today, startOfWeek]);

  const setFilters = useCallback(
    (patch: TTimeTrackingFilterPatch) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch)) {
            const param = toParamValue(value);
            if (param === null) next.delete(key);
            else next.set(key, param);
          }
          // explicit dates only travel with the custom preset
          if (patch.date_preset && patch.date_preset !== "custom") {
            next.delete("date_from");
            next.delete("date_to");
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const clearAll = useCallback(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        TIME_TRACKING_FILTER_PARAMS.forEach((key) => next.delete(key));
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const hasActiveFilters = useMemo(
    () => TIME_TRACKING_FILTER_PARAMS.some((key) => key !== "order_by" && searchParams.has(key)),
    [searchParams]
  );

  return { filters, apiFilters, setFilters, clearAll, hasActiveFilters, startOfWeek, today, searchParams };
};
