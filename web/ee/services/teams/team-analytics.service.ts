// plane constants
import { API_BASE_URL } from "@plane/constants";
// plane imports
import { TTeamDependencies, TTeamStatistics, TTeamWorkloadSummary } from "@plane/types";
// plane web imports
import { TStatisticsFilter, TTeamWorkloadChart, TWorkloadFilter } from "@/plane-web/types/teams";
// services
import { APIService } from "@/services/api.service";

export class TeamAnalyticsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get team workload chart details
   * @param workspaceSlug
   * @param teamId
   * @param params
   * @returns TWorkloadResponse
   */
  async getTeamWorkloadChart(
    workspaceSlug: string,
    teamId: string,
    params: TWorkloadFilter
  ): Promise<TTeamWorkloadChart> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/workload-chart/`, {
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
   * Get team workload summary
   * @param workspaceSlug
   * @param teamId
   * @returns TTeamWorkloadSummary
   */
  async getTeamWorkloadSummary(workspaceSlug: string, teamId: string): Promise<TTeamWorkloadSummary> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/workload-summary/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get team dependencies
   * @param workspaceSlug
   * @param teamId
   * @returns
   */
  async getTeamDependencies(workspaceSlug: string, teamId: string): Promise<TTeamDependencies> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/dependencies/`)
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
