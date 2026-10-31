/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TReportKind } from "@plane/types";
import { addDays, parseDateKey } from "./calendar-dates";
import { getWeekRange, toDateKey } from "./time-format";

/** Longest period each report covers; the API refuses more. */
export const REPORT_MAX_DAYS: Record<TReportKind, number> = {
  "plan-summary": 366,
  "planned-vs-logged": 93,
};

export const REPORT_TITLES: Record<TReportKind, string> = {
  "plan-summary": "Plan summary",
  "planned-vs-logged": "Plan vs logged",
};

export type TReportPeriod = { key: string; label: string; from: string; to: string };

/** The ready-made periods of the reports page: this and last week, this and last month. */
export const getReportPeriods = (reference: Date, weekStartsOn: number = 1): TReportPeriod[] => {
  const thisWeek = getWeekRange(reference, weekStartsOn);
  const lastWeekStart = addDays(thisWeek.from, -7);
  const monthStart = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const monthEnd = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  const lastMonthStart = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  const lastMonthEnd = new Date(reference.getFullYear(), reference.getMonth(), 0);

  return [
    { key: "this-week", label: "This week", from: thisWeek.from, to: thisWeek.to },
    { key: "last-week", label: "Last week", from: lastWeekStart, to: addDays(lastWeekStart, 6) },
    { key: "this-month", label: "This month", from: toDateKey(monthStart), to: toDateKey(monthEnd) },
    { key: "last-month", label: "Last month", from: toDateKey(lastMonthStart), to: toDateKey(lastMonthEnd) },
  ];
};

/** The first problem with a period for a report, or `null` when it can be asked for. */
export const validateReportRange = (report: TReportKind, from: string, to: string): string | null => {
  if (!from || !to) return "Choose a start and an end date.";
  if (to < from) return "The end date must not be before the start date.";
  const days = Math.round((parseDateKey(to).getTime() - parseDateKey(from).getTime()) / 86_400_000) + 1;
  const max = REPORT_MAX_DAYS[report];
  if (days > max) return `${REPORT_TITLES[report]} covers at most ${max} days.`;
  return null;
};

/** The name a downloaded report gets; the same pattern the API uses. */
export const getReportFileName = (report: TReportKind, from: string, to: string): string =>
  `${report}_${from}_${to}.csv`;
