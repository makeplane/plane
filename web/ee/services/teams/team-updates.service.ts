// plane imports
import { API_BASE_URL } from "@plane/constants";
import { TTeamActivity, TTeamReaction } from "@plane/types";
// plane web imports
import { TTeamComment } from "@/plane-web/types";
// services
import { APIService } from "@/services/api.service";

export class TeamUpdatesService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get team activities
   * @param workspaceSlug
   * @param teamId
   * @param param
   * @returns
   */
  async getTeamActivities(
    workspaceSlug: string,
    teamId: string,
    params:
      | {
        created_at__gt: string;
      }
      | object = {}
  ): Promise<TTeamActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/history/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Create a comment for a team
   * @param workspaceSlug
   * @param teamId
   * @param payload
   * @returns
   */
  async createTeamComment(
    workspaceSlug: string,
    teamId: string,
    payload: Partial<TTeamComment>
  ): Promise<TTeamComment> {
    return this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/comments/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Get team comments
   * @param workspaceSlug
   * @param teamId
   * @returns
   */
  async getTeamComments(workspaceSlug: string, teamId: string): Promise<TTeamComment[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/comments/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Update team comment
   * @param workspaceSlug
   * @param teamId
   * @param commentId
   * @param payload
   * @returns
   */
  async updateTeamComment(
    workspaceSlug: string,
    teamId: string,
    commentId: string,
    payload: Partial<TTeamComment>
  ): Promise<void> {
    return this.patch(`/api/workspaces/${workspaceSlug}/teams/${teamId}/comments/${commentId}/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Delete team comment
   * @param workspaceSlug
   * @param teamId
   * @param commentId
   * @returns
   */
  async deleteTeamComment(workspaceSlug: string, teamId: string, commentId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teams/${teamId}/comments/${commentId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Create a reaction on a comment
   * @param workspaceSlug
   * @param teamId
   * @param commentId
   * @param payload
   * @returns
   */
  async createTeamCommentReaction(
    workspaceSlug: string,
    teamId: string,
    commentId: string,
    payload: Partial<TTeamReaction>
  ): Promise<TTeamReaction> {
    return this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/comments/${commentId}/reactions/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Get team comment reactions
   * @param workspaceSlug
   * @param teamId
   * @param commentId
   * @returns
   */
  async getTeamCommentReactions(workspaceSlug: string, teamId: string, commentId: string): Promise<TTeamReaction[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/comments/${commentId}/reactions/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Delete team comment reaction
   * @param workspaceSlug
   * @param teamId
   * @param commentId
   * @param reactionId
   * @returns
   */
  async deleteTeamCommentReaction(
    workspaceSlug: string,
    teamId: string,
    commentId: string,
    reactionId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/teams/${teamId}/comments/${commentId}/reactions/${reactionId}/`
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
