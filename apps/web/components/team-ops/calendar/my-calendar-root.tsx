/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Button } from "@makeplane/propel/components/button";
import { Dialog, DialogContent } from "@makeplane/propel/components/dialog";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { AddOutline, ChevronLeftOutline, ChevronRightOutline } from "@makeplane/propel/icons";
import {
  PLAN_NOTICE,
  countDays,
  getMonthGrid,
  getWeekDays,
  isEditableDate,
  parseDateKey,
  shiftMonths,
  shiftWeeks,
  toDateKey,
} from "@plane/services";
import type { TDayCounts } from "@plane/services";
// hooks
import { useUser, useUserProfile } from "@/hooks/store/user";
import { useCalendarDays, useCalendarSettings } from "@/hooks/team-ops/use-work-calendar";
// local imports
import { ApplyRangeDialog } from "./apply-range-dialog";
import { DayPanel } from "./day-panel";
import { MonthGrid } from "./month-grid";
import { WeekView } from "./week-view";
import { DAY_KIND_META, DayKindDot } from "./work-mode";
import type { TDayKind } from "./work-mode";

type Props = {
  workspaceSlug: string;
};

type TView = "month" | "week";

const LEGEND: TDayKind[] = ["ONSITE", "REMOTE", "OFF", "LEAVE", "HOLIDAY", "UNPLANNED"];

const monthFormat = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const shortDateFormat = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });

const LOCKED_PAST_DAY =
  "This day is in the past and can no longer be changed. Ask a workspace admin if it needs correcting.";

export const MyCalendarRoot = observer(function MyCalendarRoot({ workspaceSlug }: Props) {
  // states
  const [view, setView] = useState<TView>("month");
  const [reference, setReference] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  // refs
  const panelRef = useRef<HTMLElement>(null);
  // hooks
  const { data: currentUser } = useUser();
  const { data: userProfile } = useUserProfile();
  const { permissions } = useCalendarSettings(workspaceSlug);
  // `start_of_the_week` follows the profile setting (0 = Sunday ... 6 = Saturday), Monday when unset.
  const weekStart = userProfile?.start_of_the_week ?? 1;
  const grid = useMemo(() => getMonthGrid(reference, weekStart), [reference, weekStart]);
  const weekDates = useMemo(() => getWeekDays(reference, weekStart), [reference, weekStart]);
  const range = view === "month" ? { from: grid.from, to: grid.to } : { from: weekDates[0], to: weekDates[6] };
  const { days, error, isLoading, saveDay, resetDay, applyToDays } = useCalendarDays({
    workspaceSlug,
    userId: currentUser?.id,
    ...range,
  });

  const dayMap = useMemo(() => Object.fromEntries((days ?? []).map((day) => [day.date, day])), [days]);
  const today = toDateKey(new Date());
  const selectedDay = selected ? dayMap[selected] : undefined;

  // Counts cover only the days of the month (or week) being looked at, not the padding days around it.
  const counts: TDayCounts = useMemo(
    () =>
      countDays(
        (days ?? []).filter((day) => (view === "month" ? parseDateKey(day.date).getMonth() === grid.month : true))
      ),
    [days, view, grid.month]
  );

  const lockedReason = !permissions
    ? "Loading…"
    : selected && !isEditableDate(selected, permissions.earliest_editable_date)
      ? LOCKED_PAST_DAY
      : null;

  // When the panel sits below the grid (narrow screens) a selected day would otherwise open out of sight.
  useEffect(() => {
    if (selected) panelRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  const move = (direction: -1 | 1) => {
    setSelected(null);
    setReference((current) => (view === "month" ? shiftMonths(current, direction) : shiftWeeks(current, direction)));
  };

  const title =
    view === "month"
      ? monthFormat.format(reference)
      : `${shortDateFormat.format(parseDateKey(weekDates[0]))} – ${shortDateFormat.format(parseDateKey(weekDates[6]))}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <p className="text-caption-sm-regular text-tertiary">{PLAN_NOTICE}</p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <IconButton
            icon={<Icon icon={ChevronLeftOutline} />}
            variant="ghost"
            size="sm"
            aria-label={view === "month" ? "Previous month" : "Previous week"}
            onClick={() => move(-1)}
          />
          <h2 className="min-w-44 text-center text-body-sm-medium text-primary">{title}</h2>
          <IconButton
            icon={<Icon icon={ChevronRightOutline} />}
            variant="ghost"
            size="sm"
            aria-label={view === "month" ? "Next month" : "Next week"}
            onClick={() => move(1)}
          />
          <Button
            variant="ghost"
            size="sm"
            stretch="auto"
            label="Today"
            onClick={() => {
              setSelected(null);
              setReference(new Date());
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Calendar view" className="flex gap-1">
            {(["month", "week"] as const).map((item) => (
              <Button
                key={item}
                type="button"
                variant={view === item ? "primary" : "secondary"}
                size="sm"
                stretch="auto"
                label={item === "month" ? "Month" : "Week"}
                aria-pressed={view === item}
                onClick={() => {
                  setSelected(null);
                  setView(item);
                }}
              />
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            stretch="auto"
            icon={<Icon icon={AddOutline} />}
            label="Fill days"
            onClick={() => setIsApplyOpen(true)}
          />
          <Link
            href={`/${workspaceSlug}/team-ops/calendar/settings/`}
            className="text-body-sm-medium text-accent-primary hover:underline"
          >
            Weekly plan
          </Link>
        </div>
      </div>

      <ul aria-label="Summary" className="flex flex-wrap gap-x-4 gap-y-1 text-caption-sm-regular text-secondary">
        {LEGEND.map((kind) => (
          <li key={kind} className="flex items-center gap-1.5">
            <DayKindDot kind={kind} />
            <span>
              {DAY_KIND_META[kind].label}: <span className="text-primary tabular-nums">{counts[kind]}</span>
            </span>
          </li>
        ))}
      </ul>

      {error ? (
        <p role="alert" className="text-body-sm-medium text-danger-primary">
          The calendar could not be loaded. Reload the page to try again.
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div aria-busy={isLoading} className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          {view === "month" ? (
            <MonthGrid grid={grid} days={dayMap} today={today} selected={selected} onSelect={setSelected} />
          ) : (
            <WeekView dates={weekDates} days={dayMap} today={today} selected={selected} onSelect={setSelected} />
          )}
        </div>
        <aside ref={panelRef}>
          {selectedDay && currentUser ? (
            <DayPanel
              key={[
                selectedDay.date,
                selectedDay.source,
                selectedDay.mode,
                selectedDay.planned_start_time,
                selectedDay.planned_end_time,
                selectedDay.leave_type,
                selectedDay.description,
              ].join("|")}
              workspaceSlug={workspaceSlug}
              userId={currentUser.id}
              day={selectedDay}
              lockedReason={lockedReason}
              onSave={saveDay}
              onReset={resetDay}
              onClose={() => setSelected(null)}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-subtle p-4 text-body-sm-regular text-tertiary">
              Select a day to plan it. Days that come from your weekly plan can be changed for just that day.
            </p>
          )}
        </aside>
      </div>

      <Dialog open={isApplyOpen} disablePointerDismissal onOpenChange={(open) => !open && setIsApplyOpen(false)}>
        <DialogContent size="md">
          <ApplyRangeDialog
            initialFrom={selected ?? today}
            onApply={applyToDays}
            onClose={() => setIsApplyOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
});
