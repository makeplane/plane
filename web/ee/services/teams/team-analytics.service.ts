// plane constants
import { API_BASE_URL } from "@plane/constants";
// plane imports
import { TWorkloadFilter, TTeamWorkload, TTeamDependencies, TTeamStatistics, TStatisticsFilter } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class TeamAnalyticsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get team workload
   * @param workspaceSlug
   * @param teamId
   * @param param
   * @returns TWorkloadResponse
   */
  async getTeamWorkload(workspaceSlug: string, teamId: string, params: TWorkloadFilter): Promise<TTeamWorkload> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/workloads/`, {
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
   * @returns
   */
  async getTeamStatistics(workspaceSlug: string, teamId: string, params: TStatisticsFilter): Promise<TTeamStatistics> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/statistics/`, {
      params: {
        data_key: params.dataKey,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
