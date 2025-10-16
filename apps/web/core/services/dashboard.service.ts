import { API_BASE_URL } from "@plane/constants";
import type { THomeDashboardResponse, TWidget, TWidgetStatsResponse, TWidgetStatsRequestParams } from "@plane/types";
import { APIService } from "@/services/api.service";
// helpers
// types

export class DashboardService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getHomeDashboardWidgets(workspaceSlug: string): Promise<THomeDashboardResponse> {
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

  async getDashboardDetails(dashboardId: string): Promise<TWidgetStatsResponse> {
    return this.get(`/api/dashboard/${dashboardId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateDashboardWidget(dashboardId: string, widgetId: string, data: Partial<TWidget>): Promise<TWidget> {
    return this.patch(`/api/dashboard/${dashboardId}/widgets/${widgetId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
