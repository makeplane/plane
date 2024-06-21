import { observable, action, makeObservable, runInAction, computed } from "mobx";

// helpers
import { computedFn } from "mobx-utils";
import { ICalendarPayload, ICalendarWeek } from "@/components/issues";
import { generateCalendarData } from "@/helpers/calendar.helper";
// types
import { getWeekNumberOfDate } from "@/helpers/date-time.helper";

export interface ICalendarStore {
  calendarFilters: {
    activeMonthDate: Date;
    activeWeekDate: Date;
  };
  calendarPayload: ICalendarPayload | null;

  // action
  updateCalendarFilters: (filters: Partial<{ activeMonthDate: Date; activeWeekDate: Date }>) => void;
  updateCalendarPayload: (date: Date) => void;

  // computed
  allWeeksOfActiveMonth:
    | {
        [weekNumber: string]: ICalendarWeek;
      }
    | undefined;
  activeWeekNumber: number;
  allDaysOfActiveWeek: ICalendarWeek | undefined;
  getStartAndEndDate: (layout: "week" | "month") => { startDate: string; endDate: string } | undefined;
}

export class CalendarStore implements ICalendarStore {
  loader: boolean = false;
  error: any | null = null;

  // observables
  calendarFilters: { activeMonthDate: Date; activeWeekDate: Date } = {
    activeMonthDate: new Date(),
    activeWeekDate: new Date(),
  };
  calendarPayload: ICalendarPayload | null = null;

  constructor() {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,

      // observables
      calendarFilters: observable.ref,
      calendarPayload: observable.ref,

      // actions
      updateCalendarFilters: action,
      updateCalendarPayload: action,

      //computed
      allWeeksOfActiveMonth: computed,
      activeWeekNumber: computed,
      allDaysOfActiveWeek: computed,
    });

    this.initCalendar();
  }

  get allWeeksOfActiveMonth() {
    if (!this.calendarPayload) return undefined;

    const { activeMonthDate } = this.calendarFilters;

    return this.calendarPayload[`y-${activeMonthDate.getFullYear()}`][`m-${activeMonthDate.getMonth()}`];
  }

  get activeWeekNumber() {
    return getWeekNumberOfDate(this.calendarFilters.activeWeekDate);
  }

  get allDaysOfActiveWeek() {
    if (!this.calendarPayload) return undefined;

    const { activeWeekDate } = this.calendarFilters;

    return this.calendarPayload[`y-${activeWeekDate.getFullYear()}`][`m-${activeWeekDate.getMonth()}`][
      `w-${this.activeWeekNumber - 1}`
    ];
  }

  getStartAndEndDate = computedFn((layout: "week" | "month") => {
    switch (layout) {
      case "week": {
        if (!this.allDaysOfActiveWeek) return;
        const dates = Object.keys(this.allDaysOfActiveWeek);
        return { startDate: dates[0], endDate: dates[dates.length - 1] };
      }
      case "month": {
        if (!this.allWeeksOfActiveMonth) return;
        const weeks = Object.keys(this.allWeeksOfActiveMonth);
        const firstWeekDates = Object.keys(this.allWeeksOfActiveMonth[weeks[0]]);
        const lastWeekDates = Object.keys(this.allWeeksOfActiveMonth[weeks[weeks.length - 1]]);

        return { startDate: firstWeekDates[0], endDate: lastWeekDates[lastWeekDates.length - 1] };
      }
    }
  });

  updateCalendarFilters = (filters: Partial<{ activeMonthDate: Date; activeWeekDate: Date }>) => {
    this.updateCalendarPayload(filters.activeMonthDate || filters.activeWeekDate || new Date());

    runInAction(() => {
      this.calendarFilters = {
        ...this.calendarFilters,
        ...filters,
      };
    });
  };

  updateCalendarPayload = (date: Date) => {
    if (!this.calendarPayload) return null;

    const nextDate = new Date(date);

    runInAction(() => {
      this.calendarPayload = generateCalendarData(this.calendarPayload, nextDate);
    });
  };

  initCalendar = () => {
    const newCalendarPayload = generateCalendarData(null, new Date());

    runInAction(() => {
      this.calendarPayload = newCalendarPayload;
    });
  };
}
