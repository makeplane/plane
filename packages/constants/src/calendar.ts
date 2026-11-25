/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCalendarLayouts } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";

export const MONTHS_LIST: {
  [monthNumber: number]: {
    i18n_short_title: string;
    i18n_title: string;
  };
} = {
  1: {
    i18n_short_title: "months_short.jan",
    i18n_title: "months.january",
  },
  2: {
    i18n_short_title: "months_short.feb",
    i18n_title: "months.february",
  },
  3: {
    i18n_short_title: "months_short.mar",
    i18n_title: "months.march",
  },
  4: {
    i18n_short_title: "months_short.apr",
    i18n_title: "months.april",
  },
  5: {
    i18n_short_title: "months_short.may",
    i18n_title: "months.may",
  },
  6: {
    i18n_short_title: "months_short.jun",
    i18n_title: "months.june",
  },
  7: {
    i18n_short_title: "months_short.jul",
    i18n_title: "months.july",
  },
  8: {
    i18n_short_title: "months_short.aug",
    i18n_title: "months.august",
  },
  9: {
    i18n_short_title: "months_short.sep",
    i18n_title: "months.september",
  },
  10: {
    i18n_short_title: "months_short.oct",
    i18n_title: "months.october",
  },
  11: {
    i18n_short_title: "months_short.nov",
    i18n_title: "months.november",
  },
  12: {
    i18n_short_title: "months_short.dec",
    i18n_title: "months.december",
  },
};

export const DAYS_LIST: {
  [dayIndex: number]: {
    i18n_short_title: string;
    i18n_title: string;
    value: EStartOfTheWeek;
  };
} = {
  1: {
    i18n_short_title: "weekdays_short.sun",
    i18n_title: "weekdays.sunday",
    value: EStartOfTheWeek.SUNDAY,
  },
  2: {
    i18n_short_title: "weekdays_short.mon",
    i18n_title: "weekdays.monday",
    value: EStartOfTheWeek.MONDAY,
  },
  3: {
    i18n_short_title: "weekdays_short.tue",
    i18n_title: "weekdays.tuesday",
    value: EStartOfTheWeek.TUESDAY,
  },
  4: {
    i18n_short_title: "weekdays_short.wed",
    i18n_title: "weekdays.wednesday",
    value: EStartOfTheWeek.WEDNESDAY,
  },
  5: {
    i18n_short_title: "weekdays_short.thu",
    i18n_title: "weekdays.thursday",
    value: EStartOfTheWeek.THURSDAY,
  },
  6: {
    i18n_short_title: "weekdays_short.fri",
    i18n_title: "weekdays.friday",
    value: EStartOfTheWeek.FRIDAY,
  },
  7: {
    i18n_short_title: "weekdays_short.sat",
    i18n_title: "weekdays.saturday",
    value: EStartOfTheWeek.SATURDAY,
  },
};

export const CALENDAR_LAYOUTS: {
  [layout in TCalendarLayouts]: {
    key: TCalendarLayouts;
    i18n_title: string;
  };
} = {
  month: {
    key: "month",
    i18n_title: "calendar_layouts.month",
  },
  week: {
    key: "week",
    i18n_title: "calendar_layouts.week",
  },
};
