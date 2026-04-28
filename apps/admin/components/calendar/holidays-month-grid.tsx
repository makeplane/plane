/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { IHoliday, IDayOverride } from "@plane/types";

// Sunday=0..Saturday=6 → Mon-first offset
const MON_FIRST_OFFSET = [6, 0, 1, 2, 3, 4, 5];

/** Pure-JS helpers — no date-fns dependency needed */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

type CellState = "holiday" | "override-workday" | "override-holiday" | "default";

function getCellState(dateStr: string, holidays: IHoliday[], overrides: IDayOverride[]): CellState {
  if (holidays.some((h) => h.date === dateStr)) return "holiday";
  const ov = overrides.find((o) => o.date === dateStr);
  if (ov) return ov.type === "WORKDAY" ? "override-workday" : "override-holiday";
  return "default";
}

const CELL_STYLES: Record<CellState, string> = {
  holiday: "bg-red-500/10 text-red-700 font-medium",
  "override-workday": "bg-amber-500/10 text-amber-700 font-medium",
  "override-holiday": "bg-yellow-500/10 text-yellow-700 font-medium",
  default: "text-primary hover:bg-surface-2",
};

type Props = {
  year: number;
  month: number; // 0-indexed
  holidays: IHoliday[];
  overrides: IDayOverride[];
  onCellClick: (date: string, state: CellState) => void;
};

export const HolidaysMonthGrid = observer(function HolidaysMonthGrid({
  year,
  month,
  holidays,
  overrides,
  onCellClick,
}: Props) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = MON_FIRST_OFFSET[getFirstDayOfWeek(year, month)];
  const totalCells = firstDayOfWeek + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  const monthLabel = `${String(month + 1).padStart(2, "0")}/${year}`;
  const dayHeaders = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className="border border-subtle rounded-lg overflow-hidden bg-surface-1">
      <div className="bg-surface-2 px-3 py-2 text-body-xs-semibold text-secondary text-center border-b border-subtle">
        Tháng {month + 1} / {year}
      </div>
      <div className="p-2">
        <div className="grid grid-cols-7 mb-1">
          {dayHeaders.map((d) => (
            <div key={d} className="text-center text-caption-sm-medium text-tertiary py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: rows * 7 }).map((_, idx) => {
            const day = idx - firstDayOfWeek + 1;
            if (day < 1 || day > daysInMonth) {
              return <div key={idx} className="aspect-square" />;
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const state = getCellState(dateStr, holidays, overrides);
            return (
              <button
                key={idx}
                type="button"
                title={`${dateStr} — ${monthLabel}`}
                onClick={() => onCellClick(dateStr, state)}
                className={`aspect-square flex items-center justify-center rounded text-caption-sm-regular transition-colors cursor-pointer ${CELL_STYLES[state]}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
