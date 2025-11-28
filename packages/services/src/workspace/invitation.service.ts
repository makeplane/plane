import { API_BASE_URL } from "@plane/constants";
import type { IWorkspaceMemberInvitation, IWorkspaceBulkInviteFormData, IWorkspaceMember } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing workspace invitations
 * Handles operations related to inviting users to workspaces and managing invitations
 * @extends {APIService}
 */
export class WorkspaceInvitationService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves all workspace invitations for the current user
   * @returns {Promise<IWorkspaceMemberInvitation[]>} Promise resolving to array of workspace invitations
   * @throws {Error} If the API request fails
   */
  async userInvitations(): Promise<IWorkspaceMemberInvitation[]> {
    return this.get("/api/users/me/workspaces/invitations/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves all invitations for a specific workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @returns {Promise<IWorkspaceMemberInvitation[]>} Promise resolving to array of workspace invitations
   * @throws {Error} If the API request fails
   */
  async workspaceInvitations(workspaceSlug: string): Promise<IWorkspaceMemberInvitation[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/invitations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Sends bulk invitations to users for a workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {IWorkspaceBulkInviteFormData} data - Bulk invitation data containing user information
   * @returns {Promise<any>} Promise resolving to the invitation response
   * @throws {Error} If the API request fails
   */
  async invite(workspaceSlug: string, data: IWorkspaceBulkInviteFormData): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/invitations/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update Invitation
   * @param workspaceSlug
   * @param invitationId
   * @param data
   * @returns
   */
  async update(workspaceSlug: string, invitationId: string, data: Partial<IWorkspaceMember>): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/invitations/${invitationId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete Workspace invitation
   * @param workspaceSlug
   * @param invitationId
   * @returns
   */
  async destroy(workspaceSlug: string, invitationId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/invitations/${invitationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Accepts an invitation to join a workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} invitationId - The unique identifier for the invitation
   * @param {any} data - Additional data required for joining the workspace
   * @returns {Promise<any>} Promise resolving to the join response
   * @throws {Error} If the API request fails
   */
  async join(workspaceSlug: string, invitationId: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/invitations/${invitationId}/join/`, data, {
      headers: {},
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Accepts multiple workspace invitations at once
   * @param {any} data - Data containing information about invitations to accept
   * @returns {Promise<any>} Promise resolving to the bulk join response
   * @throws {Error} If the API request fails
   */
  async joinMany(data: any): Promise<any> {
    return this.post("/api/users/me/workspaces/invitations/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
