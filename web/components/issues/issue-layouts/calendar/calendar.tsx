import { observer } from "mobx-react-lite";
// hooks
// components
// ui
import { Spinner } from "@plane/ui";
import { CalendarHeader, CalendarWeekDays, CalendarWeekHeader } from "components/issues";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TGroupedIssues, TIssue, TIssueKanbanFilters, TIssueMap } from "@plane/types";
import { ICalendarWeek } from "./types";
// constants
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";
import { EUserProjectRoles } from "constants/project";
import { useIssues, useUser } from "hooks/store";
import { useCalendarView } from "hooks/store/use-calendar-view";
import { ICycleIssuesFilter } from "store/issue/cycle";
import { IModuleIssuesFilter } from "store/issue/module";
import { IProjectIssuesFilter } from "store/issue/project";
import { IProjectViewIssuesFilter } from "store/issue/project-views";

type Props = {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
  issues: TIssueMap | undefined;
  groupedIssueIds: TGroupedIssues;
  layout: "month" | "week" | undefined;
  showWeekends: boolean;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
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
  // store hooks
  const {
    issues: { viewFlags },
  } = useIssues(EIssuesStoreType.PROJECT);
  const issueCalendarView = useCalendarView();
  const {
    membership: { currentProjectRole },
  } = useUser();

  const { enableIssueCreation } = viewFlags || {};
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const calendarPayload = issueCalendarView.calendarPayload;

  const allWeeksOfActiveMonth = issueCalendarView.allWeeksOfActiveMonth;

  if (!calendarPayload)
    return (
      <div className="grid h-full w-full place-items-center">
        <Spinner />
      </div>
    );

  return (
    <>
      <div className="flex h-full w-full flex-col overflow-hidden">
        <CalendarHeader issuesFilterStore={issuesFilterStore} updateFilters={updateFilters} />
        <div className="flex h-full w-full vertical-scrollbar scrollbar-lg flex-col">
          <CalendarWeekHeader isLoading={!issues} showWeekends={showWeekends} />
          <div className="h-full w-full">
            {layout === "month" && (
              <div className="grid h-full w-full grid-cols-1 divide-y-[0.5px] divide-custom-border-200">
                {allWeeksOfActiveMonth &&
                  Object.values(allWeeksOfActiveMonth).map((week: ICalendarWeek, weekIndex) => (
                    <CalendarWeekDays
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
        </div>
      </div>
    </>
  );
});
