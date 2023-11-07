import { observer } from "mobx-react-lite";

// constants
import { DAYS_LIST } from "constants/calendar";

type Props = {
  isLoading: boolean;
  showWeekends: boolean;
};

export const CalendarWeekHeader: React.FC<Props> = observer((props) => {
  const { isLoading, showWeekends } = props;

  return (
    <div
      className={`relative grid text-sm font-medium divide-x-[0.5px] divide-custom-border-200 ${
        showWeekends ? "grid-cols-7" : "grid-cols-5"
      }`}
    >
      {isLoading && (
        <div className="absolute h-[1.5px] w-3/4 bg-custom-primary-100 animate-[bar-loader_2s_linear_infinite]" />
      )}
      {Object.values(DAYS_LIST).map((day) => {
        if (!showWeekends && (day.shortTitle === "Sat" || day.shortTitle === "Sun")) return null;

        return (
          <div key={day.shortTitle} className="h-11 bg-custom-background-90 flex items-center px-4">
            {day.shortTitle}
          </div>
        );
      })}
    </div>
  );
});
