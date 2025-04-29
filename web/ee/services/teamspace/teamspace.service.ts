// services
import { TTeamspace, TTeamspaceEntities, TTeamspaceMember } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class TeamspaceSpace extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Fetches all teamspaces for a workspace
   * @param workspaceSlug
   * @returns Promise<TTeamspace[]>
   */
  async getAllTeamspaces(workspaceSlug: string): Promise<TTeamspace[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Fetches a teamspace for a workspace
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<TTeamspace>
   */
  async getTeamspace(workspaceSlug: string, teamspaceId: string): Promise<TTeamspace> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Fetches all team members for a workspace
   * @param workspaceSlug
   * @returns Promise<TTeamspaceMember[]>
   */
  async getAllTeamspaceMembers(workspaceSlug: string): Promise<TTeamspaceMember[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspace-members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Fetches all team members for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<TTeamspaceMember[]>
   */
  async getTeamspaceMembers(workspaceSlug: string, teamspaceId: string): Promise<TTeamspaceMember[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Fetches teamspace entities for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<TTeamspaceEntities>
   */
  async getTeamspaceEntities(workspaceSlug: string, teamspaceId: string): Promise<TTeamspaceEntities> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/entities/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Creates a teamspace for a workspace
   * @param workspaceSlug
   * @param data
   * @returns Promise<TTeamspace>
   */
  async createTeamspace(workspaceSlug: string, data: Partial<TTeamspace>): Promise<TTeamspace> {
    return this.post(`/api/workspaces/${workspaceSlug}/teamspaces/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Updates a teamspace for a workspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param data
   * @returns Promise<TTeamspace>
   */
  async updateTeamspace(workspaceSlug: string, teamspaceId: string, data: Partial<TTeamspace>): Promise<TTeamspace> {
    return this.patch(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Adds team members to a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param memberIds
   * @returns Promise<TTeamspaceMember[]>
   */
  async addTeamspaceMembers(workspaceSlug: string, teamspaceId: string, memberIds: string[]): Promise<TTeamspaceMember[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/members/`, { member_ids: memberIds })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Removes a team member from a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param memberId
   * @returns Promise<void>
   */
  async removeTeamspaceMember(workspaceSlug: string, teamspaceId: string, memberId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/members/${memberId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Deletes a teamspace for a workspace
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<void>
   */
  async deleteTeamspace(workspaceSlug: string, teamspaceId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
