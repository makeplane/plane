/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
import { MoreVerticalIcon } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
// constants
import type { TSupportedFilterTypeForUpdate } from "@plane/constants";
import { EIssueFilterType, CALENDAR_LAYOUTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CheckIcon, ChevronUpIcon } from "@plane/propel/icons";
import { Switch } from "@plane/propel/switch";
import type { TCalendarLayouts, TSupportedFilterForUpdate } from "@plane/types";
// hooks
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import useSize from "@/hooks/use-window-size";
import type { ICycleIssuesFilter } from "@/store/work-items/cycle";
import type { IModuleIssuesFilter } from "@/store/work-items/module";
import type { IProjectIssuesFilter } from "@/store/work-items/project";
import type { IProjectViewIssuesFilter } from "@/store/work-items/project-views";
import type { IWorkspaceIssuesFilter } from "@/store/work-items/workspace";

interface ICalendarHeader {
  issuesFilterStore:
    | IProjectIssuesFilter
    | IModuleIssuesFilter
    | ICycleIssuesFilter
    | IProjectViewIssuesFilter
    | IWorkspaceIssuesFilter;
  updateFilters?: (
    projectId: string,
    filterType: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate
  ) => Promise<void>;
}

export const CalendarOptionsDropdown = observer(function CalendarOptionsDropdown(props: ICalendarHeader) {
  const { issuesFilterStore, updateFilters } = props;

  const { t } = useTranslation();

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

  const handleLayoutChange = (layout: TCalendarLayouts, closePopover: () => void) => {
    if (!updateFilters) return;

    void updateFilters(projectId?.toString(), EIssueFilterType.DISPLAY_FILTERS, {
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

  const handleToggleWeekends = (closePopover: () => void) => {
    const showWeekends = issuesFilterStore.issueFilters?.displayFilters?.calendar?.show_weekends ?? false;

    if (!updateFilters) return;

    void updateFilters(projectId?.toString(), EIssueFilterType.DISPLAY_FILTERS, {
      calendar: {
        ...issuesFilterStore.issueFilters?.displayFilters?.calendar,
        show_weekends: !showWeekends,
      },
    });
    if (windowWidth <= 768) closePopover();
  };

  return (
    <Popover className="relative flex items-center">
      {(state) => {
        const closePopover = (): void => state.close();
        const { open } = state;
        return (
          <>
            <Popover.Button as={React.Fragment}>
              <button type="button" ref={setReferenceElement}>
                <div
                  className={`hidden md:flex items-center gap-1.5 rounded-sm bg-layer-1 px-2.5 py-1 text-11 outline-none hover:bg-layer-1 ${
                    open ? "text-primary" : "text-secondary"
                  }`}
                >
                  <div className="font-medium">{t("common.options")}</div>
                  <div
                    className={`flex h-3.5 w-3.5 items-center justify-center transition-all ${open ? "" : "rotate-180"}`}
                  >
                    <ChevronUpIcon width={12} strokeWidth={2} />
                  </div>
                </div>
                <div className="md:hidden">
                  <MoreVerticalIcon className="h-4 text-secondary" strokeWidth={2} />
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
                  className="absolute right-0 z-10 mt-1 min-w-[12rem] overflow-hidden rounded-sm border border-subtle bg-surface-1 p-1 shadow-raised-200"
                >
                  <div>
                    {Object.entries(CALENDAR_LAYOUTS).map(([layout, layoutDetails]) => (
                      <button
                        key={layout}
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-sm px-1 py-1.5 text-left text-11 hover:bg-layer-1"
                        onClick={() => handleLayoutChange(layoutDetails.key, closePopover)}
                      >
                        {layoutDetails.title}
                        {calendarLayout === layout && <CheckIcon width={12} height={12} strokeWidth={2} />}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-sm px-1 py-1.5 text-left text-11 hover:bg-layer-1"
                      onClick={() => handleToggleWeekends(closePopover)}
                    >
                      {t("common.actions.show_weekends")}
                      <Switch value={showWeekends} onChange={() => handleToggleWeekends(closePopover)} />
                    </button>
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        );
      }}
    </Popover>
  );
});
