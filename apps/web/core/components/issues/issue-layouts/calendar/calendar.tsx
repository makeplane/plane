/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
// plane constants
import type { TSupportedFilterTypeForUpdate } from "@plane/constants";
// types
import type {
  TGroupedIssues,
  TIssue,
  TIssueMap,
  TPaginationData,
  ICalendarWeek,
  TSupportedFilterForUpdate,
} from "@plane/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
// ui
import { Spinner } from "@plane/ui";
import { renderFormattedPayloadDate, cn } from "@plane/utils";
// constants
import { MONTHS_LIST } from "@plane/constants";
// helpers
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import useSize from "@/hooks/use-window-size";
// store
import type { IProfileIssuesFilter } from "@/store/issue/profile/filter.store";
import type { ICycleIssuesFilter } from "@/store/issue/cycle";
import type { ICalendarStore } from "@/store/issue/issue_calendar_view.store";
import type { IModuleIssuesFilter } from "@/store/issue/module";
import type { IProjectIssuesFilter } from "@/store/issue/project";
import type { IProjectViewIssuesFilter } from "@/store/issue/project-views";
// local imports
import { IssueLayoutHOC } from "../issue-layout-HOC";
import type { TRenderQuickActions } from "../list/list-view-types";
import { CalendarHeader } from "./header";
import { CalendarHoursGrid } from "./hours-grid";
import { CalendarIssueBlocks } from "./issue-blocks";
import { CalendarUnscheduledStrip } from "./unscheduled-strip";
import { CalendarWeekDays } from "./week-days";
import { CalendarWeekHeader } from "./week-header";

type Props = {
  issuesFilterStore:
    | IProjectIssuesFilter
    | IModuleIssuesFilter
    | ICycleIssuesFilter
    | IProjectViewIssuesFilter
    | IProfileIssuesFilter;
  issues: TIssueMap | undefined;
  groupedIssueIds: TGroupedIssues;
  layout: "month" | "week" | "hours" | undefined;
  showWeekends: boolean;
  issueCalendarView: ICalendarStore;
  storeType?: EIssuesStoreType;
  isProfileCalendar?: boolean;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  quickActions: TRenderQuickActions;
  handleDragAndDrop: (
    issueId: string | undefined,
    issueProjectId: string | undefined,
    sourceDate: string | undefined,
    destinationDate: string | undefined,
    destinationHour?: number
  ) => Promise<void>;
  handleResizePlan?: (
    issueId: string,
    data: { planned_at?: string | null; planned_duration_minutes?: number }
  ) => Promise<void>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  readOnly?: boolean;
  updateFilters?: (
    projectId: string,
    filterType: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate
  ) => Promise<void>;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
};

