import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarHeader, CalendarWeekDays, CalendarWeekHeader } from "components/issues";
// ui
import { Spinner } from "components/ui";
// helpers
import { getWeekNumberOfDate } from "helpers/date-time.helper";
// types
import { ICalendarWeek } from "./types";

export const CalendarChart: React.FC = observer(() => {
  const { issue: issueStore, issueFilter: issueFilterStore, calendar: calendarStore } = useMobxStore();

  const activeMonthDate = calendarStore.calendarFilters.activeMonthDate;
  const activeWeekDate = calendarStore.calendarFilters.activeWeekDate;

  const calendarLayout = issueFilterStore.userDisplayFilters.calendar?.layout ?? "month";
  const calendarPayload = calendarStore.calendarPayload;

  if (!calendarPayload || !issueStore.getIssues)
    return (
      <div className="h-full w-full grid place-items-center">
        <Spinner />
      </div>
    );

  console.log("calendarPayload", calendarPayload);

  // console.log("activeMonthDate", activeMonthDate);
  // console.log("activeWeekDate", activeWeekDate);

  const activeWeekNumber = getWeekNumberOfDate(activeWeekDate);

  // console.log("activeWeekNumber", activeWeekNumber);

  const activeMonthAllWeeks = calendarPayload[activeMonthDate.getFullYear()][activeMonthDate.getMonth()];
  const activeWeekAllDays = calendarPayload[activeWeekDate.getFullYear()][activeWeekDate.getMonth()][activeWeekNumber];

  return (
    <>
      <div className="h-full w-full flex flex-col overflow-hidden">
        <CalendarHeader />
        <CalendarWeekHeader />
        {activeMonthAllWeeks ? (
          <div className="h-full w-full overflow-y-auto">
            {calendarLayout === "month" ? (
              <div className="h-full w-full grid grid-cols-1">
                {Object.values(activeMonthAllWeeks).map((week: ICalendarWeek, weekIndex) => (
                  <CalendarWeekDays key={weekIndex} week={week} />
                ))}
              </div>
            ) : (
              <CalendarWeekDays week={activeWeekAllDays} />
            )}
          </div>
        ) : (
          <div className="h-full w-full grid place-items-center">
            <Spinner />
          </div>
        )}
      </div>
    </>
  );
});
