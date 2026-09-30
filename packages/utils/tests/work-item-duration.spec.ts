/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import {
  WORK_ITEM_DURATION_MIN,
  calculateStartDateFromDuration,
  calculateTargetDateFromDuration,
  calculateWorkItemDuration,
  normalizeWorkItemDuration,
  reconcileWorkItemDuration,
} from "../src/work-item/duration";

describe("work item duration helpers", () => {
  it("counts duration inclusively", () => {
    expect(calculateWorkItemDuration("2026-01-01", "2026-01-05")).toBe(5);
    expect(calculateWorkItemDuration("2026-02-02", "2026-02-06")).toBe(5);
  });

  it("treats a single day work item as one day", () => {
    expect(calculateWorkItemDuration("2026-01-01", "2026-01-01")).toBe(1);
  });

  it("returns undefined when a date is missing", () => {
    expect(calculateWorkItemDuration(null, "2026-01-05")).toBeUndefined();
    expect(calculateWorkItemDuration("2026-01-01", null)).toBeUndefined();
    expect(calculateWorkItemDuration(undefined, undefined)).toBeUndefined();
  });

  it("reports a backwards range as a non positive duration", () => {
    expect(calculateWorkItemDuration("2026-01-10", "2026-01-05")).toBeLessThan(WORK_ITEM_DURATION_MIN);
  });

  it("derives the target date from the start date", () => {
    expect(calculateTargetDateFromDuration("2026-01-01", 5)).toBe("2026-01-05");
    expect(calculateTargetDateFromDuration("2026-01-01", 1)).toBe("2026-01-01");
  });

  it("derives the start date from the target date", () => {
    expect(calculateStartDateFromDuration("2026-01-10", 3)).toBe("2026-01-08");
    expect(calculateStartDateFromDuration("2026-01-10", 1)).toBe("2026-01-10");
  });

  it("crosses month and year boundaries", () => {
    expect(calculateTargetDateFromDuration("2026-12-30", 5)).toBe("2027-01-03");
    expect(calculateStartDateFromDuration("2027-01-03", 5)).toBe("2026-12-30");
    // 2028 is a leap year, so February has 29 days
    expect(calculateTargetDateFromDuration("2028-02-27", 4)).toBe("2028-03-01");
  });

  it("normalizes durations to whole days of at least one", () => {
    expect(normalizeWorkItemDuration(3.4)).toBe(3);
    expect(normalizeWorkItemDuration(3.6)).toBe(4);
    expect(normalizeWorkItemDuration(0)).toBe(WORK_ITEM_DURATION_MIN);
    expect(normalizeWorkItemDuration(-5)).toBe(WORK_ITEM_DURATION_MIN);
    expect(normalizeWorkItemDuration(null)).toBeNull();
    expect(normalizeWorkItemDuration(undefined)).toBeNull();
    expect(normalizeWorkItemDuration(Number.NaN)).toBeNull();
  });
});

describe("reconcileWorkItemDuration - editing the duration", () => {
  it("calculates the target date when a start date exists", () => {
    expect(reconcileWorkItemDuration({ start_date: "2026-01-01", target_date: null }, { duration: 5 })).toEqual({
      duration: 5,
      target_date: "2026-01-05",
    });
  });

  it("calculates the start date when only a target date exists", () => {
    expect(reconcileWorkItemDuration({ start_date: null, target_date: "2026-01-10" }, { duration: 3 })).toEqual({
      duration: 3,
      start_date: "2026-01-08",
    });
  });

  it("keeps the start date anchored when both dates exist", () => {
    expect(
      reconcileWorkItemDuration({ start_date: "2026-02-02", target_date: "2026-02-06", duration: 5 }, { duration: 8 })
    ).toEqual({
      duration: 8,
      target_date: "2026-02-09",
    });
  });

  it("stores a duration on a work item without any dates", () => {
    expect(reconcileWorkItemDuration({ start_date: null, target_date: null }, { duration: 4 })).toEqual({
      duration: 4,
    });
  });

  it("leaves the dates untouched when the duration is cleared", () => {
    expect(
      reconcileWorkItemDuration(
        { start_date: "2026-01-01", target_date: "2026-01-05", duration: 5 },
        { duration: null }
      )
    ).toEqual({ duration: null });
  });

  it("clamps an out of range duration before deriving dates", () => {
    expect(reconcileWorkItemDuration({ start_date: "2026-01-01" }, { duration: 0 })).toEqual({
      duration: WORK_ITEM_DURATION_MIN,
      target_date: "2026-01-01",
    });
  });
});

