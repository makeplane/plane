/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { MANUAL_MIN_SECONDS, TIME_ENTRY_MAX_SECONDS } from "@plane/constants";
import type { TTimeDatePreset, TTimeReportInterval } from "@plane/types";

// Duration input

export type TDurationInputError = "empty" | "invalid" | "too_short" | "too_long";

export type TDurationInputResult = {
  /** seconds rounded to the minute, or null when the input isn't a valid duration */
  seconds: number | null;
  error?: TDurationInputError;
  /** for "90" (read as 90 hours): the number of minutes the user probably meant */
  suggestedMinutes?: number;
};

const NUMBER = String.raw`(\d+(?:[.,]\d*)?|[.,]\d+)`;
const HOURS_UNIT = "(?:hours|hour|hrs|hr|h)";
const MINUTES_UNIT = "(?:minutes|minute|mins|min|m)";
const UNITS_PATTERN = new RegExp(String.raw`^(?:${NUMBER}\s*${HOURS_UNIT})?\s*(?:${NUMBER}\s*${MINUTES_UNIT})?$`);
const CLOCK_PATTERN = /^(\d{1,2}):([0-5]\d)$/;
const BARE_NUMBER_PATTERN = new RegExp(`^${NUMBER}$`);

const toNumber = (value: string) => Number.parseFloat(value.replace(",", "."));

/**
 * Parses what people type into a duration field (plan Appendix A).
 *
 * `1h 30m`, `1h30m`, `1 h 30 min`, `2 hours`, `45 mins`, `1.5h`, `1,5h`, `1:30` and bare numbers (hours: `1.5`, `2`).
 * Valid results are 1 minute to 24 hours.
 */
export const analyzeDurationInput = (input: string): TDurationInputResult => {
  const value = (input ?? "").trim().toLowerCase();
  if (!value) return { seconds: null, error: "empty" };

  let minutes: number | null = null;
  let bareNumber: number | null = null;

  const clock = CLOCK_PATTERN.exec(value);
  if (clock) {
    minutes = Number(clock[1]) * 60 + Number(clock[2]);
  } else if (BARE_NUMBER_PATTERN.test(value)) {
    bareNumber = toNumber(value);
    minutes = bareNumber * 60;
  } else {
    const units = UNITS_PATTERN.exec(value);
    if (units && (units[1] !== undefined || units[2] !== undefined)) {
      minutes = (units[1] ? toNumber(units[1]) * 60 : 0) + (units[2] ? toNumber(units[2]) : 0);
    }
  }

  if (minutes === null || Number.isNaN(minutes)) return { seconds: null, error: "invalid" };

  const seconds = Math.round(minutes) * 60;
  if (seconds < MANUAL_MIN_SECONDS) return { seconds: null, error: "too_short" };
  if (seconds > TIME_ENTRY_MAX_SECONDS) {
    const result: TDurationInputResult = { seconds: null, error: "too_long" };
    // "90" means 90 hours, which is out of range; 90 minutes is probably what was meant
    if (bareNumber !== null && Number.isInteger(bareNumber) && bareNumber * 60 <= TIME_ENTRY_MAX_SECONDS) {
      result.suggestedMinutes = bareNumber;
    }
    return result;
  }
  return { seconds };
};

/** Seconds for a duration typed by a person, or null if invalid or out of range. See analyzeDurationInput. */
export const parseDurationInput = (input: string): number | null => analyzeDurationInput(input).seconds;

// Formatting

export type TDurationFormat = "short" | "clock" | "decimal";

/**
 * - `short`: `1h 30m`, `45m`, `2h`, `0m`
 * - `clock`: `1:30`
 * - `decimal`: `1.50` (hours, 2 decimals)
 *
 * Partial minutes are dropped, so the parts always add up to what was logged.
 */
export const formatTimeDuration = (seconds: number | null | undefined, style: TDurationFormat = "short"): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds ?? 0));
  if (style === "decimal") return (safeSeconds / 3600).toFixed(2);

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (style === "clock") return `${hours}:${String(minutes).padStart(2, "0")}`;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
};

/** `1:23:45`, for running timers. */
export const formatElapsed = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

/**
 * Seconds a timer has been running, measured on the server's clock.
 * `clockOffsetMs` is `server_now - Date.now()` at the time the timer was fetched.
 */
export const getElapsedSeconds = (startedAtIso: string, nowMs: number, clockOffsetMs: number): number =>
  Math.max(0, Math.floor((nowMs + clockOffsetMs - Date.parse(startedAtIso)) / 1000));

