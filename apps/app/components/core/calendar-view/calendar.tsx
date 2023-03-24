import React, { useState } from "react";
import {
  startOfMonth,
  lastDayOfMonth,
  startOfWeek,
  lastDayOfWeek,
  eachDayOfInterval,
  weekDayInterval,
  formatDate,
} from "helpers/calendar.helper";
import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import ReactDatePicker from "react-datepicker";

export const CalendarView = () => {
  const [showWeekEnds, setShowWeekEnds] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const firstDay = startOfMonth(currentDate);
  //   console.log("firstDay : ", firstDay);

  const lastDay = lastDayOfMonth(currentDate);
  //   console.log("lastDay : ", lastDay);

  const startDate = startOfWeek(firstDay);
  //   console.log("startDate : ", startDate);

  const endDate = lastDayOfWeek(lastDay);
  //   console.log("endDate : ", endDate);

  const totalDate = eachDayOfInterval({ start: startDate, end: endDate });
  //   console.log("totalDate : ", totalDate);

  const totalWeekDays = weekDayInterval({ start: startDate, end: endDate });
  //   console.log("totalWeekDays : ", totalWeekDays);

  const weeks = ((date: Date[]) => {
    const weeks = [];
    if (showWeekEnds) {
      for (let day = 0; day <= 6; day++) {
        weeks.push(date[day]);
      }
    } else {
      for (let day = 0; day <= 4; day++) {
        weeks.push(date[day]);
      }
    }

    return weeks;
  })(showWeekEnds ? totalDate : totalWeekDays);

  const currentViewDays = showWeekEnds ? totalDate : totalWeekDays;

  return (
    <div className="h-full overflow-y-auto rounded-lg text-gray-600">
      <div className="mb-6 flex items-center  justify-between">
        <div className="relative flex h-full w-full items-center justify-center text-sm ">
          <Popover className="flex h-full w-full items-center  justify-center rounded-lg">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`group flex h-full w-full items-center gap-1 px-2.5 py-1.5 text-gray-800`}
                >
                  <div className="text-3xl font-semibold">
                    <span className="text-black">{formatDate(currentDate, "Month")}</span>{" "}
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
                  <Popover.Panel className="absolute top-10 left-0 z-20 w-full  transform overflow-hidden">
                    <ReactDatePicker
                      selected={currentDate}
                      onChange={(date) => date && setCurrentDate(date)}
                      dateFormat="MM/yyyy"
                      showMonthYearPicker
                      inline
                    />
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>
        </div>

        <div className="flex w-full items-center justify-end">
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`group flex items-center gap-2 rounded-md border bg-transparent px-3 py-1.5 text-xs hover:bg-gray-100 hover:text-gray-900 focus:outline-none ${
                    open ? "bg-gray-100 text-gray-900" : "text-gray-500"
                  }`}
                >
                  Monthly View
                  <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
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
                  <Popover.Panel className="absolute right-0 z-20 mt-1 w-screen max-w-[260px]  transform overflow-hidden rounded-lg bg-white p-3 text-sm shadow-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-gray-600">Show weekends</h4>
                      <button
                        type="button"
                        className={`relative inline-flex h-3.5 w-6 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showWeekEnds ? "bg-green-500" : "bg-gray-200"
                        }`}
                        role="switch"
                        aria-checked={showWeekEnds}
                        onClick={() => setShowWeekEnds(!showWeekEnds)}
                      >
                        <span className="sr-only">Show weekends</span>
                        <span
                          aria-hidden="true"
                          className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showWeekEnds ? "translate-x-2.5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>
        </div>
      </div>
      <div
        className={`grid auto-rows-[minmax(50px,1fr)] rounded-lg ${
          showWeekEnds ? "grid-cols-7" : "grid-cols-5"
        }`}
      >
        {weeks.map((week, index) => (
          <span
            key={index}
            className={`flex items-center justify-start border-gray-300 bg-gray-100 px-3 py-4 text-left text-base font-medium ${
              showWeekEnds
                ? (index + 1) % 7 === 0
                  ? ""
                  : "border-r"
                : (index + 1) % 5 === 0
                ? ""
                : "border-r"
            }`}
          >
            {formatDate(week, "eee")}
          </span>
        ))}
      </div>
      <div
        className={`grid h-full auto-rows-[minmax(170px,1fr)] ${
          showWeekEnds ? "grid-cols-7" : "grid-cols-5"
        } `}
      >
        {currentViewDays.map((d, index) => (
          <div
            key={index}
            className={`flex flex-col gap-1 border-t border-gray-300 px-3 py-4 text-left text-base font-medium ${
              showWeekEnds
                ? (index + 1) % 7 === 0
                  ? ""
                  : "border-r"
                : (index + 1) % 5 === 0
                ? ""
                : "border-r"
            }`}
          >
            <span>{formatDate(d, "d")}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
