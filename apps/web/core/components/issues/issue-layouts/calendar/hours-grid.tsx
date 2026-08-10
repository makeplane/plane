/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements, monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { DAYS_LIST, MONTHS_LIST } from "@plane/constants";
import type { ICalendarDate, TIssue, TIssueMap } from "@plane/types";
import { cn, getOrderedDays, renderFormattedPayloadDate } from "@plane/utils";
import { highlightIssueOnDrop } from "@/components/issues/issue-layouts/utils";
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import { useUserProfile } from "@/hooks/store/user";
import { useCurrentTime } from "@/hooks/use-current-time";
import type { TRenderQuickActions } from "../list/list-view-types";
import { HoursIssueBlock } from "./hours-issue-block";
import {
  CALENDAR_DAY_DROP_TYPE,
  CALENDAR_ISSUE_DRAG_TYPE,
  getCalendarDestinationFromDropPayload,
  getCalendarSourceFromDropPayload,
  getIssuePlanBounds,
  HOURS_HALF_ROW_HEIGHT,
  HOURS_ROW_HEIGHT,
  HOURS_WORKDAY_END,
  HOURS_WORKDAY_START,
  packOverlappingPlanBlocks,
} from "./utils";

type HandleDragAndDrop = (
  issueId: string | undefined,
  issueProjectId: string | undefined,
  sourceDate: string | undefined,
  destinationDate: string | undefined,
  destinationHour?: number
) => Promise<void>;

type HandleResizePlan = (
  issueId: string,
  data: { planned_at?: string | null; planned_duration_minutes?: number }
) => Promise<void>;

type Props = {
  issues: TIssueMap | undefined;
  quickActions: TRenderQuickActions;
  readOnly?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
  showDueDateBadge?: boolean;
  showWeekends?: boolean;
  handleDragAndDrop: HandleDragAndDrop;
  handleResizePlan: HandleResizePlan;
};

type DayPlanBlock = {
  id: string;
  issue: TIssue;
  startHour: number;
  endHour: number;
  durationMinutes: number;
};

const CalendarHourDropBand = observer(function CalendarHourDropBand(props: {
  dateString: string;
  hour: number;
  height: number;
  showBottomBorder?: boolean;
  issuesMap: TIssueMap | undefined;
  handleDragAndDrop: HandleDragAndDrop;
}) {
  const { dateString, hour, height, showBottomBorder = false, issuesMap, handleDragAndDrop } = props;
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const bandRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = bandRef.current;
    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source?.data?.type === CALENDAR_ISSUE_DRAG_TYPE,
        getData: () => ({ date: dateString, hour, type: CALENDAR_DAY_DROP_TYPE }),
        onDragEnter: () => setIsDraggingOver(true),
        onDragLeave: () => setIsDraggingOver(false),
        onDrop: (payload) => {
          setIsDraggingOver(false);

          const source = getCalendarSourceFromDropPayload(payload);
          const destination = getCalendarDestinationFromDropPayload(payload);
          if (!source || !destination) return;

          void handleDragAndDrop(
            source.id,
            issuesMap?.[source.id]?.project_id ?? undefined,
            source.date,
            destination.date,
            destination.hour ?? hour
          );

          highlightIssueOnDrop(payload.source?.element?.id, false);
        },
      })
    );
  }, [dateString, hour, handleDragAndDrop, issuesMap]);

  return (
    <div
      ref={bandRef}
      className={cn("pointer-events-auto", {
        "border-b border-subtle-1": showBottomBorder,
        "bg-layer-transparent-hover opacity-80": isDraggingOver,
      })}
      style={{ height }}
    />
  );
});

