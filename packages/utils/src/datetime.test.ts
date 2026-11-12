/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { checkDateCriteria, parseDateFilter, processRelativeDate } from "./datetime";

describe("relative month date filters", () => {
  afterEach(() => vi.useRealTimers());

  it.each([
    [2025, 0, 31, "1_months", 2025, 2, 2],
    [2024, 0, 31, "1_months", 2024, 2, 1],
    [2025, 1, 1, "1_months", 2025, 2, 3],
    [2025, 0, 31, "2_months", 2025, 3, 1],
    [2025, 11, 15, "1_months", 2026, 0, 14],
    [2025, 2, 31, "-1_months", 2025, 2, 1],
  ])("uses 30 days per month from %i/%i/%i for %s", (year, month, day, value, endYear, endMonth, endDay) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(year, month, day, 12));
    expect(processRelativeDate(value)).toEqual(new Date(endYear, endMonth, endDay, 12));
  });

  it("includes the API's 30-day boundary when filtering sub-work items", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 31, 12));
    const { date, type } = parseDateFilter("1_months;after;fromnow");
    expect(checkDateCriteria(new Date(2025, 2, 2), date, type)).toBe(true);
    expect(checkDateCriteria(new Date(2025, 2, 1), date, type)).toBe(false);
  });

  it.each([
    ["1_days", 1],
    ["2_weeks", 14],
  ])("preserves %s offsets", (value, days) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 12));
    expect(processRelativeDate(value)).toEqual(new Date(2025, 0, 1 + days, 12));
  });
});
