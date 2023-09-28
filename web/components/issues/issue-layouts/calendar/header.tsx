import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarOptionsDropdown } from "components/issues";
// icons
import { ChevronLeft, ChevronRight } from "lucide-react";
// constants
import { MONTHS_LIST } from "constants/calendar";

export const CalendarHeader: React.FC = observer(() => {
  const { issueFilter: issueFilterStore, calendar: calendarStore } = useMobxStore();

  const calendarLayout = issueFilterStore.userDisplayFilters.calendar?.layout ?? "month";

  const { activeMonthDate, activeWeekDate } = calendarStore.calendarFilters;

  const getWeekLayoutHeader = (): string => {
    const allDaysOfActiveWeek = calendarStore.allDaysOfActiveWeek;

    if (!allDaysOfActiveWeek) return "Week view";

    const daysList = Object.keys(allDaysOfActiveWeek);

    const firstDay = new Date(daysList[0]);
    const lastDay = new Date(daysList[daysList.length - 1]);

    if (firstDay.getMonth() === lastDay.getMonth() && firstDay.getFullYear() === lastDay.getFullYear())
      return `${MONTHS_LIST[firstDay.getMonth() + 1].shortTitle} ${firstDay.getFullYear()}`;

    if (firstDay.getFullYear() !== lastDay.getFullYear()) {
      return `${MONTHS_LIST[firstDay.getMonth() + 1].shortTitle} ${firstDay.getFullYear()} - ${
        MONTHS_LIST[lastDay.getMonth() + 1].shortTitle
      } ${lastDay.getFullYear()}`;
    } else
      return `${MONTHS_LIST[firstDay.getMonth() + 1].shortTitle} - ${
        MONTHS_LIST[lastDay.getMonth() + 1].shortTitle
      } ${lastDay.getFullYear()}`;
  };

  const handlePrevious = () => {
    if (calendarLayout === "month") {
      const previousMonthYear =
        activeMonthDate.getMonth() === 0 ? activeMonthDate.getFullYear() - 1 : activeMonthDate.getFullYear();
      const previousMonthMonth = activeMonthDate.getMonth() === 0 ? 11 : activeMonthDate.getMonth() - 1;

      const previousMonthFirstDate = new Date(previousMonthYear, previousMonthMonth, 1);

      calendarStore.updateCalendarFilters({
        activeMonthDate: previousMonthFirstDate,
      });
    } else {
      const previousWeekDate = new Date(
        activeWeekDate.getFullYear(),
        activeWeekDate.getMonth(),
        activeWeekDate.getDate() - 7
      );

      calendarStore.updateCalendarFilters({
        activeWeekDate: previousWeekDate,
      });
    }
  };

  const handleNext = () => {
    if (calendarLayout === "month") {
      const nextMonthYear =
        activeMonthDate.getMonth() === 11 ? activeMonthDate.getFullYear() + 1 : activeMonthDate.getFullYear();
      const nextMonthMonth = (activeMonthDate.getMonth() + 1) % 12;

      const nextMonthFirstDate = new Date(nextMonthYear, nextMonthMonth, 1);

      calendarStore.updateCalendarFilters({
        activeMonthDate: nextMonthFirstDate,
      });
    } else {
      const nextWeekDate = new Date(
        activeWeekDate.getFullYear(),
        activeWeekDate.getMonth(),
        activeWeekDate.getDate() + 7
      );

      calendarStore.updateCalendarFilters({
        activeWeekDate: nextWeekDate,
      });
    }
  };

  const handleToday = () => {
    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    calendarStore.updateCalendarFilters({
      activeMonthDate: firstDayOfCurrentMonth,
      activeWeekDate: today,
    });
  };

  return (
    <div className="flex items-center justify-between gap-2 px-3 mb-4">
      <div className="flex items-center gap-1.5">
        <button type="button" className="grid place-items-center" onClick={handlePrevious}>
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <h2 className="text-xl font-semibold">
          {calendarLayout === "month"
            ? `${MONTHS_LIST[activeMonthDate.getMonth() + 1].title} ${activeMonthDate.getFullYear()}`
            : getWeekLayoutHeader()}
        </h2>
        <button type="button" className="grid place-items-center" onClick={handleNext}>
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="px-2.5 py-1 text-xs bg-custom-background-80 rounded font-medium"
          onClick={handleToday}
        >
          Today
        </button>
        <CalendarOptionsDropdown />
      </div>
    </div>
  );
});
