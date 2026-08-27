/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { calculateTimeAgo, calculateTimeAgoShort, parseDateSafe } from "../src/datetime";

describe("datetime helpers: calculateTimeAgo and calculateTimeAgoShort", () => {
  describe("parseDateSafe", () => {
    it("should safely return undefined for null, undefined, or empty string", () => {
      expect(parseDateSafe(null)).toBeUndefined();
      expect(parseDateSafe(undefined)).toBeUndefined();
      expect(parseDateSafe("")).toBeUndefined();
      expect(parseDateSafe("   ")).toBeUndefined();
      expect(parseDateSafe("undefined")).toBeUndefined();
      expect(parseDateSafe("null")).toBeUndefined();
      expect(parseDateSafe("NaN")).toBeUndefined();
    });

    it("should parse Date instances correctly", () => {
      const now = new Date();
      expect(parseDateSafe(now)).toEqual(now);
      expect(parseDateSafe(new Date("invalid"))).toBeUndefined();
    });

    it("should parse numeric timestamps in milliseconds and seconds", () => {
      const ms = 1724312400000;
      expect(parseDateSafe(ms)?.getTime()).toBe(ms);

      const sec = 1724312400;
      expect(parseDateSafe(sec)?.getTime()).toBe(sec * 1000);
    });

    it("should parse string numeric timestamps", () => {
      expect(parseDateSafe("1724312400000")?.getTime()).toBe(1724312400000);
      expect(parseDateSafe("1724312400")?.getTime()).toBe(1724312400 * 1000);
    });

    it("should parse standard ISO strings and date formats", () => {
      const iso = "2024-08-22T09:00:00.000Z";
      expect(parseDateSafe(iso)?.toISOString()).toBe(iso);

      const ymd = "2024-08-22";
      expect(parseDateSafe(ymd)).toBeDefined();
    });

    it("should safely return undefined for garbage strings without throwing", () => {
      expect(parseDateSafe("not-a-date")).toBeUndefined();
      expect(parseDateSafe("99999-99-99")).toBeUndefined();
    });
  });

  describe("calculateTimeAgo", () => {
    it("should format Date objects without throwing", () => {
      const oneHourAgo = new Date(Date.now() - 3600 * 1000);
      const result = calculateTimeAgo(oneHourAgo);
      expect(result).toMatch(/about 1 hour ago|1 hour ago/);
    });

    it("should format numeric millisecond timestamps without throwing RangeError", () => {
      const oneMinuteAgo = Date.now() - 60 * 1000;
      const result = calculateTimeAgo(oneMinuteAgo);
      expect(result).toMatch(/1 minute ago|minute ago/);
    });

    it("should format numeric second timestamps without throwing RangeError", () => {
      const tenSecondsAgo = Math.floor(Date.now() / 1000) - 10;
      const result = calculateTimeAgo(tenSecondsAgo);
      expect(result).toMatch(/less than a minute ago/);
    });

    it("should format string timestamps without throwing", () => {
      const timestampStr = String(Date.now() - 120 * 1000);
      const result = calculateTimeAgo(timestampStr);
      expect(result).toMatch(/2 minutes ago/);
    });

    it("should format ISO strings without throwing", () => {
      const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const result = calculateTimeAgo(oneDayAgo);
      expect(result).toMatch(/1 day ago|yesterday/);
    });

    it("should return empty string for null, undefined, empty, or invalid inputs", () => {
      expect(calculateTimeAgo(null)).toBe("");
      expect(calculateTimeAgo(undefined)).toBe("");
      expect(calculateTimeAgo("")).toBe("");
      expect(calculateTimeAgo("invalid-date-string")).toBe("");
      expect(calculateTimeAgo("undefined")).toBe("");
      expect(calculateTimeAgo("NaN")).toBe("");
      expect(calculateTimeAgo(NaN)).toBe("");
      expect(calculateTimeAgo(Infinity)).toBe("");
    });
  });

  describe("calculateTimeAgoShort", () => {
    it("should return compact short strings for seconds, minutes, hours, days", () => {
      const now = Date.now();

      // 30 seconds ago
      expect(calculateTimeAgoShort(now - 30 * 1000)).toMatch(/^(29|30|31)s$/);

      // 5 minutes ago
      expect(calculateTimeAgoShort(now - 5 * 60 * 1000)).toBe("5m");

      // 3 hours ago
      expect(calculateTimeAgoShort(now - 3 * 3600 * 1000)).toBe("3h");

      // 4 days ago
      expect(calculateTimeAgoShort(now - 4 * 24 * 3600 * 1000)).toBe("4d");

      // 2 months ago
      expect(calculateTimeAgoShort(now - 60 * 24 * 3600 * 1000)).toBe("2mo");

      // 2 years ago
      expect(calculateTimeAgoShort(now - 750 * 24 * 3600 * 1000)).toBe("2y");
    });

    it("should return 0s for future dates instead of negative or crashing", () => {
      const futureDate = Date.now() + 60 * 1000;
      expect(calculateTimeAgoShort(futureDate)).toBe("0s");
    });

    it("should return empty string for null, undefined, or invalid inputs (never NaNy)", () => {
      expect(calculateTimeAgoShort(null)).toBe("");
      expect(calculateTimeAgoShort(undefined)).toBe("");
      expect(calculateTimeAgoShort("")).toBe("");
      expect(calculateTimeAgoShort("invalid-date")).toBe("");
      expect(calculateTimeAgoShort("undefined")).toBe("");
      expect(calculateTimeAgoShort(NaN)).toBe("");
    });
  });
});
