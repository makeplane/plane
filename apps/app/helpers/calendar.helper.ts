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