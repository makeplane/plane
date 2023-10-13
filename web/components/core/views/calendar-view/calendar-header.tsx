import React from "react";

// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { CustomMenu, ToggleSwitch } from "components/ui";
// icons
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
// helpers
import {
  formatDate,
  isSameMonth,
  isSameYear,
  updateDateWithMonth,
  updateDateWithYear,
} from "helpers/calendar.helper";
// constants
import { MONTHS_LIST, YEARS_LIST } from "constants/calendar";

type Props = {
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  showWeekEnds: boolean;
  setShowWeekEnds: React.Dispatch<React.SetStateAction<boolean>>;
};

export const CalendarHeader: React.FC<Props> = ({
  currentDate,
  setCurrentDate,
  showWeekEnds,
  setShowWeekEnds,
}) => (
  <div className="mb-4 flex items-center justify-between">
    <div className="relative flex h-full w-full items-center justify-start gap-2 text-sm ">
      <Popover className="flex h-full items-center justify-start rounded-lg">
        {({ open }) => (
          <>
            <Popover.Button>
              <div className="flex items-center justify-center gap-2 text-2xl font-semibold text-custom-text-100">
                <span>{formatDate(currentDate, "Month")}</span>{" "}
                <span>{formatDate(currentDate, "yyyy")}</span>
              </div>
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
              <Popover.Panel className="absolute top-10 left-0 z-20 flex w-full max-w-xs transform flex-col overflow-hidden rounded-[10px] bg-custom-background-80 shadow-lg">
                <div className="flex items-center justify-center gap-5 px-2 py-2 text-sm">
                  {YEARS_LIST.map((year) => (
                    <button
                      onClick={() => setCurrentDate(updateDateWithYear(year.label, currentDate))}
                      className={` ${
                        isSameYear(year.value, currentDate)
                          ? "text-sm font-medium text-custom-text-100"
                          : "text-xs text-custom-text-200 "
                      } hover:text-sm hover:font-medium hover:text-custom-text-100`}
                    >
                      {year.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4  border-t border-custom-border-200 px-2">
                  {MONTHS_LIST.map((month) => (
                    <button
                      onClick={() =>
                        setCurrentDate(updateDateWithMonth(`${month.value}`, currentDate))
                      }
                      className={`px-2 py-2 text-xs text-custom-text-200 hover:font-medium hover:text-custom-text-100 ${
                        isSameMonth(`${month.value}`, currentDate)
                          ? "font-medium text-custom-text-100"
                          : ""
                      }`}
                    >
                      {month.label}
                    </button>
                  ))}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>

      <div className="flex items-center gap-2">
        <button
          className="cursor-pointer"
          onClick={() => {
            const previousMonthYear =
              currentDate.getMonth() === 0
                ? currentDate.getFullYear() - 1
                : currentDate.getFullYear();
            const previousMonthMonth =
              currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;

            const previousMonthFirstDate = new Date(previousMonthYear, previousMonthMonth, 1);

            setCurrentDate(previousMonthFirstDate);
          }}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <button
          className="cursor-pointer"
          onClick={() => {
            const nextMonthYear =
              currentDate.getMonth() === 11
                ? currentDate.getFullYear() + 1
                : currentDate.getFullYear();
            const nextMonthMonth = (currentDate.getMonth() + 1) % 12;

            const nextMonthFirstDate = new Date(nextMonthYear, nextMonthMonth, 1);

            setCurrentDate(nextMonthFirstDate);
          }}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>

    <div className="flex w-full items-center justify-end gap-2">
      <button
        className="group flex cursor-pointer items-center gap-2 rounded-md border border-custom-border-200 px-3 py-1 text-sm hover:bg-custom-background-80 hover:text-custom-text-100 focus:outline-none"
        onClick={() => setCurrentDate(new Date())}
      >
        Today
      </button>

      <CustomMenu
        customButton={
          <div className="group flex cursor-pointer items-center gap-2 rounded-md border border-custom-border-200 px-3 py-1 text-sm hover:bg-custom-background-80 hover:text-custom-text-100 focus:outline-none">
            Options
            <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
          </div>
        }
      >
        <div className="flex w-52 items-center justify-between px-1 text-sm text-custom-text-200">
          <h4>Show weekends</h4>
          <ToggleSwitch value={showWeekEnds} onChange={() => setShowWeekEnds(!showWeekEnds)} />
        </div>
      </CustomMenu>
    </div>
  </div>
);

export default CalendarHeader;
