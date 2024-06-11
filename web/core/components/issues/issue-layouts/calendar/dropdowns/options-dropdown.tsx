"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
import { Check, ChevronUp, MoreVerticalIcon } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
// hooks
// ui
// icons
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TCalendarLayouts,
  TIssueKanbanFilters,
} from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
// types
// constants
import { CALENDAR_LAYOUTS } from "@/constants/calendar";
import { EIssueFilterType } from "@/constants/issue";
import { useCalendarView } from "@/hooks/store";
import useSize from "@/hooks/use-window-size";
import { ICycleIssuesFilter } from "@/store/issue/cycle";
import { IModuleIssuesFilter } from "@/store/issue/module";
import { IProjectIssuesFilter } from "@/store/issue/project";
import { IProjectViewIssuesFilter } from "@/store/issue/project-views";

interface ICalendarHeader {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
  updateFilters?: (
    projectId: string,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
  ) => Promise<void>;
}

export const CalendarOptionsDropdown: React.FC<ICalendarHeader> = observer((props) => {
  const { issuesFilterStore, updateFilters } = props;

  const { projectId } = useParams();

  const issueCalendarView = useCalendarView();
  const [windowWidth] = useSize();

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

  const calendarLayout = issuesFilterStore.issueFilters?.displayFilters?.calendar?.layout ?? "month";
  const showWeekends = issuesFilterStore.issueFilters?.displayFilters?.calendar?.show_weekends ?? false;

  const handleLayoutChange = (layout: TCalendarLayouts, closePopover: any) => {
    if (!projectId || !updateFilters) return;

    updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, {
      calendar: {
        ...issuesFilterStore.issueFilters?.displayFilters?.calendar,
        layout,
      },
    });

    issueCalendarView.updateCalendarPayload(
      layout === "month"
        ? issueCalendarView.calendarFilters.activeMonthDate
        : issueCalendarView.calendarFilters.activeWeekDate
    );
    if (windowWidth <= 768) closePopover(); // close the popover on mobile
  };

  const handleToggleWeekends = () => {
    const showWeekends = issuesFilterStore.issueFilters?.displayFilters?.calendar?.show_weekends ?? false;

    if (!projectId || !updateFilters) return;

    updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, {
      calendar: {
        ...issuesFilterStore.issueFilters?.displayFilters?.calendar,
        show_weekends: !showWeekends,
      },
    });
  };

  return (
    <Popover className="relative flex items-center">
      {({ open, close: closePopover }) => (
        <>
          <Popover.Button as={React.Fragment}>
            <button type="button" ref={setReferenceElement}>
              <div
                className={`hidden md:flex items-center gap-1.5 rounded bg-custom-background-80 px-2.5 py-1 text-xs outline-none hover:bg-custom-background-80 ${
                  open ? "text-custom-text-100" : "text-custom-text-200"
                }`}
              >
                <div className="font-medium">Options</div>
                <div
                  className={`flex h-3.5 w-3.5 items-center justify-center transition-all ${open ? "" : "rotate-180"}`}
                >
                  <ChevronUp width={12} strokeWidth={2} />
                </div>
              </div>
              <div className="md:hidden">
                <MoreVerticalIcon className="h-4 text-custom-text-200" strokeWidth={2} />
              </div>
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
                className="absolute right-0 z-10 mt-1 min-w-[12rem] overflow-hidden rounded border border-custom-border-200 bg-custom-background-100 p-1 shadow-custom-shadow-sm"
              >
                <div>
                  {Object.entries(CALENDAR_LAYOUTS).map(([layout, layoutDetails]) => (
                    <button
                      key={layout}
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded px-1 py-1.5 text-left text-xs hover:bg-custom-background-80"
                      onClick={() => handleLayoutChange(layoutDetails.key, closePopover)}
                    >
                      {layoutDetails.title}
                      {calendarLayout === layout && <Check size={12} strokeWidth={2} />}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded px-1 py-1.5 text-left text-xs hover:bg-custom-background-80"
                    onClick={handleToggleWeekends}
                  >
                    Show weekends
                    <ToggleSwitch
                      value={showWeekends}
                      onChange={() => {
                        if (windowWidth <= 768) closePopover(); // close the popover on mobile
                      }}
                    />
                  </button>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
});
