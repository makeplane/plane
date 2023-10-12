import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarHeader, CalendarWeekDays, CalendarWeekHeader } from "components/issues";
// ui
import { Spinner } from "components/ui";
// types
import { ICalendarWeek } from "./types";
import { IIssueGroupedStructure } from "store/issue";

type Props = {
  issues: IIssueGroupedStructure | null;
  layout: "month" | "week" | undefined;
  enableQuickIssueCreate?: boolean;
};

export const CalendarChart: React.FC<Props> = observer((props) => {
  const { issues, layout, enableQuickIssueCreate } = props;

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
        <CalendarWeekHeader />
        <div className="h-full w-full overflow-y-auto">
          {layout === "month" ? (
            <div className="h-full w-full grid grid-cols-1 divide-y-[0.5px] divide-custom-border-200">
              {allWeeksOfActiveMonth &&
                Object.values(allWeeksOfActiveMonth).map((week: ICalendarWeek, weekIndex) => (
                  <CalendarWeekDays
                    key={weekIndex}
                    week={week}
                    issues={issues}
                    enableQuickIssueCreate={enableQuickIssueCreate}
                  />
                ))}
            </div>
          ) : (
            <CalendarWeekDays
              week={calendarStore.allDaysOfActiveWeek}
              issues={issues}
              enableQuickIssueCreate={enableQuickIssueCreate}
            />
          )}
        </div>
      </div>
    </>
  );
});
