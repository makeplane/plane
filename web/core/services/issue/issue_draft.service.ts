import { TIssue, TIssuesResponse } from "@plane/types";
import { API_BASE_URL } from "@/helpers/common.helper";
import { APIService } from "@/services/api.service";
// helpers

export class IssueDraftService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getDraftIssues(workspaceSlug: string, projectId: string, query?: any, config = {}): Promise<TIssuesResponse> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-drafts/`,
      {
        params: { ...query },
      },
      config
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createDraftIssue(workspaceSlug: string, projectId: string, data: any): Promise<TIssue> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-drafts/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateDraftIssue(workspaceSlug: string, projectId: string, issueId: string, data: any): Promise<void> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-drafts/${issueId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteDraftIssue(workspaceSlug: string, projectId: string, issueId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-drafts/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getDraftIssueById(workspaceSlug: string, projectId: string, issueId: string, queries?: any): Promise<TIssue> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-drafts/${issueId}/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
