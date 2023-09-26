import { useEffect, useState } from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarDayTile, CalendarHeader, CalendarWeekHeader } from "components/issues";
// ui
import { Spinner } from "components/ui";
// icons
import { ICalendarDate, ICalendarPayload, ICalendarWeek, generateCalendarData } from "./data";
// constants
import { renderDateFormat } from "helpers/date-time.helper";

type Props = {};

export const CalendarChart: React.FC<Props> = observer((props) => {
  const {} = props;

  const [activeMonthDate, setActiveMonthDate] = useState<Date | null>(null);
  const [showWeekends, setShowWeekends] = useState(false);
  const [calendarPayload, setCalendarPayload] = useState<ICalendarPayload | null>(null);

  const { issue: issueStore } = useMobxStore();

  useEffect(() => {
    if (activeMonthDate !== null) return;

    setActiveMonthDate(new Date());

    setCalendarPayload(generateCalendarData(new Date().getFullYear(), new Date().getMonth(), 1));
  }, []);

  if (!activeMonthDate || !calendarPayload || !issueStore.getIssues)
    return (
      <div className="h-full w-full grid place-items-center">
        <Spinner />
      </div>
    );

  console.log("calendarPayload", calendarPayload);

  return (
    <>
      {
        <div className="h-full w-full flex flex-col overflow-hidden">
          <CalendarHeader
            activeMonthDate={activeMonthDate}
            handleMonthChange={(monthDate) => setActiveMonthDate(monthDate)}
          />
          <CalendarWeekHeader showWeekends={showWeekends} />
          <div className="h-full w-full overflow-y-auto">
            {Object.values(calendarPayload[activeMonthDate.getFullYear()][activeMonthDate.getMonth()]).map(
              (week: ICalendarWeek, weekIndex) => (
                <div key={weekIndex} className={`grid ${showWeekends ? "grid-cols-7" : "grid-cols-5"}`}>
                  {Object.values(week).map((date, index: number) => {
                    if (!showWeekends && (index === 5 || index === 6)) return <></>;

                    return <CalendarDayTile key={date ? renderDateFormat(date.date) : ""} date={date} />;
                  })}
                </div>
              )
            )}
          </div>
        </div>
      }
    </>
  );
});
