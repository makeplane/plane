/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { CSSProperties } from "react";
import type { IDayOverride, IHoliday } from "@plane/types";

// Sunday=0..Saturday=6 → Mon-first offset (Mon=0..Sun=6)
export const MON_FIRST_OFFSET = [6, 0, 1, 2, 3, 4, 5];

export type CellState = "holiday" | "override-workday" | "override-holiday" | "weekend" | "working";

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** YYYY-MM-DD in local timezone (matches backend canonical format). */
export function getTodayString(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function getCellState(
  dateStr: string,
  weekdayMonFirst: number,
  holidays: IHoliday[],
  overrides: IDayOverride[],
  weekPattern: boolean[] | undefined
): CellState {
  if (holidays.some((h) => h.date === dateStr)) return "holiday";
  const ov = overrides.find((o) => o.date === dateStr);
  if (ov) return ov.type === "WORKDAY" ? "override-workday" : "override-holiday";
  // Defensive: if weekPattern missing, treat as all-working to avoid blank UI
  const isWorking = weekPattern ? Boolean(weekPattern[weekdayMonFirst]) : true;
  return isWorking ? "working" : "weekend";
}

const WEEKEND_STRIPES: CSSProperties = {
  backgroundImage: "repeating-linear-gradient(-45deg, transparent 0 4px, var(--border-color-subtle) 4px 5px)",
};

export function getCellClasses(state: CellState): { className: string; style?: CSSProperties } {
  switch (state) {
    case "holiday":
      return {
        className: "bg-danger-subtle text-danger-primary font-semibold hover:bg-danger-subtle",
      };
    case "override-workday":
      return {
        className:
          "bg-warning-subtle text-warning-primary font-medium border border-dashed border-warning-strong hover:bg-warning-subtle",
      };
    case "override-holiday":
      return {
        className:
          "bg-success-subtle text-success-primary font-medium border border-dashed border-success-strong hover:bg-success-subtle",
      };
    case "weekend":
      return {
        className: "bg-surface-2 text-tertiary",
        style: WEEKEND_STRIPES,
      };
    case "working":
    default:
      return { className: "bg-surface-1 text-primary hover:bg-surface-2" };
  }
}
