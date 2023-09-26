import { renderLongDateFormat } from "helpers/date-time.helper";
import { generateCalendarData } from "./data";

type Props = {};

export const CalendarView: React.FC<Props> = (props) => {
  const {} = props;

  const currentDate = new Date();
  const CALENDAR_PAYLOAD = generateCalendarData(currentDate.getFullYear(), currentDate.getMonth(), 5);

  console.log("calendar payload", CALENDAR_PAYLOAD);

  return (
    <div className="calendar">
      {Object.entries(CALENDAR_PAYLOAD).map(([year, months]) =>
        Object.entries(months).map(([month, weeks]) => (
          <div key={`${year}-${month}`} className="month">
            <h2>{`${year}-${Number(month) + 1}`}</h2>
            <div className="weekdays">
              <div className="day">Sun</div>
              <div className="day">Mon</div>
              <div className="day">Tue</div>
              <div className="day">Wed</div>
              <div className="day">Thu</div>
              <div className="day">Fri</div>
              <div className="day">Sat</div>
            </div>
            <div className="weeks">
              {Object.values(weeks).map((week: Date[], weekIndex) => (
                <div key={weekIndex} className="week">
                  {week.map((date, dayIndex) => (
                    <div key={dayIndex} className="day">
                      {date && (
                        <div className="date">
                          {date.getDate()} {/* Assuming you want to display the day of the month */}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
