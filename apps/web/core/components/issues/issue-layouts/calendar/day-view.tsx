"use client";

import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import type { TIssueMap, TGroupedIssues, TPaginationData, TIssue } from "@plane/types";
import type { TRenderQuickActions } from "../list/list-view-types";
import { isoToLocalDateString, hourLabel } from "./calendar-time";
import { CalendarIssueBlocks } from "./issue-blocks";
import { renderFormattedPayloadDate } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  date: Date;
  groupedIssueIds: TGroupedIssues;
  issues: TIssueMap | undefined;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  quickActions: TRenderQuickActions;
  enableQuickIssueCreate: boolean;
  disableIssueCreation: boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  readOnly: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  handleDragAndDrop?: (
    issueId: string | undefined,
    issueProjectId: string | undefined,
    sourceDate: string | undefined,
    destinationDate: string | undefined
  ) => Promise<void>;
  isEpic?: boolean;
};

const HOUR_HEIGHT = 60; // pixels per hour

// Helper to calculate position and height of event blocks
const calculateEventPosition = (startTime: string, endTime?: string) => {
  const start = new Date(startTime);
  const startHour = start.getHours();
  const startMinute = start.getMinutes();

  // Position from top of the hour
  const topOffset = (startMinute / 60) * HOUR_HEIGHT;

  // Calculate height
  let height = HOUR_HEIGHT; // default 1 hour
  if (endTime) {
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    height = Math.max(durationHours * HOUR_HEIGHT, 30); // min 30px
  }

  return {
    hourIndex: startHour,
    topOffset,
    height,
  };
};