describe("reconcileWorkItemDuration - editing the dates", () => {
  it("calculates the duration once both dates are set", () => {
    expect(
      reconcileWorkItemDuration({ start_date: "2026-02-02", target_date: null }, { target_date: "2026-02-06" })
    ).toEqual({
      target_date: "2026-02-06",
      duration: 5,
    });
  });

  it("recalculates the duration when a date is moved", () => {
    expect(
      reconcileWorkItemDuration(
        { start_date: "2026-02-02", target_date: "2026-02-06", duration: 5 },
        { start_date: "2026-02-04" }
      )
    ).toEqual({
      start_date: "2026-02-04",
      duration: 3,
    });
  });

  it("derives the missing target date from an existing duration", () => {
    expect(reconcileWorkItemDuration({ duration: 5 }, { start_date: "2026-01-01" })).toEqual({
      start_date: "2026-01-01",
      target_date: "2026-01-05",
    });
  });

  it("derives the missing start date from an existing duration", () => {
    expect(reconcileWorkItemDuration({ duration: 3 }, { target_date: "2026-01-10" })).toEqual({
      target_date: "2026-01-10",
      start_date: "2026-01-08",
    });
  });

  it("does not resurrect a date the user just cleared", () => {
    expect(
      reconcileWorkItemDuration(
        { start_date: "2026-01-01", target_date: "2026-01-05", duration: 5 },
        { target_date: null }
      )
    ).toEqual({ target_date: null });

    expect(
      reconcileWorkItemDuration(
        { start_date: "2026-01-01", target_date: "2026-01-05", duration: 5 },
        { start_date: null }
      )
    ).toEqual({ start_date: null });
  });

  it("keeps the duration when both dates are cleared", () => {
    expect(
      reconcileWorkItemDuration(
        { start_date: "2026-01-01", target_date: "2026-01-05", duration: 5 },
        { start_date: null, target_date: null }
      )
    ).toEqual({ start_date: null, target_date: null });
  });

  it("leaves the duration untouched when only one date is known and no duration is set", () => {
    expect(reconcileWorkItemDuration({}, { start_date: "2026-01-01" })).toEqual({
      start_date: "2026-01-01",
    });
  });

  it("drags the target date along when the start date slips past it", () => {
    expect(
      reconcileWorkItemDuration(
        { start_date: "2026-01-01", target_date: "2026-01-05", duration: 5 },
        { start_date: "2026-01-10" }
      )
    ).toEqual({
      start_date: "2026-01-10",
      target_date: "2026-01-14",
      duration: 5,
    });
  });

  it("pulls the start date back when the target date moves before it", () => {
    expect(
      reconcileWorkItemDuration(
        { start_date: "2026-01-10", target_date: "2026-01-14", duration: 5 },
        { target_date: "2026-01-05" }
      )
    ).toEqual({
      target_date: "2026-01-05",
      start_date: "2026-01-01",
      duration: 5,
    });
  });

  it("falls back to the previous date range when no duration is stored", () => {
    expect(
      reconcileWorkItemDuration({ start_date: "2026-01-01", target_date: "2026-01-03" }, { start_date: "2026-01-10" })
    ).toEqual({
      start_date: "2026-01-10",
      target_date: "2026-01-12",
      duration: 3,
    });
  });

  it("returns the change untouched when no duration field was edited", () => {
    expect(reconcileWorkItemDuration({ start_date: "2026-01-01", target_date: "2026-01-05", duration: 5 }, {})).toEqual(
      {}
    );
  });
});
