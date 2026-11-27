/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: the period shown by the Activity page, kept in the URL: `?range=<preset>` or a custom
// `?from=YYYY-MM-DD&to=YYYY-MM-DD`. Dates are local dates of the page's time zone (the project's).

import { shiftDate } from "./grid";

export const RANGE_PARAM = "range";
export const FROM_PARAM = "from";
export const TO_PARAM = "to";
// The API refuses longer ranges (plane/liviere/activity/queries.py, MAX_DAYS)
export const MAX_RANGE_DAYS = 366;

export const DAY_PRESETS = { "7d": 7, "30d": 30, "90d": 90 } as const;
export type TDayPreset = keyof typeof DAY_PRESETS;
// The current month (from its first day to today) and the whole previous month
export const MONTH_PRESETS = { month: 0, prev_month: -1 } as const;
export type TMonthPreset = keyof typeof MONTH_PRESETS;
export type TRangePreset = TDayPreset | TMonthPreset;
export const RANGE_PRESETS: TRangePreset[] = ["7d", "30d", "90d", "month", "prev_month"];
export const DEFAULT_PRESET: TRangePreset = "30d";

/** A preset (resolved against today) or a fixed custom range. */
export type TRangeSelection = { preset: TRangePreset } | { preset: null; from: string; to: string };

export type TDateRange = { from: string; to: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar date in the YYYY-MM-DD format (not 2026-02-30). */
export const isDate = (value: string | null | undefined): value is string =>
  !!value &&
  DATE_PATTERN.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  shiftDate(value, 0) === value;

/** Days from `from` to `to`, both included. */
export const rangeLength = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;

const isPreset = (value: string | null): value is TRangePreset =>
  !!value && (RANGE_PRESETS as string[]).includes(value);

/** Custom range the API accepts, or null. */
export const validCustomRange = (from: string | null, to: string | null): TDateRange | null =>
  isDate(from) && isDate(to) && from <= to && rangeLength(from, to) <= MAX_RANGE_DAYS ? { from, to } : null;

/** The selection in the URL; anything missing or invalid means the default preset. */
export const parseRange = (params: { get: (name: string) => string | null }): TRangeSelection => {
  const preset = params.get(RANGE_PARAM);
  if (isPreset(preset)) return { preset };
  const custom = validCustomRange(params.get(FROM_PARAM), params.get(TO_PARAM));
  return custom ? { preset: null, ...custom } : { preset: DEFAULT_PRESET };
};

const pad = (value: number) => value.toString().padStart(2, "0");

/**
 * A calendar month relative to the month of `today` (YYYY-MM-DD): offset 0 is the current month up to today,
 * -1 the whole previous month.
 */
export const monthRange = (today: string, offset: number): TDateRange => {
  const [year, month] = today.split("-").map(Number);
  // Date.UTC normalises month overflow (month -1 is December of the previous year)
  const first = new Date(Date.UTC(year, month - 1 + offset, 1));
  const from = `${first.getUTCFullYear()}-${pad(first.getUTCMonth() + 1)}-01`;
  if (offset === 0) return { from, to: today };
  // Day 0 of the next month is the last day of this one
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  return { from, to: `${last.getUTCFullYear()}-${pad(last.getUTCMonth() + 1)}-${pad(last.getUTCDate())}` };
};

/** Dates of a preset on the given day (`today`, YYYY-MM-DD in the page's time zone). */
export const presetRange = (preset: TRangePreset, today: string): TDateRange =>
  preset in MONTH_PRESETS
    ? monthRange(today, MONTH_PRESETS[preset as TMonthPreset])
    : { from: shiftDate(today, -(DAY_PRESETS[preset as TDayPreset] - 1)), to: today };

export const resolveRange = (selection: TRangeSelection, today: string): TDateRange =>
  selection.preset ? presetRange(selection.preset, today) : { from: selection.from, to: selection.to };

/** URL changes for `useQueryParams().updateQueryParams` that store a selection. */
export const rangeQueryChange = (
  selection: TRangeSelection
): { paramsToAdd: Record<string, string>; paramsToRemove: string[] } =>
  selection.preset
    ? { paramsToAdd: { [RANGE_PARAM]: selection.preset }, paramsToRemove: [FROM_PARAM, TO_PARAM] }
    : { paramsToAdd: { [FROM_PARAM]: selection.from, [TO_PARAM]: selection.to }, paramsToRemove: [RANGE_PARAM] };
