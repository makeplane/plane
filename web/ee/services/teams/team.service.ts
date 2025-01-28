// services
import { TTeam, TTeamEntities, TTeamMember } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class TeamService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Fetches all teams for a workspace
   * @param workspaceSlug
   * @returns Promise<TTeam[]>
   */
  async getAllTeams(workspaceSlug: string): Promise<TTeam[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Fetches a team for a workspace
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<TTeam>
   */
  async getTeam(workspaceSlug: string, teamId: string): Promise<TTeam> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Fetches all team members for a workspace
   * @param workspaceSlug
   * @returns Promise<TTeamMember[]>
   */
  async getAllTeamMembers(workspaceSlug: string): Promise<TTeamMember[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/team-members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Fetches all team members for a team
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<TTeamMember[]>
   */
  async getTeamMembers(workspaceSlug: string, teamId: string): Promise<TTeamMember[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Fetches team entities for a team
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<TTeamEntities>
   */
  async getTeamEntities(workspaceSlug: string, teamId: string): Promise<TTeamEntities> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/entities/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Creates a team for a workspace
   * @param workspaceSlug
   * @param data
   * @returns Promise<TTeam>
   */
  async createTeam(workspaceSlug: string, data: Partial<TTeam>): Promise<TTeam> {
    return this.post(`/api/workspaces/${workspaceSlug}/teams/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Updates a team for a workspace
   * @param workspaceSlug
   * @param teamId
   * @param data
   * @returns Promise<TTeam>
   */
  async updateTeam(workspaceSlug: string, teamId: string, data: Partial<TTeam>): Promise<TTeam> {
    return this.patch(`/api/workspaces/${workspaceSlug}/teams/${teamId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Adds team members to a team
   * @param workspaceSlug
   * @param teamId
   * @param memberIds
   * @returns Promise<TTeamMember[]>
   */
  async addTeamMembers(workspaceSlug: string, teamId: string, memberIds: string[]): Promise<TTeamMember[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/members/`, { member_ids: memberIds })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Removes a team member from a team
   * @param workspaceSlug
   * @param teamId
   * @param memberId
   * @returns Promise<void>
   */
  async removeTeamMember(workspaceSlug: string, teamId: string, memberId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teams/${teamId}/members/${memberId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Deletes a team for a workspace
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<void>
   */
  async deleteTeam(workspaceSlug: string, teamId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teams/${teamId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
