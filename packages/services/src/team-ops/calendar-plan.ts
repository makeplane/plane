/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCalendarDay, TCalendarDayPayload, TLeaveType, TWeeklyPlanDay, TWorkMode } from "@plane/types";

/** The values of a plan form, kept as strings so inputs can hold half-typed values. */
export type TPlanValues = {
  mode: TWorkMode;
  /** `HH:MM`, or empty. */
  start: string;
  end: string;
  leaveType: TLeaveType;
  description: string;
};

/** Modes that describe working hours; the other two have no times. */
export const isWorkingMode = (mode: TWorkMode): boolean => mode === "ONSITE" || mode === "REMOTE";

/** The form values for a day: its current plan, or sensible defaults when nothing is planned. */
export const planFromDay = (
  day: Pick<TCalendarDay, "mode" | "planned_start_time" | "planned_end_time" | "leave_type" | "description">
): TPlanValues => ({
  mode: day.mode ?? "ONSITE",
  start: day.planned_start_time ?? "",
  end: day.planned_end_time ?? "",
  leaveType: day.leave_type ?? "ANNUAL",
  description: day.description,
});

/**
 * The first problem with a plan's times, or `null` when it is fine. Mirrors the server's rules:
 * a working day has both times or neither, in order; the other modes have none.
 */
export const validatePlanTimes = (mode: TWorkMode, start: string, end: string): string | null => {
  if (!isWorkingMode(mode)) return null;
  if (!start && !end) return null;
  if (!start || !end) return "Set both the start and the end time, or neither.";
  if (end <= start) return "The end time must be after the start time.";
  return null;
};

/** The request body for saving a plan. Times only go with working modes, the leave type only with leave. */
export const toDayPayload = (values: TPlanValues): TCalendarDayPayload => {
  const working = isWorkingMode(values.mode);
  return {
    work_mode: values.mode,
    planned_start_time: working && values.start ? values.start : null,
    planned_end_time: working && values.end ? values.end : null,
    description: values.description.trim(),
    leave_type: values.mode === "LEAVE" ? values.leaveType : null,
  };
};

/** ISO weekdays, Monday first, with the names the weekly plan shows. */
export const WEEKDAY_NAMES: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

export const ISO_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

export const DEFAULT_WORK_START = "09:00";
export const DEFAULT_WORK_END = "17:00";

export type TWeeklyPlanRow = {
  weekday: number;
  enabled: boolean;
  mode: Exclude<TWorkMode, "LEAVE">;
  start: string;
  end: string;
};

/** Seven editable rows, filled from the saved plan. A weekday that is not in the plan is switched off. */
export const rowsFromPlan = (plan: TWeeklyPlanDay[] | undefined): TWeeklyPlanRow[] =>
  ISO_WEEKDAYS.map((weekday) => {
    const saved = plan?.find((day) => day.weekday === weekday);
    return {
      weekday,
      enabled: !!saved?.is_active,
      mode: saved?.work_mode ?? "ONSITE",
      start: saved?.planned_start_time ?? DEFAULT_WORK_START,
      end: saved?.planned_end_time ?? DEFAULT_WORK_END,
    };
  });

/** The first problem in the rows, or `null`. */
export const validatePlanRows = (rows: TWeeklyPlanRow[]): string | null => {
  for (const row of rows) {
    if (!row.enabled) continue;
    const problem = validatePlanTimes(row.mode, row.start, row.end);
    if (problem) return `${WEEKDAY_NAMES[row.weekday]}: ${problem}`;
  }
  return null;
};

/** The days to send: switched-off weekdays are left out, which removes them from the plan. */
export const rowsToPlanDays = (rows: TWeeklyPlanRow[]): TWeeklyPlanDay[] =>
  rows
    .filter((row) => row.enabled)
    .map((row) => {
      const working = isWorkingMode(row.mode);
      return {
        weekday: row.weekday,
        work_mode: row.mode,
        planned_start_time: working && row.start ? row.start : null,
        planned_end_time: working && row.end ? row.end : null,
        is_active: true,
      };
    });
