import { observer } from "mobx-react-lite";
// hooks
import { useIssues, useUser } from "hooks/store";
// components
import { CalendarHeader, CalendarWeekDays, CalendarWeekHeader } from "components/issues";
// ui
import { Spinner } from "@plane/ui";
// types
import { ICalendarWeek } from "./types";
import { TGroupedIssues, TIssue, TIssueMap } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";
import { useCalendarView } from "hooks/store/use-calendar-view";
import { EIssuesStoreType } from "constants/issue";
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
  viewId?: string;
};

export const CalendarChart: React.FC<Props> = observer((props) => {
  const { issuesFilterStore, issues, groupedIssueIds, layout, showWeekends, quickActions, quickAddCallback, viewId } =
    props;
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
        <CalendarHeader issuesFilterStore={issuesFilterStore} viewId={viewId} />
        <CalendarWeekHeader isLoading={!issues} showWeekends={showWeekends} />
        <div className="h-full w-full overflow-y-auto">
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
                    viewId={viewId}
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
              viewId={viewId}
            />
          )}
        </div>
      </div>
    </>
  );
});
