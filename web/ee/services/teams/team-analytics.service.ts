// plane constants
import { API_BASE_URL } from "@plane/constants";
// plane imports
import { TTeamRelations, TTeamStatistics, TTeamProgressSummary } from "@plane/types";
// plane web imports
import { TStatisticsFilter, TTeamProgressChart, TWorkloadFilter } from "@/plane-web/types/teams";
// services
import { APIService } from "@/services/api.service";

export class TeamAnalyticsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get team progress chart details
   * @param workspaceSlug
   * @param teamId
   * @param params
   * @returns TWorkloadResponse
   */
  async getTeamProgressChart(
    workspaceSlug: string,
    teamId: string,
    params: TWorkloadFilter
  ): Promise<TTeamProgressChart> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/progress-chart/`, {
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
   * Get team progress summary
   * @param workspaceSlug
   * @param teamId
   * @returns TTeamProgressSummary
   */
  async getTeamProgressSummary(workspaceSlug: string, teamId: string): Promise<TTeamProgressSummary> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/progress-summary/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get team relations
   * @param workspaceSlug
   * @param teamId
   * @returns
   */
  async getTeamRelations(workspaceSlug: string, teamId: string): Promise<TTeamRelations> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/relations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get team statistics
   * @param workspaceSlug
   * @param teamId
   * @param params
   * @returns
   */
  async getTeamStatistics(workspaceSlug: string, teamId: string, params: TStatisticsFilter): Promise<TTeamStatistics> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/statistics/`, {
      params: {
        scope: params.scope,
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
