"use client";

import React, { useEffect, useRef } from "react";
import type { TIssueMap, TGroupedIssues, TPaginationData, TIssue } from "@plane/types";
import type { TRenderQuickActions } from "../list/list-view-types";
import {
  isoToLocalHour,
  isoToLocalDateString,
  hourLabel,
} from "./calendar-time";
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

  /** Auto-scroll to current hour */
  useEffect(() => {
    const h = new Date().getHours();
    hourRefs.current[h]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  return (
    <div className="border-t border-custom-border-200 w-full h-full">
      <div className="relative w-full h-full overflow-y-auto">
        {Array.from({ length: 24 }).map((_, hour) => {
          const issuesForHour = issues
            ? Object.values(issues).filter((issue) => {
                if (!issue.start_time) return false;

                return (
                  isoToLocalDateString(issue.start_time) === selectedDateString &&
                  isoToLocalHour(issue.start_time) === hour
                );
              })
            : [];

          return (
            <div
              key={hour}
              ref={(el) => {hourRefs.current[hour] = el}}
              className="flex border-b border-custom-border-200 min-h-[100px]"
            >
              {/* Hour label */}
              <div className="w-24 flex items-start justify-end pr-4 pt-2 text-sm text-gray-600">
                {hourLabel(hour)}
              </div>

              {/* Issues */}
              <div className="flex-1 relative">
                <CalendarIssueBlocks
                  date={date}
                  issueIdList={issuesForHour.map((i) => i.id)}
                  loadMoreIssues={loadMoreIssues}
                  getPaginationData={getPaginationData}
                  getGroupIssueCount={getGroupIssueCount}
                  quickActions={quickActions}
                  enableQuickIssueCreate={enableQuickIssueCreate}
                  disableIssueCreation={disableIssueCreation}
                  quickAddCallback={quickAddCallback}
                  addIssuesToView={addIssuesToView}
                  readOnly={readOnly}
                  canEditProperties={canEditProperties}
                  isEpic={isEpic}
                  isDragDisabled={false}
                  handleDragAndDrop={handleDragAndDrop}
                  hourIndex={hour}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
