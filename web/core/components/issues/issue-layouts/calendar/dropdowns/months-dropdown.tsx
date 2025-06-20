import React, { useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
//hooks
// icons
// constants
import { getDate } from "@plane/utils";
import { MONTHS_LIST } from "@/constants/calendar";
import { useCalendarView } from "@/hooks/store";
import { IProjectEpicsFilter } from "@/plane-web/store/issue/epic";
import { ICycleIssuesFilter } from "@/store/issue/cycle";
import { IModuleIssuesFilter } from "@/store/issue/module";
import { IProjectIssuesFilter } from "@/store/issue/project";
import { IProjectViewIssuesFilter } from "@/store/issue/project-views";
// helpers

interface Props {
  issuesFilterStore:
    | IProjectIssuesFilter
    | IModuleIssuesFilter
    | ICycleIssuesFilter
    | IProjectViewIssuesFilter
    | IProjectEpicsFilter;
}
export const CalendarMonthsDropdown: React.FC<Props> = observer((props: Props) => {
  const { issuesFilterStore } = props;

  const issueCalendarView = useCalendarView();

  const calendarLayout = issuesFilterStore.issueFilters?.displayFilters?.calendar?.layout ?? "month";

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "auto",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  const { activeMonthDate } = issueCalendarView.calendarFilters;

  const getWeekLayoutHeader = (): string => {
    const allDaysOfActiveWeek = issueCalendarView.allDaysOfActiveWeek;

    if (!allDaysOfActiveWeek) return "Week view";

    const daysList = Object.keys(allDaysOfActiveWeek);

    const firstDay = getDate(daysList[0]);
    const lastDay = getDate(daysList[daysList.length - 1]);

    if (!firstDay || !lastDay) return "Week view";

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
    issueCalendarView.updateCalendarFilters({
      activeMonthDate: date,
    });
  };

  return (
    <Popover className="relative">
      <Popover.Button as={React.Fragment}>
        <button
          type="button"
          ref={setReferenceElement}
          className="text-xl font-semibold outline-none"
          disabled={calendarLayout === "week"}
        >
          {calendarLayout === "month"
            ? `${MONTHS_LIST[activeMonthDate.getMonth() + 1].title} ${activeMonthDate.getFullYear()}`
            : getWeekLayoutHeader()}
        </button>
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
        <Popover.Panel className="fixed z-50">
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="w-56 divide-y divide-custom-border-200 rounded border border-custom-border-200 bg-custom-background-100 p-3 shadow-custom-shadow-rg"
          >
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
            <div className="grid grid-cols-4 items-stretch justify-items-stretch gap-4 pt-3">
              {Object.values(MONTHS_LIST).map((month, index) => (
                <button
                  key={month.shortTitle}
                  type="button"
                  className="rounded py-0.5 text-xs hover:bg-custom-background-80"
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