const CalendarDayColumn = observer(function CalendarDayColumn(props: {
  dateString: string;
  hours: number[];
  blocks: Array<DayPlanBlock & { columnIndex: number; columnCount: number }>;
  issuesMap: TIssueMap | undefined;
  quickActions: TRenderQuickActions;
  readOnly?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
  showDueDateBadge?: boolean;
  isDraggingIssue: boolean;
  showNowIndicator?: boolean;
  nowTop?: number;
  handleDragAndDrop: HandleDragAndDrop;
  handleResizePlan: HandleResizePlan;
}) {
  const {
    dateString,
    hours,
    blocks,
    issuesMap,
    quickActions,
    readOnly,
    canEditProperties,
    isEpic,
    showDueDateBadge,
    isDraggingIssue,
    showNowIndicator = false,
    nowTop,
    handleDragAndDrop,
    handleResizePlan,
  } = props;

  return (
    <div className="relative border-l border-subtle-1" style={{ height: hours.length * HOURS_ROW_HEIGHT }}>
      <div className="absolute inset-0 z-[1]">
        {hours.map((hour) => (
          <div key={`${dateString}-${hour}`} className="border-b border-subtle-1" style={{ height: HOURS_ROW_HEIGHT }}>
            <CalendarHourDropBand
              dateString={dateString}
              hour={hour}
              height={HOURS_HALF_ROW_HEIGHT}
              issuesMap={issuesMap}
              handleDragAndDrop={handleDragAndDrop}
            />
            <CalendarHourDropBand
              dateString={dateString}
              hour={hour + 0.5}
              height={HOURS_HALF_ROW_HEIGHT}
              issuesMap={issuesMap}
              handleDragAndDrop={handleDragAndDrop}
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 z-[2]">
        {blocks.map((block) => (
          <HoursIssueBlock
            key={block.id}
            issue={block.issue}
            dateString={dateString}
            startHour={block.startHour}
            endHour={block.endHour}
            durationMinutes={block.durationMinutes}
            columnIndex={block.columnIndex}
            columnCount={block.columnCount}
            quickActions={quickActions}
            readOnly={readOnly}
            canEditProperties={canEditProperties}
            isEpic={isEpic}
            showDueDateBadge={showDueDateBadge}
            pointerEventsDisabled={isDraggingIssue}
            handleResizePlan={handleResizePlan}
          />
        ))}
      </div>

      {showNowIndicator && nowTop !== undefined && (
        <div
          className="pointer-events-none absolute inset-x-0 z-[3] flex items-center"
          style={{ top: nowTop }}
          aria-hidden
        >
          <span className="size-2 flex-shrink-0 -translate-x-1/2 rounded-full bg-accent-primary" />
          <span className="h-0.5 w-full bg-accent-primary" />
        </div>
      )}
    </div>
  );
});

export const CalendarHoursGrid = observer(function CalendarHoursGrid(props: Props) {
  const {
    issues,
    quickActions,
    readOnly,
    canEditProperties,
    isEpic,
    showDueDateBadge,
    showWeekends = false,
    handleDragAndDrop,
    handleResizePlan,
  } = props;
  const issueCalendarView = useCalendarView();
  const { data } = useUserProfile();
  const startOfWeek = data?.start_of_the_week;
  const { currentTime } = useCurrentTime();
  const [isDraggingIssue, setIsDraggingIssue] = useState(false);

  useEffect(
    () =>
      monitorForElements({
        canMonitor: ({ source }) => source.data.type === CALENDAR_ISSUE_DRAG_TYPE,
        onDragStart: () => setIsDraggingIssue(true),
        onDrop: () => setIsDraggingIssue(false),
      }),
    []
  );

  const week = issueCalendarView.allDaysOfActiveWeek;

  const visibleDays = useMemo(() => {
    if (!week) return [];

    const shouldShowDay = (dayDate: Date) => {
      if (showWeekends) return true;
      const day = dayDate.getDay();
      return !(day === 0 || day === 6);
    };

    return getOrderedDays(Object.values(week), (item) => item.date.getDay(), startOfWeek).filter((day: ICalendarDate) =>
      shouldShowDay(day.date)
    );
  }, [week, showWeekends, startOfWeek]);

  const hours = useMemo(
    () =>
      Array.from({ length: HOURS_WORKDAY_END - HOURS_WORKDAY_START + 1 }, (_, index) => HOURS_WORKDAY_START + index),
    []
  );

  // Compute during render (not useMemo): issuesMap reference is stable while
  // planned_at / planned_duration_minutes mutate, so memoizing on `issues`
  // would keep stale block positions until a full remount/refresh.
  const blocksByDate: Record<string, Array<DayPlanBlock & { columnIndex: number; columnCount: number }>> = {};
  if (issues && visibleDays.length > 0) {
    const visibleDateStrings = new Set(
      visibleDays.map((day) => renderFormattedPayloadDate(day.date)).filter((date): date is string => Boolean(date))
    );

    const rawByDate: Record<string, DayPlanBlock[]> = {};

    Object.values(issues).forEach((issue) => {
      if (!issue?.planned_at) return;
      const dateString = renderFormattedPayloadDate(issue.planned_at);
      if (!dateString || !visibleDateStrings.has(dateString)) return;

      const bounds = getIssuePlanBounds(issue.planned_at, issue.planned_duration_minutes);
      if (!bounds) return;

      // Skip blocks that fall entirely outside the visible workday window.
      if (bounds.endHour <= HOURS_WORKDAY_START || bounds.startHour > HOURS_WORKDAY_END) return;

      const clampedStart = Math.max(bounds.startHour, HOURS_WORKDAY_START);
      const clampedEnd = Math.min(bounds.endHour, HOURS_WORKDAY_END + 1);
      if (clampedEnd <= clampedStart) return;

      if (!rawByDate[dateString]) rawByDate[dateString] = [];
      rawByDate[dateString].push({
        id: issue.id,
        issue,
        startHour: clampedStart,
        endHour: clampedEnd,
        durationMinutes: bounds.durationMinutes,
      });
    });

    Object.entries(rawByDate).forEach(([dateString, dayBlocks]) => {
      blocksByDate[dateString] = packOverlappingPlanBlocks(dayBlocks);
    });
  }

  if (visibleDays.length === 0) return null;

  const todayDateString = renderFormattedPayloadDate(currentTime);
  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
  const isNowWithinWorkday = currentHour >= HOURS_WORKDAY_START && currentHour < HOURS_WORKDAY_END + 1;
  const nowTop = isNowWithinWorkday
    ? (((currentTime.getHours() - HOURS_WORKDAY_START) * 60 + currentTime.getMinutes()) / 60) * HOURS_ROW_HEIGHT
    : undefined;

  return (
    <div className="w-full border-t border-subtle-1">
      <div
        className={cn("sticky top-0 z-[3] grid border-b border-subtle-1 bg-layer-1", {
          "grid-cols-[56px_repeat(7,minmax(0,1fr))]": showWeekends,
          "grid-cols-[56px_repeat(5,minmax(0,1fr))]": !showWeekends,
        })}
      >
        <div className="border-r border-subtle-1" />
        {visibleDays.map((day) => {
          const dateString = renderFormattedPayloadDate(day.date);
          const dayMeta = DAYS_LIST[day.date.getDay() + 1];
          const monthMeta = MONTHS_LIST[day.date.getMonth() + 1];
          const isToday = day.date.toDateString() === new Date().toDateString();

          return (
            <div
              key={dateString}
              className="flex min-h-12 flex-col items-center justify-center gap-0.5 border-l border-subtle-1 px-2 py-1 text-13 font-medium"
            >
              <span className="text-11 text-tertiary">{dayMeta?.shortTitle}</span>
              <div className="flex items-center gap-1">
                {isToday ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary text-11 text-on-color">
                    {day.date.getDate()}
                  </span>
                ) : (
                  <span>{day.date.getDate()}</span>
                )}
                <span className="text-11 text-tertiary">{monthMeta?.shortTitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={cn("grid", {
          "grid-cols-[56px_repeat(7,minmax(0,1fr))]": showWeekends,
          "grid-cols-[56px_repeat(5,minmax(0,1fr))]": !showWeekends,
        })}
      >
        <div className="border-r border-subtle-1">
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-b border-subtle-1 px-2 py-3 text-11 text-tertiary"
              style={{ height: HOURS_ROW_HEIGHT }}
            >
              {`${hour.toString().padStart(2, "0")}:00`}
            </div>
          ))}
        </div>

        {visibleDays.map((day) => {
          const dateString = renderFormattedPayloadDate(day.date);
          if (!dateString) return null;

          return (
            <CalendarDayColumn
              key={dateString}
              dateString={dateString}
              hours={hours}
              blocks={blocksByDate[dateString] ?? []}
              issuesMap={issues}
              quickActions={quickActions}
              readOnly={readOnly}
              canEditProperties={canEditProperties}
              isEpic={isEpic}
              showDueDateBadge={showDueDateBadge}
              isDraggingIssue={isDraggingIssue}
              showNowIndicator={dateString === todayDateString && isNowWithinWorkday}
              nowTop={nowTop}
              handleDragAndDrop={handleDragAndDrop}
              handleResizePlan={handleResizePlan}
            />
          );
        })}
      </div>
    </div>
  );
});
