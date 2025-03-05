// plane constants
import { API_BASE_URL } from "@plane/constants";
// plane types
import { TDashboardWidget, TDashboard, TDashboardWidgetsLayoutPayload, TDashboardWidgetData } from "@plane/types";
import { APIService } from "../api.service";

export class WorkspaceDashboardsService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves the list of dashboards for a specific workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @returns {Promise<TDashboard[]>} Promise resolving to dashboards data
   * @throws {Error} If the API request fails
   */
  async list(workspaceSlug: string): Promise<TDashboard[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves detailed information about a specific dashboard
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} dashboardId - The unique identifier for the dashboard
   * @returns {Promise<TDashboard>} Promise resolving to dashboard details
   * @throws {Error} If the API request fails
   */
  async retrieve(workspaceSlug: string, dashboardId: string): Promise<TDashboard> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new dashboard within a workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {Partial<TDashboard>} data - Partial dashboard data to create
   * @returns {Promise<TDashboard>} Promise resolving to the created dashboard data
   * @throws {Error} If the API request fails
   */
  async create(workspaceSlug: string, data: Partial<TDashboard>): Promise<TDashboard> {
    return this.post(`/api/workspaces/${workspaceSlug}/dashboards/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates a specific dashboard within a workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} dashboardId - The unique identifier for the dashboard
   * @param {Partial<TDashboard>} data - Partial dashboard data to update
   * @returns {Promise<TDashboard>} Promise resolving to the updated dashboard data
   * @throws {Error} If the API request fails
   */
  async update(workspaceSlug: string, dashboardId: string, data: Partial<TDashboard>): Promise<TDashboard> {
    return this.patch(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Removes a specific dashboard within a workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} dashboardId - The unique identifier for the dashboard
   * @throws {Error} If the API request fails
   */
  async destroy(workspaceSlug: string, dashboardId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves the list of widgets for a specific dashboard
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} dashboardId - The unique identifier for the dashboard
   * @returns {Promise<TDashboardWidget[]>} Promise resolving to widgets data
   * @throws {Error} If the API request fails
   */
  async listWidgets(workspaceSlug: string, dashboardId: string): Promise<TDashboardWidget[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves detailed information about a specific widget
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} dashboardId - The unique identifier for the dashboard
   * @param {string} widgetId - The unique identifier for the widget
   * @returns {Promise<TDashboardWidget>} Promise resolving to widget details
   * @throws {Error} If the API request fails
   */
  async retrieveWidget(workspaceSlug: string, dashboardId: string, widgetId: string): Promise<TDashboardWidget> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new widget within a dashboard
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} dashboardId - The unique identifier for the dashboard
   * @param {Partial<TDashboardWidget>} data - Partial widget data to create
   * @returns {Promise<TDashboardWidget>} Promise resolving to the created widget data
   * @throws {Error} If the API request fails
   */
  async createWidget(
    workspaceSlug: string,
    dashboardId: string,
    data: Partial<TDashboardWidget>
  ): Promise<TDashboardWidget> {
    return this.post(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates a specific widget within a dashboard
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} dashboardId - The unique identifier for the dashboard
   * @param {string} widgetId - The unique identifier for the widget
   * @param {Partial<TDashboardWidget>} data - Partial widget data to update
   * @returns {Promise<TDashboardWidget>} Promise resolving to the updated widget data
   * @throws {Error} If the API request fails
   */
  async updateWidget(
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: Partial<TDashboardWidget>
  ): Promise<TDashboardWidget> {
    return this.patch(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates a specific dashboard within a workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} dashboardId - The unique identifier for the dashboard
   * @param {TDashboardWidgetsLayoutPayload[]} data - Partial widget data to update
   * @throws {Error} If the API request fails
   */
  async updateWidgetsLayout(
    workspaceSlug: string,
    dashboardId: string,
    data: TDashboardWidgetsLayoutPayload[]
  ): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/bulk-update-widgets/`, {
      widgets: data,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Removes a specific widget within a dashboard
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} dashboardId - The unique identifier for the dashboard
   * @param {string} widgetId - The unique identifier for the widget
   * @throws {Error} If the API request fails
   */
  async destroyWidget(workspaceSlug: string, dashboardId: string, widgetId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves the data for a specific widget
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} dashboardId - The unique identifier for the dashboard
   * @param {string} widgetId - The unique identifier for the widget
   * @param {Partial<TDashboardWidget>} params - The params for the widget data
   * @returns {Promise<TDashboardWidgetData>} Promise resolving to the updated widget data
   * @throws {Error} If the API request fails
   */
  async retrieveWidgetData(
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string
  ): Promise<TDashboardWidgetData> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/widgets/${widgetId}/charts/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
