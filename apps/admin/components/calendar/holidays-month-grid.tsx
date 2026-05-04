/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
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
import type { MonthStats } from "./calendar-stats-helper";

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Props = {
  year: number;
  month: number; // 0-indexed
  holidays: IHoliday[];
  overrides: IDayOverride[];
  weekPattern: boolean[];
  monthStats?: MonthStats;
  monthHolidays?: IHoliday[];
  onCellClick: (date: string, state: CellState) => void;
};

function formatHolidayLine(h: IHoliday): string {
  const [, m, d] = h.date.split("-");
  return `${Number(d)}/${Number(m)} ${h.name}`;
}

export const HolidaysMonthGrid = observer(function HolidaysMonthGrid({
  year,
  month,
  holidays,
  overrides,
  weekPattern,
  monthStats,
  monthHolidays,
  onCellClick,
}: Props) {
  const today = useMemo(() => getTodayString(), []);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = MON_FIRST_OFFSET[getFirstDayOfWeek(year, month)];
  const totalCells = firstDayOfWeek + daysInMonth;
  const rows = Math.ceil(totalCells / 7);
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="border border-subtle rounded-lg overflow-hidden bg-surface-1">
      <div className="bg-surface-2 px-3 pt-2 text-body-xs-semibold text-secondary text-center border-b border-subtle">
        {monthLabel}
      </div>
      {monthStats && (
        <div className="bg-surface-2 px-3 pb-2 text-caption-sm-medium text-secondary text-center border-b border-subtle">
          {monthStats.workingDays} working · {monthStats.holidayCount} holidays · {monthStats.weekendCount} off
        </div>
      )}
      <div className="p-2">
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((d) => (
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
            const dateStr = formatDate(year, month, day);
            const weekdayMonFirst = MON_FIRST_OFFSET[new Date(year, month, day).getDay()];
            const state = getCellState(dateStr, weekdayMonFirst, holidays, overrides, weekPattern);
            const isToday = dateStr === today;
            const { className, style } = getCellClasses(state);
            return (
              <button
                key={idx}
                type="button"
                title={`${dateStr} — ${monthLabel}`}
                onClick={() => onCellClick(dateStr, state)}
                className={cn(
                  "relative aspect-square flex flex-col items-center justify-center rounded text-caption-sm-regular transition-colors cursor-pointer",
                  className,
                  isToday && "ring-2 ring-accent-strong ring-inset"
                )}
                style={style}
              >
                <span>{day}</span>
                {state === "holiday" && <span className="text-[6px] leading-none mt-0.5">●</span>}
              </button>
            );
          })}
        </div>
      </div>
      {monthHolidays && monthHolidays.length > 0 && (
        <ul className="px-3 py-2 space-y-1 text-caption-sm-regular text-tertiary border-t border-subtle max-h-32 overflow-y-auto">
          {monthHolidays.map((h) => (
            <li key={h.id}>• {formatHolidayLine(h)}</li>
          ))}
        </ul>
      )}
    </div>
  );
});
