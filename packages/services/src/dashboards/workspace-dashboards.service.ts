// plane constants
import { API_BASE_URL } from "@plane/constants";
// plane types
import { TWorkspaceDashboard } from "@plane/types";
import { APIService } from "../api.service";

export class WorkspaceDashboardsService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves the list of dashboards for a specific workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @returns {Promise<TWorkspaceDashboard>} Promise resolving to dashboard data
   * @throws {Error} If the API request fails
   */
  async list(workspaceSlug: string): Promise<TWorkspaceDashboard[]> {
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
   * @returns {Promise<TWorkspaceDashboard>} Promise resolving to dashboard details
   * @throws {Error} If the API request fails
   */
  async retrieve(workspaceSlug: string, dashboardId: string): Promise<TWorkspaceDashboard> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboards/${dashboardId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new dashboard within a workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {Partial<TWorkspaceDashboard>} data - Partial dashboard data to create
   * @returns {Promise<TWorkspaceDashboard>} Promise resolving to the created dashboard data
   * @throws {Error} If the API request fails
   */
  async create(workspaceSlug: string, data: Partial<TWorkspaceDashboard>): Promise<TWorkspaceDashboard> {
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
   * @param {Partial<TWorkspaceDashboard>} data - Partial dashboard data to update
   * @returns {Promise<TWorkspaceDashboard>} Promise resolving to the updated dashboard data
   * @throws {Error} If the API request fails
   */
  async update(
    workspaceSlug: string,
    dashboardId: string,
    data: Partial<TWorkspaceDashboard>
  ): Promise<TWorkspaceDashboard> {
    return this.patch(`/api/workspaces/${workspaceSlug}/dashboard/${dashboardId}/`, data)
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
}