// Calendar dates (YYYY-MM-DD strings, no timezone)

type TCalendarDate = { year: number; month: number; day: number };

const fromParts = ({ year, month, day }: TCalendarDate): Date => new Date(Date.UTC(year, month - 1, day));

const toISODate = (date: Date): string => date.toISOString().slice(0, 10);

const localParts = (date: Date): TCalendarDate => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
});

const parseISODate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return fromParts({ year, month, day });
};

/** Adds (or with a negative number, subtracts) whole days to a YYYY-MM-DD date. */
export const addDaysToISODate = (value: string, days: number): string => {
  const date = parseISODate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
};

/** The YYYY-MM-DD of a Date's local calendar day. */
export const getISODate = (date: Date): string => toISODate(fromParts(localParts(date)));

/** Today's YYYY-MM-DD in an IANA timezone (the browser's when omitted or invalid). */
export const getTodayISODate = (timezone?: string, now: Date = new Date()): string => {
  if (timezone) {
    try {
      // en-CA formats as YYYY-MM-DD
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);
    } catch {
      // unknown timezone: fall through to the browser's
    }
  }
  return getISODate(now);
};

/** A Date (at local midnight) for a YYYY-MM-DD string, for date pickers and presets. */
export const getDateFromISODate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/** The first day of the week containing `date`; `startOfWeek` is 0 = Sunday … 6 = Saturday. */
export const getWeekStartDate = (date: Date | string, startOfWeek: number): string => {
  const day = typeof date === "string" ? parseISODate(date) : fromParts(localParts(date));
  const offset = (day.getUTCDay() - startOfWeek + 7) % 7;
  day.setUTCDate(day.getUTCDate() - offset);
  return toISODate(day);
};

/** The 7 dates of the week starting on `weekStartDate`. */
export const getWeekDays = (weekStartDate: string): string[] =>
  Array.from({ length: 7 }, (_, i) => addDaysToISODate(weekStartDate, i));

const monthRange = (year: number, month: number, months = 1) => {
  const from = fromParts({ year, month, day: 1 });
  const to = fromParts({ year, month: month + months, day: 1 });
  to.setUTCDate(0); // the last day of the previous month
  return { from: toISODate(from), to: toISODate(to) };
};

export type TDateRange = { from: string; to: string };

/**
 * Resolves a date preset to an inclusive range (plan Appendix B), using the viewer's today and start of week.
 * The API only ever receives explicit dates.
 */
export const getDatePresetRange = (
  preset: Exclude<TTimeDatePreset, "custom" | "all_time">,
  { today, startOfWeek }: { today: Date | string; startOfWeek: number }
): TDateRange => {
  const todayISO = typeof today === "string" ? today : getISODate(today);
  const { year, month } = (() => {
    const [y, m] = todayISO.split("-").map(Number);
    return { year: y, month: m };
  })();
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;

  switch (preset) {
    case "today":
      return { from: todayISO, to: todayISO };
    case "yesterday": {
      const yesterday = addDaysToISODate(todayISO, -1);
      return { from: yesterday, to: yesterday };
    }
    case "this_week": {
      const start = getWeekStartDate(todayISO, startOfWeek);
      return { from: start, to: addDaysToISODate(start, 6) };
    }
    case "last_week": {
      const start = getWeekStartDate(todayISO, startOfWeek);
      return { from: addDaysToISODate(start, -7), to: addDaysToISODate(start, -1) };
    }
    case "this_month":
      return monthRange(year, month);
    case "last_month":
      return monthRange(year, month - 1);
    case "this_quarter":
      return monthRange(year, quarterStartMonth, 3);
    case "last_quarter":
      return monthRange(year, quarterStartMonth - 3, 3);
    case "this_year":
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    case "last_year":
      return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
    case "last_7_days":
      return { from: addDaysToISODate(todayISO, -6), to: todayISO };
    case "last_30_days":
      return { from: addDaysToISODate(todayISO, -29), to: todayISO };
    case "last_90_days":
      return { from: addDaysToISODate(todayISO, -89), to: todayISO };
  }
};

/** Number of days in an inclusive YYYY-MM-DD range. */
export const getDateRangeLength = ({ from, to }: TDateRange): number =>
  Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000) + 1;

/** The chart interval for a range: up to 31 days → day, up to 26 weeks → week, otherwise month. */
export const getAutoTimeReportInterval = (range: TDateRange | null | undefined): TTimeReportInterval => {
  if (!range) return "month";
  const days = getDateRangeLength(range);
  if (days <= 31) return "day";
  if (days <= 26 * 7) return "week";
  return "month";
};
