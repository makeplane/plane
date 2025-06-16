export interface ICalendarRange {
  startDate: Date;
  endDate: Date;
}

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
  [date: string]: ICalendarDate;
}

export interface ICalendarMonth {
  [monthIndex: string]: {
    [weekNumber: string]: ICalendarWeek;
  };
}

export interface ICalendarPayload {
  [year: string]: ICalendarMonth;
}
