import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarDayTile } from "components/issues";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// types
import { ICalendarDate, ICalendarWeek } from "./data";

type Props = {
  activeMonthDate: Date;
  week: ICalendarWeek;
};

export const CalendarWeekDays: React.FC<Props> = observer((props) => {
  const { activeMonthDate, week } = props;

  const { issueFilter: issueFilterStore } = useMobxStore();

  const showWeekends = issueFilterStore.userDisplayFilters.calendar?.show_weekends ?? false;

  return (
    <div
      className={`grid divide-x-[0.5px] divide-y-[0.5px] divide-custom-border-200 ${
        showWeekends ? "grid-cols-7" : "grid-cols-5"
      }`}
    >
      {Object.values(week).map((date: ICalendarDate, index) => {
        if (!showWeekends && (index === 5 || index === 6)) return null;

        return <CalendarDayTile key={renderDateFormat(date.date)} activeMonthDate={activeMonthDate} date={date} />;
      })}
    </div>
  );
});
