import { APIService } from "services/api.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";
import { TIssue } from "@plane/types";

export class IssueDraftService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getDraftIssues(workspaceSlug: string, projectId: string, query?: any): Promise<TIssue[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-drafts/`, {
      params: { ...query },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createDraftIssue(workspaceSlug: string, projectId: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-drafts/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateDraftIssue(workspaceSlug: string, projectId: string, issueId: string, data: any): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-drafts/${issueId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteDraftIssue(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-drafts/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getDraftIssueById(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-drafts/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
