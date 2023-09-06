// services
import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";

// types
import type {
  ICurrentUserResponse,
  IssueReaction,
  IssueCommentReaction,
  IssueReactionForm,
  IssueCommentReactionForm,
} from "types";

import getConfig from "next/config";
const { publicRuntimeConfig: { NEXT_PUBLIC_API_BASE_URL } } = getConfig();

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

class ReactionService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createIssueReaction(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: IssueReactionForm,
    user?: ICurrentUserResponse
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/reactions/`,
      data
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackReactionEvent(response?.data, "ISSUE_REACTION_CREATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listIssueReactions(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<IssueReaction[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/reactions/`
    )
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
    user?: ICurrentUserResponse
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/reactions/${reaction}/`
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackReactionEvent(response?.data, "ISSUE_REACTION_DELETE", user);
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
    user?: ICurrentUserResponse
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/comments/${commentId}/reactions/`,
      data
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackReactionEvent(
            response?.data,
            "ISSUE_COMMENT_REACTION_CREATE",
            user
          );
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
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/comments/${commentId}/reactions/`
    )
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
    user?: ICurrentUserResponse
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/comments/${commentId}/reactions/${reaction}/`
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackReactionEvent(
            response?.data,
            "ISSUE_COMMENT_REACTION_DELETE",
            user
          );
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const reactionService = new ReactionService();

export default reactionService;
