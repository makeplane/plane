/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Working-day helpers (d2m-plane).
 *
 * Weekdays use ISO numbering: 1 = Monday … 7 = Sunday.
 * Holidays are calendar dates in `YYYY-MM-DD` form.
 */

export const ISO_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/** Monday → Friday. Used when a project has no working-day configuration yet. */
export const DEFAULT_WORKING_DAYS: number[] = [1, 2, 3, 4, 5];

export type TWorkingCalendar = {
  working_days?: number[] | null;
  holidays?: string[] | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Formats a Date as `YYYY-MM-DD` using its local calendar fields. */
export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * Parses a `YYYY-MM-DD` string (or an ISO datetime, read in local time) into a local Date at midnight,
 * without the UTC shift that `new Date("YYYY-MM-DD")` applies.
 */
export const parseDateKey = (value: string | Date | null | undefined): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return undefined;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  // Full ISO datetimes (e.g. "2026-10-18T17:00:00Z") are converted to the viewer's local day.
  if (value.length > 10 && value.includes("T")) {
    const dateTime = new Date(value);
    if (isNaN(dateTime.getTime())) return undefined;
    return new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isNaN(date.getTime()) ? undefined : date;
};

/** ISO weekday (1 = Monday … 7 = Sunday) of a date. */
export const getIsoWeekday = (date: Date): number => date.getDay() || 7;

/** Normalised, de-duplicated working days; falls back to Monday–Friday when unset or invalid. */
export const resolveWorkingDays = (workingDays?: number[] | null): number[] => {
  const valid = Array.from(new Set((workingDays ?? []).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7)));
  return valid.length > 0 ? valid.sort((a, b) => a - b) : [...DEFAULT_WORKING_DAYS];
};

/** Whether `date` is a working day for the given calendar (weekday allowed and not a holiday). */
export const isWorkingDay = (date: string | Date, calendar?: TWorkingCalendar | null): boolean => {
  const parsed = parseDateKey(date);
  if (!parsed) return false;
  const workingDays = resolveWorkingDays(calendar?.working_days);
  if (!workingDays.includes(getIsoWeekday(parsed))) return false;
  const holidays = calendar?.holidays ?? [];
  return !holidays.includes(toDateKey(parsed));
};

/**
 * Counts working days between two dates, both inclusive.
 * Returns 0 when either date is missing or the range is reversed.
 */
export const countWorkingDays = (
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  calendar?: TWorkingCalendar | null
): number => {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (!start || !end || start > end) return 0;
  let count = 0;
  const cursor = new Date(start);
  // Guard against pathological ranges (~10 years).
  for (let i = 0; cursor <= end && i < 3700; i++) {
    if (isWorkingDay(cursor, calendar)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
};

/**
 * Keeps only the working-day keys of a date-keyed series (e.g. a burndown distribution).
 * If nothing would remain, the original keys are returned so charts never go blank.
 */
export const filterWorkingDayKeys = (keys: string[], calendar?: TWorkingCalendar | null): string[] => {
  const filtered = keys.filter((key) => isWorkingDay(key, calendar));
  return filtered.length > 0 ? filtered : keys;
};
