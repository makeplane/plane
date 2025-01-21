import { API_BASE_URL } from "@plane/constants";
import type { TCycleDistribution, TProgressSnapshot, TCycleEstimateDistribution } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing cycles within a workspace and project context.
 * Extends APIService to handle HTTP requests to the cycle-related endpoints.
 * @extends {APIService}
 */
export class CycleAnalyticsService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves analytics for active cycles in a workspace.
   * @param {string} workspaceSlug - The workspace identifier
   * @param {string} projectId - The project identifier
   * @param {string} cycleId - The cycle identifier
   * @param {string} [analytic_type="points"] - The type of analytics to retrieve
   * @returns {Promise<TCycleDistribution | TCycleEstimateDistribution>} The cycle analytics data
   * @throws {Error} If the request fails
   */
  async workspaceActiveCyclesAnalytics(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    analytic_type: string = "points"
  ): Promise<TCycleDistribution | TCycleEstimateDistribution> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/analytics?type=${analytic_type}`
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Retrieves progress data for active cycles.
   * @param {string} workspaceSlug - The workspace identifier
   * @param {string} projectId - The project identifier
   * @param {string} cycleId - The cycle identifier
   * @returns {Promise<TProgressSnapshot>} The cycle progress data
   * @throws {Error} If the request fails
   */
  async workspaceActiveCyclesProgress(
    workspaceSlug: string,
    projectId: string,
    cycleId: string
  ): Promise<TProgressSnapshot> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/progress/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Retrieves advanced progress data for active cycles (Pro feature).
   * @param {string} workspaceSlug - The workspace identifier
   * @param {string} projectId - The project identifier
   * @param {string} cycleId - The cycle identifier
   * @returns {Promise<TProgressSnapshot>} The detailed cycle progress data
   * @throws {Error} If the request fails
   */
  async workspaceActiveCyclesProgressPro(
    workspaceSlug: string,
    projectId: string,
    cycleId: string
  ): Promise<TProgressSnapshot> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-progress/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
