/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { renderFormattedDate, renderFormattedPayloadDate, renderFormattedTime } from "./datetime";

describe("timestamp formatting in a selected timezone", () => {
  it.each([
    ["2026-10-23T15:18:47.523136+00:00", "UTC", "Oct 23, 2026", "15:18"],
    ["2026-10-23T15:18:47.523136+00:00", "Asia/Kolkata", "Oct 23, 2026", "20:48"],
    ["2026-10-23T23:30:00Z", "Asia/Kolkata", "Oct 24, 2026", "05:00"],
    ["2026-10-23T01:30:00Z", "America/Los_Angeles", "Oct 22, 2026", "18:30"],
    ["2026-01-15T12:00:00Z", "America/New_York", "Jan 15, 2026", "07:00"],
    ["2026-07-15T12:00:00Z", "America/New_York", "Jul 15, 2026", "08:00"],
    ["2026-03-08T06:59:00Z", "America/New_York", "Mar 08, 2026", "01:59"],
    ["2026-03-08T07:00:00Z", "America/New_York", "Mar 08, 2026", "03:00"],
    ["2026-11-01T05:30:00Z", "America/New_York", "Nov 01, 2026", "01:30"],
    ["2026-11-01T06:30:00Z", "America/New_York", "Nov 01, 2026", "01:30"],
    ["2026-10-23T00:00:00Z", "UTC", "Oct 23, 2026", "00:00"],
  ])("formats %s in %s", (timestamp, timeZone, expectedDate, expectedTime) => {
    expect(renderFormattedDate(timestamp, undefined, timeZone)).toBe(expectedDate);
    expect(renderFormattedDate(new Date(timestamp), undefined, timeZone)).toBe(expectedDate);
    expect(renderFormattedTime(timestamp, "24-hour", timeZone)).toBe(expectedTime);
  });

  it("preserves 12-hour formatting and custom date formats", () => {
    expect(renderFormattedTime("2026-10-23T00:00:00Z", "12-hour", "UTC")).toBe("12:00 AM");
    expect(renderFormattedTime("2026-10-23T15:18:00Z", "12-hour", "UTC")).toBe("03:18 PM");
    expect(renderFormattedDate("2026-10-23T23:30:00Z", "yyyy-MM-dd", "Asia/Kolkata")).toBe("2026-10-24");
    expect(renderFormattedDate("2026-10-23T23:30:00Z", "invalid", "Asia/Kolkata")).toBe("Oct 24, 2026");
  });

  it("keeps date-only values and payload formatting unchanged", () => {
    for (const timeZone of ["UTC", "Asia/Kolkata", "America/Los_Angeles"]) {
      expect(renderFormattedDate("2026-10-23", undefined, timeZone)).toBe("Oct 23, 2026");
    }
    const timestamp = new Date("2026-10-23T23:30:00Z");
    const before = timestamp.getTime();
    const payload = renderFormattedPayloadDate(timestamp);
    renderFormattedDate(timestamp, undefined, "Asia/Kolkata");
    renderFormattedTime(timestamp, "24-hour", "Asia/Kolkata");
    expect(timestamp.getTime()).toBe(before);
    expect(renderFormattedPayloadDate(timestamp)).toBe(payload);
  });

  it("handles invalid dates and falls back to browser time for missing or invalid timezones", () => {
    expect(renderFormattedDate(undefined, undefined, "UTC")).toBeUndefined();
    expect(renderFormattedDate(null, undefined, "UTC")).toBeUndefined();
    expect(renderFormattedDate("invalid", undefined, "UTC")).toBeUndefined();
    expect(renderFormattedTime("invalid", "24-hour", "UTC")).toBe("");
    const timestamp = "2026-10-23T23:30:00Z";
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(renderFormattedTime(timestamp, "24-hour", "invalid")).toBe(renderFormattedTime(timestamp));
    expect(renderFormattedDate(timestamp, undefined, "invalid")).toBe(
      renderFormattedDate(new Date(timestamp), undefined, browserTimeZone)
    );
    expect(renderFormattedDate(timestamp)).toBe(renderFormattedDate(new Date(timestamp), undefined, browserTimeZone));
  });
});
