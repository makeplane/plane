/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { getReportFileName, getReportPeriods, validateReportRange } from "./calendar-reports";

describe("getReportPeriods", () => {
  it("lists this and last week and this and last month", () => {
    const periods = getReportPeriods(new Date(2027, 0, 13), 1); // Wednesday 13 January 2027

    expect(periods.map((period) => period.key)).toEqual(["this-week", "last-week", "this-month", "last-month"]);
    expect(periods[0]).toMatchObject({ from: "2027-01-11", to: "2027-01-17" });
    expect(periods[1]).toMatchObject({ from: "2027-01-04", to: "2027-01-10" });
    expect(periods[2]).toMatchObject({ from: "2027-01-01", to: "2027-01-31" });
    expect(periods[3]).toMatchObject({ from: "2026-12-01", to: "2026-12-31" });
  });

  it("starts weeks on the chosen weekday", () => {
    const periods = getReportPeriods(new Date(2027, 0, 13), 0);

    expect(periods[0]).toMatchObject({ from: "2027-01-10", to: "2027-01-16" });
  });

  it("handles leap-year February and a January last month", () => {
    const march = getReportPeriods(new Date(2028, 2, 5), 1);
    const january = getReportPeriods(new Date(2027, 0, 5), 1);

    expect(march[3]).toMatchObject({ from: "2028-02-01", to: "2028-02-29" });
    expect(january[3]).toMatchObject({ from: "2026-12-01", to: "2026-12-31" });
  });
});

describe("validateReportRange", () => {
  it("accepts ranges within each report's limit", () => {
    expect(validateReportRange("plan-summary", "2027-01-01", "2027-12-31")).toBeNull();
    expect(validateReportRange("planned-vs-logged", "2027-01-01", "2027-04-03")).toBeNull(); // 93 days
  });

  it("rejects missing, reversed and too long ranges", () => {
    expect(validateReportRange("plan-summary", "", "2027-01-31")).toMatch(/start and an end/);
    expect(validateReportRange("plan-summary", "2027-02-01", "2027-01-31")).toMatch(/not be before/);
    expect(validateReportRange("planned-vs-logged", "2027-01-01", "2027-04-04")).toBe(
      "Plan vs logged covers at most 93 days."
    );
    expect(validateReportRange("plan-summary", "2027-01-01", "2028-01-02")).toMatch(/at most 366/);
  });
});

describe("getReportFileName", () => {
  it("names the file after the report and the period", () => {
    expect(getReportFileName("plan-summary", "2027-01-01", "2027-01-31")).toBe(
      "plan-summary_2027-01-01_2027-01-31.csv"
    );
  });
});
