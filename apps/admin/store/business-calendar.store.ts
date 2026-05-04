/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { BusinessCalendarService } from "@plane/services";
import type {
  IWorkSchedule,
  IWorkScheduleCreate,
  IWorkScheduleUpdate,
  IHoliday,
  IHolidayCreate,
  IHolidayUpdate,
  IDayOverride,
  IDayOverrideCreate,
  IDayOverrideUpdate,
  ICopyYearResponse,
} from "@plane/types";

export interface IBusinessCalendarStore {
  // observables
  schedulesMap: Record<string, IWorkSchedule>;
  holidaysMap: Record<string, IHoliday[]>;
  overridesMap: Record<string, IDayOverride[]>;
  loader: boolean;
  error: string | null;
  // computed
  schedules: IWorkSchedule[];
  defaultSchedule: IWorkSchedule | undefined;
  // parameterized read helpers
  getHolidaysForYear: (scheduleId: string, year: number) => IHoliday[];
  getOverridesForYear: (scheduleId: string, year: number) => IDayOverride[];
  // schedule actions
  fetchSchedules: () => Promise<void>;
  createSchedule: (data: IWorkScheduleCreate) => Promise<IWorkSchedule>;
  updateSchedule: (id: string, data: IWorkScheduleUpdate) => Promise<IWorkSchedule>;
  deleteSchedule: (id: string) => Promise<void>;
  // holiday actions
  fetchHolidays: (scheduleId: string, year: number) => Promise<void>;
  createHoliday: (scheduleId: string, data: IHolidayCreate) => Promise<IHoliday>;
  updateHoliday: (scheduleId: string, holidayId: string, data: IHolidayUpdate) => Promise<IHoliday>;
  deleteHoliday: (scheduleId: string, holidayId: string) => Promise<void>;
  // override actions
  fetchOverrides: (scheduleId: string, year: number) => Promise<void>;
  createOverride: (scheduleId: string, data: IDayOverrideCreate) => Promise<IDayOverride>;
  updateOverride: (scheduleId: string, overrideId: string, data: IDayOverrideUpdate) => Promise<IDayOverride>;
  deleteOverride: (scheduleId: string, overrideId: string) => Promise<void>;
  // copy year
  copyYear: (scheduleId: string, fromYear: number, toYear: number) => Promise<ICopyYearResponse>;
}

export class BusinessCalendarStore implements IBusinessCalendarStore {
  schedulesMap: Record<string, IWorkSchedule> = {};
  holidaysMap: Record<string, IHoliday[]> = {};
  overridesMap: Record<string, IDayOverride[]> = {};
  loader: boolean = false;
  error: string | null = null;

  private service: BusinessCalendarService;

  constructor() {
    this.service = new BusinessCalendarService();

    makeObservable(this, {
      schedulesMap: observable,
      holidaysMap: observable,
      overridesMap: observable,
      loader: observable,
      error: observable,
      schedules: computed,
      defaultSchedule: computed,
      fetchSchedules: action,
      createSchedule: action,
      updateSchedule: action,
      deleteSchedule: action,
      fetchHolidays: action,
      createHoliday: action,
      updateHoliday: action,
      deleteHoliday: action,
      fetchOverrides: action,
      createOverride: action,
      updateOverride: action,
      deleteOverride: action,
      copyYear: action,
    });
  }

  get schedules(): IWorkSchedule[] {
    return Object.values(this.schedulesMap);
  }

  get defaultSchedule(): IWorkSchedule | undefined {
    return Object.values(this.schedulesMap).find((s) => s.is_default);
  }

  getHolidaysForYear = (scheduleId: string, year: number): IHoliday[] =>
    this.holidaysMap[`${scheduleId}:${year}`] ?? [];

  getOverridesForYear = (scheduleId: string, year: number): IDayOverride[] =>
    this.overridesMap[`${scheduleId}:${year}`] ?? [];

  // ── Schedules ─────────────────────────────────────────────────────────────

  fetchSchedules = async (): Promise<void> => {
    runInAction(() => {
      this.loader = true;
      this.error = null;
    });
    try {
      const data = await this.service.fetchSchedules();
      runInAction(() => {
        data.forEach((s) => set(this.schedulesMap, s.id, s));
      });
    } catch {
      runInAction(() => {
        this.error = "Không thể tải lịch làm việc";
      });
    } finally {
      runInAction(() => {
        this.loader = false;
      });
    }
  };

  createSchedule = async (data: IWorkScheduleCreate): Promise<IWorkSchedule> => {
    const created = await this.service.createSchedule(data);
    runInAction(() => {
      set(this.schedulesMap, created.id, created);
    });
    return created;
  };

