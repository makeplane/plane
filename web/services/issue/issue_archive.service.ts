import { APIService } from "services/api.service";
// type
import { API_BASE_URL } from "helpers/common.helper";

export class IssueArchiveService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getArchivedIssues(workspaceSlug: string, projectId: string, queries?: any): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/archived-issues/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unarchiveIssue(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/unarchive/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieveArchivedIssue(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/archived-issues/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteArchivedIssue(workspaceSlug: string, projectId: string, issuesId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/archived-issues/${issuesId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
