/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IDayOverride, IHoliday } from "@plane/types";
import { MON_FIRST_OFFSET, formatDate, getDaysInMonth } from "./calendar-cell-helper";

export type YearStats = {
  totalDays: number;
  workingDays: number;
  holidayCount: number;
  weekendCount: number;
  overrideDelta: number;
  overrideWorkdayCount: number;
  overrideHolidayCount: number;
};

export type MonthStats = {
  workingDays: number;
  holidayCount: number;
  weekendCount: number;
};

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

type Counts = { working: number; weekend: number; holiday: number; overWorkday: number; overHoliday: number };

function countMonth(
  year: number,
  month: number,
  holidaySet: Set<string>,
  overrideMap: Map<string, IDayOverride["type"]>,
  weekPattern: boolean[] | undefined
): Counts {
  const c: Counts = { working: 0, weekend: 0, holiday: 0, overWorkday: 0, overHoliday: 0 };
  const days = getDaysInMonth(year, month);
  for (let d = 1; d <= days; d++) {
    const dateStr = formatDate(year, month, d);
    const wd = MON_FIRST_OFFSET[new Date(year, month, d).getDay()];

    if (holidaySet.has(dateStr)) {
      c.holiday++;
      continue;
    }
    const ov = overrideMap.get(dateStr);
    if (ov === "WORKDAY") {
      c.working++;
      c.overWorkday++;
      continue;
    }
    if (ov === "HOLIDAY") {
      c.weekend++;
      c.overHoliday++;
      continue;
    }
    const isWorking = weekPattern ? Boolean(weekPattern[wd]) : true;
    if (isWorking) c.working++;
    else c.weekend++;
  }
  return c;
}

export function computeYearStats(
  year: number,
  holidays: IHoliday[],
  overrides: IDayOverride[],
  weekPattern: boolean[] | undefined
): YearStats {
  const holidaySet = new Set(holidays.map((h) => h.date));
  const overrideMap = new Map(overrides.map((o) => [o.date, o.type]));

  const totals: Counts = { working: 0, weekend: 0, holiday: 0, overWorkday: 0, overHoliday: 0 };
  for (let m = 0; m < 12; m++) {
    const c = countMonth(year, m, holidaySet, overrideMap, weekPattern);
    totals.working += c.working;
    totals.weekend += c.weekend;
    totals.holiday += c.holiday;
    totals.overWorkday += c.overWorkday;
    totals.overHoliday += c.overHoliday;
  }

  return {
    totalDays: isLeapYear(year) ? 366 : 365,
    workingDays: totals.working,
    holidayCount: totals.holiday,
    weekendCount: totals.weekend,
    overrideDelta: totals.overWorkday - totals.overHoliday,
    overrideWorkdayCount: totals.overWorkday,
    overrideHolidayCount: totals.overHoliday,
  };
}

export function computeMonthStats(
  year: number,
  month: number,
  holidays: IHoliday[],
  overrides: IDayOverride[],
  weekPattern: boolean[] | undefined
): MonthStats {
  const holidaySet = new Set(holidays.map((h) => h.date));
  const overrideMap = new Map(overrides.map((o) => [o.date, o.type]));
  const c = countMonth(year, month, holidaySet, overrideMap, weekPattern);
  return { workingDays: c.working, holidayCount: c.holiday, weekendCount: c.weekend };
}

export function getMonthHolidays(year: number, month: number, holidays: IHoliday[]): IHoliday[] {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  return holidays.filter((h) => h.date.startsWith(prefix)).sort((a, b) => a.date.localeCompare(b.date));
}

export function getMonthOverrides(year: number, month: number, overrides: IDayOverride[]): IDayOverride[] {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  return overrides.filter((o) => o.date.startsWith(prefix)).sort((a, b) => a.date.localeCompare(b.date));
}
