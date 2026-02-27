import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";
import type {
  IDashboard,
  IDashboardWidget,
  IDashboardChartResponse,
  TDashboardCreate,
  TDashboardUpdate,
  TDashboardWidgetCreate,
  TDashboardWidgetUpdate,
} from "@plane/types";

interface IErrorResponse {
  response?: {
    data?: unknown;
  };
}

export class DashboardService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // Dashboards
  async getDashboards(workspaceSlug: string): Promise<IDashboard[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/`)
      .then((res) => (res?.data as IDashboard[]) ?? [])
      .catch((err: IErrorResponse) => {
        throw err?.response?.data;
      });
  }

  async getDashboard(workspaceSlug: string, dashboardId: string): Promise<IDashboard> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/`)
      .then((res) => res?.data as IDashboard)
      .catch((err: IErrorResponse) => {
        throw err?.response?.data;
      });
  }

  async createDashboard(workspaceSlug: string, data: TDashboardCreate): Promise<IDashboard> {
    return this.post(`/api/workspaces/${workspaceSlug}/dashboards/`, data)
      .then((res) => res?.data as IDashboard)
      .catch((err: IErrorResponse) => {
        throw err?.response?.data;
      });
  }

  async updateDashboard(workspaceSlug: string, dashboardId: string, data: TDashboardUpdate): Promise<IDashboard> {
    return this.patch(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/`, data)
      .then((res) => res?.data as IDashboard)
      .catch((err: IErrorResponse) => {
        throw err?.response?.data;
      });
  }

  async deleteDashboard(workspaceSlug: string, dashboardId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/`)
      .then(() => undefined)
      .catch((err: IErrorResponse) => {
        throw err?.response?.data;
      });
  }

  // Widgets
  async getWidgets(workspaceSlug: string, dashboardId: string): Promise<IDashboardWidget[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/`)
      .then((res) => (res?.data as IDashboardWidget[]) ?? [])
      .catch((err: IErrorResponse) => {
        throw err?.response?.data;
      });
  }

  async createWidget(
    workspaceSlug: string,
    dashboardId: string,
    data: TDashboardWidgetCreate
  ): Promise<IDashboardWidget> {
    return this.post(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/`, data)
      .then((res) => res?.data as IDashboardWidget)
      .catch((err: IErrorResponse) => {
        throw err?.response?.data;
      });
  }

  async updateWidget(
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: TDashboardWidgetUpdate
  ): Promise<IDashboardWidget> {
    return this.patch(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/`, data)
      .then((res) => res?.data as IDashboardWidget)
      .catch((err: IErrorResponse) => {
        throw err?.response?.data;
      });
  }

  async deleteWidget(workspaceSlug: string, dashboardId: string, widgetId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/`)
      .then(() => undefined)
      .catch((err: IErrorResponse) => {
        throw err?.response?.data;
      });
  }

  // Charts
  async getWidgetChartData(
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string
  ): Promise<IDashboardChartResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/charts/`)
      .then((res) => (res?.data as IDashboardChartResponse) ?? { data: [] })
      .catch((err: IErrorResponse) => {
        throw err?.response?.data;
      });
  }
}
