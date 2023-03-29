export const startOfWeek = (date: Date) => {
  const startOfMonthDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfWeek = startOfMonthDate.getDay() % 7;
  const startOfWeekDate = new Date(
    startOfMonthDate.getFullYear(),
    startOfMonthDate.getMonth(),
    startOfMonthDate.getDate() - dayOfWeek
  );
  const timezoneOffset = startOfMonthDate.getTimezoneOffset();
  const timezoneOffsetMilliseconds = timezoneOffset * 60 * 1000;
  const startOfWeekAdjusted = new Date(startOfWeekDate.getTime() - timezoneOffsetMilliseconds);
  return startOfWeekAdjusted;
};

export const lastDayOfWeek = (date: Date) => {
  const lastDayOfPreviousMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const dayOfWeek = lastDayOfPreviousMonth.getDay() % 7;
  const daysUntilEndOfWeek = 6 - dayOfWeek;
  const lastDayOfWeekDate = new Date(
    lastDayOfPreviousMonth.getFullYear(),
    lastDayOfPreviousMonth.getMonth(),
    lastDayOfPreviousMonth.getDate() + daysUntilEndOfWeek
  );
  const timezoneOffset = lastDayOfPreviousMonth.getTimezoneOffset();
  const timezoneOffsetMilliseconds = timezoneOffset * 60 * 1000;
  const lastDayOfWeekAdjusted = new Date(lastDayOfWeekDate.getTime() - timezoneOffsetMilliseconds);
  return lastDayOfWeekAdjusted;
};

export const getCurrentWeekStartDate = (date: Date) => {
  const today = new Date(date);
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOfWeek);
  const timezoneOffset = startOfWeek.getTimezoneOffset();
  const timezoneOffsetMilliseconds = timezoneOffset * 60 * 1000;
  const startOfWeekAdjusted = new Date(startOfWeek.getTime() - timezoneOffsetMilliseconds);
  return startOfWeekAdjusted;
};

export const getCurrentWeekEndDate = (date: Date) => {
  const today = new Date(date);
  const dayOfWeek = today.getDay();
  const endOfWeek = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + (6 - dayOfWeek)
  );
  const timezoneOffset = endOfWeek.getTimezoneOffset();
  const timezoneOffsetMilliseconds = timezoneOffset * 60 * 1000;
  const endOfWeekAdjusted = new Date(endOfWeek.getTime() - timezoneOffsetMilliseconds);
  return endOfWeekAdjusted;
};

export const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }) => {
  const days = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

export const weekDayInterval = ({ start, end }: { start: Date; end: Date }) => {
  const dates = [];
  const currentDate = new Date(start);
  const endDate = new Date(end);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

export const formatDate = (date: Date, format: string): string => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthsOfYear = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formattedDate = format
    .replace("dd", day.toString().padStart(2, "0"))
    .replace("d", day.toString())
    .replace("eee", daysOfWeek[date.getDay()])
    .replace("Month", monthsOfYear[month - 1])
    .replace("yyyy", year.toString())
    .replace("yyy", year.toString().slice(-3))
    .replace("hh", hours.toString().padStart(2, "0"))
    .replace("mm", minutes.toString().padStart(2, "0"))
    .replace("ss", seconds.toString().padStart(2, "0"));

  return formattedDate;
};

export const subtractMonths = (date: Date, numMonths: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() - numMonths);
  return result;
};

export const addMonths = (date: Date, numMonths: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + numMonths);
  return result;
};

export const updateDateWithYear = (yearString: string, date: Date) => {
  const year = parseInt(yearString);
  const month = date.getMonth();
  const day = date.getDate();
  return new Date(year, month, day);
};

export const updateDateWithMonth = (monthString: string, date: Date) => {
  const month = parseInt(monthString) - 1;
  const year = date.getFullYear();
  const day = date.getDate();
  return new Date(year, month, day);
};

export const isSameMonth = (monthString: string, date: Date) => {
  const month = parseInt(monthString) - 1;
  return month === date.getMonth();
};

export const isSameYear = (yearString: string, date: Date) => {
  const year = parseInt(yearString);
  return year === date.getFullYear();
};

export const addSevenDaysToDate = (date: Date) => {
  const currentDate = date;
  const newDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
  return newDate;
};

export const subtract7DaysToDate = (date: Date) => {
  const currentDate = date;
  const newDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  return newDate;
};
