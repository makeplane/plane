/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { format } from "date-fns";
import type { TCalendarLayouts } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";
import { getDateFnsLocale } from "@plane/utils";

const DAY_VALUES = [
  EStartOfTheWeek.SUNDAY,
  EStartOfTheWeek.MONDAY,
  EStartOfTheWeek.TUESDAY,
  EStartOfTheWeek.WEDNESDAY,
  EStartOfTheWeek.THURSDAY,
  EStartOfTheWeek.FRIDAY,
  EStartOfTheWeek.SATURDAY,
];

/**
 * Builds the month lookup (1-12) using the app's current UI language so
 * calendar views never fall back to hardcoded English month names.
 */
export const getMonthsList = (): {
  [monthNumber: number]: { shortTitle: string; title: string };
} => {
  const locale = getDateFnsLocale();
  const months: { [monthNumber: number]: { shortTitle: string; title: string } } = {};
  for (let month = 0; month < 12; month++) {
    const date = new Date(2024, month, 1);
    months[month + 1] = {
      shortTitle: format(date, "MMM", { locale }),
      title: format(date, "MMMM", { locale }),
    };
  }
  return months;
};

/**
 * Builds the weekday lookup (1-7, Sunday-first) using the app's current UI
 * language so calendar views never fall back to hardcoded English day names.
 */
export const getDaysList = (): {
  [dayIndex: number]: { shortTitle: string; title: string; value: EStartOfTheWeek };
} => {
  const locale = getDateFnsLocale();
  // 2024-01-07 is a Sunday; walking forward from there covers Sun..Sat in order.
  const days: { [dayIndex: number]: { shortTitle: string; title: string; value: EStartOfTheWeek } } = {};
  for (let day = 0; day < 7; day++) {
    const date = new Date(2024, 0, 7 + day);
    days[day + 1] = {
      shortTitle: format(date, "EEE", { locale }),
      title: format(date, "EEEE", { locale }),
      value: DAY_VALUES[day],
    };
  }
  return days;
};

export const CALENDAR_LAYOUTS: {
  [layout in TCalendarLayouts]: {
    key: TCalendarLayouts;
    title: string;
  };
} = {
  month: {
    key: "month",
    title: "Вид: месяц",
  },
  week: {
    key: "week",
    title: "Вид: неделя",
  },
};
