/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { calculateTimeAgo, calculateTimeAgoShort } from "../src/datetime";

describe("calculateTimeAgo and calculateTimeAgoShort", () => {
  describe("calculateTimeAgo", () => {
    it("should format Date instances correctly", () => {
      const oneHourAgo = new Date(Date.now() - 3600 * 1000);
      expect(calculateTimeAgo(oneHourAgo)).toMatch(/about 1 hour ago|1 hour ago/);
    });

    it("should format numeric millisecond timestamps without throwing RangeError", () => {
      const oneMinuteAgo = Date.now() - 60 * 1000;
      expect(calculateTimeAgo(oneMinuteAgo)).toMatch(/1 minute ago|minute ago/);
    });

    it("should format ISO strings without throwing", () => {
      const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      expect(calculateTimeAgo(oneDayAgo)).toMatch(/1 day ago|yesterday/);
    });

    it("should safely return empty string for null, undefined, or invalid inputs", () => {
      expect(calculateTimeAgo(null)).toBe("");
      expect(calculateTimeAgo(undefined)).toBe("");
      expect(calculateTimeAgo("")).toBe("");
      expect(calculateTimeAgo("invalid-date-string")).toBe("");
      expect(calculateTimeAgo(NaN)).toBe("");
    });
  });

  describe("calculateTimeAgoShort", () => {
    it("should format elapsed time into compact units", () => {
      const now = Date.now();
      expect(calculateTimeAgoShort(now - 30 * 1000)).toMatch(/^(29|30|31)s$/);
      expect(calculateTimeAgoShort(now - 5 * 60 * 1000)).toBe("5m");
      expect(calculateTimeAgoShort(now - 3 * 3600 * 1000)).toBe("3h");
      expect(calculateTimeAgoShort(now - 4 * 24 * 3600 * 1000)).toBe("4d");
      expect(calculateTimeAgoShort(now - 60 * 24 * 3600 * 1000)).toBe("2mo");
      expect(calculateTimeAgoShort(now - 750 * 24 * 3600 * 1000)).toBe("2y");
    });

    it("should return 0s for future dates", () => {
      expect(calculateTimeAgoShort(Date.now() + 60 * 1000)).toBe("0s");
    });

    it("should safely return empty string for invalid inputs", () => {
      expect(calculateTimeAgoShort(null)).toBe("");
      expect(calculateTimeAgoShort(undefined)).toBe("");
      expect(calculateTimeAgoShort("")).toBe("");
      expect(calculateTimeAgoShort("invalid-date")).toBe("");
      expect(calculateTimeAgoShort(NaN)).toBe("");
    });
  });
});
