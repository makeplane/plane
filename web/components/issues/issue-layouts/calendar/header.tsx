import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarOptionsDropdown } from "components/issues";
// icons
import { ChevronLeft, ChevronRight } from "lucide-react";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// constants
import { MONTHS_LIST } from "constants/calendar";

type Props = {};

export const CalendarHeader: React.FC<Props> = observer((props) => {
  const {} = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issueFilter: issueFilterStore } = useMobxStore();

  const handlePreviousMonth = () => {
    const activeMonth = issueFilterStore.userDisplayFilters.calendar?.active_month;

    if (!workspaceSlug || !projectId || !activeMonth) return;

    const activeMonthDate = new Date(activeMonth);

    const previousMonthYear =
      activeMonthDate.getMonth() === 0 ? activeMonthDate.getFullYear() - 1 : activeMonthDate.getFullYear();
    const previousMonthMonth = activeMonthDate.getMonth() === 0 ? 11 : activeMonthDate.getMonth() - 1;

    const previousMonthFirstDate = new Date(previousMonthYear, previousMonthMonth, 1);

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        calendar: {
          ...issueFilterStore.userDisplayFilters.calendar,
          active_month: renderDateFormat(previousMonthFirstDate),
        },
      },
    });
  };

  const handleNextMonth = () => {
    const activeMonth = issueFilterStore.userDisplayFilters.calendar?.active_month;

    if (!workspaceSlug || !projectId || !activeMonth) return;

    const activeMonthDate = new Date(activeMonth);

    const nextMonthYear =
      activeMonthDate.getMonth() === 11 ? activeMonthDate.getFullYear() + 1 : activeMonthDate.getFullYear();
    const nextMonthMonth = (activeMonthDate.getMonth() + 1) % 12;

    const nextMonthFirstDate = new Date(nextMonthYear, nextMonthMonth, 1);

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        calendar: {
          ...issueFilterStore.userDisplayFilters.calendar,
          active_month: renderDateFormat(nextMonthFirstDate),
        },
      },
    });
  };

  const handleToday = () => {
    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    if (!workspaceSlug || !projectId) return;

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        calendar: {
          ...issueFilterStore.userDisplayFilters.calendar,
          active_month: renderDateFormat(firstDayOfCurrentMonth),
        },
      },
    });
  };

  const handleToggleWeekends = () => {
    const showWeekends = issueFilterStore.userDisplayFilters.calendar?.show_weekends ?? false;

    if (!workspaceSlug || !projectId) return;

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        calendar: {
          ...issueFilterStore.userDisplayFilters.calendar,
          show_weekends: !showWeekends,
        },
      },
    });
  };

  const activeMonthDate = new Date(issueFilterStore.userDisplayFilters.calendar?.active_month || new Date());

  return (
    <div className="flex items-center justify-between gap-2 px-3 mb-4">
      <div className="flex items-center gap-1.5">
        <button type="button" className="grid place-items-center" onClick={handlePreviousMonth}>
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <h2 className="text-xl font-semibold">
          {MONTHS_LIST[activeMonthDate.getMonth() + 1].title} {activeMonthDate.getFullYear()}
        </h2>
        <button type="button" className="grid place-items-center" onClick={handleNextMonth}>
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>
      <div className="flex items-center">
        <button
          type="button"
          className="px-2.5 py-1 text-xs hover:bg-custom-background-80 rounded font-medium"
          onClick={handleToday}
        >
          Today
        </button>
        <CalendarOptionsDropdown />
        <button
          type="button"
          className="px-2.5 py-1 text-xs hover:bg-custom-background-80 rounded font-medium"
          onClick={handleToggleWeekends}
        >
          Toggle weekends
        </button>
      </div>
    </div>
  );
});
