import { TIssue } from "@plane/types";
import { API_BASE_URL } from "@/helpers/common.helper";
import { APIService } from "@/services/api.service";
// types
// constants

export class IssueArchiveService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getArchivedIssues(workspaceSlug: string, projectId: string, queries?: any, config = {}): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/archived-issues/`,
      {
        params: { ...queries },
      },
      config
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async archiveIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<{
    archived_at: string;
  }> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restoreIssue(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieveArchivedIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    queries?: any
  ): Promise<TIssue> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/archive/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
