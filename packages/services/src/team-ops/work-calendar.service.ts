/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TCalendarAuditParams,
  TCalendarAuditResponse,
  TCalendarBulkPayload,
  TCalendarBulkResponse,
  TCalendarDay,
  TCalendarDayPayload,
  TCalendarDaysParams,
  TCalendarDaysResponse,
  TCalendarHoliday,
  TCalendarHolidayPayload,
  TCalendarSettings,
  TCalendarSettingsResponse,
  TOpsTeam,
  TOpsTeamPayload,
  TPlanSummaryReport,
  TPlannedVsLoggedReport,
  TReportKind,
  TReportParams,
  TTeamCalendarParams,
  TTeamCalendarResponse,
  TTeamDayFilters,
  TTeamDayResponse,
  TWeeklyPlanPayload,
  TWeeklyPlanResponse,
} from "@plane/types";
// services
import { APIService } from "../api.service";

export class WorkCalendarService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  private base(workspaceSlug: string) {
    return `/api/workspaces/${workspaceSlug}/team-ops`;
  }

  private calendar(workspaceSlug: string) {
    return `${this.base(workspaceSlug)}/calendar`;
  }

  // --- policy -------------------------------------------------------------------------------

  /** The workspace policy together with what the caller may do under it. */
  async getSettings(workspaceSlug: string): Promise<TCalendarSettingsResponse> {
    return this.get(`${this.calendar(workspaceSlug)}/settings/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Admins only. Fields that are not sent keep their value. */
  async updateSettings(workspaceSlug: string, data: Partial<TCalendarSettings>): Promise<TCalendarSettingsResponse> {
    return this.put(`${this.calendar(workspaceSlug)}/settings/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listHolidays(workspaceSlug: string, params?: { from?: string; to?: string }): Promise<TCalendarHoliday[]> {
    return this.get(`${this.calendar(workspaceSlug)}/holidays/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createHoliday(workspaceSlug: string, data: TCalendarHolidayPayload): Promise<TCalendarHoliday> {
    return this.post(`${this.calendar(workspaceSlug)}/holidays/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteHoliday(workspaceSlug: string, holidayId: string): Promise<void> {
    return this.delete(`${this.calendar(workspaceSlug)}/holidays/${holidayId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // --- teams --------------------------------------------------------------------------------

  async listTeams(workspaceSlug: string): Promise<TOpsTeam[]> {
    return this.get(`${this.base(workspaceSlug)}/teams/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createTeam(workspaceSlug: string, data: TOpsTeamPayload & { name: string }): Promise<TOpsTeam> {
    return this.post(`${this.base(workspaceSlug)}/teams/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateTeam(workspaceSlug: string, teamId: string, data: TOpsTeamPayload): Promise<TOpsTeam> {
    return this.patch(`${this.base(workspaceSlug)}/teams/${teamId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteTeam(workspaceSlug: string, teamId: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug)}/teams/${teamId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // --- days ---------------------------------------------------------------------------------

  /** Every day from `from` to `to` for one person (the caller by default). */
  async getDays(workspaceSlug: string, params: TCalendarDaysParams): Promise<TCalendarDaysResponse> {
    return this.get(`${this.calendar(workspaceSlug)}/entries/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Sets the plan for one day, replacing whatever was there. */
  async saveDay(workspaceSlug: string, date: string, data: TCalendarDayPayload): Promise<TCalendarDay> {
    return this.put(`${this.calendar(workspaceSlug)}/entries/${date}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Removes a day set by hand; a future day goes back to the weekly plan. Returns the day as it now is. */
  async resetDay(workspaceSlug: string, date: string, user?: string): Promise<TCalendarDay> {
    return this.delete(`${this.calendar(workspaceSlug)}/entries/${date}/`, undefined, { params: user ? { user } : {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Applies one plan to several days. Days the caller may no longer change come back in `skipped_dates`. */
  async applyToDays(workspaceSlug: string, data: TCalendarBulkPayload): Promise<TCalendarBulkResponse> {
    return this.post(`${this.calendar(workspaceSlug)}/entries/bulk/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // --- team view ----------------------------------------------------------------------------

  /** Per-day counts and people for everyone the caller may see. Needs the right to view the team. */
  async getTeamCalendar(workspaceSlug: string, params: TTeamCalendarParams): Promise<TTeamCalendarResponse> {
    return this.get(`${this.calendar(workspaceSlug)}/team/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** One row per person for a day: the plan next to the time logged. */
  async getTeamDay(workspaceSlug: string, date: string, params?: TTeamDayFilters): Promise<TTeamDayResponse> {
    return this.get(`${this.calendar(workspaceSlug)}/team/day/${date}/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // --- reports ------------------------------------------------------------------------------

  /** Days per work mode, holidays and unplanned working days for each person the caller may see. */
  async getPlanSummary(workspaceSlug: string, params: TReportParams): Promise<TPlanSummaryReport> {
    return this.get(`${this.calendar(workspaceSlug)}/reports/plan-summary/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Planned hours next to the time logged in Time Tracking. */
  async getPlannedVsLogged(workspaceSlug: string, params: TReportParams): Promise<TPlannedVsLoggedReport> {
    return this.get(`${this.calendar(workspaceSlug)}/reports/planned-vs-logged/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** The report as a CSV file. */
  async exportReport(workspaceSlug: string, report: TReportKind, params: TReportParams): Promise<Blob> {
    return this.get(
      `${this.calendar(workspaceSlug)}/reports/${report}/`,
      { params: { ...params, export: "csv" } },
      { responseType: "blob" }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // --- weekly plan --------------------------------------------------------------------------

  async getWeeklyPlan(workspaceSlug: string, user?: string): Promise<TWeeklyPlanResponse> {
    return this.get(`${this.calendar(workspaceSlug)}/template/`, { params: user ? { user } : {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Replaces the weekly plan and writes it out for the coming weeks. */
  async saveWeeklyPlan(workspaceSlug: string, data: TWeeklyPlanPayload): Promise<TWeeklyPlanResponse> {
    return this.put(`${this.calendar(workspaceSlug)}/template/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // --- history ------------------------------------------------------------------------------

  async listAudit(workspaceSlug: string, params?: TCalendarAuditParams): Promise<TCalendarAuditResponse> {
    return this.get(`${this.calendar(workspaceSlug)}/audit/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
