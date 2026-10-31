/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import {
  MAX_ENTRY_SECONDS,
  formatClock,
  formatDuration,
  getWeekRange,
  shiftWeeks,
  splitDuration,
  toDateKey,
  toDurationSeconds,
} from "./time-format";

describe("splitDuration", () => {
  it("splits seconds into whole hours and minutes", () => {
    expect(splitDuration(5400)).toEqual({ hours: 1, minutes: 30 });
    expect(splitDuration(59)).toEqual({ hours: 0, minutes: 0 });
  });

  it("treats negative values as zero", () => {
    expect(splitDuration(-10)).toEqual({ hours: 0, minutes: 0 });
  });
});

describe("toDurationSeconds", () => {
  it("converts hours and minutes", () => {
    expect(toDurationSeconds(1, 30)).toBe(5400);
    expect(toDurationSeconds(0, 5)).toBe(300);
  });

  it("accepts exactly one day", () => {
    expect(toDurationSeconds(24, 0)).toBe(MAX_ENTRY_SECONDS);
  });

  it.each([
    [0, 0],
    [-1, 10],
    [1, -5],
    [1.5, 0],
    [0, 2.5],
    [24, 1],
    [Number.NaN, 0],
  ])("rejects %s h %s m", (hours, minutes) => {
    expect(toDurationSeconds(hours, minutes)).toBeNull();
  });
});

describe("formatClock", () => {
  it("pads every field", () => {
    expect(formatClock(0)).toBe("00:00:00");
    expect(formatClock(3661)).toBe("01:01:01");
  });

  it("keeps counting past a day instead of wrapping", () => {
    expect(formatClock(100 * 3600)).toBe("100:00:00");
  });
});

describe("formatDuration", () => {
  it("omits empty units", () => {
    expect(formatDuration(9000, "en")).toBe("2h 30m");
    expect(formatDuration(7200, "en")).toBe("2h");
    expect(formatDuration(1800, "en")).toBe("30m");
  });

  it("shows seconds under a minute", () => {
    expect(formatDuration(45, "en")).toBe("45s");
    expect(formatDuration(0, "en")).toBe("0s");
  });

  it("drops leftover seconds once past a minute", () => {
    expect(formatDuration(3659, "en")).toBe("1h");
  });
});

describe("toDateKey", () => {
  it("uses the local calendar day with zero padding", () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("getWeekRange", () => {
  it("starts on Monday by default", () => {
    // Friday 30 Oct 2026
    expect(getWeekRange(new Date(2026, 9, 30))).toEqual({ from: "2026-10-26", to: "2026-11-01" });
  });

  it("returns the same week for a Monday and a Sunday", () => {
    const week = { from: "2026-10-26", to: "2026-11-01" };
    expect(getWeekRange(new Date(2026, 9, 26))).toEqual(week);
    expect(getWeekRange(new Date(2026, 10, 1))).toEqual(week);
  });

  it("supports other first days of the week", () => {
    // Saturday-first week (Persian calendar convention)
    expect(getWeekRange(new Date(2026, 9, 30), 6)).toEqual({ from: "2026-10-24", to: "2026-10-30" });
    // Sunday-first
    expect(getWeekRange(new Date(2026, 9, 30), 0)).toEqual({ from: "2026-10-25", to: "2026-10-31" });
  });

  it("crosses year boundaries", () => {
    expect(getWeekRange(new Date(2026, 0, 1))).toEqual({ from: "2025-12-29", to: "2026-01-04" });
  });
});

describe("shiftWeeks", () => {
  it("moves by whole weeks in both directions", () => {
    expect(toDateKey(shiftWeeks(new Date(2026, 9, 30), 1))).toBe("2026-11-06");
    expect(toDateKey(shiftWeeks(new Date(2026, 9, 30), -5))).toBe("2026-09-25");
  });
});
