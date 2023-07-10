import React from "react";

// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { CustomMenu, ToggleSwitch } from "components/ui";
// icons
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
// helpers
import {
  addMonths,
  addSevenDaysToDate,
  formatDate,
  getCurrentWeekEndDate,
  getCurrentWeekStartDate,
  isSameMonth,
  isSameYear,
  lastDayOfWeek,
  startOfWeek,
  subtract7DaysToDate,
  subtractMonths,
  updateDateWithMonth,
  updateDateWithYear,
} from "helpers/calendar.helper";
// constants
import { MONTHS_LIST, YEARS_LIST } from "constants/calendar";

type Props = {
  isMonthlyView: boolean;
  setIsMonthlyView: React.Dispatch<React.SetStateAction<boolean>>;
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  showWeekEnds: boolean;
  setShowWeekEnds: React.Dispatch<React.SetStateAction<boolean>>;
  changeDateRange: (startDate: Date, endDate: Date) => void;
};

export const CalendarHeader: React.FC<Props> = ({
  setIsMonthlyView,
  isMonthlyView,
  currentDate,
  setCurrentDate,
  showWeekEnds,
  setShowWeekEnds,
  changeDateRange,
}) => {
  const updateDate = (date: Date) => {
    setCurrentDate(date);

    changeDateRange(startOfWeek(date), lastDayOfWeek(date));
  };

  return (
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
                        onClick={() => updateDate(updateDateWithYear(year.label, currentDate))}
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
                  <div className="grid grid-cols-4  border-t border-custom-border-100 px-2">
                    {MONTHS_LIST.map((month) => (
                      <button
                        onClick={() =>
                          updateDate(updateDateWithMonth(`${month.value}`, currentDate))
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
              if (isMonthlyView) {
                updateDate(subtractMonths(currentDate, 1));
              } else {
                setCurrentDate(subtract7DaysToDate(currentDate));
                changeDateRange(
                  getCurrentWeekStartDate(subtract7DaysToDate(currentDate)),
                  getCurrentWeekEndDate(subtract7DaysToDate(currentDate))
                );
              }
            }}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            className="cursor-pointer"
            onClick={() => {
              if (isMonthlyView) {
                updateDate(addMonths(currentDate, 1));
              } else {
                setCurrentDate(addSevenDaysToDate(currentDate));
                changeDateRange(
                  getCurrentWeekStartDate(addSevenDaysToDate(currentDate)),
                  getCurrentWeekEndDate(addSevenDaysToDate(currentDate))
                );
              }
            }}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex w-full items-center justify-end gap-2">
        <button
          className="group flex cursor-pointer items-center gap-2 rounded-md border border-custom-border-100 px-3 py-1 text-sm hover:bg-custom-background-80 hover:text-custom-text-100 focus:outline-none"
          onClick={() => {
            if (isMonthlyView) {
              updateDate(new Date());
            } else {
              setCurrentDate(new Date());
              changeDateRange(
                getCurrentWeekStartDate(new Date()),
                getCurrentWeekEndDate(new Date())
              );
            }
          }}
        >
          Today
        </button>

        <CustomMenu
          customButton={
            <div className="group flex cursor-pointer items-center gap-2 rounded-md border border-custom-border-100 px-3 py-1 text-sm hover:bg-custom-background-80 hover:text-custom-text-100 focus:outline-none ">
              {isMonthlyView ? "Monthly" : "Weekly"}
              <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
            </div>
          }
        >
          <CustomMenu.MenuItem
            onClick={() => {
              setIsMonthlyView(true);
              changeDateRange(startOfWeek(currentDate), lastDayOfWeek(currentDate));
            }}
            className="w-52 text-sm text-custom-text-200"
          >
            <div className="flex w-full max-w-[260px] items-center justify-between gap-2">
              <span className="flex items-center gap-2">Monthly View</span>
              <CheckIcon
                className={`h-4 w-4 flex-shrink-0 ${isMonthlyView ? "opacity-100" : "opacity-0"}`}
              />
            </div>
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem
            onClick={() => {
              setIsMonthlyView(false);
              changeDateRange(
                getCurrentWeekStartDate(currentDate),
                getCurrentWeekEndDate(currentDate)
              );
            }}
            className="w-52 text-sm text-custom-text-200"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="flex items-center gap-2">Weekly View</span>
              <CheckIcon
                className={`h-4 w-4 flex-shrink-0 ${isMonthlyView ? "opacity-0" : "opacity-100"}`}
              />
            </div>
          </CustomMenu.MenuItem>
          <div className="mt-1 flex w-52 items-center justify-between border-t border-custom-border-100 py-2 px-1  text-sm text-custom-text-200">
            <h4>Show weekends</h4>
            <ToggleSwitch value={showWeekEnds} onChange={() => setShowWeekEnds(!showWeekEnds)} />
          </div>
        </CustomMenu>
      </div>
    </div>
  );
};

export default CalendarHeader;
