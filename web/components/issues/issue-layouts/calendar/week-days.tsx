import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarDayTile } from "components/issues";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// types
import { ICalendarDate, ICalendarWeek } from "./types";
import { IIssue } from "types";
import { EIssueActions } from "../types";
import { IGroupedIssues, IIssueResponse } from "store/issues/types";

type Props = {
  issues: IIssueResponse | undefined;
  groupedIssueIds: IGroupedIssues;
  week: ICalendarWeek | undefined;
  handleIssues: (date: string, issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue) => React.ReactNode;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  viewId?: string;
};

export const CalendarWeekDays: React.FC<Props> = observer((props) => {
  const {
    issues,
    groupedIssueIds,
    week,
    handleIssues,
    quickActions,
    enableQuickIssueCreate,
    quickAddCallback,
    viewId,
  } = props;

  const { issueFilter: issueFilterStore } = useMobxStore();

  const calendarLayout = issueFilterStore.userDisplayFilters.calendar?.layout ?? "month";
  const showWeekends = issueFilterStore.userDisplayFilters.calendar?.show_weekends ?? false;

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
            key={renderDateFormat(date.date)}
            date={date}
            issues={issues}
            groupedIssueIds={groupedIssueIds}
            handleIssues={handleIssues}
            quickActions={quickActions}
            enableQuickIssueCreate={enableQuickIssueCreate}
            quickAddCallback={quickAddCallback}
            viewId={viewId}
          />
        );
      })}
    </div>
  );
});