  updateSchedule = async (id: string, data: IWorkScheduleUpdate): Promise<IWorkSchedule> => {
    const updated = await this.service.updateSchedule(id, data);
    runInAction(() => {
      set(this.schedulesMap, id, updated);
    });
    return updated;
  };

  deleteSchedule = async (id: string): Promise<void> => {
    await this.service.deleteSchedule(id);
    runInAction(() => {
      delete this.schedulesMap[id];
      // Clean orphaned holiday/override cache entries for the deleted schedule
      // to prevent unbounded memory growth across long admin sessions.
      Object.keys(this.holidaysMap)
        .filter((k) => k.startsWith(`${id}:`))
        .forEach((k) => delete this.holidaysMap[k]);
      Object.keys(this.overridesMap)
        .filter((k) => k.startsWith(`${id}:`))
        .forEach((k) => delete this.overridesMap[k]);
    });
  };

  // ── Holidays ──────────────────────────────────────────────────────────────

  fetchHolidays = async (scheduleId: string, year: number): Promise<void> => {
    const key = `${scheduleId}:${year}`;
    const data = await this.service.fetchHolidays(scheduleId, year);
    runInAction(() => {
      set(this.holidaysMap, key, data);
    });
  };

  createHoliday = async (scheduleId: string, data: IHolidayCreate): Promise<IHoliday> => {
    const created = await this.service.createHoliday(scheduleId, data);
    const year = Number(created.date.slice(0, 4));
    const key = `${scheduleId}:${year}`;
    runInAction(() => {
      const existing = this.holidaysMap[key] ?? [];
      set(this.holidaysMap, key, [...existing, created]);
    });
    return created;
  };

  updateHoliday = async (scheduleId: string, holidayId: string, data: IHolidayUpdate): Promise<IHoliday> => {
    const updated = await this.service.updateHoliday(scheduleId, holidayId, data);
    const year = Number(updated.date.slice(0, 4));
    const key = `${scheduleId}:${year}`;
    runInAction(() => {
      const existing = this.holidaysMap[key] ?? [];
      set(
        this.holidaysMap,
        key,
        existing.map((h) => (h.id === holidayId ? updated : h))
      );
    });
    return updated;
  };

  deleteHoliday = async (scheduleId: string, holidayId: string): Promise<void> => {
    await this.service.deleteHoliday(scheduleId, holidayId);
    runInAction(() => {
      for (const key of Object.keys(this.holidaysMap)) {
        if (key.startsWith(scheduleId)) {
          set(
            this.holidaysMap,
            key,
            (this.holidaysMap[key] ?? []).filter((h) => h.id !== holidayId)
          );
        }
      }
    });
  };

  // ── Day Overrides ─────────────────────────────────────────────────────────

  fetchOverrides = async (scheduleId: string, year: number): Promise<void> => {
    const key = `${scheduleId}:${year}`;
    const data = await this.service.fetchOverrides(scheduleId, year);
    runInAction(() => {
      set(this.overridesMap, key, data);
    });
  };

  createOverride = async (scheduleId: string, data: IDayOverrideCreate): Promise<IDayOverride> => {
    const created = await this.service.createOverride(scheduleId, data);
    const year = Number(created.date.slice(0, 4));
    const key = `${scheduleId}:${year}`;
    runInAction(() => {
      const existing = this.overridesMap[key] ?? [];
      set(this.overridesMap, key, [...existing, created]);
    });
    return created;
  };

  updateOverride = async (scheduleId: string, overrideId: string, data: IDayOverrideUpdate): Promise<IDayOverride> => {
    const updated = await this.service.updateOverride(scheduleId, overrideId, data);
    const year = Number(updated.date.slice(0, 4));
    const key = `${scheduleId}:${year}`;
    runInAction(() => {
      const existing = this.overridesMap[key] ?? [];
      set(
        this.overridesMap,
        key,
        existing.map((o) => (o.id === overrideId ? updated : o))
      );
    });
    return updated;
  };

  deleteOverride = async (scheduleId: string, overrideId: string): Promise<void> => {
    await this.service.deleteOverride(scheduleId, overrideId);
    runInAction(() => {
      for (const key of Object.keys(this.overridesMap)) {
        if (key.startsWith(scheduleId)) {
          set(
            this.overridesMap,
            key,
            (this.overridesMap[key] ?? []).filter((o) => o.id !== overrideId)
          );
        }
      }
    });
  };

  // ── Copy Year ─────────────────────────────────────────────────────────────

  copyYear = async (scheduleId: string, fromYear: number, toYear: number): Promise<ICopyYearResponse> => {
    const result = await this.service.copyYear(scheduleId, fromYear, toYear);
    // Refetch target year data to reflect copied entries
    await this.fetchHolidays(scheduleId, toYear);
    await this.fetchOverrides(scheduleId, toYear);
    return result;
  };
}
