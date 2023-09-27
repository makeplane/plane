import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

// components
import { CalendarDayTile, CalendarHeader, CalendarWeekHeader } from "components/issues";
// ui
import { Spinner } from "components/ui";
// icons
import { ICalendarPayload, ICalendarWeek, generateCalendarData } from "./data";
// constants
import { renderDateFormat } from "helpers/date-time.helper";

type Props = {};

export const CalendarChart: React.FC<Props> = observer((props) => {
  const {} = props;

  const [calendarPayload, setCalendarPayload] = useState<ICalendarPayload | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issue: issueStore, issueFilter: issueFilterStore } = useMobxStore();

  const activeMonth = issueFilterStore.userDisplayFilters.calendar?.active_month;
  const showWeekends = issueFilterStore.userDisplayFilters.calendar?.show_weekends ?? false;

  // generate calendar payload
  useEffect(() => {
    console.log("Active month changed");

    let activeMonthDate = new Date();

    if (activeMonth) activeMonthDate = new Date(activeMonth);

    setCalendarPayload(
      generateCalendarData(calendarPayload, activeMonthDate.getFullYear(), activeMonthDate.getMonth(), 5)
    );
  }, [activeMonth, calendarPayload]);

  // set active month if not set
  useEffect(() => {
    if (!activeMonth) {
      const today = new Date();
      const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        display_filters: {
          calendar: {
            active_month: renderDateFormat(firstDayOfCurrentMonth),
          },
        },
      });
    }
  }, [activeMonth, issueFilterStore, projectId, workspaceSlug]);

  if (!calendarPayload || !issueStore.getIssues || !activeMonth)
    return (
      <div className="h-full w-full grid place-items-center">
        <Spinner />
      </div>
    );

  const activeMonthDate = new Date(activeMonth);

  console.log("calendarPayload", calendarPayload);

  console.log("activeMonthPayload", calendarPayload[activeMonthDate.getFullYear()][activeMonthDate.getMonth()]);

  return (
    <>
      <div className="h-full w-full flex flex-col overflow-hidden">
        <CalendarHeader />
        <CalendarWeekHeader />
        {calendarPayload[activeMonthDate.getFullYear()][activeMonthDate.getMonth()] ? (
          <div className="h-full w-full overflow-y-auto">
            {Object.values(calendarPayload[activeMonthDate.getFullYear()][activeMonthDate.getMonth()]).map(
              (week: ICalendarWeek, weekIndex) => (
                <div
                  key={weekIndex}
                  className={`grid divide-x-[0.5px] divide-y-[0.5px] divide-custom-border-200 ${
                    showWeekends ? "grid-cols-7" : "grid-cols-5"
                  }`}
                >
                  {Object.values(week).map((date, index: number) => {
                    if (!showWeekends && (index === 5 || index === 6)) return null;

                    return <CalendarDayTile key={date ? renderDateFormat(date.date) : ""} date={date} />;
                  })}
                </div>
              )
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
