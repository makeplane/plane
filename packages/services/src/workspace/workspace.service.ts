import { API_BASE_URL } from "@plane/constants";
import type { IWorkspace, ILastActiveWorkspaceDetails, IWorkspaceSearchResults } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing workspace operations
 * Handles CRUD operations and various workspace-related functionalities
 * @extends {APIService}
 */
export class WorkspaceService extends APIService {
  /**
   * Creates an instance of WorkspaceService
   * @param {string} baseUrl - The base URL for API requests
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }
  /**
   * Retrieves all workspaces for the current user
   * @returns {Promise<IWorkspace[]>} Promise resolving to an array of workspaces
   * @throws {Error} If the API request fails
   */
  async list(): Promise<IWorkspace[]> {
    return this.get("/api/users/me/workspaces/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves details of a specific workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @returns {Promise<IWorkspace>} Promise resolving to workspace details
   * @throws {Error} If the API request fails
   */
  async retrieve(workspaceSlug: string): Promise<IWorkspace> {
    return this.get(`/api/workspaces/${workspaceSlug}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Creates a new workspace
   * @param {Partial<IWorkspace>} data - Workspace data for creation
   * @returns {Promise<IWorkspace>} Promise resolving to the created workspace
   * @throws {Error} If the API request fails
   */
  async create(data: Partial<IWorkspace>): Promise<IWorkspace> {
    return this.post("/api/workspaces/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an existing workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {Partial<IWorkspace>} data - Updated workspace data
   * @returns {Promise<IWorkspace>} Promise resolving to the updated workspace
   * @throws {Error} If the API request fails
   */
  async update(workspaceSlug: string, data: Partial<IWorkspace>): Promise<IWorkspace> {
    return this.patch(`/api/workspaces/${workspaceSlug}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @returns {Promise<any>} Promise resolving to the deletion response
   * @throws {Error} If the API request fails
   */
  async destroy(workspaceSlug: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves information about the user's last visited workspace
   * @returns {Promise<ILastActiveWorkspaceDetails>} Promise resolving to last active workspace details
   * @throws {Error} If the API request fails
   */
  async lastVisited(): Promise<ILastActiveWorkspaceDetails> {
    return this.get("/api/users/last-visited-workspace/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Checks if a workspace slug is available
   * @param {string} slug - The workspace slug to check
   * @returns {Promise<any>} Promise resolving to slug availability status
   * @throws {Error} If the API request fails
   */
  async slugCheck(slug: string): Promise<any> {
    return this.get(`/api/workspace-slug-check/?slug=${slug}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Searches within a workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {Object} params - Search parameters
   * @param {string} [params.project_id] - Optional project ID to scope the search
   * @param {string} params.search - Search query string
   * @param {boolean} params.workspace_search - Whether to search across the entire workspace
   * @returns {Promise<IWorkspaceSearchResults>} Promise resolving to search results
   * @throws {Error} If the API request fails
   */
  async search(
    workspaceSlug: string,
    params: {
      project_id?: string;
      search: string;
      workspace_search: boolean;
    }
  ): Promise<IWorkspaceSearchResults> {
    return this.get(`/api/workspaces/${workspaceSlug}/search/`, {
      params,
    })
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
