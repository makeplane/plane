/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import type { ChartDataType, IGanttBlock } from "@plane/types";
import { getItemPositionWidth } from "./helpers";

const position = (start_date: string | undefined, target_date: string | undefined) => {
  const chart = { data: { startDate: new Date(2026, 0, 1), dayWidth: 24 } } as ChartDataType;
  const block = { start_date, target_date } as IGanttBlock;
  return getItemPositionWidth(chart, block);
};

describe("Gantt block calendar-day widths", () => {
  it("runs across the expected DST offset change", () => {
    expect(new Date(2026, 10, 1).getTimezoneOffset()).toBe(240);
    expect(new Date(2026, 10, 2).getTimezoneOffset()).toBe(300);
  });

  it("preserves default widths for incomplete dates", () => {
    expect(position("2026-11-01", undefined)?.width).toBe(60);
    expect(position(undefined, "2026-11-02")?.width).toBe(60);
    expect(position(undefined, undefined)).toBeUndefined();
  });

  it.each([
    ["2026-11-01", "2026-11-02", 2],
    ["2026-10-31", "2026-11-02", 3],
    ["2026-03-08", "2026-03-09", 2],
    ["2026-03-07", "2026-03-09", 3],
    ["2026-03-09", "2026-03-08", 2],
    ["2026-06-01", "2026-06-02", 2],
    ["2026-11-01", "2026-11-01", 1],
    ["2026-11-02", "2026-11-01", 2],
  ])("renders %s through %s as %i inclusive days", (start, end, days) => {
    expect(position(start, end)?.width).toBe(days * 24);
  });
});