export const CalendarChart = observer(function CalendarChart(props: Props) {
  const {
    issuesFilterStore,
    issues,
    groupedIssueIds,
    layout,
    showWeekends,
    issueCalendarView,
    loadMoreIssues,
    handleDragAndDrop,
    handleResizePlan,
    quickActions,
    quickAddCallback,
    addIssuesToView,
    getPaginationData,
    getGroupIssueCount,
    updateFilters,
    canEditProperties,
    readOnly = false,
    isEpic = false,
    storeType = EIssuesStoreType.PROJECT,
    isProfileCalendar = false,
  } = props;
  // states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  //refs
  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);
  // store hooks
  const {
    issues: { viewFlags },
  } = useIssues(storeType);

  const [windowWidth] = useSize();

  const { enableIssueCreation, enableQuickAdd } = viewFlags || {};

  const calendarPayload = issueCalendarView.calendarPayload;

  const allWeeksOfActiveMonth = issueCalendarView.allWeeksOfActiveMonth;

  const formattedDatePayload = renderFormattedPayloadDate(selectedDate) ?? undefined;

  // Enable Auto Scroll for calendar
  useEffect(() => {
    const element = scrollableContainerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
      })
    );
  }, []);

  if (!calendarPayload || !formattedDatePayload)
    return (
      <div className="grid h-full w-full place-items-center">
        <Spinner />
      </div>
    );

  const issueIdList = groupedIssueIds ? groupedIssueIds[formattedDatePayload] : [];

  return (
    <>
      <div className="flex h-full w-full flex-col overflow-hidden">
        <CalendarHeader
          setSelectedDate={setSelectedDate}
          issuesFilterStore={issuesFilterStore}
          updateFilters={updateFilters}
          isProfileCalendar={isProfileCalendar}
        />

        <IssueLayoutHOC layout={EIssueLayoutTypes.CALENDAR}>
          <div
            className={cn("flex w-full flex-col overflow-y-auto md:h-full", {
              "vertical-scrollbar scrollbar-lg": windowWidth > 768,
            })}
            ref={scrollableContainerRef}
          >
            {layout !== "hours" && <CalendarWeekHeader isLoading={!issues} showWeekends={showWeekends} />}
            <div className="h-full w-full">
              {layout === "month" && (
                <div className="grid h-full w-full grid-cols-1 divide-y-[0.5px] divide-subtle-1">
                  {allWeeksOfActiveMonth &&
                    Object.entries(allWeeksOfActiveMonth).map(([weekKey, week]: [string, ICalendarWeek]) => (
                      <CalendarWeekDays
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        handleDragAndDrop={handleDragAndDrop}
                        issuesFilterStore={issuesFilterStore}
                        key={weekKey}
                        week={week}
                        issues={issues}
                        groupedIssueIds={groupedIssueIds}
                        loadMoreIssues={loadMoreIssues}
                        getPaginationData={getPaginationData}
                        getGroupIssueCount={getGroupIssueCount}
                        enableQuickIssueCreate={enableQuickAdd}
                        disableIssueCreation={!enableIssueCreation}
                        quickActions={quickActions}
                        quickAddCallback={quickAddCallback}
                        addIssuesToView={addIssuesToView}
                        readOnly={readOnly}
                        canEditProperties={canEditProperties}
                        isEpic={isEpic}
                        showDueDateBadge={isProfileCalendar}
                      />
                    ))}
                </div>
              )}
              {layout === "week" && (
                <CalendarWeekDays
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  handleDragAndDrop={handleDragAndDrop}
                  issuesFilterStore={issuesFilterStore}
                  week={issueCalendarView.allDaysOfActiveWeek}
                  issues={issues}
                  groupedIssueIds={groupedIssueIds}
                  loadMoreIssues={loadMoreIssues}
                  getPaginationData={getPaginationData}
                  getGroupIssueCount={getGroupIssueCount}
                  enableQuickIssueCreate={enableQuickAdd}
                  disableIssueCreation={!enableIssueCreation}
                  quickActions={quickActions}
                  quickAddCallback={quickAddCallback}
                  addIssuesToView={addIssuesToView}
                  readOnly={readOnly}
                  canEditProperties={canEditProperties}
                  isEpic={isEpic}
                  showDueDateBadge={isProfileCalendar}
                />
              )}
              {layout === "hours" && handleResizePlan && (
                <CalendarHoursGrid
                  issues={issues}
                  quickActions={quickActions}
                  readOnly={readOnly}
                  canEditProperties={canEditProperties}
                  isEpic={isEpic}
                  showDueDateBadge={isProfileCalendar}
                  showWeekends={showWeekends}
                  handleDragAndDrop={handleDragAndDrop}
                  handleResizePlan={handleResizePlan}
                />
              )}
            </div>

            {isProfileCalendar && (
              <CalendarUnscheduledStrip
                groupedIssueIds={groupedIssueIds}
                issues={issues}
                quickActions={quickActions}
                loadMoreIssues={loadMoreIssues}
                getPaginationData={getPaginationData}
                getGroupIssueCount={getGroupIssueCount}
                readOnly={readOnly}
                canEditProperties={canEditProperties}
                isEpic={isEpic}
                handleDragAndDrop={handleDragAndDrop}
              />
            )}

            {/* mobile view */}
            <div className="md:hidden">
              <p className="p-4 text-18 font-semibold">
                {`${selectedDate.getDate()} ${
                  MONTHS_LIST[selectedDate.getMonth() + 1].title
                }, ${selectedDate.getFullYear()}`}
              </p>
              <CalendarIssueBlocks
                date={selectedDate}
                issueIdList={issueIdList}
                loadMoreIssues={loadMoreIssues}
                getPaginationData={getPaginationData}
                getGroupIssueCount={getGroupIssueCount}
                quickActions={quickActions}
                enableQuickIssueCreate={enableQuickAdd}
                disableIssueCreation={!enableIssueCreation}
                quickAddCallback={quickAddCallback}
                addIssuesToView={addIssuesToView}
                readOnly={readOnly}
                canEditProperties={canEditProperties}
                isDragDisabled
                isMobileView
                isEpic={isEpic}
              />
            </div>
          </div>
        </IssueLayoutHOC>

        {/* mobile view */}
        <div className="md:hidden">
          <p className="p-4 text-18 font-semibold">
            {`${selectedDate.getDate()} ${
              MONTHS_LIST[selectedDate.getMonth() + 1].title
            }, ${selectedDate.getFullYear()}`}
          </p>
          <CalendarIssueBlocks
            date={selectedDate}
            issueIdList={issueIdList}
            quickActions={quickActions}
            loadMoreIssues={loadMoreIssues}
            getPaginationData={getPaginationData}
            getGroupIssueCount={getGroupIssueCount}
            enableQuickIssueCreate={enableQuickAdd}
            disableIssueCreation={!enableIssueCreation}
            quickAddCallback={quickAddCallback}
            addIssuesToView={addIssuesToView}
            readOnly={readOnly}
            canEditProperties={canEditProperties}
            isDragDisabled
            isMobileView
            isEpic={isEpic}
          />
        </div>
      </div>
    </>
  );
});
