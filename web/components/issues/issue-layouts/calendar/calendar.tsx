import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarHeader, CalendarWeekDays, CalendarWeekHeader } from "components/issues";
// ui
import { Spinner } from "@plane/ui";
// types
import { ICalendarWeek } from "./types";
import { IIssue } from "types";
import { IGroupedIssues, IIssueResponse } from "store/issues/types";

type Props = {
  issues: IIssueResponse | undefined;
  groupedIssueIds: IGroupedIssues;
  layout: "month" | "week" | undefined;
  showWeekends: boolean;
  quickActions: (issue: IIssue) => React.ReactNode;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  viewId?: string;
};

export const CalendarChart: React.FC<Props> = observer((props) => {
  const { issues, groupedIssueIds, layout, showWeekends, quickActions, quickAddCallback, viewId } = props;

  const { calendar: calendarStore } = useMobxStore();

  const calendarPayload = calendarStore.calendarPayload;

  const allWeeksOfActiveMonth = calendarStore.allWeeksOfActiveMonth;

  if (!calendarPayload)
    return (
      <div className="h-full w-full grid place-items-center">
        <Spinner />
      </div>
    );

  return (
    <>
      <div className="h-full w-full flex flex-col overflow-hidden">
        <CalendarHeader />
        <CalendarWeekHeader isLoading={!issues} showWeekends={showWeekends} />
        <div className="h-full w-full overflow-y-auto">
          {layout === "month" && (
            <div className="h-full w-full grid grid-cols-1 divide-y-[0.5px] divide-custom-border-200">
              {allWeeksOfActiveMonth &&
                Object.values(allWeeksOfActiveMonth).map((week: ICalendarWeek, weekIndex) => (
                  <CalendarWeekDays
                    key={weekIndex}
                    week={week}
                    issues={issues}
                    groupedIssueIds={groupedIssueIds}
                    enableQuickIssueCreate
                    quickActions={quickActions}
                    quickAddCallback={quickAddCallback}
                    viewId={viewId}
                  />
                ))}
            </div>
          )}
          {layout === "week" && (
            <CalendarWeekDays
              week={calendarStore.allDaysOfActiveWeek}
              issues={issues}
              groupedIssueIds={groupedIssueIds}
              enableQuickIssueCreate
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
