/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCalendarDay, TWorkMode } from "@plane/types";
import { toDateKey } from "./time-format";

/** A local calendar day from its `YYYY-MM-DD` key. */
export const parseDateKey = (key: string): Date => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/** The day `days` after (or before, when negative) the given day key. */
export const addDays = (key: string, days: number): string => {
  const date = parseDateKey(key);
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
};

/** ISO weekday of a day key: Monday is 1, Sunday is 7. */
export const getIsoWeekday = (key: string): number => parseDateKey(key).getDay() || 7;

/** Moves a reference date by whole months, landing on the first of the month. */
export const shiftMonths = (reference: Date, months: number): Date =>
  new Date(reference.getFullYear(), reference.getMonth() + months, 1);

/** The seven day keys of the week containing `reference`. `weekStartsOn` follows `Date#getDay`. */
export const getWeekDays = (reference: Date, weekStartsOn: number = 1): string[] => {
  const offset = (reference.getDay() - weekStartsOn + 7) % 7;
  const first = toDateKey(new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - offset));
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
};

export type TMonthGrid = {
  /** Whole weeks covering the month, each as seven day keys. */
  weeks: string[][];
  /** First and last visible day, inclusive: what to ask the API for. */
  from: string;
  to: string;
  year: number;
  /** Zero-based, as `Date#getMonth`. */
  month: number;
};

/** The weeks needed to show the month of `reference`, padded with days of the neighbouring months. */
export const getMonthGrid = (reference: Date, weekStartsOn: number = 1): TMonthGrid => {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startOffset = (first.getDay() - weekStartsOn + 7) % 7;
  const endOffset = (weekStartsOn + 6 - last.getDay() + 7) % 7;
  const from = toDateKey(new Date(year, month, 1 - startOffset));
  const to = toDateKey(new Date(year, month + 1, 0 + endOffset));

  const weeks: string[][] = [];
  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(cursor, index)));
  }
  return { weeks, from, to, year, month };
};

/** Whether a day can still be changed, given the first editable day (`null` means no limit). */
export const isEditableDate = (key: string, earliestEditable: string | null | undefined): boolean =>
  !earliestEditable || key >= earliestEditable;

/** `09:00 – 17:00`, or an empty string when the day has no hours. */
export const formatTimeRange = (start: string | null, end: string | null): string =>
  start && end ? `${start} – ${end}` : "";

export type TDayCounts = Record<TWorkMode, number> & {
  HOLIDAY: number;
  UNPLANNED: number;
};

/** How many of the given days fall in each category: the four modes, holidays and unplanned working days. */
export const countDays = (days: TCalendarDay[]): TDayCounts => {
  const counts: TDayCounts = { ONSITE: 0, REMOTE: 0, OFF: 0, LEAVE: 0, HOLIDAY: 0, UNPLANNED: 0 };
  for (const day of days) {
    if (day.mode) counts[day.mode] += 1;
    else if (day.source === "HOLIDAY") counts.HOLIDAY += 1;
    else if (day.is_unplanned) counts.UNPLANNED += 1;
  }
  return counts;
};
