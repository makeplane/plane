/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  formatHourLabel,
  getCalendarDestinationFromDropPayload,
  getCalendarSourceFromDropPayload,
  getDragDurationMinutes,
  getDragGrabOffsetY,
  getDragIssueName,
  getIssuePlanBounds,
  hourToTopOffset,
  HOURS_MIN_DURATION_MINUTES,
  HOURS_ROW_HEIGHT,
  HOURS_WORKDAY_END,
  HOURS_WORKDAY_START,
  packOverlappingPlanBlocks,
  resolveDropHour,
  yOffsetToHour,
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
  showProjectBadge?: boolean;
  showWeekends?: boolean;
  disableIssueCreation?: boolean;
  enableIssueCreation?: boolean;
  onDayClick?: (date: Date) => void;
  onTimeRangeSelect?: (date: Date, startHour: number, endHour: number) => void;
  isCalendarDragActive?: boolean;
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

type GridDragPreview = {
  dateString: string;
  startHour: number;
  durationMinutes: number;
  issueName: string;
};

const resolveColumnAtPoint = (
  clientX: number,
  clientY: number,
  columnRefs: Map<string, HTMLDivElement>
): { dateString: string; element: HTMLDivElement } | null => {
  const entries = [...columnRefs.entries()];

  for (const [dateString, element] of entries) {
    const rect = element.getBoundingClientRect();
    if (clientX >= rect.left && clientX < rect.right && clientY >= rect.top && clientY < rect.bottom) {
      return { dateString, element };
    }
  }

  let nearest: { dateString: string; element: HTMLDivElement; distance: number } | null = null;

  for (const [dateString, element] of entries) {
    const rect = element.getBoundingClientRect();
    if (clientY < rect.top || clientY >= rect.bottom) continue;

    const centerX = (rect.left + rect.right) / 2;
    const distance = Math.abs(clientX - centerX);
    if (!nearest || distance < nearest.distance) {
      nearest = { dateString, element, distance };
    }
  }

  return nearest ? { dateString: nearest.dateString, element: nearest.element } : null;
};

const HoursDropGhost = (props: { startHour: number; durationMinutes: number; issueName: string }) => {
  const { startHour, durationMinutes, issueName } = props;
  const spanHours = Math.max(durationMinutes / 60, HOURS_MIN_DURATION_MINUTES / 60);
  const endHour = startHour + spanHours;

  return (
    <div
      className="pointer-events-none absolute right-1 left-1 z-[6] overflow-hidden rounded-sm bg-surface-2/95 shadow-raised-300"
      style={{
        top: hourToTopOffset(startHour),
        height: spanHours * HOURS_ROW_HEIGHT,
      }}
    >
      <div className="flex h-full flex-col px-1.5 py-1">
        {issueName ? <div className="truncate text-11 font-semibold text-primary">{issueName}</div> : null}
        <div className={cn("truncate text-9 font-medium text-accent-primary", { "mt-0.5": issueName })}>
          {formatHourLabel(startHour)} – {formatHourLabel(endHour)}
        </div>
      </div>
    </div>
  );
};

