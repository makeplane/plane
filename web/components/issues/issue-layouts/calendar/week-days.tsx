import { observer } from "mobx-react-lite";
// components
import { CalendarDayTile } from "components/issues";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// types
import { ICalendarDate, ICalendarWeek } from "./types";
import { TGroupedIssues, TIssue, TIssueMap } from "@plane/types";
import { ICycleIssuesFilter } from "store/issue/cycle";
import { IModuleIssuesFilter } from "store/issue/module";
import { IProjectIssuesFilter } from "store/issue/project";
import { IProjectViewIssuesFilter } from "store/issue/project-views";

type Props = {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
  issues: TIssueMap | undefined;
  groupedIssueIds: TGroupedIssues;
  week: ICalendarWeek | undefined;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  enableQuickIssueCreate?: boolean;
  disableIssueCreation?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
};

export const CalendarWeekDays: React.FC<Props> = observer((props) => {
  const {
    issuesFilterStore,
    issues,
    groupedIssueIds,
    week,
    quickActions,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    viewId,
  } = props;

  const calendarLayout = issuesFilterStore?.issueFilters?.displayFilters?.calendar?.layout ?? "month";
  const showWeekends = issuesFilterStore?.issueFilters?.displayFilters?.calendar?.show_weekends ?? false;

  if (!week) return null;

  return (
    <div
      className={`grid divide-x-[0.5px] divide-custom-border-200 ${showWeekends ? "grid-cols-7" : "grid-cols-5"} ${
        calendarLayout === "month" ? "" : "h-full"
      }`}
    >
      {Object.values(week).map((date: ICalendarDate) => {
        if (!showWeekends && (date.date.getDay() === 0 || date.date.getDay() === 6)) return null;

        return (
          <CalendarDayTile
            issuesFilterStore={issuesFilterStore}
            key={renderFormattedPayloadDate(date.date)}
            date={date}
            issues={issues}
            groupedIssueIds={groupedIssueIds}
            quickActions={quickActions}
            enableQuickIssueCreate={enableQuickIssueCreate}
            disableIssueCreation={disableIssueCreation}
            quickAddCallback={quickAddCallback}
            viewId={viewId}
          />
        );
      })}
    </div>
  );
});
