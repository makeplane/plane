import { observable, action, makeObservable, runInAction, computed, reaction } from "mobx";

// helpers
import { computedFn } from "mobx-utils";
import type { ICalendarPayload, ICalendarWeek } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";
import { generateCalendarData, getWeekNumberOfDate } from "@plane/utils";
// types
import type { IIssueRootStore } from "./root.store";

export interface ICalendarStore {
  calendarFilters: {
    activeMonthDate: Date;
    activeWeekDate: Date;
  };
  calendarPayload: ICalendarPayload | null;

  // action
  updateCalendarFilters: (filters: Partial<{ activeMonthDate: Date; activeWeekDate: Date }>) => void;
  updateCalendarPayload: (date: Date) => void;
  regenerateCalendar: () => void;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any | null = null;

  // observables
  calendarFilters: { activeMonthDate: Date; activeWeekDate: Date } = {
    activeMonthDate: new Date(),
    activeWeekDate: new Date(),
  };
  calendarPayload: ICalendarPayload | null = null;
  // root store
  rootStore;

  constructor(_rootStore: IIssueRootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,

      // observables
      calendarFilters: observable.ref,
      calendarPayload: observable.ref,

      // actions
      updateCalendarFilters: action,
      updateCalendarPayload: action,
      regenerateCalendar: action,

      //computed
      allWeeksOfActiveMonth: computed,
      activeWeekNumber: computed,
      allDaysOfActiveWeek: computed,
    });

    this.rootStore = _rootStore;
    this.initCalendar();

    // Watch for changes in startOfWeek preference and regenerate calendar
    reaction(
      () => this.rootStore.rootStore.user.userProfile.data?.start_of_the_week,
      () => {
        // Regenerate calendar when startOfWeek preference changes
        this.regenerateCalendar();
      }
    );
  }

  get allWeeksOfActiveMonth() {
    if (!this.calendarPayload) return undefined;

    const { activeMonthDate } = this.calendarFilters;

    const year = activeMonthDate.getFullYear();
    const month = activeMonthDate.getMonth();

    // Get the weeks for the current month
    const weeks = this.calendarPayload[`y-${year}`][`m-${month}`];

    // If no weeks exist, return undefined
    if (!weeks) return undefined;

    // Create a new object to store the reordered weeks
    const reorderedWeeks: { [weekNumber: string]: ICalendarWeek } = {};

    // Get all week numbers and sort them
    const weekNumbers = Object.keys(weeks).map((key) => parseInt(key.replace("w-", "")));
    weekNumbers.sort((a, b) => a - b);

    // Reorder weeks based on start_of_week
    weekNumbers.forEach((weekNumber) => {
      const weekKey = `w-${weekNumber}`;
      reorderedWeeks[weekKey] = weeks[weekKey];
    });

    return reorderedWeeks;
  }

  get activeWeekNumber() {
    return getWeekNumberOfDate(this.calendarFilters.activeWeekDate);
  }

  get allDaysOfActiveWeek() {
    if (!this.calendarPayload) return undefined;

    const { activeWeekDate } = this.calendarFilters;
    const year = activeWeekDate.getFullYear();
    const month = activeWeekDate.getMonth();
    const dayOfMonth = activeWeekDate.getDate();

    // Check if calendar data exists for this year and month
    const yearData = this.calendarPayload[`y-${year}`];
    if (!yearData) return undefined;

    const monthData = yearData[`m-${month}`];
    if (!monthData) return undefined;

    // Calculate firstDayOfMonth offset (same logic as calendar generation)
    const startOfWeek = this.rootStore?.rootStore?.user?.userProfile?.data?.start_of_the_week ?? EStartOfTheWeek.SUNDAY;
    const firstDayOfMonthRaw = new Date(year, month, 1).getDay();
    const firstDayOfMonth = (firstDayOfMonthRaw - startOfWeek + 7) % 7;

    // Calculate which sequential week this date falls into
    const weekIndex = Math.floor((dayOfMonth - 1 + firstDayOfMonth) / 7);

    const weekKey = `w-${weekIndex}`;
    if (!(weekKey in monthData)) {
      return undefined;
    }
    return monthData[weekKey];
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
    const startOfWeek = this.rootStore.rootStore.user.userProfile.data?.start_of_the_week ?? EStartOfTheWeek.SUNDAY;

    runInAction(() => {
      this.calendarPayload = generateCalendarData(this.calendarPayload, nextDate, startOfWeek);
    });
  };

  initCalendar = () => {
    const startOfWeek = this.rootStore.rootStore.user.userProfile.data?.start_of_the_week ?? EStartOfTheWeek.SUNDAY;
    const newCalendarPayload = generateCalendarData(null, new Date(), startOfWeek);

    runInAction(() => {
      this.calendarPayload = newCalendarPayload;
    });
  };

  /**
   * Force complete regeneration of calendar data
   * This should be called when startOfWeek preference changes
   */
  regenerateCalendar = () => {
    const startOfWeek = this.rootStore.rootStore.user.userProfile.data?.start_of_the_week ?? EStartOfTheWeek.SUNDAY;
    const { activeMonthDate } = this.calendarFilters;

    // Force complete regeneration by passing null to clear all cached data
    const newCalendarPayload = generateCalendarData(null, activeMonthDate, startOfWeek);

    runInAction(() => {
      this.calendarPayload = newCalendarPayload;
    });
  };
}
