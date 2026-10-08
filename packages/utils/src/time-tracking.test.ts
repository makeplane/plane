/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import {
  addDaysToISODate,
  analyzeDurationInput,
  formatTimeDuration,
  formatElapsed,
  getAutoTimeReportInterval,
  getDatePresetRange,
  getElapsedSeconds,
  getTodayISODate,
  getWeekDays,
  getWeekStartDate,
  parseDurationInput,
} from "./time-tracking";

describe("parseDurationInput (plan Appendix A)", () => {
  it.each([
    ["1h 30m", 5400],
    ["1h30m", 5400],
    ["1 h 30 min", 5400],
    ["2h", 7200],
    ["2 hours", 7200],
    ["2hrs", 7200],
    ["2 hr", 7200],
    ["1 hour", 3600],
    ["45m", 2700],
    ["45 min", 2700],
    ["45 mins", 2700],
    ["45 minutes", 2700],
    ["1 minute", 60],
    ["1.5h", 5400],
    ["1,5h", 5400],
    ["1:30", 5400],
    ["0:05", 300],
    ["1.5", 5400],
    ["1,5", 5400],
    ["2", 7200],
    ["0.25", 900],
    [".5", 1800],
    ["24h", 86_400],
    ["24:00", 86_400],
    ["  1H 30M  ", 5400],
    ["90m", 5400],
    ["1.3333", 4800], // rounded to the nearest minute
  ])("%s → %d", (input, seconds) => {
    expect(parseDurationInput(input)).toBe(seconds);
  });

  it.each(["24h 1m", "25", "90", "0", "0m", "30s", "1:75", "abc", "1h 30", "-1h", "", "   ", "h", "1h1h", "1:3"])(
    "%j → null",
    (input) => {
      expect(parseDurationInput(input)).toBeNull();
    }
  );

  it("explains why an input is rejected", () => {
    expect(analyzeDurationInput("")).toEqual({ seconds: null, error: "empty" });
    expect(analyzeDurationInput("abc")).toEqual({ seconds: null, error: "invalid" });
    expect(analyzeDurationInput("0m")).toEqual({ seconds: null, error: "too_short" });
    expect(analyzeDurationInput("24h 1m")).toEqual({ seconds: null, error: "too_long" });
  });

  it("suggests minutes for a bare number that is too many hours", () => {
    expect(analyzeDurationInput("90")).toEqual({ seconds: null, error: "too_long", suggestedMinutes: 90 });
    expect(analyzeDurationInput("25")).toEqual({ seconds: null, error: "too_long", suggestedMinutes: 25 });
    // 2000 minutes is still more than a day
    expect(analyzeDurationInput("2000").suggestedMinutes).toBeUndefined();
    expect(analyzeDurationInput("90h").suggestedMinutes).toBeUndefined();
  });
});

describe("formatTimeDuration", () => {
  it.each([
    [5400, "1h 30m"],
    [2700, "45m"],
    [7200, "2h"],
    [0, "0m"],
    [59, "0m"],
    [5459, "1h 30m"],
    [360_000, "100h"],
  ])("short %d → %s", (seconds, text) => {
    expect(formatTimeDuration(seconds)).toBe(text);
    expect(formatTimeDuration(seconds, "short")).toBe(text);
  });

  it.each([
    [5400, "1:30"],
    [300, "0:05"],
    [0, "0:00"],
    [90_000, "25:00"],
  ])("clock %d → %s", (seconds, text) => {
    expect(formatTimeDuration(seconds, "clock")).toBe(text);
  });

  it.each([
    [5400, "1.50"],
    [900, "0.25"],
    [0, "0.00"],
    [1000, "0.28"],
  ])("decimal %d → %s", (seconds, text) => {
    expect(formatTimeDuration(seconds, "decimal")).toBe(text);
  });

  it("treats null, undefined and negatives as zero", () => {
    expect(formatTimeDuration(null)).toBe("0m");
    expect(formatTimeDuration(undefined, "clock")).toBe("0:00");
    expect(formatTimeDuration(-60)).toBe("0m");
  });
});

describe("formatElapsed", () => {
  it.each([
    [5025, "1:23:45"],
    [0, "0:00:00"],
    [59, "0:00:59"],
    [43_200, "12:00:00"],
    [-5, "0:00:00"],
  ])("%d → %s", (seconds, text) => {
    expect(formatElapsed(seconds)).toBe(text);
  });
});

describe("getElapsedSeconds", () => {
  const startedAt = "2026-10-07T10:00:00Z";
  const now = Date.parse("2026-10-07T10:05:00Z");

  it("measures from the start", () => {
    expect(getElapsedSeconds(startedAt, now, 0)).toBe(300);
  });

  it("uses the server clock when the browser runs behind (positive offset)", () => {
    expect(getElapsedSeconds(startedAt, now, 30_000)).toBe(330);
  });

  it("uses the server clock when the browser runs ahead (negative offset)", () => {
    expect(getElapsedSeconds(startedAt, now, -30_000)).toBe(270);
  });

  it("never goes negative", () => {
    expect(getElapsedSeconds(startedAt, Date.parse("2026-10-07T09:59:00Z"), 0)).toBe(0);
  });
});

