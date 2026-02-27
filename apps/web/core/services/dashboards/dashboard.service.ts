/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export class DashboardService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // Dashboards
  async getDashboards(workspaceSlug: string): Promise<any[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/`)
      .then((res) => res?.data ?? [])
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getDashboard(workspaceSlug: string, dashboardId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createDashboard(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/dashboards/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateDashboard(workspaceSlug: string, dashboardId: string, data: any): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteDashboard(workspaceSlug: string, dashboardId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/`)
      .then(() => undefined)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // Widgets
  async getWidgets(workspaceSlug: string, dashboardId: string): Promise<any[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/`)
      .then((res) => res?.data ?? [])
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createWidget(workspaceSlug: string, dashboardId: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateWidget(workspaceSlug: string, dashboardId: string, widgetId: string, data: any): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/`,
      data
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteWidget(workspaceSlug: string, dashboardId: string, widgetId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/`
    )
      .then(() => undefined)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // Charts
  async getWidgetChartData(workspaceSlug: string, dashboardId: string, widgetId: string): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/charts/`
    )
      .then((res) => res?.data ?? {})
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
