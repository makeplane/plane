import { renderLongDateFormat } from "helpers/date-time.helper";
import { generateCalendarData } from "./data";

type Props = {};

export const CalendarView: React.FC<Props> = (props) => {
  const {} = props;

  const currentDate = new Date();
  const CALENDAR_PAYLOAD = generateCalendarData(currentDate.getFullYear(), currentDate.getMonth(), 5);

  console.log("calendar payload", CALENDAR_PAYLOAD);

  return (
    <div className="h-full w-full overflow-y-auto">
      {Object.keys(CALENDAR_PAYLOAD).map((year) => (
        <div key={year}>
          {Object.keys(CALENDAR_PAYLOAD[year]).map((month) => (
            <div key={`${year}-${month}`}>
              {Object.keys(CALENDAR_PAYLOAD[year][month]).map((week) => (
                <div key={`${year}-${month}-${week}`}>
                  {CALENDAR_PAYLOAD[year][month][week].map((day) => (
                    <div key={day}>{day ? renderLongDateFormat(day) : "No date"}</div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
