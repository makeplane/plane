/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { WORK_MODE_LABELS, formatTimeRange, parseDateKey } from "@plane/services";
import type { TMonthGrid } from "@plane/services";
import type { TCalendarDay } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { DAY_KIND_META, DayKindDot, getDayKind } from "./work-mode";

type Props = {
  grid: TMonthGrid;
  /** The visible days by `YYYY-MM-DD`. */
  days: Record<string, TCalendarDay | undefined>;
  /** Today's day key. */
  today: string;
  selected: string | null;
  onSelect: (date: string) => void;
};

const weekdayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const longDateFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long" });

const describeCell = (date: string, day: TCalendarDay | undefined): string => {
  const base = longDateFormat.format(parseDateKey(date));
  if (!day) return base;
  if (day.mode) {
    const hours = formatTimeRange(day.planned_start_time, day.planned_end_time);
    return `${base}: ${WORK_MODE_LABELS[day.mode]}${hours ? `, ${hours}` : ""}`;
  }
  if (day.holiday) return `${base}: holiday, ${day.holiday}`;
  if (day.is_unplanned) return `${base}: not planned`;
  return base;
};

/** A month as a grid of days, each showing the plan for that day. */
export function MonthGrid(props: Props) {
  const { grid, days, today, selected, onSelect } = props;

  return (
    <div role="grid" aria-label="Month" className="overflow-hidden rounded-lg border border-subtle bg-surface-1">
      <div role="row" className="grid grid-cols-7 border-b border-subtle bg-layer-1">
        {grid.weeks[0].map((date) => (
          <div key={date} role="columnheader" className="px-2 py-1.5 text-caption-sm-medium text-tertiary">
            {weekdayFormat.format(parseDateKey(date))}
          </div>
        ))}
      </div>
      {grid.weeks.map((week) => (
        <div key={week[0]} role="row" className="grid grid-cols-7">
          {week.map((date) => {
            const day = days[date];
            const kind = day ? getDayKind(day) : null;
            const inMonth = parseDateKey(date).getMonth() === grid.month;
            const isToday = date === today;
            const hours = day ? formatTimeRange(day.planned_start_time, day.planned_end_time) : "";
            return (
              <div key={date} role="gridcell" className="border-r border-b border-subtle last:border-r-0">
                <button
                  type="button"
                  aria-label={describeCell(date, day)}
                  aria-pressed={selected === date}
                  onClick={() => onSelect(date)}
                  className={cn(
                    "flex min-h-24 w-full flex-col items-start gap-1 p-1.5 text-left transition-colors hover:bg-layer-1",
                    kind ? DAY_KIND_META[kind].cell : "bg-surface-1",
                    !inMonth && "opacity-50",
                    selected === date && "ring-2 ring-accent-strong ring-inset"
                  )}
                >
                  <span
                    className={cn(
                      "text-caption-sm-medium",
                      isToday ? "rounded-full bg-accent-primary px-1.5 text-on-color" : "text-secondary"
                    )}
                  >
                    {parseDateKey(date).getDate()}
                  </span>
                  {kind ? (
                    <span
                      title={kind === "HOLIDAY" ? (day?.holiday ?? undefined) : undefined}
                      className="flex max-w-full min-w-0 items-center gap-1.5 text-caption-sm-medium"
                    >
                      <DayKindDot kind={kind} />
                      <span className={cn("truncate", kind === "UNPLANNED" ? "text-tertiary" : "text-primary")}>
                        {kind === "HOLIDAY" ? (day?.holiday ?? DAY_KIND_META.HOLIDAY.label) : DAY_KIND_META[kind].label}
                      </span>
                    </span>
                  ) : null}
                  {hours ? (
                    <span className="max-w-full truncate text-caption-sm-regular text-tertiary">{hours}</span>
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
