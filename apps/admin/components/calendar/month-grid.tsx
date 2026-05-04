/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import type { IDayOverride, IHoliday } from "@plane/types";
import { cn } from "@plane/utils";
import {
  MON_FIRST_OFFSET,
  formatDate,
  getCellClasses,
  getCellState,
  getDaysInMonth,
  getFirstDayOfWeek,
  getTodayString,
  type CellState,
} from "./calendar-cell-helper";

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATE_BADGE: Partial<Record<CellState, string>> = {
  holiday: "●",
  "override-workday": "▩",
  "override-holiday": "▩",
};

type Props = {
  year: number;
  month: number;
  holidays: IHoliday[];
  overrides: IDayOverride[];
  weekPattern: boolean[] | undefined;
  cellLabel: (state: CellState, dateStr: string) => string;
  onCellClick: (dateStr: string, state: CellState) => void;
};

export const MonthGrid = function MonthGrid({
  year,
  month,
  holidays,
  overrides,
  weekPattern,
  cellLabel,
  onCellClick,
}: Props) {
  const today = useMemo(() => getTodayString(), []);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = MON_FIRST_OFFSET[getFirstDayOfWeek(year, month)];
  const totalCells = firstDayOfWeek + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  return (
    <div className="border border-subtle rounded-lg bg-surface-1 p-3">
      <div className="grid grid-cols-7 mb-2">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-caption-sm-medium text-tertiary py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: rows * 7 }).map((_, idx) => {
          const day = idx - firstDayOfWeek + 1;
          if (day < 1 || day > daysInMonth) return <div key={idx} className="aspect-square" />;
          const dateStr = formatDate(year, month, day);
          const weekdayMonFirst = MON_FIRST_OFFSET[new Date(year, month, day).getDay()];
          const state = getCellState(dateStr, weekdayMonFirst, holidays, overrides, weekPattern);
          const isToday = dateStr === today;
          const { className, style } = getCellClasses(state);
          const label = cellLabel(state, dateStr);
          const badge = STATE_BADGE[state];
          return (
            <button
              key={idx}
              type="button"
              title={label ? `${dateStr} — ${label}` : dateStr}
              onClick={() => onCellClick(dateStr, state)}
              className={cn(
                "aspect-square flex flex-col p-2 rounded text-left transition-colors cursor-pointer text-caption-sm-regular",
                className,
                isToday && "ring-2 ring-accent-strong ring-inset"
              )}
              style={style}
            >
              <div className="flex justify-between items-start text-body-sm-medium leading-none">
                <span>{day}</span>
                {badge && <span className="text-[8px] mt-0.5">{badge}</span>}
              </div>
              {label && <div className="text-[10px] leading-tight truncate mt-1 w-full">{label}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
