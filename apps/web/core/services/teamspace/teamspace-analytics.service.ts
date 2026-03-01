/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// plane constants
import { API_BASE_URL } from "@plane/constants";
// plane imports
import type { TTeamspaceRelations, TTeamspaceStatistics, TTeamspaceProgressSummary } from "@plane/types";
// plane web imports
import type { TStatisticsFilter, TTeamspaceProgressChart, TWorkloadFilter } from "@/types/teamspace";
// services
import { APIService } from "@/services/api.service";

export class TeamspaceAnalyticsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get teamspace progress chart details
   * @param workspaceSlug
   * @param teamspaceId
   * @param params
   * @returns TWorkloadResponse
   */
  async getTeamspaceProgressChart(
    workspaceSlug: string,
    teamspaceId: string,
    params: TWorkloadFilter
  ): Promise<TTeamspaceProgressChart> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/progress-chart/`, {
      params: {
        x_axis: params.xAxisKey,
        y_axis: params.yAxisKey,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get teamspace progress summary
   * @param workspaceSlug
   * @param teamspaceId
   * @returns TTeamspaceProgressSummary
   */
  async getTeamspaceProgressSummary(workspaceSlug: string, teamspaceId: string): Promise<TTeamspaceProgressSummary> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/progress-summary/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get teamspace relations
   * @param workspaceSlug
   * @param teamspaceId
   * @returns
   */
  async getTeamspaceRelations(workspaceSlug: string, teamspaceId: string): Promise<TTeamspaceRelations> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/relations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get teamspace statistics
   * @param workspaceSlug
   * @param teamspaceId
   * @param params
   * @returns
   */
  async getTeamspaceStatistics(
    workspaceSlug: string,
    teamspaceId: string,
    params: TStatisticsFilter
  ): Promise<TTeamspaceStatistics> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/statistics/`, {
      params: {
        data_key: params.data_key,
        dependency_type: params.dependency_type,
        state_group: params.state_group.map((val) => val?.toString()).join(","),
        target_date: params.target_date.map((val) => val?.toString()).join(","),
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
