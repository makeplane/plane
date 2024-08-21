// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// plane web types
import { TIssueType } from "@/plane-web/types";
// services
import { APIService } from "@/services/api.service";

export class IssueTypesService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(workspaceSlug: string): Promise<TIssueType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/issue-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchAllProjectIssueTypes(workspaceSlug: string, projectId: string): Promise<TIssueType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, projectId: string, data: Partial<TIssueType>): Promise<TIssueType> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    issueTypeId: string,
    data: Partial<TIssueType>
  ): Promise<TIssueType> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${issueTypeId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteType(workspaceSlug: string, projectId: string, issueTypeId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${issueTypeId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async enableIssueTypes(workspaceSlug: string, projectId: string): Promise<TIssueType> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/default-issue-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
