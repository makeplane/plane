import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// constants
import { DAYS_LIST } from "constants/calendar";

type Props = {};

export const CalendarWeekHeader: React.FC<Props> = observer((props) => {
  const { issueFilter: issueFilterStore } = useMobxStore();

  const showWeekends = issueFilterStore.userDisplayFilters.calendar?.show_weekends ?? false;

  return (
    <div
      className={`grid text-sm font-medium divide-x-[0.5px] divide-custom-border-200 ${
        showWeekends ? "grid-cols-7" : "grid-cols-5"
      }`}
    >
      {Object.values(DAYS_LIST).map((day) => {
        if (!showWeekends && (day.shortTitle === "Sat" || day.shortTitle === "Sun")) return null;

        return (
          <div key={day.shortTitle} className="h-11 bg-custom-background-80 flex items-center px-4">
            {day.shortTitle}
          </div>
        );
      })}
    </div>
  );
});
