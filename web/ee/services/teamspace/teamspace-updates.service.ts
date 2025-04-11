// plane imports
import { API_BASE_URL } from "@plane/constants";
import { TTeamspaceActivity, TTeamspaceReaction, TIssueComment } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class TeamspaceUpdatesService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get teamspace activities
   * @param workspaceSlug
   * @param teamspaceId
   * @param param
   * @returns
   */
  async getTeamspaceActivities(
    workspaceSlug: string,
    teamspaceId: string,
    params:
      | {
          created_at__gt: string;
        }
      | object = {}
  ): Promise<TTeamspaceActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/history/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Create a comment for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @param payload
   * @returns
   */
  async createTeamspaceComment(
    workspaceSlug: string,
    teamspaceId: string,
    payload: Partial<TIssueComment>
  ): Promise<TIssueComment> {
    return this.post(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/comments/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Get teamspace comments
   * @param workspaceSlug
   * @param teamspaceId
   * @returns
   */
  async getTeamspaceComments(workspaceSlug: string, teamspaceId: string): Promise<TIssueComment[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/comments/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Update teamspace comment
   * @param workspaceSlug
   * @param teamspaceId
   * @param commentId
   * @param payload
   * @returns
   */
  async updateTeamspaceComment(
    workspaceSlug: string,
    teamspaceId: string,
    commentId: string,
    payload: Partial<TIssueComment>
  ): Promise<TIssueComment> {
    return this.patch(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/comments/${commentId}/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Delete teamspace comment
   * @param workspaceSlug
   * @param teamspaceId
   * @param commentId
   * @returns
   */
  async deleteTeamspaceComment(workspaceSlug: string, teamspaceId: string, commentId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/comments/${commentId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Create a reaction on a comment
   * @param workspaceSlug
   * @param teamspaceId
   * @param commentId
   * @param payload
   * @returns
   */
  async createTeamspaceCommentReaction(
    workspaceSlug: string,
    teamspaceId: string,
    commentId: string,
    payload: Partial<TTeamspaceReaction>
  ): Promise<TTeamspaceReaction> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/comments/${commentId}/reactions/`,
      payload
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Get teamspace comment reactions
   * @param workspaceSlug
   * @param teamspaceId
   * @param commentId
   * @returns
   */
  async getTeamspaceCommentReactions(
    workspaceSlug: string,
    teamspaceId: string,
    commentId: string
  ): Promise<TTeamspaceReaction[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/comments/${commentId}/reactions/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * Delete teamspace comment reaction
   * @param workspaceSlug
   * @param teamspaceId
   * @param commentId
   * @param reactionId
   * @returns
   */
  async deleteTeamspaceCommentReaction(
    workspaceSlug: string,
    teamspaceId: string,
    commentId: string,
    reactionId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/comments/${commentId}/reactions/${reactionId}/`
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