const CalendarDayColumn = observer(function CalendarDayColumn(props: {
  date: Date;
  dateString: string;
  hours: number[];
  blocks: Array<DayPlanBlock & { columnIndex: number; columnCount: number }>;
  issuesMap: TIssueMap | undefined;
  quickActions: TRenderQuickActions;
  readOnly?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
  showDueDateBadge?: boolean;
  showProjectBadge?: boolean;
  disableIssueCreation?: boolean;
  enableIssueCreation?: boolean;
  onDayClick?: (date: Date) => void;
  onTimeRangeSelect?: (date: Date, startHour: number, endHour: number) => void;
  isDraggingIssue: boolean;
  isCalendarDragActive?: boolean;
  gridDragPreview?: GridDragPreview | null;
  registerColumnRef?: (dateString: string, element: HTMLDivElement | null) => void;
  showNowIndicator?: boolean;
  nowTop?: number;
  handleDragAndDrop: HandleDragAndDrop;
  handleResizePlan: HandleResizePlan;
}) {
  const {
    date,
    dateString,
    hours,
    blocks,
    issuesMap,
    quickActions,
    readOnly,
    canEditProperties,
    isEpic,
    showDueDateBadge,
    showProjectBadge,
    disableIssueCreation,
    enableIssueCreation,
    onDayClick,
    onTimeRangeSelect,
    isDraggingIssue,
    isCalendarDragActive = false,
    gridDragPreview = null,
    registerColumnRef,
    showNowIndicator = false,
    nowTop,
    handleDragAndDrop,
    handleResizePlan,
  } = props;

  const columnRef = useRef<HTMLDivElement | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartY, setSelectionStartY] = useState(0);
  const [selectionEndY, setSelectionEndY] = useState(0);

  const dragStartY = useRef(0);
  const hasMoved = useRef(false);
  const startSelectionOnMove = useRef(false);

  const isActiveDropColumn = gridDragPreview?.dateString === dateString;
  const isDimmedDuringDrag = showDueDateBadge && isCalendarDragActive && !isActiveDropColumn;

  const mergedColumnRef = useCallback(
    (element: HTMLDivElement | null) => {
      columnRef.current = element;
      registerColumnRef?.(dateString, element);
    },
    [dateString, registerColumnRef]
  );

  const yToHour = useCallback((relativeY: number): number => yOffsetToHour(relativeY), []);

  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source?.data?.type === CALENDAR_ISSUE_DRAG_TYPE,
        getData: ({ input, source }) => {
          const rect = element.getBoundingClientRect();
          const grabOffsetY = getDragGrabOffsetY(source.data as Record<string, unknown>);
          const hour = resolveDropHour(input.clientY, rect.top, grabOffsetY);
          return { date: dateString, hour, type: CALENDAR_DAY_DROP_TYPE };
        },
        onDrop: (payload) => {
          const source = getCalendarSourceFromDropPayload(payload);
          const destination = getCalendarDestinationFromDropPayload(payload);
          if (!source || !destination) return;

          void handleDragAndDrop(
            source.id,
            issuesMap?.[source.id]?.project_id ?? undefined,
            source.date,
            destination.date,
            destination.hour
          );

          highlightIssueOnDrop(payload.source?.element?.id, false);
        },
      })
    );
  }, [dateString, handleDragAndDrop, issuesMap]);

  const canCreate = !readOnly && !disableIssueCreation && enableIssueCreation;

  const handleDragStart = useCallback(
    (clientY: number) => {
      if (isDraggingIssue || !canCreate || !columnRef.current) return;

      const rect = columnRef.current.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      dragStartY.current = clientY;
      setSelectionStartY(Math.max(0, Math.min(relativeY, rect.height)));
      setSelectionEndY(Math.max(0, Math.min(relativeY, rect.height)));
      hasMoved.current = false;
      startSelectionOnMove.current = true;
    },
    [canCreate, isDraggingIssue]
  );

  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!startSelectionOnMove.current && !isSelecting) return;

      if (startSelectionOnMove.current && Math.abs(clientY - dragStartY.current) > 5) {
        setIsSelecting(true);
        startSelectionOnMove.current = false;
        hasMoved.current = true;
      }

      if (isSelecting && columnRef.current) {
        const rect = columnRef.current.getBoundingClientRect();
        const relativeY = clientY - rect.top;
        setSelectionEndY(Math.max(0, Math.min(relativeY, rect.height)));
      }
    },
    [isSelecting]
  );

  const handleDragEnd = useCallback(() => {
    if (isSelecting && onTimeRangeSelect) {
      const startHour = yToHour(Math.min(selectionStartY, selectionEndY));
      const endHour = yToHour(Math.max(selectionStartY, selectionEndY));
      if (endHour > startHour) {
        onTimeRangeSelect(date, startHour, endHour);
      }
    } else if (!hasMoved.current && !isSelecting && onDayClick) {
      onDayClick(date);
    }
    setIsSelecting(false);
    startSelectionOnMove.current = false;
    hasMoved.current = false;
  }, [isSelecting, onTimeRangeSelect, onDayClick, date, yToHour, selectionStartY, selectionEndY]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingIssue || e.button !== 0) return;
      e.preventDefault();
      handleDragStart(e.clientY);
    },
    [handleDragStart, isDraggingIssue]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleDragMove(e.clientY);
    },
    [handleDragMove]
  );

  const onMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isDraggingIssue) return;
      handleDragStart(e.touches[0].clientY);
    },
    [handleDragStart, isDraggingIssue]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isSelecting) e.preventDefault();
      handleDragMove(e.touches[0].clientY);
    },
    [isSelecting, handleDragMove]
  );

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  return (
    <div
      role="presentation"
      ref={mergedColumnRef}
      className={cn("relative border-l border-subtle-1 transition-opacity", {
        "bg-layer-transparent-hover": showDueDateBadge && isActiveDropColumn,
        "bg-layer-transparent-hover opacity-80": !showDueDateBadge && isActiveDropColumn,
        "opacity-50": isDimmedDuringDrag,
      })}
      style={{ height: hours.length * HOURS_ROW_HEIGHT }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="pointer-events-none absolute inset-0 z-[1]">
        {hours.map((hour) => (
          <div
            key={`${dateString}-${hour}`}
            className="border-b border-subtle-1"
            style={{ height: HOURS_ROW_HEIGHT }}
          />
        ))}
      </div>

      {showDueDateBadge && isActiveDropColumn && gridDragPreview != null && (
        <HoursDropGhost
          startHour={gridDragPreview.startHour}
          durationMinutes={gridDragPreview.durationMinutes}
          issueName={gridDragPreview.issueName}
        />
      )}

      {isSelecting && (
        <div
          className="border-accent-primary pointer-events-none absolute right-0 left-0 border-t border-b bg-accent-primary/20"
          style={{
            top: Math.min(selectionStartY, selectionEndY),
            height: Math.abs(selectionEndY - selectionStartY),
            zIndex: 2,
          }}
        />
      )}

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
            showProjectBadge={showProjectBadge}
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
    showProjectBadge,
    showWeekends = false,
    disableIssueCreation,
    enableIssueCreation,
    onDayClick,
    onTimeRangeSelect,
    isCalendarDragActive = false,
    handleDragAndDrop,
    handleResizePlan,
  } = props;
  const issueCalendarView = useCalendarView();
  const { data } = useUserProfile();
  const startOfWeek = data?.start_of_the_week;
  const { currentTime } = useCurrentTime();
  const [isDraggingIssue, setIsDraggingIssue] = useState(false);
  const [gridDragPreview, setGridDragPreview] = useState<GridDragPreview | null>(null);
  const columnRefs = useRef(new Map<string, HTMLDivElement>());

  const registerColumnRef = useCallback((dateString: string, element: HTMLDivElement | null) => {
    if (element) columnRefs.current.set(dateString, element);
    else columnRefs.current.delete(dateString);
  }, []);

  const updateGridDragPreview = useCallback(
    (clientX: number, clientY: number, sourceData: Record<string, unknown>) => {
      if (!showDueDateBadge) return;

      const match = resolveColumnAtPoint(clientX, clientY, columnRefs.current);
      if (!match) {
        setGridDragPreview(null);
        return;
      }

      const rect = match.element.getBoundingClientRect();
      const grabOffsetY = getDragGrabOffsetY(sourceData);
      const durationMinutes = getDragDurationMinutes(sourceData);
      const startHour = resolveDropHour(clientY, rect.top, grabOffsetY);

      setGridDragPreview({
        dateString: match.dateString,
        startHour,
        durationMinutes,
        issueName: getDragIssueName(sourceData),
      });
    },
    [showDueDateBadge]
  );

  useEffect(
    () =>
      monitorForElements({
        canMonitor: ({ source }) => source.data.type === CALENDAR_ISSUE_DRAG_TYPE,
        onDragStart: ({ location, source }) => {
          setIsDraggingIssue(true);
          updateGridDragPreview(
            location.current.input.clientX,
            location.current.input.clientY,
            source.data as Record<string, unknown>
          );
        },
        onDrag: ({ location, source }) =>
          updateGridDragPreview(
            location.current.input.clientX,
            location.current.input.clientY,
            source.data as Record<string, unknown>
          ),
        onDrop: () => {
          setIsDraggingIssue(false);
          setGridDragPreview(null);
        },
      }),
    [updateGridDragPreview]
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
              date={day.date}
              dateString={dateString}
              hours={hours}
              blocks={blocksByDate[dateString] ?? []}
              issuesMap={issues}
              quickActions={quickActions}
              readOnly={readOnly}
              canEditProperties={canEditProperties}
              isEpic={isEpic}
              showDueDateBadge={showDueDateBadge}
              showProjectBadge={showProjectBadge}
              disableIssueCreation={disableIssueCreation}
              enableIssueCreation={enableIssueCreation}
              onDayClick={onDayClick}
              onTimeRangeSelect={onTimeRangeSelect}
              isDraggingIssue={isDraggingIssue}
              isCalendarDragActive={isCalendarDragActive}
              gridDragPreview={gridDragPreview}
              registerColumnRef={registerColumnRef}
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
