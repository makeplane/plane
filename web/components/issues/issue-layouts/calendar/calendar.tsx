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
};

export const CalendarChart: React.FC<Props> = observer((props) => {
  const { issues } = props;

  const { calendar: calendarStore, issueFilter: issueFilterStore } = useMobxStore();

  const calendarLayout = issueFilterStore.userDisplayFilters.calendar?.layout ?? "month";
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
          {calendarLayout === "month" ? (
            <div className="h-full w-full grid grid-cols-1">
              {allWeeksOfActiveMonth &&
                Object.values(allWeeksOfActiveMonth).map((week: ICalendarWeek, weekIndex) => (
                  <CalendarWeekDays key={weekIndex} week={week} issues={issues} />
                ))}
            </div>
          ) : (
            <CalendarWeekDays week={calendarStore.allDaysOfActiveWeek} issues={issues} />
          )}
        </div>
      </div>
    </>
  );
});
