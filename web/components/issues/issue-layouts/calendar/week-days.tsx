import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarDayTile } from "components/issues";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// types
import { ICalendarDate, ICalendarWeek } from "./types";

type Props = {
  week: ICalendarWeek;
};

export const CalendarWeekDays: React.FC<Props> = observer((props) => {
  const { week } = props;

  const { issueFilter: issueFilterStore } = useMobxStore();

  const calendarLayout = issueFilterStore.userDisplayFilters.calendar?.layout ?? "month";
  const showWeekends = issueFilterStore.userDisplayFilters.calendar?.show_weekends ?? false;

  return (
    <div
      className={`grid divide-x-[0.5px] divide-y-[0.5px] divide-custom-border-200 ${
        showWeekends ? "grid-cols-7" : "grid-cols-5"
      } ${calendarLayout === "month" ? "" : "h-full"}`}
    >
      {Object.values(week).map((date: ICalendarDate) => {
        if (!showWeekends && (date.date.getDay() === 0 || date.date.getDay() === 6)) return null;

        return <CalendarDayTile key={renderDateFormat(date.date)} date={date} />;
      })}
    </div>
  );
});
