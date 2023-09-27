import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarHeader, CalendarWeekDays, CalendarWeekHeader } from "components/issues";
// ui
import { Spinner } from "components/ui";
// icons
import { ICalendarPayload, ICalendarWeek, generateCalendarData } from "./data";

type Props = {};

export const CalendarChart: React.FC<Props> = observer((props) => {
  const {} = props;

  const [activeMonthDate, setActiveMonthDate] = useState(new Date());
  const [activeWeekNumber, setActiveWeekNumber] = useState<number | null>(null);
  const [calendarPayload, setCalendarPayload] = useState<ICalendarPayload | null>(null);

  const { issue: issueStore, issueFilter: issueFilterStore } = useMobxStore();

  // generate calendar payload
  useEffect(() => {
    console.log("Generating payload...");

    setCalendarPayload(
      generateCalendarData(calendarPayload, activeMonthDate.getFullYear(), activeMonthDate.getMonth(), 5)
    );
  }, [activeMonthDate, calendarPayload]);

  if (!calendarPayload || !issueStore.getIssues)
    return (
      <div className="h-full w-full grid place-items-center">
        <Spinner />
      </div>
    );

  const calendarLayout = issueFilterStore.userDisplayFilters.calendar?.layout ?? "month";

  console.log("calendarPayload", calendarPayload);

  const activeMonthAllWeeks = calendarPayload[activeMonthDate.getFullYear()][activeMonthDate.getMonth()];

  return (
    <>
      <div className="h-full w-full flex flex-col overflow-hidden">
        <CalendarHeader activeMonthDate={activeMonthDate} setActiveMonthDate={(date) => setActiveMonthDate(date)} />
        <CalendarWeekHeader />
        {activeMonthAllWeeks ? (
          <div className="h-full w-full overflow-y-auto">
            {calendarLayout === "month"
              ? Object.values(activeMonthAllWeeks).map((week: ICalendarWeek, weekIndex) => (
                  <CalendarWeekDays key={weekIndex} activeMonthDate={activeMonthDate} week={week} />
                ))
              : "Week view, boys"}
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
