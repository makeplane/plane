import { observer } from "mobx-react";

// components
import type { TSupportedFilterTypeForUpdate } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronLeftIcon, ChevronRightIcon } from "@plane/propel/icons";
import type { TSupportedFilterForUpdate } from "@plane/types";
import { Row } from "@plane/ui";
// icons
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import type { IProjectEpicsFilter } from "@/plane-web/store/issue/epic";
import type { ICycleIssuesFilter } from "@/store/issue/cycle";
import type { IModuleIssuesFilter } from "@/store/issue/module";
import type { IProjectIssuesFilter } from "@/store/issue/project";
import type { IProjectViewIssuesFilter } from "@/store/issue/project-views";
import { CalendarMonthsDropdown, CalendarOptionsDropdown } from "./dropdowns";

interface ICalendarHeader {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
  updateFilters?: (
    projectId: string,
    filterType: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate
  ) => Promise<void>;
  setSelectedDate: (date: Date) => void;
}

export const CalendarHeader = observer(function CalendarHeader(props: ICalendarHeader) {
  const { issuesFilterStore, updateFilters, setSelectedDate } = props;

  const { t } = useTranslation();

  const issueCalendarView = useCalendarView();

  const calendarLayout = issuesFilterStore.issueFilters?.displayFilters?.calendar?.layout ?? "month";

  const { activeMonthDate, activeWeekDate } = issueCalendarView.calendarFilters;

  const handlePrevious = () => {
    if (calendarLayout === "month") {
      const previousMonthYear =
        activeMonthDate.getMonth() === 0 ? activeMonthDate.getFullYear() - 1 : activeMonthDate.getFullYear();
      const previousMonthMonth = activeMonthDate.getMonth() === 0 ? 11 : activeMonthDate.getMonth() - 1;

      const previousMonthFirstDate = new Date(previousMonthYear, previousMonthMonth, 1);

      issueCalendarView.updateCalendarFilters({
        activeMonthDate: previousMonthFirstDate,
      });
    } else {
      const previousWeekDate = new Date(
        activeWeekDate.getFullYear(),
        activeWeekDate.getMonth(),
        activeWeekDate.getDate() - 7
      );

      issueCalendarView.updateCalendarFilters({
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

      issueCalendarView.updateCalendarFilters({
        activeMonthDate: nextMonthFirstDate,
      });
    } else {
      const nextWeekDate = new Date(
        activeWeekDate.getFullYear(),
        activeWeekDate.getMonth(),
        activeWeekDate.getDate() + 7
      );

      issueCalendarView.updateCalendarFilters({
        activeWeekDate: nextWeekDate,
      });
    }
  };

  const handleToday = () => {
    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    issueCalendarView.updateCalendarFilters({
      activeMonthDate: firstDayOfCurrentMonth,
      activeWeekDate: today,
    });
    setSelectedDate(today);
  };

  return (
    <Row className="mb-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <button type="button" className="grid place-items-center" onClick={handlePrevious}>
          <ChevronLeftIcon height={16} width={16} strokeWidth={2} />
        </button>
        <button type="button" className="grid place-items-center" onClick={handleNext}>
          <ChevronRightIcon height={16} width={16} strokeWidth={2} />
        </button>
        <CalendarMonthsDropdown issuesFilterStore={issuesFilterStore} />
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="rounded-sm bg-layer-transparent hover:bg-layer-transparent-hover px-2.5 py-1 text-11 font-medium text-secondary  hover:text-primary"
          onClick={handleToday}
        >
          {t("common.today")}
        </button>
        <CalendarOptionsDropdown issuesFilterStore={issuesFilterStore} updateFilters={updateFilters} />
      </div>
    </Row>
  );
});
