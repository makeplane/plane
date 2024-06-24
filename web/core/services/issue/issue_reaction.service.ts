import type { TIssueCommentReaction, TIssueReaction } from "@plane/types";
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";
// types

export class IssueReactionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createIssueReaction(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueReaction>
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/reactions/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listIssueReactions(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueReaction[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/reactions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueReaction(workspaceSlug: string, projectId: string, issueId: string, reaction: string): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/reactions/${reaction}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueCommentReaction(
    workspaceSlug: string,
    projectId: string,
    commentId: string,
    data: Partial<TIssueCommentReaction>
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/comments/${commentId}/reactions/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listIssueCommentReactions(
    workspaceSlug: string,
    projectId: string,
    commentId: string
  ): Promise<TIssueCommentReaction[]> {
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
    reaction: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/comments/${commentId}/reactions/${reaction}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
