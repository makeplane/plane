import { API_BASE_URL } from "@plane/constants";
import { TIssue, TWorkspaceDraftIssue, TWorkspaceDraftPaginationInfo } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class WorkspaceDraftService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getIssues(
    workspaceSlug: string,
    query: object = {}
  ): Promise<TWorkspaceDraftPaginationInfo<TWorkspaceDraftIssue> | undefined> {
    return this.get(`/api/workspaces/${workspaceSlug}/draft-issues/`, { params: { ...query } })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueById(workspaceSlug: string, issueId: string): Promise<TWorkspaceDraftIssue | undefined> {
    return this.get(`/api/workspaces/${workspaceSlug}/draft-issues/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createIssue(
    workspaceSlug: string,
    payload: Partial<TWorkspaceDraftIssue | TIssue>
  ): Promise<TWorkspaceDraftIssue | undefined> {
    return this.post(`/api/workspaces/${workspaceSlug}/draft-issues/`, payload)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateIssue(
    workspaceSlug: string,
    issueId: string,
    payload: Partial<TWorkspaceDraftIssue | TIssue>
  ): Promise<TWorkspaceDraftIssue | undefined> {
    return this.patch(`/api/workspaces/${workspaceSlug}/draft-issues/${issueId}/`, payload)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteIssue(workspaceSlug: string, issueId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/draft-issues/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async moveIssue(workspaceSlug: string, issueId: string, payload: Partial<TWorkspaceDraftIssue>): Promise<TIssue> {
    return this.post(`/api/workspaces/${workspaceSlug}/draft-to-issue/${issueId}/`, payload)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

const workspaceDraftService = new WorkspaceDraftService();

export default workspaceDraftService;
