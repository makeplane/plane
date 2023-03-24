export const startOfMonth = (date: Date) => {
  const startOfMonthDate = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfMonthDate;
};

export const lastDayOfMonth = (date: Date) => {
  const lastDayOfPreviousMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return lastDayOfPreviousMonth;
};
