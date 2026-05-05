/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// --- Enums ---

// TWeekPatternKey is kept for UI display mapping (T2..CN labels), but
// week_pattern on IWorkSchedule uses boolean[] (DB/serializer canonical form):
// index 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun. true = working day.
export type TWeekPatternKey = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type TDayOverrideType = "WORKDAY" | "HOLIDAY";

// --- Work Schedule ---

export interface IWorkSchedule {
  id: string;
  name: string;
  is_default: boolean;
  /** 7-element boolean array: index 0=Mon … 6=Sun. true = working day. */
  week_pattern: boolean[];
  timezone: string;
  country_code: string;
  created_at: string;
  updated_at: string;
}

export type IWorkScheduleCreate = Pick<
  IWorkSchedule,
  "name" | "week_pattern" | "timezone" | "country_code" | "is_default"
>;

export type IWorkScheduleUpdate = Partial<IWorkScheduleCreate>;

// --- Holiday ---

export interface IHoliday {
  id: string;
  schedule: string; // UUID
  date: string; // YYYY-MM-DD
  name: string;
  created_at: string;
  updated_at: string;
}

export type IHolidayCreate = Pick<IHoliday, "date" | "name">;

export type IHolidayUpdate = Partial<IHolidayCreate>;

// --- Day Override ---

export interface IDayOverride {
  id: string;
  schedule: string; // UUID
  date: string; // YYYY-MM-DD
  type: TDayOverrideType;
  reason: string;
  swap_with_date: string | null; // YYYY-MM-DD or null
  created_at: string;
  updated_at: string;
}

export type IDayOverrideCreate = Pick<IDayOverride, "date" | "type" | "reason" | "swap_with_date">;

export type IDayOverrideUpdate = Partial<IDayOverrideCreate>;

// --- Copy Year ---

export interface ICopyYearResponse {
  copied_holidays: number;
  copied_overrides: number;
  skipped: number;
  warnings: string[];
}
