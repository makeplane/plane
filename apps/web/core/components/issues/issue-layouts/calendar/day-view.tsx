"use client";

import React, { useEffect, useRef } from "react";
import type { TIssueMap, TGroupedIssues, TPaginationData } from "@plane/types";
import { CalendarIssueBlocks } from "./issue-blocks";

type Props = {
  date: Date;
  groupedIssueIds: TGroupedIssues;
  issues: TIssueMap | undefined;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  quickActions: any;
  enableQuickIssueCreate: boolean;
  disableIssueCreation: boolean;
  quickAddCallback: any;
  addIssuesToView: any;
  readOnly: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  handleDragAndDrop: (
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
  groupedIssueIds,
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
  isEpic,
}) => {
  const formattedDate = date.toISOString().substring(0, 10);
  const issueIdList = groupedIssueIds?.[formattedDate] ?? [];


  // --- Hour rows ref ---
  const hourRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- Auto scroll to system hour ---
  useEffect(() => {
    const systemHour = new Date().getHours(); // 0-23

    const target = hourRefs.current[systemHour];
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  // --- 12h Format ---
  const HOURS = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 === 0 ? 12 : i % 12;
    const period = i < 12 ? "AM" : "PM";
    return `${hour.toString().padStart(2, "0")}:00 ${period}`;
  });

  return (
    <div className="border-t border-custom-border-200 w-full h-full">
      <div className="relative w-full h-full overflow-y-auto">
        {HOURS.map((time, index) => (
          <div
            key={index}
            ref={(el) => {
              hourRefs.current[index] = el;
            }}
            className="flex border-b border-custom-border-200 min-h-[100px]"
          >
            <div className="w-24 flex items-start justify-end pr-4 pt-2 text-sm text-gray-600">
              {time}
            </div>

            <div className="flex-1 relative">
              <CalendarIssueBlocks
                date={date}
                issueIdList={issueIdList}
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
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