export const DayView: React.FC<Props> = observer(({
  date,
  groupedIssueIds,
  issues,
  loadMoreIssues,
  getPaginationData,
  getGroupIssueCount,
  quickActions,
  disableIssueCreation,
  quickAddCallback,
  addIssuesToView,
  readOnly,
  canEditProperties,
  isEpic,
}) => {
  const formattedDatePayload = renderFormattedPayloadDate(date);
  const hourRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { issue: issueStore } = useIssueDetail();

  // Group issues: events (with start_time) vs all-day (without) - using direct computation for MobX reactivity
  const getIssuesForDay = () => {
    if (!issues || !formattedDatePayload) return { eventIssues: [], allDayIssues: [] };

    // Get issues that have their start_date matching the selected date
    const allIssuesForDay = Object.values(issues).filter((issue): issue is TIssue => {
      if (!issue) return false;

      const selectedDate = formattedDatePayload;
      const latestIssue = issueStore.getIssueById(issue.id) || issue;

      // Only show issues on their start_date
      if (latestIssue.start_date) {
        return latestIssue.start_date === selectedDate;
      }

      // Fallback: check if issue is in the grouped list for this date
      const issueIdsForDate = groupedIssueIds[formattedDatePayload] || [];
      return issueIdsForDate.includes(issue.id);
    });

    return {
      eventIssues: allIssuesForDay.filter((issue) => {
        const latestIssue = issueStore.getIssueById(issue.id) || issue;
        return latestIssue.start_time;
      }),
      allDayIssues: allIssuesForDay.filter((issue) => {
        const latestIssue = issueStore.getIssueById(issue.id) || issue;
        return !latestIssue.start_time;
      }),
    };
  };

  const { eventIssues, allDayIssues } = getIssuesForDay();

  // Group events by hour for positioning with overlap handling
  const getEventsByHour = () => {
    const map: Record<number, Array<{ issue: TIssue; position: ReturnType<typeof calculateEventPosition>; column: number; totalColumns: number }>> = {};

    eventIssues.forEach((issue) => {
      const latestIssue = issueStore.getIssueById(issue.id) || issue;
      if (!latestIssue.start_time) return;

      const position = calculateEventPosition(latestIssue.start_time, latestIssue.end_time);
      if (!map[position.hourIndex]) {
        map[position.hourIndex] = [];
      }
      map[position.hourIndex].push({ issue: latestIssue, position, column: 0, totalColumns: 1 });
    });

    // Calculate columns for overlapping events
    Object.keys(map).forEach((hourKey) => {
      const hour = parseInt(hourKey);
      const events = map[hour];

      // Sort events by start time
      events.sort((a, b) => a.position.topOffset - b.position.topOffset);

      // Detect overlaps and assign columns
      for (let i = 0; i < events.length; i++) {
        const currentEvent = events[i];
        const currentEnd = currentEvent.position.topOffset + currentEvent.position.height;

        let column = 0;
        const overlappingEvents = [currentEvent];

        // Find all overlapping events
        for (let j = 0; j < events.length; j++) {
          if (i === j) continue;

          const otherEvent = events[j];
          const otherEnd = otherEvent.position.topOffset + otherEvent.position.height;

          // Check if events overlap
          if (
            (currentEvent.position.topOffset < otherEnd && currentEnd > otherEvent.position.topOffset)
          ) {
            overlappingEvents.push(otherEvent);
          }
        }

        // Assign columns to overlapping events
        overlappingEvents.forEach((event, index) => {
          event.column = index;
          event.totalColumns = overlappingEvents.length;
        });
      }
    });

    return map;
  };

  const eventsByHour = getEventsByHour();

  /** Auto-scroll to current hour */
  useEffect(() => {
    const h = new Date().getHours();
    hourRefs.current[h]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  return (
    <div className="border-t border-custom-border-200 w-full h-full flex flex-col">
      {/* All-day section */}
      {allDayIssues.length > 0 && (
        <div className="border-b border-custom-border-200 bg-custom-background-90 p-2">
          <div className="text-xs font-medium text-custom-text-300 mb-2">All Day</div>
          <div className="flex flex-wrap gap-1">
            <CalendarIssueBlocks
              date={date}
              issueIdList={allDayIssues.map((i) => i.id)}
              loadMoreIssues={loadMoreIssues}
              getPaginationData={getPaginationData}
              getGroupIssueCount={getGroupIssueCount}
              quickActions={quickActions}
              enableQuickIssueCreate={false}
              disableIssueCreation={disableIssueCreation}
              quickAddCallback={quickAddCallback}
              addIssuesToView={addIssuesToView}
              readOnly={readOnly}
              canEditProperties={canEditProperties}
              isEpic={isEpic}
              isDragDisabled={false}
              showLoadMore={false}
            />
          </div>
        </div>
      )}

      {/* Hourly timeline */}
      <div className="relative w-full flex-1 overflow-y-auto">
        {/* Current time indicator */}
        <CurrentTimeIndicator selectedDate={date} />

        {Array.from({ length: 24 }).map((_, hour) => {
          const eventsForHour = eventsByHour[hour] || [];

          return (
            <div
              key={hour}
              ref={(el) => {
                hourRefs.current[hour] = el;
              }}
              className="flex border-b border-custom-border-200 relative"
              style={{ height: `${HOUR_HEIGHT}px` }}
            >
              {/* Hour label */}
              <div className="w-20 flex-shrink-0 flex items-start justify-end pr-3 pt-1 text-xs text-custom-text-300 font-medium">
                {hourLabel(hour)}
              </div>

              {/* Event area */}
              <div className="flex-1 relative border-l border-custom-border-200">
                {/* Render each event with CalendarIssueBlocks positioned absolutely */}
                {eventsForHour.map(({ issue, position, column, totalColumns }) => {
                  const columnWidth = totalColumns > 1 ? `${100 / totalColumns}%` : '100%';
                  const leftOffset = totalColumns > 1 ? `${(column * 100) / totalColumns}%` : '0%';

                  return (
                    <div
                      key={`${issue.id}-${issueStore.getIssueById(issue.id)?.start_time}-${issueStore.getIssueById(issue.id)?.end_time}`}
                      className="absolute z-1-"
                      style={{
                        top: `${position.topOffset}px`,
                        height: `${position.height}px`,
                        left: `calc(4px + ${leftOffset})`,
                        width: `calc(${columnWidth} - 4px)`,
                      }}
                    >
                      <CalendarIssueBlocks
                        date={date}
                        issueIdList={[issue.id]}
                        loadMoreIssues={loadMoreIssues}
                        getPaginationData={getPaginationData}
                        getGroupIssueCount={getGroupIssueCount}
                        quickActions={quickActions}
                        enableQuickIssueCreate={false}
                        disableIssueCreation={disableIssueCreation}
                        quickAddCallback={quickAddCallback}
                        addIssuesToView={addIssuesToView}
                        readOnly={readOnly}
                        canEditProperties={canEditProperties}
                        isEpic={isEpic}
                        isDragDisabled={false}
                        showLoadMore={false}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Current time indicator component (unchanged)
const CurrentTimeIndicator: React.FC<{ selectedDate: Date }> = ({ selectedDate }) => {
  const [position, setPosition] = React.useState<number | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();

      // Only show if viewing today
      if (
        now.getDate() !== selectedDate.getDate() ||
        now.getMonth() !== selectedDate.getMonth() ||
        now.getFullYear() !== selectedDate.getFullYear()
      ) {
        setPosition(null);
        return;
      }

      const hour = now.getHours();
      const minute = now.getMinutes();
      const totalMinutes = hour * 60 + minute;
      const positionPx = (totalMinutes / 60) * HOUR_HEIGHT;

      setPosition(positionPx);
    };

    updatePosition();
    const interval = setInterval(updatePosition, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [selectedDate]);

  if (position === null) return null;

  return (
    <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: `${position}px` }}>
      <div className="flex items-center">
        <div className="w-20 flex-shrink-0" />
        <div className="flex-1 flex items-center">
          <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
          <div className="flex-1 h-0.5 bg-red-500" />
        </div>
      </div>
    </div>
  );
};