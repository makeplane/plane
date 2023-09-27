import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarOptionsDropdown } from "components/issues";
// icons
import { ChevronLeft, ChevronRight } from "lucide-react";
// constants
import { MONTHS_LIST } from "constants/calendar";

type Props = {
  activeMonthDate: Date;
  setActiveMonthDate: (date: Date) => void;
};

export const CalendarHeader: React.FC<Props> = observer((props) => {
  const { activeMonthDate, setActiveMonthDate } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issueFilter: issueFilterStore } = useMobxStore();

  const handlePreviousMonth = () => {
    if (!workspaceSlug || !projectId) return;

    const previousMonthYear =
      activeMonthDate.getMonth() === 0 ? activeMonthDate.getFullYear() - 1 : activeMonthDate.getFullYear();
    const previousMonthMonth = activeMonthDate.getMonth() === 0 ? 11 : activeMonthDate.getMonth() - 1;

    const previousMonthFirstDate = new Date(previousMonthYear, previousMonthMonth, 1);

    setActiveMonthDate(previousMonthFirstDate);
  };

  const handleNextMonth = () => {
    if (!workspaceSlug || !projectId) return;

    const nextMonthYear =
      activeMonthDate.getMonth() === 11 ? activeMonthDate.getFullYear() + 1 : activeMonthDate.getFullYear();
    const nextMonthMonth = (activeMonthDate.getMonth() + 1) % 12;

    const nextMonthFirstDate = new Date(nextMonthYear, nextMonthMonth, 1);

    setActiveMonthDate(nextMonthFirstDate);
  };

  const handleToday = () => {
    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    if (!workspaceSlug || !projectId) return;

    setActiveMonthDate(firstDayOfCurrentMonth);
  };

  const calendarLayout = issueFilterStore.userDisplayFilters.calendar?.layout ?? "month";

  return (
    <div className="flex items-center justify-between gap-2 px-3 mb-4">
      <div className="flex items-center gap-1.5">
        <button type="button" className="grid place-items-center" onClick={handlePreviousMonth}>
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <h2 className="text-xl font-semibold">
          {calendarLayout === "month"
            ? `${MONTHS_LIST[activeMonthDate.getMonth() + 1].title} ${activeMonthDate.getFullYear()}`
            : "Week view"}
        </h2>
        <button type="button" className="grid place-items-center" onClick={handleNextMonth}>
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="px-2.5 py-1 text-xs bg-custom-background-80 rounded font-medium"
          onClick={handleToday}
        >
          Today
        </button>
        <CalendarOptionsDropdown />
      </div>
    </div>
  );
});
