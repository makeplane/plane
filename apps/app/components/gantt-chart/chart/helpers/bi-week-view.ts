const weeks = [
  { week: 0, text: { shortTitle: "sun", title: "sunday" } },
  { week: 1, text: { shortTitle: "mon", title: "monday" } },
  { week: 2, text: { shortTitle: "tue", title: "tuesday" } },
  { week: 3, text: { shortTitle: "wed", title: "wednesday" } },
  { week: 4, text: { shortTitle: "thurs", title: "thursday" } },
  { week: 5, text: { shortTitle: "fri", title: "friday" } },
  { week: 6, text: { shortTitle: "sat", title: "saturday" } },
];

const months = [
  { month: 0, text: { shortTitle: "jan", title: "january" } },
  { month: 1, text: { shortTitle: "feb", title: "february" } },
  { month: 2, text: { shortTitle: "mar", title: "march" } },
  { month: 3, text: { shortTitle: "apr", title: "april" } },
  { month: 4, text: { shortTitle: "ma", title: "may" } },
  { month: 5, text: { shortTitle: "", title: "june" } },
  { month: 6, text: { shortTitle: "", title: "july" } },
  { month: 7, text: { shortTitle: "", title: "august" } },
  { month: 8, text: { shortTitle: "", title: "september" } },
  { month: 9, text: { shortTitle: "", title: "october" } },
  { month: 10, text: { shortTitle: "", title: "november" } },
  { month: 11, text: { shortTitle: "", title: "december" } },
];

// getting all the week Numbers in a month and year
const getWeekNumberByDate = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const daysOffset = firstDayOfYear.getDay();
  const firstWeekStart = firstDayOfYear.getTime() - daysOffset * 24 * 60 * 60 * 1000;

  const weekStart = new Date(firstWeekStart);
  const weekNumber =
    Math.floor((date.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  return weekNumber;
};

const getAllWeeksInMonth = (month: number, year: number) => {
  const weeks = [];

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeek = new Date(firstDay);
  startWeek.setDate(firstDay.getDate() - firstDay.getDay());

  const endWeek = new Date(lastDay);
  endWeek.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

  while (startWeek <= endWeek) {
    const startWeekDate = new Date(startWeek);

    const endWeekDate = new Date(startWeek);
    endWeekDate.setDate(endWeekDate.getDate() + 6);

    weeks.push({
      week: getWeekNumberByDate(startWeekDate),
      start: startWeekDate,
      end: endWeekDate,
    });

    startWeek.setDate(startWeek.getDate() + 7);
  }

  return weeks;
};

export const generateDayDataByDate = (week: number) => {
  const currentWeek: number = week;
  console.log("weeks", weeks);
};

const generateWeekDataByWeek = (week: number, month: number, year: number) => {
  const currentWeek: number = week;
  const currentMonth: number = month;
  const currentYear: number = year;
};

const generateMonthDataByMonth = (month: number, year: number) => {
  const currentMonth: number = month;
  const currentYear: number = year;
  const allWeekData = [];

  const monthPayload = {
    month: currentMonth,
    monthData: months[currentMonth],
    weeks: getAllWeeksInMonth(currentMonth, currentYear),
  };

  return monthPayload;
};

export const generateYearDataByYear = (year: number) => {
  const currentYear: number = year;
  const allMonthsData = [];

  for (const month in months) {
    const currentMonth = parseInt(month);
    allMonthsData.push(generateMonthDataByMonth(currentMonth, currentYear));
  }

  const yearPayload = {
    year: currentYear,
    months: allMonthsData,
  };

  return yearPayload;
};

export const returnPayload = [
  {
    year: 2023,
    months: [
      {
        month: 0,
        weeks: [
          {
            week: 0,
            startDate: "",
            endDate: "",
            days: [
              {
                day: 0,
                hours: [
                  {
                    hour: 0,
                    minutes: 0,
                    seconds: 0,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
