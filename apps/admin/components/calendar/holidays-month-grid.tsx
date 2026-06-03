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
    <div className="overflow-hidden rounded-lg border border-subtle bg-surface-1">
      <div className="border-b border-subtle bg-surface-2 px-3 pt-2 text-center text-body-xs-semibold text-secondary">
        {monthLabel}
      </div>
      {monthStats && (
        <div className="border-b border-subtle bg-surface-2 px-3 pb-2 text-center text-caption-sm-medium text-secondary">
          {monthStats.workingDays} working · {monthStats.holidayCount} holidays · {monthStats.weekendCount} off
        </div>
      )}
      <div className="p-2">
        <div className="mb-1 grid grid-cols-7">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="py-1 text-center text-caption-sm-medium text-tertiary">
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
                  "relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded text-caption-sm-regular transition-colors",
                  className,
                  isToday && "ring-2 ring-accent-strong ring-inset"
                )}
                style={style}
              >
                <span>{day}</span>
                {state === "holiday" && <span className="mt-0.5 text-[6px] leading-none">●</span>}
              </button>
            );
          })}
        </div>
      </div>
      {monthHolidays && monthHolidays.length > 0 && (
        <ul className="max-h-32 space-y-1 overflow-y-auto border-t border-subtle px-3 py-2 text-caption-sm-regular text-tertiary">
          {monthHolidays.map((h) => (
            <li key={h.id}>• {formatHolidayLine(h)}</li>
          ))}
        </ul>
      )}
    </div>
  );
});
