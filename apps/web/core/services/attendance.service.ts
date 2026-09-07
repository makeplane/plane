/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@workspaces/constants";
// api services
import { APIService } from "@/services/api.service";

export type TAttendanceCoordinates = {
  latitude: number;
  longitude: number;
};

export type TAttendanceSession = {
  check_in: string | null;
  check_out: string | null;
  worked_hours: number;
};

/**
 * Today's attendance for the signed-in user, as Odoo holds it.
 *
 * Timestamps are UTC with an explicit `Z`; `timezone` is the *employee's* zone
 * and is what they should be displayed in. `worked_hours_today` already
 * includes the running session.
 *
 * Everything past `available` is absent when the feature is switched off, so
 * check that flag before reading the rest.
 */
export type TAttendanceStatus = {
  available: boolean;
  employee?: {
    id: number;
    name: string;
    work_email: string;
    department: string | null;
  };
  date?: string;
  timezone?: string;
  checked_in?: boolean;
  check_in?: string | null;
  current_session_hours?: number;
  worked_hours_today?: number;
  closed_hours_today?: number;
  sessions_today?: TAttendanceSession[];
  last_check_in?: string | null;
  last_check_out?: string | null;
  server_time?: string;
};

export type TAttendanceError = {
  error: string;
  code?:
    | "unavailable"
    | "not_linked"
    | "location_required"
    | "location_invalid"
    | "already_checked_in"
    | "not_checked_in"
    | "conflict";
};

/**
 * A payload from an endpoint that needs Odoo bridge routes this deployment may
 * not have yet. `available: false` with `code: "bridge_endpoint_missing"` means
 * the module in `odoo-implementation/ODOO_MODULE_SPEC.md` has not shipped --
 * the UI hides the panel and says so, rather than showing an error.
 */
export type TAttendanceOptional<T> = ({ available: true } & T) | { available: false; code?: string; error?: string };

export type TAttendanceHistoryDay = {
  date: string;
  worked_hours: number;
  expected_hours: number;
  status: "present" | "absent" | "leave" | "holiday" | "weekend";
  sessions: TAttendanceSession[];
};

export type TAttendanceHistory = TAttendanceOptional<{
  employee?: { id: number; name: string; work_email: string };
  timezone?: string;
  start_date: string;
  end_date: string;
  days: TAttendanceHistoryDay[];
  totals: {
    worked_hours: number;
    expected_hours: number;
    present_days: number;
    absent_days: number;
    leave_days: number;
  };
}>;

export type TLeaveBalance = {
  type: string;
  allocated: number;
  taken: number;
  pending: number;
  remaining: number;
  unit: string;
};

export type TLeaveRequest = {
  id: number;
  type: string;
  start_date: string;
  end_date: string;
  days: number;
  state: string;
  description: string;
};

export type TAttendanceLeave = TAttendanceOptional<{
  year: number;
  balances: TLeaveBalance[];
  requests: TLeaveRequest[];
}>;

export type THoliday = { date: string; name: string; type: string };

export type TAttendanceHolidays = TAttendanceOptional<{
  year: number;
  calendar: string;
  holidays: THoliday[];
}>;

export type TWorkingHours = TAttendanceOptional<{
  calendar: string;
  timezone: string;
  hours_per_day: number;
  hours_per_week: number;
  days: { weekday: number; from: string; to: string; break_hours: number }[];
}>;

export class AttendanceService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getStatus(): Promise<TAttendanceStatus> {
    return this.get("/api/attendance/me/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Coordinates are mandatory — the API rejects a check-in without them. */
  async checkIn(coordinates: TAttendanceCoordinates): Promise<TAttendanceStatus> {
    return this.post("/api/attendance/check-in/", coordinates)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Coordinates are best-effort here: a check-out is never blocked on a fix. */
  async checkOut(coordinates?: TAttendanceCoordinates): Promise<TAttendanceStatus> {
    return this.post("/api/attendance/check-out/", coordinates ?? {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Attendance over a date range.
   *
   * Answers `{ available: false }` until the bridge grows the history route --
   * check that flag before reading anything else.
   */
  async getHistory(startDate?: string, endDate?: string): Promise<TAttendanceHistory> {
    return this.get("/api/attendance/history/", {
      params: { start_date: startDate, end_date: endDate },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getLeave(): Promise<TAttendanceLeave> {
    return this.get("/api/attendance/leave/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getHolidays(year?: number): Promise<TAttendanceHolidays> {
    return this.get("/api/attendance/holidays/", { params: { year } })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkingHours(): Promise<TWorkingHours> {
    return this.get("/api/attendance/working-hours/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const attendanceService = new AttendanceService();

export default attendanceService;
