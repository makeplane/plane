/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import type { TGroupedIssues, TIssue, TIssueMap, TPaginationData, ICalendarDate } from "@plane/types";
// components
import { cn, renderFormattedPayloadDate } from "@plane/utils";
import { highlightIssueOnDrop } from "@/components/issues/issue-layouts/utils";
// helpers
import { MONTHS_LIST } from "@plane/constants";
// helpers
// types
import type { IProfileIssuesFilter } from "@/store/issue/profile/filter.store";
import type { ICycleIssuesFilter } from "@/store/issue/cycle";
import type { IModuleIssuesFilter } from "@/store/issue/module";
import type { IProjectIssuesFilter } from "@/store/issue/project";
import type { IProjectViewIssuesFilter } from "@/store/issue/project-views";
import type { TRenderQuickActions } from "../list/list-view-types";
import { CalendarIssueBlocks } from "./issue-blocks";

type Props = {
  issuesFilterStore:
    | IProjectIssuesFilter
    | IModuleIssuesFilter
    | ICycleIssuesFilter
    | IProjectViewIssuesFilter
    | IProfileIssuesFilter;
  date: ICalendarDate;
  issues: TIssueMap | undefined;
  groupedIssueIds: TGroupedIssues;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  enableQuickIssueCreate?: boolean;
  disableIssueCreation?: boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  quickActions: TRenderQuickActions;
  handleDragAndDrop: (
    issueId: string | undefined,
    issueProjectId: string | undefined,
    sourceDate: string | undefined,
    destinationDate: string | undefined
  ) => Promise<void>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  readOnly?: boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
  showDueDateBadge?: boolean;
};

export const CalendarDayTile = observer(function CalendarDayTile(props: Props) {
  const {
    issuesFilterStore,
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
    readOnly = false,
    selectedDate,
    handleDragAndDrop,
    setSelectedDate,
    canEditProperties,
    isEpic = false,
    showDueDateBadge = false,
  } = props;

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const calendarLayout = issuesFilterStore?.issueFilters?.displayFilters?.calendar?.layout ?? "month";

  const formattedDatePayload = renderFormattedPayloadDate(date.date);

  const dayContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = dayContentRef.current;

    if (!element || !formattedDatePayload) return;

    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ date: formattedDatePayload }),
        onDragEnter: () => {
          setIsDraggingOver(true);
        },
        onDragLeave: () => {
          setIsDraggingOver(false);
        },
        onDrop: ({ source }) => {
          setIsDraggingOver(false);
          highlightIssueOnDrop(source?.element?.id, false);
        },
      })
    );
  }, [formattedDatePayload]);

  if (!formattedDatePayload) return null;
  const issueIds = groupedIssueIds?.[formattedDatePayload];

  const isToday = date.date.toDateString() === new Date().toDateString();
  const isSelectedDate = date.date.toDateString() == selectedDate.toDateString();

  const isWeekend = [0, 6].includes(date.date.getDay());
  const isMonthLayout = calendarLayout === "month";

  const normalBackground = isWeekend ? "bg-layer-1" : "bg-layer-transparent";
  const draggingOverBackground = isWeekend ? "bg-layer-1" : "bg-layer-transparent-hover";

  return (
    <>
      <div className="group relative flex h-full w-full flex-col">
        {/* header */}
        <div
          className={`hidden flex-shrink-0 justify-end px-2 py-1.5 text-right text-11 md:flex ${
            isMonthLayout // if month layout, highlight current month days
              ? date.is_current_month
                ? "font-medium"
                : "text-tertiary"
              : "font-medium" // if week layout, highlight all days
          } ${isWeekend ? "bg-layer-1" : "bg-layer-transparent"} `}
        >
          {date.date.getDate() === 1 && MONTHS_LIST[date.date.getMonth() + 1].shortTitle + " "}
          {isToday ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary text-on-color">
              {date.date.getDate()}
            </span>
          ) : (
            <>{date.date.getDate()}</>
          )}
        </div>

        {/* content */}
        <div className="hidden h-full w-full md:block">
          <div
            ref={dayContentRef}
            className={cn(
              `h-full w-full select-none ${isDraggingOver ? `${draggingOverBackground} opacity-70` : normalBackground}`,
              {
                "min-h-[5rem]": isMonthLayout,
              }
            )}
          >
            <CalendarIssueBlocks
              date={date.date}
              issueIdList={issueIds}
              quickActions={quickActions}
              loadMoreIssues={loadMoreIssues}
              getPaginationData={getPaginationData}
              getGroupIssueCount={getGroupIssueCount}
              isDragDisabled={readOnly}
              addIssuesToView={addIssuesToView}
              disableIssueCreation={disableIssueCreation}
              enableQuickIssueCreate={enableQuickIssueCreate}
              quickAddCallback={quickAddCallback}
              readOnly={readOnly}
              canEditProperties={canEditProperties}
              isEpic={isEpic}
              showDueDateBadge={showDueDateBadge}
            />
          </div>
        </div>

        {/* Mobile view content */}
        <div
          onClick={() => setSelectedDate(date.date)}
          className={cn(
            "mx-auto flex h-full w-full cursor-pointer flex-col items-center justify-start py-2.5 text-13 font-medium opacity-80 md:hidden",
            {
              "bg-layer-2": !isWeekend,
            }
          )}
        >
          <div
            className={cn("flex size-6 items-center justify-center rounded-full", {
              "bg-accent-primary text-on-color": isSelectedDate,
              "bg-accent-primary/10 text-accent-primary": isToday && !isSelectedDate,
            })}
          >
            {date.date.getDate()}
          </div>
        </div>
      </div>
    </>
  );
});
