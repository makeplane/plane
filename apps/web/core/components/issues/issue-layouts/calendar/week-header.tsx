import { observer } from "mobx-react";
import { EStartOfTheWeek } from "@plane/types";
import { getOrderedDays } from "@plane/utils";
import { DAYS_LIST } from "@/constants/calendar";
// helpers
// hooks
import { useUserProfile } from "@/hooks/store/user";

type Props = {
  isLoading: boolean;
  showWeekends: boolean;
};

export const CalendarWeekHeader = observer(function CalendarWeekHeader(props: Props) {
  const { isLoading, showWeekends } = props;
  // hooks
  const { data } = useUserProfile();
  const startOfWeek = data?.start_of_the_week;

  // derived
  const orderedDays = getOrderedDays(Object.values(DAYS_LIST), (item) => item.value, startOfWeek);

  return (
    <div
      className={`relative sticky top-0 z-[1] grid md:divide-x-[0.5px] divide-subtle-1 text-13 font-medium ${
        showWeekends ? "grid-cols-7" : "grid-cols-5"
      }`}
    >
      {isLoading && (
        <div className="absolute h-[1.5px] w-3/4 animate-[bar-loader_2s_linear_infinite] bg-accent-primary" />
      )}
      {orderedDays.map((day) => {
        if (!showWeekends && (day.value === EStartOfTheWeek.SUNDAY || day.value === EStartOfTheWeek.SATURDAY))
          return null;

        return (
          <div key={day.shortTitle} className="flex h-11 items-center justify-center md:justify-end bg-layer-1 px-4">
            {day.shortTitle}
          </div>
        );
      })}
    </div>
  );
});
