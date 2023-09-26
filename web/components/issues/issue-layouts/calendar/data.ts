import { renderDateFormat } from "helpers/date-time.helper";

export interface ICalendarDate {
  date: Date;
  year: number;
  month: number;
  day: number;
  week: number; // week number wrt year, eg- 51, 52
  is_current_month: boolean;
  is_current_week: boolean;
  is_today: boolean;
}

export interface ICalendarWeek {
  [weekNumber: number]: {
    [date: string]: ICalendarDate | null;
  };
}

export interface ICalendarMonth {
  [monthNumber: number]: ICalendarWeek;
}

export interface ICalendarPayload {
  [year: number]: ICalendarMonth;
}

// get week number wrt year
export const getWeekNumber = (date: Date): number => {
  const d = new Date(date);

  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));

  const week1 = new Date(d.getFullYear(), 0, 4);

  return 1 + Math.round(((d.valueOf() - week1.valueOf()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

export const generateCalendarData = (startYear: number, startMonth: number, numMonths: number): ICalendarPayload => {
  const calendarData: ICalendarPayload = {};

  for (let i = 0; i < numMonths; i++) {
    const currentDate = new Date(startYear, startMonth + i, 1);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const numDaysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Convert Sunday to 0-based index

    calendarData[year] ||= {};
    calendarData[year][month] ||= {};

    const numWeeks = Math.ceil((numDaysInMonth + firstDayOfWeek) / 7);

    for (let week = 0; week < numWeeks; week++) {
      const currentWeekObject: { [date: string]: ICalendarDate | null } = {};

      for (let i = 0; i < 7; i++) {
        const dayNumber = week * 7 + i - firstDayOfWeek + 1;

        const date = new Date(year, month, dayNumber);

        currentWeekObject[renderDateFormat(date)] =
          dayNumber >= 1 && dayNumber <= numDaysInMonth
            ? {
                date,
                year,
                month,
                day: dayNumber,
                week: getWeekNumber(date),
                is_current_month: true,
                is_current_week: getWeekNumber(date) === getWeekNumber(new Date()),
                is_today: date.toDateString() === new Date().toDateString(),
              }
            : null;
      }

      calendarData[year][month][week] = currentWeekObject;
    }
  }

  return calendarData;
};
