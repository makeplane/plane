/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCalendarDay, TWeeklyPlanDay } from "@plane/types";
import { describe, expect, it } from "vitest";
import type { TWeeklyPlanRow } from "./calendar-plan";
import {
  isWorkingMode,
  planFromDay,
  rowsFromPlan,
  rowsToPlanDays,
  toDayPayload,
  validatePlanRows,
  validatePlanTimes,
} from "./calendar-plan";

const emptyDay: TCalendarDay = {
  date: "2027-01-04",
  mode: null,
  source: "NONE",
  planned_start_time: null,
  planned_end_time: null,
  planned_seconds: 0,
  description: "",
  leave_type: null,
  holiday: null,
  is_working_day: true,
  is_unplanned: true,
  entry: null,
};

describe("planFromDay", () => {
  it("starts an unplanned day as onsite", () => {
    expect(planFromDay(emptyDay)).toEqual({
      mode: "ONSITE",
      start: "",
      end: "",
      leaveType: "ANNUAL",
      description: "",
    });
  });

  it("carries over what is planned", () => {
    const values = planFromDay({
      ...emptyDay,
      mode: "LEAVE",
      leave_type: "SICK",
      description: "Flu",
    });

    expect(values).toMatchObject({ mode: "LEAVE", leaveType: "SICK", description: "Flu" });
  });
});

describe("validatePlanTimes", () => {
  it("accepts no times, or both times in order", () => {
    expect(validatePlanTimes("ONSITE", "", "")).toBeNull();
    expect(validatePlanTimes("REMOTE", "09:00", "17:00")).toBeNull();
  });

  it("asks for both times or neither", () => {
    expect(validatePlanTimes("ONSITE", "09:00", "")).toMatch(/both/);
    expect(validatePlanTimes("ONSITE", "", "17:00")).toMatch(/both/);
  });

  it("wants the end after the start", () => {
    expect(validatePlanTimes("ONSITE", "17:00", "09:00")).toMatch(/after/);
    expect(validatePlanTimes("ONSITE", "09:00", "09:00")).toMatch(/after/);
  });

  it("ignores times for modes without hours", () => {
    expect(validatePlanTimes("OFF", "17:00", "09:00")).toBeNull();
    expect(validatePlanTimes("LEAVE", "09:00", "")).toBeNull();
  });
});

describe("toDayPayload", () => {
  it("keeps times only for working modes and the leave type only for leave", () => {
    const base = { start: "09:00", end: "17:00", leaveType: "SICK" as const, description: "  note " };

    expect(toDayPayload({ ...base, mode: "ONSITE" })).toEqual({
      work_mode: "ONSITE",
      planned_start_time: "09:00",
      planned_end_time: "17:00",
      description: "note",
      leave_type: null,
    });
    expect(toDayPayload({ ...base, mode: "OFF" })).toMatchObject({
      planned_start_time: null,
      planned_end_time: null,
      leave_type: null,
    });
    expect(toDayPayload({ ...base, mode: "LEAVE" })).toMatchObject({
      planned_start_time: null,
      leave_type: "SICK",
    });
  });

  it("sends null instead of empty times", () => {
    const payload = toDayPayload({ mode: "REMOTE", start: "", end: "", leaveType: "ANNUAL", description: "" });

    expect(payload.planned_start_time).toBeNull();
    expect(payload.planned_end_time).toBeNull();
  });

  it("knows which modes have hours", () => {
    expect(isWorkingMode("ONSITE")).toBe(true);
    expect(isWorkingMode("REMOTE")).toBe(true);
    expect(isWorkingMode("OFF")).toBe(false);
    expect(isWorkingMode("LEAVE")).toBe(false);
  });
});

const patchRow = (rows: TWeeklyPlanRow[], weekday: number, patch: Partial<TWeeklyPlanRow>): TWeeklyPlanRow[] =>
  rows.map((row) => (row.weekday === weekday ? Object.assign({}, row, patch) : row));

describe("weekly plan rows", () => {
  const saved: TWeeklyPlanDay[] = [
    { weekday: 1, work_mode: "ONSITE", planned_start_time: "08:00", planned_end_time: "16:00", is_active: true },
    { weekday: 3, work_mode: "REMOTE", planned_start_time: null, planned_end_time: null, is_active: true },
    { weekday: 5, work_mode: "OFF", planned_start_time: null, planned_end_time: null, is_active: false },
  ];

  it("builds seven rows, switching on only the active saved weekdays", () => {
    const rows = rowsFromPlan(saved);

    expect(rows.map((row) => row.weekday)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(rows.filter((row) => row.enabled).map((row) => row.weekday)).toEqual([1, 3]);
    expect(rows[0]).toMatchObject({ mode: "ONSITE", start: "08:00", end: "16:00" });
    expect(rows[1]).toMatchObject({ enabled: false, mode: "ONSITE", start: "09:00", end: "17:00" });
  });

  it("starts with every weekday off when there is no plan", () => {
    expect(rowsFromPlan(undefined).every((row) => !row.enabled)).toBe(true);
  });

  it("sends only the switched-on rows, without hours for days off", () => {
    const rows = patchRow(rowsFromPlan(saved), 2, { enabled: true, mode: "OFF" });

    expect(rowsToPlanDays(rows)).toEqual([
      { weekday: 1, work_mode: "ONSITE", planned_start_time: "08:00", planned_end_time: "16:00", is_active: true },
      { weekday: 2, work_mode: "OFF", planned_start_time: null, planned_end_time: null, is_active: true },
      { weekday: 3, work_mode: "REMOTE", planned_start_time: "09:00", planned_end_time: "17:00", is_active: true },
    ]);
  });

  it("reports the first bad row by weekday name and ignores switched-off rows", () => {
    const rows = patchRow(patchRow(rowsFromPlan(saved), 3, { start: "18:00", end: "09:00" }), 6, { start: "" });

    expect(validatePlanRows(rows)).toBe("Wednesday: The end time must be after the start time.");
    expect(validatePlanRows(rowsFromPlan(saved))).toBeNull();
  });
});
