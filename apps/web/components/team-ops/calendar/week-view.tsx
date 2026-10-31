/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { LEAVE_TYPE_LABELS, formatTimeRange, parseDateKey } from "@plane/services";
import type { TCalendarDay } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { DayKindBadge, getDayKind } from "./work-mode";

type Props = {
  /** The seven day keys of the week. */
  dates: string[];
  days: Record<string, TCalendarDay | undefined>;
  today: string;
  selected: string | null;
  onSelect: (date: string) => void;
};

const weekdayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const dateFormat = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });

const sourceHint = (day: TCalendarDay): string => {
  if (day.source === "TEMPLATE") return "From your weekly plan";
  if (day.source === "HOLIDAY") return day.holiday ?? "Holiday";
  return "";
};

/** One week as a list of days, each with its plan on a single row. */
export function WeekView(props: Props) {
  const { dates, days, today, selected, onSelect } = props;

  return (
    <ul className="divide-y divide-subtle overflow-hidden rounded-lg border border-subtle bg-surface-1">
      {dates.map((date) => {
        const day = days[date];
        const kind = day ? getDayKind(day) : null;
        const parsed = parseDateKey(date);
        const hint = day ? sourceHint(day) : "";
        return (
          <li key={date}>
            <button
              type="button"
              aria-pressed={selected === date}
              onClick={() => onSelect(date)}
              className={cn(
                "flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-layer-1",
                selected === date && "bg-layer-1"
              )}
            >
              <div className="w-32 shrink-0">
                <p className={cn("text-body-sm-medium", date === today ? "text-accent-primary" : "text-primary")}>
                  {weekdayFormat.format(parsed)}
                </p>
                <p className="text-caption-sm-regular text-tertiary">{dateFormat.format(parsed)}</p>
              </div>
              <div className="w-28 shrink-0">{kind ? <DayKindBadge kind={kind} /> : null}</div>
              <div className="min-w-0 grow">
                <p className="truncate text-body-sm-regular text-primary">
                  {[
                    day ? formatTimeRange(day.planned_start_time, day.planned_end_time) : "",
                    day?.leave_type ? LEAVE_TYPE_LABELS[day.leave_type] : "",
                    day?.description ?? "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {hint ? <p className="text-caption-sm-regular text-tertiary">{hint}</p> : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
