export const generateDayDataByDate = (week: number) => {
  const currentWeek: number = week;

  const weeks = [
    { week: 0, smallCase: "sunday", upperCase: "SUNDAY" },
    { week: 1, smallCase: "monday", upperCase: "MONDAY" },
    { week: 2, smallCase: "tuesday", upperCase: "TUESDAY" },
    { week: 3, smallCase: "wednesday", upperCase: "WEDNESDAY" },
    { week: 4, smallCase: "thursday", upperCase: "THURSDAY" },
    { week: 5, smallCase: "friday", upperCase: "FRIDAY" },
    { week: 6, smallCase: "saturday", upperCase: "SATURDAY" },
  ];

  console.log("weeks", weeks);
};

export const generateMonthDataByMonth = (month: number) => {
  const currentMonth: number = month;

  const months = [
    { month: 0, smallCase: "january", upperCase: "JANUARY" },
    { month: 1, smallCase: "february", upperCase: "FEBRUARY" },
    { month: 2, smallCase: "march", upperCase: "MARCH" },
    { month: 3, smallCase: "april", upperCase: "APRIL" },
    { month: 4, smallCase: "may", upperCase: "MAY" },
    { month: 5, smallCase: "june", upperCase: "JUNE" },
    { month: 6, smallCase: "july", upperCase: "JULY" },
    { month: 7, smallCase: "august", upperCase: "AUGUST" },
    { month: 8, smallCase: "september", upperCase: "SEPTEMBER" },
    { month: 9, smallCase: "october", upperCase: "OCTOBER" },
    { month: 10, smallCase: "november", upperCase: "NOVEMBER" },
    { month: 11, smallCase: "december", upperCase: "DECEMBER" },
  ];

  const data = [];

  for (let i = 0; i < 12; i++) {
    data.push({
      month: months[i],
    });
  }

  console.log("data", data);
  return data;
};

export const generateYearDataByYear = (year: number) => {
  const currentYear: number = year;

  console.log("currentYear", currentYear);
};
