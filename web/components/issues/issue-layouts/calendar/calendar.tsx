import { useState } from "react";
import { Placement } from "@popperjs/core";
import { observer } from "mobx-react-lite";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TGroupedIssues,
  TIssue,
  TIssueKanbanFilters,
  TIssueMap,
} from "@plane/types";
// hooks
import { Spinner } from "@plane/ui";
import { CalendarHeader, CalendarIssueBlocks, CalendarWeekDays, CalendarWeekHeader } from "@/components/issues";
import { MONTHS_LIST } from "@/constants/calendar";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { cn } from "@/helpers/common.helper";
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { useIssues, useUser } from "@/hooks/store";
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import useSize from "@/hooks/use-window-size";
// components
// ui
// types
import { ICycleIssuesFilter } from "@/store/issue/cycle";
import { IModuleIssuesFilter } from "@/store/issue/module";
import { IProjectIssuesFilter } from "@/store/issue/project";
import { IProjectViewIssuesFilter } from "@/store/issue/project-views";
import type { ICalendarWeek } from "./types";
// helpers
// constants

type Props = {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
  issues: TIssueMap | undefined;
  groupedIssueIds: TGroupedIssues;
  layout: "month" | "week" | undefined;
  showWeekends: boolean;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement, placement?: Placement) => React.ReactNode;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  viewId?: string;
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
    quickActions,
    quickAddCallback,
    addIssuesToView,
    viewId,
    updateFilters,
    readOnly = false,
  } = props;
  // states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // store hooks
  const {
    issues: { viewFlags },
  } = useIssues(EIssuesStoreType.PROJECT);
  const issueCalendarView = useCalendarView();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const [windowWidth] = useSize();

  const { enableIssueCreation } = viewFlags || {};
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const calendarPayload = issueCalendarView.calendarPayload;

  const allWeeksOfActiveMonth = issueCalendarView.allWeeksOfActiveMonth;

  const formattedDatePayload = renderFormattedPayloadDate(selectedDate) ?? undefined;

  if (!calendarPayload || !formattedDatePayload)
    return (
      <div className="grid h-full w-full place-items-center">
        <Spinner />
      </div>
    );

  const issueIdList = groupedIssueIds ? groupedIssueIds[formattedDatePayload] : null;

  return (
    <>
      <div className="flex h-full w-full flex-col overflow-hidden">
        <CalendarHeader
          setSelectedDate={setSelectedDate}
          issuesFilterStore={issuesFilterStore}
          updateFilters={updateFilters}
        />
        <div
          className={cn("flex md:h-full w-full flex-col overflow-y-auto", {
            "vertical-scrollbar scrollbar-lg": windowWidth > 768,
          })}
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
                      issuesFilterStore={issuesFilterStore}
                      key={weekIndex}
                      week={week}
                      issues={issues}
                      groupedIssueIds={groupedIssueIds}
                      enableQuickIssueCreate
                      disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
                      quickActions={quickActions}
                      quickAddCallback={quickAddCallback}
                      addIssuesToView={addIssuesToView}
                      viewId={viewId}
                      readOnly={readOnly}
                    />
                  ))}
              </div>
            )}
            {layout === "week" && (
              <CalendarWeekDays
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                issuesFilterStore={issuesFilterStore}
                week={issueCalendarView.allDaysOfActiveWeek}
                issues={issues}
                groupedIssueIds={groupedIssueIds}
                enableQuickIssueCreate
                disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
                quickActions={quickActions}
                quickAddCallback={quickAddCallback}
                addIssuesToView={addIssuesToView}
                viewId={viewId}
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
              issues={issues}
              issueIdList={issueIdList}
              quickActions={quickActions}
              enableQuickIssueCreate
              disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
              quickAddCallback={quickAddCallback}
              addIssuesToView={addIssuesToView}
              viewId={viewId}
              readOnly={readOnly}
              isDragDisabled
              isMobileView
            />
          </div>
        </div>
      </div>
    </>
  );
});
