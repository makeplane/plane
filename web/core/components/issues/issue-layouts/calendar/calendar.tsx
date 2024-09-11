"use client";

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
// types
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TGroupedIssues,
  TIssue,
  TIssueKanbanFilters,
  TIssueMap,
  TPaginationData,
} from "@plane/types";
// ui
import { Spinner } from "@plane/ui";
// components
import { CalendarHeader, CalendarIssueBlocks, CalendarWeekDays, CalendarWeekHeader } from "@/components/issues";
// constants
import { MONTHS_LIST } from "@/constants/calendar";
import { EIssueFilterType, EIssueLayoutTypes, EIssuesStoreType } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { useIssues, useUserPermissions } from "@/hooks/store";
import useSize from "@/hooks/use-window-size";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// store
import { ICycleIssuesFilter } from "@/store/issue/cycle";
import { ICalendarStore } from "@/store/issue/issue_calendar_view.store";
import { IModuleIssuesFilter } from "@/store/issue/module";
import { IProjectIssuesFilter } from "@/store/issue/project";
import { IProjectViewIssuesFilter } from "@/store/issue/project-views";
import { IssueLayoutHOC } from "../issue-layout-HOC";
import { TRenderQuickActions } from "../list/list-view-types";
import type { ICalendarWeek } from "./types";

type Props = {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
  issues: TIssueMap | undefined;
  groupedIssueIds: TGroupedIssues;
  layout: "month" | "week" | undefined;
  showWeekends: boolean;
  issueCalendarView: ICalendarStore;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  quickActions: TRenderQuickActions;
  handleDragAndDrop: (
    issueId: string | undefined,
    sourceDate: string | undefined,
    destinationDate: string | undefined
  ) => Promise<void>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  readOnly?: boolean;
  updateFilters?: (
    projectId: string,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
  ) => Promise<void>;
};

export const CalendarChart: React.FC<Props> = observer((props) => {
  const {
    issuesFilterStore,
    issues,
    groupedIssueIds,
    layout,
    showWeekends,
    issueCalendarView,
    loadMoreIssues,
    handleDragAndDrop,
    quickActions,
    quickAddCallback,
    addIssuesToView,
    getPaginationData,
    getGroupIssueCount,
    updateFilters,
    readOnly = false,
  } = props;
  // states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  //refs
  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);
  // store hooks
  const {
    issues: { viewFlags },
  } = useIssues(EIssuesStoreType.PROJECT);
  const { allowPermissions } = useUserPermissions();

  const [windowWidth] = useSize();

  const { enableIssueCreation } = viewFlags || {};
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

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
  }, [scrollableContainerRef?.current]);

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
        />

        <IssueLayoutHOC layout={EIssueLayoutTypes.CALENDAR}>
          <div
            className={cn("flex md:h-full w-full flex-col overflow-y-auto", {
              "vertical-scrollbar scrollbar-lg": windowWidth > 768,
            })}
            ref={scrollableContainerRef}
          >
            <CalendarWeekHeader isLoading={!issues} showWeekends={showWeekends} />
            <div className="h-full w-full">
              {layout === "month" && (
                <div className="grid h-full w-full grid-cols-1 divide-y-[0.5px] divide-custom-border-200">
                  {allWeeksOfActiveMonth &&
                    Object.values(allWeeksOfActiveMonth).map((week: ICalendarWeek, weekIndex) => (
                      <CalendarWeekDays
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        handleDragAndDrop={handleDragAndDrop}
                        issuesFilterStore={issuesFilterStore}
                        key={weekIndex}
                        week={week}
                        issues={issues}
                        groupedIssueIds={groupedIssueIds}
                        loadMoreIssues={loadMoreIssues}
                        getPaginationData={getPaginationData}
                        getGroupIssueCount={getGroupIssueCount}
                        enableQuickIssueCreate
                        disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
                        quickActions={quickActions}
                        quickAddCallback={quickAddCallback}
                        addIssuesToView={addIssuesToView}
                        readOnly={readOnly}
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
                  enableQuickIssueCreate
                  disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
                  quickActions={quickActions}
                  quickAddCallback={quickAddCallback}
                  addIssuesToView={addIssuesToView}
                  readOnly={readOnly}
                />
              )}
            </div>

            {/* mobile view */}
            <div className="md:hidden">
              <p className="p-4 text-xl font-semibold">
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
                enableQuickIssueCreate
                disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
                quickAddCallback={quickAddCallback}
                addIssuesToView={addIssuesToView}
                readOnly={readOnly}
                isDragDisabled
                isMobileView
              />
            </div>
          </div>
        </IssueLayoutHOC>

        {/* mobile view */}
        <div className="md:hidden">
          <p className="p-4 text-xl font-semibold">
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
            enableQuickIssueCreate
            disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
            quickAddCallback={quickAddCallback}
            addIssuesToView={addIssuesToView}
            readOnly={readOnly}
            isDragDisabled
            isMobileView
          />
        </div>
      </div>
    </>
  );
});
