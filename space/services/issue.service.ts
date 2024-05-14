import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

class IssueService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getPublicIssues(workspace_slug: string, project_slug: string, params: any): Promise<any> {
    return this.get(`/api/public/workspaces/${workspace_slug}/project-boards/${project_slug}/issues/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getIssueById(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.get(`/api/public/workspaces/${workspaceSlug}/project-boards/${projectId}/issues/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getIssueVotes(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.get(`/api/public/workspaces/${workspaceSlug}/project-boards/${projectId}/issues/${issueId}/votes/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createIssueVote(workspaceSlug: string, projectId: string, issueId: string, data: any): Promise<any> {
    return this.post(
      `/api/public/workspaces/${workspaceSlug}/project-boards/${projectId}/issues/${issueId}/votes/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteIssueVote(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.delete(`/api/public/workspaces/${workspaceSlug}/project-boards/${projectId}/issues/${issueId}/votes/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getIssueReactions(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.get(`/api/public/workspaces/${workspaceSlug}/project-boards/${projectId}/issues/${issueId}/reactions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createIssueReaction(workspaceSlug: string, projectId: string, issueId: string, data: any): Promise<any> {
    return this.post(
      `/api/public/workspaces/${workspaceSlug}/project-boards/${projectId}/issues/${issueId}/reactions/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteIssueReaction(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    reactionId: string
  ): Promise<any> {
    return this.delete(
      `/api/public/workspaces/${workspaceSlug}/project-boards/${projectId}/issues/${issueId}/reactions/${reactionId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getIssueComments(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.get(`/api/public/workspaces/${workspaceSlug}/project-boards/${projectId}/issues/${issueId}/comments/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createIssueComment(workspaceSlug: string, projectId: string, issueId: string, data: any): Promise<any> {
    return this.post(
      `/api/public/workspaces/${workspaceSlug}/project-boards/${projectId}/issues/${issueId}/comments/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateIssueComment(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    data: any
  ): Promise<any> {
    return this.patch(
      `/api/public/workspaces/${workspaceSlug}/project-boards/${projectId}/issues/${issueId}/comments/${commentId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteIssueComment(workspaceSlug: string, projectId: string, issueId: string, commentId: string): Promise<any> {
    return this.delete(
      `/api/public/workspaces/${workspaceSlug}/project-boards/${projectId}/issues/${issueId}/comments/${commentId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createCommentReaction(
    workspaceSlug: string,
    projectId: string,
    commentId: string,
    data: {
      reaction: string;
    }
  ): Promise<any> {
    return this.post(
      `/api/public/workspaces/${workspaceSlug}/project-boards/${projectId}/comments/${commentId}/reactions/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteCommentReaction(
    workspaceSlug: string,
    projectId: string,
    commentId: string,
    reactionHex: string
  ): Promise<any> {
    return this.delete(
      `/api/public/workspaces/${workspaceSlug}/project-boards/${projectId}/comments/${commentId}/reactions/${reactionHex}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

export default IssueService;
