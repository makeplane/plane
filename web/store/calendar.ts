import { observable, action, makeObservable, runInAction } from "mobx";

// types
import { RootStore } from "./root";
import { ICalendarPayload, generateCalendarData } from "components/issues";

export interface ICalendarStore {
  calendarFilters: {
    activeMonthDate: Date;
    activeWeekDate: Date;
  };
  calendarPayload: ICalendarPayload | null;

  // action
  updateCalendarFilters: (filters: Partial<{ activeMonthDate: Date; activeWeekDate: Date }>) => void;
  updateCalendarPayload: (date: Date) => void;
}

class CalendarStore implements ICalendarStore {
  loader: boolean = false;
  error: any | null = null;

  // observables
  calendarFilters: { activeMonthDate: Date; activeWeekDate: Date } = {
    activeMonthDate: new Date(),
    activeWeekDate: new Date(),
  };
  calendarPayload: ICalendarPayload | null = null;

  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,

      // observables
      calendarFilters: observable.ref,
      calendarPayload: observable.ref,

      // actions
      updateCalendarFilters: action,
      updateCalendarPayload: action,
    });

    this.rootStore = _rootStore;

    this.initCalendar();
  }

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

export default CalendarStore;
