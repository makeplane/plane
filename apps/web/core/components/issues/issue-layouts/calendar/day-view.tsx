"use client";

import React, { useEffect, useRef } from "react";
import type { TIssueMap, TGroupedIssues, TPaginationData, TIssue } from "@plane/types";
import type { TRenderQuickActions } from "../list/list-view-types";
import { isoToLocalHour, isoToLocalDateString, hourLabel } from "./calendar-time";
import { CalendarEventBlock } from "./event-block";
import { CalendarIssueBlocks } from "./issue-blocks";

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

export const DayView: React.FC<Props> = ({
  date,
  issues,
  loadMoreIssues,
  getPaginationData,
  getGroupIssueCount,
  quickActions,
  enableQuickIssueCreate,
  disableIssueCreation,
  quickAddCallback,
  addIssuesToView,
  readOnly,
  canEditProperties,
  handleDragAndDrop,
  isEpic,
}) => {
  const selectedDateString = isoToLocalDateString(date.toISOString())!;
  const hourRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Group issues: events (with start_time) vs all-day (without)
  const { eventIssues, allDayIssues } = React.useMemo(() => {
    if (!issues) return { eventIssues: [], allDayIssues: [] };

    const allIssues = Object.values(issues).filter(
      (issue) => isoToLocalDateString(issue.start_time || issue.target_date) === selectedDateString
    );

    return {
      eventIssues: allIssues.filter((issue) => issue.start_time),
      allDayIssues: allIssues.filter((issue) => !issue.start_time),
    };
  }, [issues, selectedDateString]);

  // Create a map of hour -> events for positioning
  const eventsByHour = React.useMemo(() => {
    const map: Record<number, Array<{ issue: TIssue; position: ReturnType<typeof calculateEventPosition> }>> = {};

    eventIssues.forEach((issue) => {
      if (!issue.start_time) return;

      const position = calculateEventPosition(issue.start_time, issue.end_time);
      if (!map[position.hourIndex]) {
        map[position.hourIndex] = [];
      }
      map[position.hourIndex].push({ issue, position });
    });

    return map;
  }, [eventIssues]);

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
                {/* Render events positioned within this hour */}
                {eventsForHour.map(({ issue, position }) => (
                  <CalendarEventBlock
                    key={issue.id}
                    issue={issue}
                    quickActions={quickActions}
                    canEditProperties={canEditProperties}
                    isEpic={isEpic}
                    style={{
                      top: `${position.topOffset}px`,
                      height: `${position.height}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick add at bottom */}
      {enableQuickIssueCreate && !disableIssueCreation && !readOnly && (
        <div className="border-t border-custom-border-200 p-2 bg-custom-background-100">
          <CalendarIssueBlocks
            date={date}
            issueIdList={[]}
            loadMoreIssues={loadMoreIssues}
            getPaginationData={getPaginationData}
            getGroupIssueCount={getGroupIssueCount}
            quickActions={quickActions}
            enableQuickIssueCreate={true}
            disableIssueCreation={disableIssueCreation}
            quickAddCallback={quickAddCallback}
            addIssuesToView={addIssuesToView}
            readOnly={readOnly}
            canEditProperties={canEditProperties}
            isEpic={isEpic}
            isDragDisabled={false}
          />
        </div>
      )}
    </div>
  );
};

// Current time indicator component
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