describe("week helpers", () => {
  // 2026-10-07 is a Wednesday
  it.each([
    ["2026-10-07", 0, "2026-10-04"],
    ["2026-10-07", 1, "2026-10-05"],
    ["2026-10-07", 6, "2026-10-03"],
    ["2026-10-04", 0, "2026-10-04"], // a Sunday starts its own Sunday week
    ["2026-10-04", 1, "2026-09-28"], // ...but belongs to the previous Monday week
    ["2027-01-01", 1, "2026-12-28"], // across a year boundary
  ])("getWeekStartDate(%s, %d) → %s", (date, startOfWeek, expected) => {
    expect(getWeekStartDate(date, startOfWeek)).toBe(expected);
  });

  it("accepts a Date and uses its local calendar day", () => {
    expect(getWeekStartDate(new Date(2026, 9, 7, 23, 30), 1)).toBe("2026-10-05");
  });

  it("lists the seven days of a week, across a month end", () => {
    expect(getWeekDays("2026-09-28")).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });

  it("adds days across a leap day", () => {
    expect(addDaysToISODate("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysToISODate("2028-03-01", -1)).toBe("2028-02-29");
    expect(addDaysToISODate("2027-03-01", -1)).toBe("2027-02-28");
  });
});

describe("getDatePresetRange (plan Appendix B)", () => {
  const range = (preset: Parameters<typeof getDatePresetRange>[0], today: string, startOfWeek = 0) =>
    getDatePresetRange(preset, { today, startOfWeek });

  describe("on Wednesday 2026-10-07", () => {
    const today = "2026-10-07";
    it.each([
      ["today", "2026-10-07", "2026-10-07"],
      ["yesterday", "2026-10-06", "2026-10-06"],
      ["this_month", "2026-10-01", "2026-10-31"],
      ["last_month", "2026-09-01", "2026-09-30"],
      ["this_quarter", "2026-10-01", "2026-12-31"],
      ["last_quarter", "2026-07-01", "2026-09-30"],
      ["this_year", "2026-01-01", "2026-12-31"],
      ["last_year", "2025-01-01", "2025-12-31"],
      ["last_7_days", "2026-10-01", "2026-10-07"],
      ["last_30_days", "2026-09-08", "2026-10-07"],
      ["last_90_days", "2026-07-10", "2026-10-07"],
    ] as const)("%s", (preset, from, to) => {
      expect(range(preset, today)).toEqual({ from, to });
    });

    it("this_week and last_week with a Sunday start", () => {
      expect(range("this_week", today, 0)).toEqual({ from: "2026-10-04", to: "2026-10-10" });
      expect(range("last_week", today, 0)).toEqual({ from: "2026-09-27", to: "2026-10-03" });
    });

    it("this_week and last_week with a Monday start", () => {
      expect(range("this_week", today, 1)).toEqual({ from: "2026-10-05", to: "2026-10-11" });
      expect(range("last_week", today, 1)).toEqual({ from: "2026-09-28", to: "2026-10-04" });
    });
  });

  it("at a month end", () => {
    expect(range("this_month", "2026-01-31")).toEqual({ from: "2026-01-01", to: "2026-01-31" });
    expect(range("last_month", "2026-03-31")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(range("yesterday", "2026-03-01")).toEqual({ from: "2026-02-28", to: "2026-02-28" });
  });

  it("at a year end", () => {
    expect(range("this_week", "2026-12-31", 1)).toEqual({ from: "2026-12-28", to: "2027-01-03" });
    expect(range("last_quarter", "2026-01-15")).toEqual({ from: "2025-10-01", to: "2025-12-31" });
    expect(range("last_month", "2026-01-15")).toEqual({ from: "2025-12-01", to: "2025-12-31" });
    expect(range("last_7_days", "2027-01-02")).toEqual({ from: "2026-12-27", to: "2027-01-02" });
  });

  it("on a leap day", () => {
    expect(range("this_month", "2028-02-29")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(range("last_month", "2028-03-15")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(range("this_week", "2028-02-29", 0)).toEqual({ from: "2028-02-27", to: "2028-03-04" });
    expect(range("last_year", "2029-02-28")).toEqual({ from: "2028-01-01", to: "2028-12-31" });
  });

  it("accepts a Date for today", () => {
    expect(getDatePresetRange("today", { today: new Date(2026, 9, 7, 23, 59), startOfWeek: 0 })).toEqual({
      from: "2026-10-07",
      to: "2026-10-07",
    });
  });
});

describe("getAutoTimeReportInterval", () => {
  it.each([
    [{ from: "2026-10-01", to: "2026-10-31" }, "day"],
    [{ from: "2026-10-01", to: "2026-11-01" }, "week"],
    [{ from: "2026-01-01", to: "2026-07-01" }, "week"],
    [{ from: "2026-01-01", to: "2026-12-31" }, "month"],
    [null, "month"],
  ] as const)("%j → %s", (value, interval) => {
    expect(getAutoTimeReportInterval(value)).toBe(interval);
  });
});

describe("getTodayISODate", () => {
  const now = new Date("2026-10-07T23:30:00Z");

  it("uses the given timezone", () => {
    expect(getTodayISODate("Pacific/Auckland", now)).toBe("2026-10-08");
    expect(getTodayISODate("America/Los_Angeles", now)).toBe("2026-10-07");
  });

  it("falls back to the browser's zone for an unknown timezone", () => {
    expect(getTodayISODate("Not/AZone", now)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
