/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCalendarDay } from "@plane/types";
import { describe, expect, it } from "vitest";
import {
  addDays,
  countDays,
  formatTimeRange,
  getIsoWeekday,
  getMonthGrid,
  getWeekDays,
  isEditableDate,
  parseDateKey,
  shiftMonths,
} from "./calendar-dates";

const day = (overrides: Partial<TCalendarDay>): TCalendarDay => ({
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
  is_unplanned: false,
  entry: null,
  ...overrides,
});

describe("day keys", () => {
  it("parses a key into a local date", () => {
    const date = parseDateKey("2027-03-09");
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2027, 2, 9]);
  });

  it("adds days across month and year ends and back", () => {
    expect(addDays("2027-01-31", 1)).toBe("2027-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("numbers weekdays the ISO way", () => {
    expect(getIsoWeekday("2027-01-04")).toBe(1); // Monday
    expect(getIsoWeekday("2027-01-09")).toBe(6); // Saturday
    expect(getIsoWeekday("2027-01-10")).toBe(7); // Sunday
  });

  it("moves by months to the first of the month", () => {
    expect(shiftMonths(new Date(2027, 0, 31), 1)).toEqual(new Date(2027, 1, 1));
    expect(shiftMonths(new Date(2027, 0, 15), -1)).toEqual(new Date(2026, 11, 1));
  });
});

describe("getWeekDays", () => {
  it("returns seven days starting on the chosen weekday", () => {
    const wednesday = new Date(2027, 0, 6);

    expect(getWeekDays(wednesday, 1)[0]).toBe("2027-01-04");
    expect(getWeekDays(wednesday, 1)).toHaveLength(7);
    expect(getWeekDays(wednesday, 0)[0]).toBe("2027-01-03");
    expect(getWeekDays(wednesday, 6)[0]).toBe("2027-01-02");
  });
});

describe("getMonthGrid", () => {
  it("covers whole weeks and includes neighbouring days", () => {
    const grid = getMonthGrid(new Date(2027, 0, 15), 1); // January 2027 starts on a Friday

    expect(grid.from).toBe("2026-12-28");
    expect(grid.to).toBe("2027-01-31");
    expect(grid.weeks).toHaveLength(5);
    expect(grid.weeks.every((week) => week.length === 7)).toBe(true);
    expect(grid.weeks[0][0]).toBe("2026-12-28");
    expect(grid.weeks[4][6]).toBe("2027-01-31");
    expect([grid.year, grid.month]).toEqual([2027, 0]);
  });

  it("needs only four weeks when February fits exactly", () => {
    const grid = getMonthGrid(new Date(2027, 1, 1), 1); // February 2027: Mon 1st to Sun 28th

    expect(grid.weeks).toHaveLength(4);
    expect(grid.from).toBe("2027-02-01");
    expect(grid.to).toBe("2027-02-28");
  });

  it("can need six weeks", () => {
    const grid = getMonthGrid(new Date(2027, 7, 1), 0); // August 2027 starts on a Sunday, ends on a Tuesday

    expect(grid.from).toBe("2027-08-01");
    expect(grid.to).toBe("2027-09-04");
    expect(grid.weeks).toHaveLength(5);
    const sixWeeks = getMonthGrid(new Date(2027, 4, 1), 1); // May 2027 starts on a Saturday
    expect(sixWeeks.weeks).toHaveLength(6);
  });

  it("follows the week start", () => {
    const sunday = getMonthGrid(new Date(2027, 0, 15), 0);
    const monday = getMonthGrid(new Date(2027, 0, 15), 1);

    expect(parseDateKey(sunday.weeks[0][0]).getDay()).toBe(0);
    expect(parseDateKey(monday.weeks[0][0]).getDay()).toBe(1);
  });

  it("lists every day exactly once, in order", () => {
    const grid = getMonthGrid(new Date(2027, 2, 10), 1);
    const flat = grid.weeks.flat();

    expect(new Set(flat).size).toBe(flat.length);
    expect(flat.toSorted()).toEqual(flat);
    expect(flat[0]).toBe(grid.from);
    expect(flat[flat.length - 1]).toBe(grid.to);
  });
});

describe("isEditableDate", () => {
  it("allows the first editable day and later, refuses earlier", () => {
    expect(isEditableDate("2027-01-04", "2027-01-04")).toBe(true);
    expect(isEditableDate("2027-01-05", "2027-01-04")).toBe(true);
    expect(isEditableDate("2027-01-03", "2027-01-04")).toBe(false);
  });

  it("has no limit without an earliest day", () => {
    expect(isEditableDate("1999-01-01", null)).toBe(true);
    expect(isEditableDate("1999-01-01", undefined)).toBe(true);
  });
});

describe("formatTimeRange", () => {
  it("joins both times and hides a missing range", () => {
    expect(formatTimeRange("09:00", "17:30")).toBe("09:00 – 17:30");
    expect(formatTimeRange(null, null)).toBe("");
    expect(formatTimeRange("09:00", null)).toBe("");
  });
});

describe("countDays", () => {
  it("counts modes, holidays and unplanned working days separately", () => {
    const counts = countDays([
      day({ mode: "ONSITE", source: "MANUAL" }),
      day({ mode: "ONSITE", source: "TEMPLATE" }),
      day({ mode: "REMOTE", source: "MANUAL" }),
      day({ mode: "LEAVE", source: "MANUAL", leave_type: "SICK" }),
      day({ mode: "OFF", source: "MANUAL", is_working_day: false }),
      day({ mode: null, source: "HOLIDAY", holiday: "New Year", is_working_day: false }),
      day({ mode: null, is_unplanned: true }),
      day({ mode: null, is_working_day: false }),
    ]);

    expect(counts).toEqual({ ONSITE: 2, REMOTE: 1, OFF: 1, LEAVE: 1, HOLIDAY: 1, UNPLANNED: 1 });
  });

  it("counts a worked holiday as its mode, not as a holiday", () => {
    const counts = countDays([day({ mode: "REMOTE", source: "MANUAL", holiday: "New Year", is_working_day: false })]);

    expect(counts.REMOTE).toBe(1);
    expect(counts.HOLIDAY).toBe(0);
  });
});
