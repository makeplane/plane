// Generating the date by using the year, month, and day
export const generateDate = (day: number, month: number, year: number) => new Date(year, month, day);

// Getting the number of days in a month
export const getNumberOfDaysInMonth = (month: number, year: number) => {
  const date = new Date(year, month, 1);

  date.setMonth(date.getMonth() + 1);
  date.setDate(date.getDate() - 1);

  return date.getDate();
};

// Getting the week number by date
export const getWeekNumberByDate = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const daysOffset = firstDayOfYear.getDay();

  const firstWeekStart = firstDayOfYear.getTime() - daysOffset * 24 * 60 * 60 * 1000;
  const weekStart = new Date(firstWeekStart);

  const weekNumber = Math.floor((date.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  return weekNumber;
};

// Getting all weeks between two dates
export const getWeeksByMonthAndYear = (month: number, year: number) => {
  const weeks = [];
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const currentDate = new Date(startDate.getTime());

  currentDate.setDate(currentDate.getDate() + ((7 - currentDate.getDay()) % 7));

  while (currentDate <= endDate) {
    weeks.push({
      year: year,
      month: month,
      weekNumber: getWeekNumberByDate(currentDate),
      startDate: new Date(currentDate.getTime()),
      endDate: new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000),
    });
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return weeks;
};

// Getting all dates in a week by week number and year
export const getAllDatesInWeekByWeekNumber = (weekNumber: number, year: number) => {
  const januaryFirst = new Date(year, 0, 1);
  const firstDayOfYear =
    januaryFirst.getDay() === 0 ? januaryFirst : new Date(year, 0, 1 + (7 - januaryFirst.getDay()));

  const startDate = new Date(firstDayOfYear.getTime());
  startDate.setDate(startDate.getDate() + 7 * (weekNumber - 1));

  var datesInWeek = [];
  for (var i = 0; i < 7; i++) {
    const currentDate = new Date(startDate.getTime());
    currentDate.setDate(currentDate.getDate() + i);
    datesInWeek.push(currentDate);
  }

  return datesInWeek;
};

// Getting the dates between two dates
export const getDatesBetweenTwoDates = (startDate: Date, endDate: Date) => {
  const dates = [];

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();

  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();

  const currentDate = new Date(startYear, startMonth);

  while (currentDate <= endDate) {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    dates.push(new Date(currentYear, currentMonth));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  if (endYear === currentDate.getFullYear() && endMonth === currentDate.getMonth()) dates.push(endDate);

  return dates;
};
