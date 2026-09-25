/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@makeplane/propel/components/menu";
import { ChevronUpOutline, MoreVerticalOutline } from "@makeplane/propel/icons";
// plane imports
import type { TSupportedFilterTypeForUpdate } from "@plane/constants";
import { CALENDAR_LAYOUTS, EIssueFilterType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TCalendarLayouts, TSupportedFilterForUpdate } from "@plane/types";
// hooks
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import useSize from "@/hooks/use-window-size";
import type { ICycleIssuesFilter } from "@/store/issue/cycle";
import type { IModuleIssuesFilter } from "@/store/issue/module";
import type { IProjectIssuesFilter } from "@/store/issue/project";
import type { IProjectViewIssuesFilter } from "@/store/issue/project-views";

interface ICalendarHeader {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
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

  // states
  const [isOpen, setIsOpen] = useState(false);

  // derived values
  const isMobile = windowWidth <= 768;

  const calendarLayout = issuesFilterStore.issueFilters?.displayFilters?.calendar?.layout ?? "month";
  const showWeekends = issuesFilterStore.issueFilters?.displayFilters?.calendar?.show_weekends ?? false;

  const handleLayoutChange = (layout: TCalendarLayouts) => {
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
  };

  const handleToggleWeekends = () => {
    if (!updateFilters) return;

    void updateFilters(projectId?.toString(), EIssueFilterType.DISPLAY_FILTERS, {
      calendar: {
        ...issuesFilterStore.issueFilters?.displayFilters?.calendar,
        show_weekends: !showWeekends,
      },
    });
  };

  return (
    // A single-choice layout group plus a standalone toggle, so Menu rows rather than a Select,
    // whose one selection axis cannot hold both.
    <Menu open={isOpen} onOpenChange={setIsOpen}>
      <MenuTrigger
        aria-label={t("common.options")}
        render={
          <button type="button">
            <div
              className={`hidden items-center gap-1.5 rounded-sm bg-layer-1 px-2.5 py-1 text-11 outline-none hover:bg-layer-1 md:flex ${
                isOpen ? "text-primary" : "text-secondary"
              }`}
            >
              <div className="font-medium">{t("common.options")}</div>
              <div
                className={`flex h-3.5 w-3.5 items-center justify-center transition-all ${isOpen ? "" : "rotate-180"}`}
              >
                <ChevronUpOutline width={12} />
              </div>
            </div>
            <div className="md:hidden">
              <MoreVerticalOutline className="h-4 text-secondary" />
            </div>
          </button>
        }
      />
      <MenuContent side="bottom" align="end" collisionPadding={12}>
        {/* `marker="radio"` because the weekends checkbox shares this popup. Mobile still closes the
            panel on a pick, as the legacy `closePopover` call did. */}
        <MenuRadioGroup
          marker="radio"
          value={calendarLayout}
          onValueChange={(value) => handleLayoutChange(value as TCalendarLayouts)}
        >
          {Object.entries(CALENDAR_LAYOUTS).map(([layout, layoutDetails]) => (
            <MenuRadioItem key={layout} value={layout} label={layoutDetails.title} closeOnClick={isMobile} />
          ))}
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuCheckboxItem
          label={t("common.actions.show_weekends")}
          checked={showWeekends}
          onCheckedChange={handleToggleWeekends}
          closeOnClick={isMobile}
        />
      </MenuContent>
    </Menu>
  );
});
