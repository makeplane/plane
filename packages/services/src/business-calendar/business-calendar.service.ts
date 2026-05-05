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
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";

const BASE = "/api/instances/calendar";

export class BusinessCalendarService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // ── Schedules ────────────────────────────────────────────────────────────

  async fetchSchedules(): Promise<IWorkSchedule[]> {
    return this.get(`${BASE}/schedules/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createSchedule(data: IWorkScheduleCreate): Promise<IWorkSchedule> {
    return this.post(`${BASE}/schedules/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateSchedule(id: string, data: IWorkScheduleUpdate): Promise<IWorkSchedule> {
    return this.patch(`${BASE}/schedules/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteSchedule(id: string): Promise<void> {
    return this.delete(`${BASE}/schedules/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ── Holidays ─────────────────────────────────────────────────────────────

  async fetchHolidays(scheduleId: string, year: number): Promise<IHoliday[]> {
    return this.get(`${BASE}/schedules/${scheduleId}/holidays/?year=${year}`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createHoliday(scheduleId: string, data: IHolidayCreate): Promise<IHoliday> {
    return this.post(`${BASE}/schedules/${scheduleId}/holidays/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateHoliday(scheduleId: string, holidayId: string, data: IHolidayUpdate): Promise<IHoliday> {
    return this.patch(`${BASE}/schedules/${scheduleId}/holidays/${holidayId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteHoliday(scheduleId: string, holidayId: string): Promise<void> {
    return this.delete(`${BASE}/schedules/${scheduleId}/holidays/${holidayId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ── Day Overrides ─────────────────────────────────────────────────────────

  async fetchOverrides(scheduleId: string, year: number): Promise<IDayOverride[]> {
    return this.get(`${BASE}/schedules/${scheduleId}/overrides/?year=${year}`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createOverride(scheduleId: string, data: IDayOverrideCreate): Promise<IDayOverride> {
    return this.post(`${BASE}/schedules/${scheduleId}/overrides/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateOverride(scheduleId: string, overrideId: string, data: IDayOverrideUpdate): Promise<IDayOverride> {
    return this.patch(`${BASE}/schedules/${scheduleId}/overrides/${overrideId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteOverride(scheduleId: string, overrideId: string): Promise<void> {
    return this.delete(`${BASE}/schedules/${scheduleId}/overrides/${overrideId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ── Copy Year ─────────────────────────────────────────────────────────────

  async copyYear(scheduleId: string, fromYear: number, toYear: number): Promise<ICopyYearResponse> {
    return this.post(`${BASE}/schedules/${scheduleId}/copy-year/`, { from_year: fromYear, to_year: toYear })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
