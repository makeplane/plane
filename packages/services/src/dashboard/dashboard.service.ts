import { API_BASE_URL } from "@plane/constants";
import type { THomeDashboardResponse, TWidget, TWidgetStatsResponse, TWidgetStatsRequestParams } from "@plane/types";
import { APIService } from "../api.service";

export default class DashboardService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves home dashboard widgets for a specific workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @returns {Promise<THomeDashboardResponse>} Promise resolving to dashboard widget data
   * @throws {Error} If the API request fails
   */
  async getHomeWidgets(workspaceSlug: string): Promise<THomeDashboardResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboard/`, {
      params: {
        dashboard_type: "home",
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Fetches statistics for a specific dashboard widget
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} dashboardId - The unique identifier for the dashboard
   * @param {TWidgetStatsRequestParams} params - Parameters for filtering widget statistics
   * @returns {Promise<TWidgetStatsResponse>} Promise resolving to widget statistics data
   * @throws {Error} If the API request fails
   */
  async getWidgetStats(
    workspaceSlug: string,
    dashboardId: string,
    params: TWidgetStatsRequestParams
  ): Promise<TWidgetStatsResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboard/${dashboardId}/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves detailed information about a specific dashboard
   * @param {string} dashboardId - The unique identifier for the dashboard
   * @returns {Promise<TWidgetStatsResponse>} Promise resolving to dashboard details
   * @throws {Error} If the API request fails
   */
  async retrieve(dashboardId: string): Promise<TWidgetStatsResponse> {
    return this.get(`/api/dashboard/${dashboardId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates a specific widget within a dashboard
   * @param {string} dashboardId - The unique identifier for the dashboard
   * @param {string} widgetId - The unique identifier for the widget
   * @param {Partial<TWidget>} data - Partial widget data to update
   * @returns {Promise<TWidget>} Promise resolving to the updated widget data
   * @throws {Error} If the API request fails
   */
  async updateWidget(dashboardId: string, widgetId: string, data: Partial<TWidget>): Promise<TWidget> {
    return this.patch(`/api/dashboard/${dashboardId}/widgets/${widgetId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export { DashboardService };
