import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS_LIST } from "@/constants/calendar";


type Props = {
  date: Date;
  isLoading: boolean;
  onChangeDate: (newDate: Date) => void;
};

export const CalendarDayHeader: React.FC<Props> = ({ date, isLoading, onChangeDate }) => {
  const weekday = date.toLocaleString("en-US", { weekday: "short" });
  const day = date.getDate();
  const month = MONTHS_LIST[date.getMonth() + 1].title;
  const year = date.getFullYear();

  const handlePrevDay = () => {
    const prevDate = new Date(date);
    prevDate.setDate(date.getDate() - 1);
    onChangeDate(prevDate);
  };

  const handleNextDay = () => {
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    onChangeDate(nextDate);
  };

  return (
    <div className="relative sticky top-0 z-[1] bg-custom-background-90 border-b border-custom-border-200 px-4 py-3 flex items-center justify-between">
      {isLoading && (
        <div className="absolute h-[1.5px] w-3/4 animate-[bar-loader_2s_linear_infinite] bg-custom-primary-100" />
      )}

      <button
        type="button"
        onClick={handlePrevDay}
        className="grid place-items-center h-6 w-6 border border-custom-border-400 rounded-full"
      >
        <ChevronLeft size={14} />
      </button>

      <h2 className="text-lg font-semibold text-center flex-1">
        {weekday}, {day} {month} {year}
      </h2>

      <button
        type="button"
        onClick={handleNextDay}
        className="grid place-items-center h-6 w-6 border border-custom-border-400 rounded-full"
      >
         <ChevronRight size={14} />
      </button>
    </div>
  );
};
