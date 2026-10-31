/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CALENDAR_KINDS, getDayPeople, parseDateKey } from "@plane/services";
import type { TMonthGrid } from "@plane/services";
import type { TCalendarKind, TTeamCalendarDay } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// local imports
import { DAY_KIND_META, DayKindDot } from "./work-mode";

type Props = {
  grid: TMonthGrid;
  days: Record<string, TTeamCalendarDay | undefined>;
  today: string;
  selected: string | null;
  onSelect: (date: string) => void;
};

const weekdayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const longDateFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long" });
const MAX_AVATARS = 3;

/** The categories shown inside a cell. A holiday is shown by its name, not as a count. */
const SHOWN_KINDS = CALENDAR_KINDS.filter((kind) => kind !== "HOLIDAY");

const describeCell = (date: string, day: TTeamCalendarDay | undefined): string => {
  const base = longDateFormat.format(parseDateKey(date));
  if (!day) return base;
  const parts = SHOWN_KINDS.filter((kind) => day.counts[kind] > 0).map(
    (kind) => `${day.counts[kind]} ${DAY_KIND_META[kind].label.toLowerCase()}`
  );
  if (day.holiday) parts.unshift(`holiday, ${day.holiday}`);
  return parts.length > 0 ? `${base}: ${parts.join(", ")}` : base;
};

/** A month where each day shows how many people are in each mode and who they are. */
export function TeamMonthGrid(props: Props) {
  const { grid, days, today, selected, onSelect } = props;

  return (
    <div role="grid" aria-label="Team month" className="overflow-hidden rounded-lg border border-subtle bg-surface-1">
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
            const inMonth = parseDateKey(date).getMonth() === grid.month;
            const people = day ? getDayPeople(day, MAX_AVATARS) : { shown: [], extra: 0 };
            return (
              <div key={date} role="gridcell" className="border-r border-b border-subtle last:border-r-0">
                <button
                  type="button"
                  aria-label={describeCell(date, day)}
                  aria-pressed={selected === date}
                  onClick={() => onSelect(date)}
                  className={cn(
                    "flex min-h-28 w-full flex-col items-start gap-1 p-1.5 text-left transition-colors hover:bg-layer-1",
                    day?.holiday ? "bg-layer-2" : "bg-surface-1",
                    !inMonth && "opacity-50",
                    selected === date && "ring-2 ring-accent-strong ring-inset"
                  )}
                >
                  <span
                    className={cn(
                      "text-caption-sm-medium",
                      date === today ? "rounded-full bg-accent-primary px-1.5 text-on-color" : "text-secondary"
                    )}
                  >
                    {parseDateKey(date).getDate()}
                  </span>
                  {day?.holiday ? (
                    <span
                      title={day.holiday}
                      className="flex max-w-full min-w-0 items-center gap-1.5 text-caption-sm-medium"
                    >
                      <DayKindDot kind="HOLIDAY" />
                      <span className="truncate text-primary">{day.holiday}</span>
                    </span>
                  ) : null}
                  <ul className="flex w-full min-w-0 flex-col gap-0.5">
                    {SHOWN_KINDS.filter((kind: TCalendarKind) => (day?.counts[kind] ?? 0) > 0).map((kind) => (
                      <li key={kind} className="flex min-w-0 items-center gap-1.5 text-caption-sm-regular">
                        <DayKindDot kind={kind} />
                        <span className="text-primary tabular-nums">{day?.counts[kind]}</span>
                        <span
                          className={cn("truncate", kind === "UNPLANNED" ? "text-danger-secondary" : "text-tertiary")}
                        >
                          {DAY_KIND_META[kind].label}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {people.shown.length > 0 ? (
                    <span className="mt-auto flex items-center gap-1">
                      <ButtonAvatars showTooltip={false} userIds={people.shown} size="xs" />
                      {people.extra > 0 ? (
                        <span className="text-caption-sm-regular text-tertiary">+{people.extra}</span>
                      ) : null}
                    </span>
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
