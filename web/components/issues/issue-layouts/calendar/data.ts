export interface ICalendarWeek {
  [weekNumber: number]: (Date | null)[];
}

export interface ICalendarMonth {
  [monthNumber: number]: ICalendarWeek;
}

export interface ICalendarPayload {
  [year: number]: ICalendarMonth;
}

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
      calendarData[year][month][week] = Array.from({ length: 7 }, (_, day) => {
        const dayNumber = week * 7 + day - firstDayOfWeek + 1;
        return dayNumber >= 1 && dayNumber <= numDaysInMonth ? new Date(year, month, dayNumber) : null;
      });
    }
  }

  return calendarData;
};
