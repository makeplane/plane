import { useState } from "react";

// icons
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ICalendarPayload, ICalendarWeek, generateCalendarData } from "./data";
// constants
import { DAYS_LIST, MONTHS_LIST } from "constants/calendar";

type Props = {};

export const CalendarLayout: React.FC<Props> = (props) => {
  const {} = props;

  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [showWeekends, setShowWeekends] = useState(true);

  const currentDate = new Date();
  const CALENDAR_PAYLOAD: ICalendarPayload = generateCalendarData(currentDate.getFullYear(), currentDate.getMonth(), 1);

  console.log("calendar payload", CALENDAR_PAYLOAD);

  return (
    <div className="h-full w-full pt-4 bg-custom-background-100 overflow-hidden">
      {Object.entries(CALENDAR_PAYLOAD).map(([year, months]) =>
        Object.entries(months).map(([month, weeks]) => (
          <div key={`${year}-${month}`} className="h-full w-full flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 mb-4">
              <ChevronLeft size={16} strokeWidth={2} />
              <h2 className="text-xl font-semibold">{MONTHS_LIST[parseInt(month, 10) + 1].title}</h2>
              <ChevronRight size={16} strokeWidth={2} />
            </div>
            <div
              className={`grid text-sm font-medium divide-x-[0.5px] divide-custom-border-200 ${
                showWeekends ? "grid-cols-7" : "grid-cols-5"
              }`}
            >
              {Object.values(DAYS_LIST).map((day) => {
                if (!showWeekends && (day.shortTitle === "Sat" || day.shortTitle === "Sun")) return null;

                return (
                  <div
                    key={`${year}-${month}-${day.shortTitle}`}
                    className="h-11 bg-custom-background-80 flex items-center px-4"
                  >
                    {day.shortTitle}
                  </div>
                );
              })}
            </div>
            <div className="h-full w-full overflow-y-auto">
              {Object.values(weeks as ICalendarWeek).map((week, weekIndex) => (
                <div key={weekIndex} className={`grid ${showWeekends ? "grid-cols-7" : "grid-cols-5"}`}>
                  {week.map((date, dayIndex) => {
                    if (!showWeekends && (dayIndex === 5 || dayIndex === 6)) return null;

                    return (
                      <div key={dayIndex} className="border-[0.5px] border-custom-border-100 min-h-[9rem] p-1">
                        {date && <div className="text-xs text-right">{date.getDate()}</div>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
