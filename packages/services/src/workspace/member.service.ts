import { API_BASE_URL } from "@plane/constants";
import type { IWorkspaceMemberMe, IWorkspaceMember, IUserProjectsRole } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing workspace members
 * Handles operations related to workspace membership, including member information,
 * updates, deletions, and role management
 * @extends {APIService}
 */
export class WorkspaceMemberService extends APIService {
  /**
   * Creates an instance of WorkspaceMemberService
   * @param {string} baseUrl - The base URL for API requests
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves current user's information for a specific workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @returns {Promise<IWorkspaceMemberMe>} Promise resolving to current user's workspace member information
   * @throws {Error} If the API request fails
   */
  async myInfo(workspaceSlug: string): Promise<IWorkspaceMemberMe> {
    return this.get(`/api/workspaces/${workspaceSlug}/workspace-members/me/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Retrieves all members of a specific workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @returns {Promise<IWorkspaceMember[]>} Promise resolving to array of workspace members
   * @throws {Error} If the API request fails
   */
  async list(workspaceSlug: string): Promise<IWorkspaceMember[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates a workspace member's information
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} memberId - The unique identifier for the member
   * @param {Partial<IWorkspaceMember>} data - Updated member data
   * @returns {Promise<IWorkspaceMember>} Promise resolving to the updated member information
   * @throws {Error} If the API request fails
   */
  async update(workspaceSlug: string, memberId: string, data: Partial<IWorkspaceMember>): Promise<IWorkspaceMember> {
    return this.patch(`/api/workspaces/${workspaceSlug}/members/${memberId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Removes a member from a workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} memberId - The unique identifier for the member to remove
   * @returns {Promise<any>} Promise resolving to the deletion response
   * @throws {Error} If the API request fails
   */
  async destroy(workspaceSlug: string, memberId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/members/${memberId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves the current user's project roles within a workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @returns {Promise<IUserProjectsRole>} Promise resolving to user's project roles
   * @throws {Error} If the API request fails
   */
  async getWorkspaceUserProjectsRole(workspaceSlug: string): Promise<IUserProjectsRole> {
    return this.get(`/api/users/me/workspaces/${workspaceSlug}/project-roles/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
