import { API_BASE_URL } from "helpers/common.helper";
// services
import { APIService } from "services/api.service";
import { TrackEventService } from "services/track_event.service";
// types
import type { IUser, IssueReaction, IssueCommentReaction, IssueReactionForm, IssueCommentReactionForm } from "types";

const trackEventService = new TrackEventService();

export class IssueReactionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createIssueReaction(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: IssueReactionForm,
    user?: IUser
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/reactions/`, data)
      .then((response) => {
        trackEventService.trackReactionEvent(response?.data, "ISSUE_REACTION_CREATE", user as IUser);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listIssueReactions(workspaceSlug: string, projectId: string, issueId: string): Promise<IssueReaction[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/reactions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueReaction(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    reaction: string,
    user?: IUser
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/reactions/${reaction}/`
    )
      .then((response) => {
        trackEventService.trackReactionEvent(response?.data, "ISSUE_REACTION_DELETE", user as IUser);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueCommentReaction(
    workspaceSlug: string,
    projectId: string,
    commentId: string,
    data: IssueCommentReactionForm,
    user?: IUser
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/comments/${commentId}/reactions/`, data)
      .then((response) => {
        trackEventService.trackReactionEvent(response?.data, "ISSUE_COMMENT_REACTION_CREATE", user as IUser);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listIssueCommentReactions(
    workspaceSlug: string,
    projectId: string,
    commentId: string
  ): Promise<IssueCommentReaction[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/comments/${commentId}/reactions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueCommentReaction(
    workspaceSlug: string,
    projectId: string,
    commentId: string,
    reaction: string,
    user?: IUser
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/comments/${commentId}/reactions/${reaction}/`
    )
      .then((response) => {
        trackEventService.trackReactionEvent(response?.data, "ISSUE_COMMENT_REACTION_DELETE", user as IUser);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
