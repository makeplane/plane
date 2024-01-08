import { APIService } from "services/api.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";
// types
import { IHomeDashboardResponse, IWidget, IWidgetStatsResponse, TWidgetKeys } from "@plane/types";

export class DashboardService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getHomeDashboardWidgets(workspaceSlug: string): Promise<IHomeDashboardResponse> {
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
    widgetKey: TWidgetKeys
  ): Promise<IWidgetStatsResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboard/${dashboardId}/`, {
      params: {
        widget_key: widgetKey,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getDashboardDetails(dashboardId: string): Promise<IWidgetStatsResponse> {
    return this.get(`/api/dashboard/${dashboardId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateDashboardWidget(dashboardId: string, widgetId: string, data: Partial<IWidget>): Promise<IWidget> {
    return this.patch(`/api/dashboard/${dashboardId}/widgets/${widgetId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
