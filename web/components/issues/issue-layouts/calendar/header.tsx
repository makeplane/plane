// icons
import { ChevronLeft, ChevronRight } from "lucide-react";
// constants
import { MONTHS_LIST } from "constants/calendar";

type Props = { activeMonthDate: Date; handleMonthChange: (monthDate: Date) => void };

export const CalendarHeader: React.FC<Props> = (props) => {
  const { activeMonthDate, handleMonthChange } = props;

  const handlePreviousMonth = () => {};

  const handleNextMonth = () => {};

  return (
    <div className="flex items-center gap-1.5 px-3 mb-4">
      <button type="button" className="grid place-items-center" onClick={handlePreviousMonth}>
        <ChevronLeft size={16} strokeWidth={2} />
      </button>
      <h2 className="text-xl font-semibold">{MONTHS_LIST[activeMonthDate.getMonth() + 1].title}</h2>
      <button type="button" className="grid place-items-center" onClick={handleNextMonth}>
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
};
