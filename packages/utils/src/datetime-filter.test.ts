/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { checkDateCriteria, parseDateFilter } from "./datetime";

const matches = (value: string | Date, filter: string) => {
  const { date, type } = parseDateFilter(filter);
  return checkDateCriteria(value, date, type);
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("date-only work item filters", () => {
  it("keeps relative boundaries on the correct day west of UTC", () => {
    vi.stubEnv("TZ", "America/New_York");
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 11, 12));
    expect(new Date().getTimezoneOffset()).toBe(300);
    expect(matches("2026-11-18", "1_weeks;after;fromnow")).toBe(true);
    expect(matches("2026-11-19", "1_weeks;before;fromnow")).toBe(false);
  });

  it("parses an absolute filter as a local calendar date", () => {
    const { date } = parseDateFilter("2026-11-18;after");
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 10, 18, 0]);
  });

  it.each(["after", "before"])("includes the exact absolute %s boundary", (operator) => {
    expect(matches("2026-11-18", `2026-11-18;${operator}`)).toBe(true);
  });

  it("keeps date-only values and local Date values on the same calendar day", () => {
    expect(matches(new Date(2026, 10, 18, 12), "2026-11-18;before")).toBe(true);
    expect(matches(new Date(2026, 10, 17, 12), "2026-11-18;after")).toBe(false);
  });

  it.each([
    ["2026-11-17", "after", false],
    ["2026-11-18", "after", true],
    ["2026-11-19", "after", true],
    ["2026-11-17", "before", true],
    ["2026-11-18", "before", true],
    ["2026-11-19", "before", false],
  ] as const)("matches %s against one week %s today", (value, operator, expected) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 11, 12));
    expect(matches(value, `1_weeks;${operator};fromnow`)).toBe(expected);
  });

  it.each([
    [2026, 2, 7, "2026-03-08"],
    [2026, 9, 31, "2026-11-01"],
    [2026, 11, 31, "2027-01-01"],
  ] as const)("retains the next calendar date from %i-%i-%i", (year, month, day, expected) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(year, month, day, 12));
    expect(matches(expected, "1_days;after;fromnow")).toBe(true);
  });

  it("preserves instant-based parsing for timestamp strings", () => {
    const timestamp = "2026-11-18T02:30:00+05:30";
    const { date } = parseDateFilter(`${timestamp};after`);
    expect(date.getTime()).toBe(new Date(timestamp).getTime());
    const boundary = new Date(timestamp);
    expect(checkDateCriteria(timestamp, boundary, "after")).toBe(true);
    expect(checkDateCriteria(timestamp, boundary, "before")).toBe(true);
  });

  it("does not mutate Date arguments", () => {
    const value = new Date(2026, 10, 18, 12, 30);
    const boundary = new Date(2026, 10, 18, 15, 30);
    const originals = [value.getTime(), boundary.getTime()];
    expect(checkDateCriteria(value, boundary, "after")).toBe(true);
    expect([value.getTime(), boundary.getTime()]).toEqual(originals);
  });

  it("rejects missing or invalid dates", () => {
    const boundary = new Date(2026, 10, 18);
    expect(checkDateCriteria(null, boundary, "after")).toBe(false);
    expect(checkDateCriteria("not-a-date", boundary, "after")).toBe(false);
    expect(checkDateCriteria("2026-11-18", new Date(NaN), "before")).toBe(false);
  });
});
