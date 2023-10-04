import React from "react";
import { Popover, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// icons
import { ChevronLeft, ChevronRight } from "lucide-react";
// constants
import { MONTHS_LIST } from "constants/calendar";

export const CalendarMonthsDropdown: React.FC = observer(() => {
  const { calendar: calendarStore, issueFilter: issueFilterStore } = useMobxStore();

  const calendarLayout = issueFilterStore.userDisplayFilters.calendar?.layout ?? "month";

  const { activeMonthDate } = calendarStore.calendarFilters;

  const getWeekLayoutHeader = (): string => {
    const allDaysOfActiveWeek = calendarStore.allDaysOfActiveWeek;

    if (!allDaysOfActiveWeek) return "Week view";

    const daysList = Object.keys(allDaysOfActiveWeek);

    const firstDay = new Date(daysList[0]);
    const lastDay = new Date(daysList[daysList.length - 1]);

    if (firstDay.getMonth() === lastDay.getMonth() && firstDay.getFullYear() === lastDay.getFullYear())
      return `${MONTHS_LIST[firstDay.getMonth() + 1].title} ${firstDay.getFullYear()}`;

    if (firstDay.getFullYear() !== lastDay.getFullYear()) {
      return `${MONTHS_LIST[firstDay.getMonth() + 1].shortTitle} ${firstDay.getFullYear()} - ${
        MONTHS_LIST[lastDay.getMonth() + 1].shortTitle
      } ${lastDay.getFullYear()}`;
    } else
      return `${MONTHS_LIST[firstDay.getMonth() + 1].shortTitle} - ${
        MONTHS_LIST[lastDay.getMonth() + 1].shortTitle
      } ${lastDay.getFullYear()}`;
  };

  const handleDateChange = (date: Date) => {
    calendarStore.updateCalendarFilters({
      activeMonthDate: date,
    });
  };

  return (
    <Popover className="relative">
      <Popover.Button className="outline-none text-xl font-semibold" disabled={calendarLayout === "week"}>
        {calendarLayout === "month"
          ? `${MONTHS_LIST[activeMonthDate.getMonth() + 1].title} ${activeMonthDate.getFullYear()}`
          : getWeekLayoutHeader()}
      </Popover.Button>
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel>
          <div className="absolute left-0 z-10 mt-1 bg-custom-background-100 border border-custom-border-200 shadow-custom-shadow-rg rounded w-56 p-3 divide-y divide-custom-border-200">
            <div className="flex items-center justify-between gap-2 pb-3">
              <button
                type="button"
                className="grid place-items-center"
                onClick={() => {
                  const previousYear = new Date(activeMonthDate.getFullYear() - 1, activeMonthDate.getMonth(), 1);
                  handleDateChange(previousYear);
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs">{activeMonthDate.getFullYear()}</span>
              <button
                type="button"
                className="grid place-items-center"
                onClick={() => {
                  const nextYear = new Date(activeMonthDate.getFullYear() + 1, activeMonthDate.getMonth(), 1);
                  handleDateChange(nextYear);
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 items-stretch justify-items-stretch pt-3">
              {Object.values(MONTHS_LIST).map((month, index) => (
                <button
                  key={month.shortTitle}
                  type="button"
                  className="text-xs hover:bg-custom-background-80 rounded py-0.5"
                  onClick={() => {
                    const newDate = new Date(activeMonthDate.getFullYear(), index, 1);
                    handleDateChange(newDate);
                  }}
                >
                  {month.shortTitle}
                </button>
              ))}
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
});
