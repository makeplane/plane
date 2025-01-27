import { API_BASE_URL } from "@plane/constants";
import type { CycleDateCheckData, ICycle, TIssuesResponse, IWorkspaceActiveCyclesResponse } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing cycles within a workspace and project context.
 * Extends APIService to handle HTTP requests to the cycle-related endpoints.
 * @extends {APIService}
 */
export class CycleService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves paginated list of active cycles in a workspace.
   * @param {string} workspaceSlug - The workspace identifier
   * @param {string} cursor - The pagination cursor
   * @param {number} per_page - Number of items per page
   * @returns {Promise<IWorkspaceActiveCyclesResponse>} Paginated active cycles data
   * @throws {Error} If the request fails
   */
  async workspaceActiveCycles(
    workspaceSlug: string,
    cursor: string,
    per_page: number
  ): Promise<IWorkspaceActiveCyclesResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/active-cycles/`, {
      params: {
        per_page,
        cursor,
      },
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Gets all cycles in a workspace.
   * @param {string} workspaceSlug - The workspace identifier
   * @returns {Promise<ICycle[]>} Array of cycle objects
   * @throws {Error} If the request fails
   */
  async getWorkspaceCycles(workspaceSlug: string): Promise<ICycle[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/cycles/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new cycle in a project.
   * @param {string} workspaceSlug - The workspace identifier
   * @param {string} projectId - The project identifier
   * @param {any} data - The cycle creation data
   * @returns {Promise<ICycle>} The created cycle object
   * @throws {Error} If the request fails
   */
  async create(workspaceSlug: string, projectId: string, data: any): Promise<ICycle> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves cycles with optional filtering parameters.
   * @param {string} workspaceSlug - The workspace identifier
   * @param {string} projectId - The project identifier
   * @param {"current"} [cycleType] - Optional filter for cycle type
   * @returns {Promise<ICycle[]>} Array of filtered cycle objects
   * @throws {Error} If the request fails
   */
  async getWithParams(workspaceSlug: string, projectId: string, cycleType?: "current"): Promise<ICycle[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/`, {
      params: {
        cycle_view: cycleType,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves detailed information for a specific cycle.
   * @param {string} workspaceSlug - The workspace identifier
   * @param {string} projectId - The project identifier
   * @param {string} cycleId - The cycle identifier
   * @returns {Promise<ICycle>} The cycle details
   * @throws {Error} If the request fails
   */
  async retrieve(workspaceSlug: string, projectId: string, cycleId: string): Promise<ICycle> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Retrieves issues associated with a specific cycle.
   * @param {string} workspaceSlug - The workspace identifier
   * @param {string} projectId - The project identifier
   * @param {string} cycleId - The cycle identifier
   * @param {any} [queries] - Optional query parameters
   * @param {object} [config={}] - Optional request configuration
   * @returns {Promise<TIssuesResponse>} The cycle issues data
   * @throws {Error} If the request fails
   */
  async getCycleIssues(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    queries?: any,
    config = {}
  ): Promise<TIssuesResponse> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/`,
      {
        params: queries,
      },
      config
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates a cycle with partial data.
   * @param {string} workspaceSlug - The workspace identifier
   * @param {string} projectId - The project identifier
   * @param {string} cycleId - The cycle identifier
   * @param {Partial<ICycle>} data - The partial cycle data to update
   * @returns {Promise<any>} The update response
   * @throws {Error} If the request fails
   */
  async update(workspaceSlug: string, projectId: string, cycleId: string, data: Partial<ICycle>): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a specific cycle.
   * @param {string} workspaceSlug - The workspace identifier
   * @param {string} projectId - The project identifier
   * @param {string} cycleId - The cycle identifier
   * @returns {Promise<any>} The deletion response
   * @throws {Error} If the request fails
   */
  async destroy(workspaceSlug: string, projectId: string, cycleId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Validates cycle dates.
   * @param {string} workspaceSlug - The workspace identifier
   * @param {string} projectId - The project identifier
   * @param {CycleDateCheckData} data - The date check data
   * @returns {Promise<any>} The validation response
   * @throws {Error} If the request fails
   */
  async validateDates(workspaceSlug: string, projectId: string, data: CycleDateCheckData): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/date-check/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
