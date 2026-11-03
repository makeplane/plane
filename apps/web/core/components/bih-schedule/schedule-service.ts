/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";
import type { TDependencyType } from "@/components/gantt-chart/dependencies/dependency-utils";

export type TScheduleHoliday = { id: string; date: string; name: string };
export type TScheduleSettings = { working_weekdays: number[]; holidays: TScheduleHoliday[] };
export type TIssueLag = { predecessor: string; successor: string; lag_days: number; dep_type?: TDependencyType };

class ScheduleService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getSettings(workspaceSlug: string): Promise<TScheduleSettings> {
    return (await this.get(`/api/workspaces/${workspaceSlug}/schedule-settings/`)).data;
  }

  async updateSettings(workspaceSlug: string, weekdays: number[]): Promise<TScheduleSettings> {
    return (await this.patch(`/api/workspaces/${workspaceSlug}/schedule-settings/`, { working_weekdays: weekdays }))
      .data;
  }

  async addHoliday(workspaceSlug: string, holiday: { date: string; name?: string }): Promise<TScheduleHoliday> {
    return (await this.post(`/api/workspaces/${workspaceSlug}/schedule-settings/holidays/`, holiday)).data;
  }

  async addVietnameseHolidays(workspaceSlug: string, year: number): Promise<TScheduleSettings> {
    return (
      await this.post(`/api/workspaces/${workspaceSlug}/schedule-settings/holidays/`, { preset: "vn_fixed", year })
    ).data;
  }

  async deleteHoliday(workspaceSlug: string, holidayId: string): Promise<void> {
    await this.delete(`/api/workspaces/${workspaceSlug}/schedule-settings/holidays/${holidayId}/`);
  }

  async getLags(workspaceSlug: string, projectId: string): Promise<TIssueLag[]> {
    return (await this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-lags/`)).data;
  }

  async getWorkspaceLags(workspaceSlug: string): Promise<TIssueLag[]> {
    return (await this.get(`/api/workspaces/${workspaceSlug}/issue-lags/`)).data;
  }

  async setWorkspaceLag(
    workspaceSlug: string,
    predecessor: string,
    successor: string,
    lagDays: number
  ): Promise<TIssueLag> {
    return (
      await this.post(`/api/workspaces/${workspaceSlug}/issue-lags/`, { predecessor, successor, lag_days: lagDays })
    ).data;
  }

  async setLag(
    workspaceSlug: string,
    projectId: string,
    predecessor: string,
    successor: string,
    lagDays: number,
    depType?: TDependencyType
  ): Promise<TIssueLag> {
    return (
      await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-lags/`, {
        predecessor,
        successor,
        lag_days: lagDays,
        ...(depType ? { dep_type: depType } : {}),
      })
    ).data;
  }
}

export const scheduleService = new ScheduleService();
