export const startOfMonth = (date: Date) => {
  const startOfMonthDate = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfMonthDate;
};

export const lastDayOfMonth = (date: Date) => {
  const lastDayOfPreviousMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return lastDayOfPreviousMonth;
};

export const startOfWeek = (date: Date) => {
  const dayOfWeek = date.getDay() % 7;
  const startOfWeekDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayOfWeek);
  return startOfWeekDate;
};

export const lastDayOfWeek = (date: Date) => {
  const dayOfWeek = date.getDay() % 7;
  const daysUntilEndOfWeek = 6 - dayOfWeek;
  const lastDayOfWeekDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + daysUntilEndOfWeek
  );
  return lastDayOfWeekDate;
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
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
