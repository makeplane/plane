import { API_BASE_URL } from "@plane/constants";
import type { IWorkspace, TWorkspacePaginationInfo } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing instance workspaces
 * Handles CRUD operations on instance workspaces
 * @extends APIService
 */
export class InstanceWorkspaceService extends APIService {
  /**
   * Constructor for InstanceWorkspaceService
   * @param BASE_URL - Base URL for API requests
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves a paginated list of workspaces for the current instance
   * @param {string} nextPageCursor - Optional cursor to retrieve the next page of results
   * @returns {Promise<TWorkspacePaginationInfo>} Promise resolving to a paginated list of workspaces
   * @throws {Error} If the API request fails
   */
  async list(nextPageCursor?: string): Promise<TWorkspacePaginationInfo> {
    return this.get(`/api/instances/workspaces/`, {
      params: {
        cursor: nextPageCursor,
      },
    })
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
    const params = new URLSearchParams({ slug });
    return this.get(`/api/instances/workspace-slug-check/?${params.toString()}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new workspace
   * @param {Partial<IWorkspace>} data - Workspace data for creation
   * @returns {Promise<IWorkspace>} Promise resolving to the created workspace
   * @throws {Error} If the API request fails
   */
  async create(data: Partial<IWorkspace>): Promise<IWorkspace> {
    return this.post("/api/instances/workspaces/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
