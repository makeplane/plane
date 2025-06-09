import { API_BASE_URL } from "@plane/constants";
import { IIssueLabel } from "@plane/types";
// services
import { APIService } from "@/services/api.service";
// types

export class IssueLabelService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getWorkspaceIssueLabels(workspaceSlug: string): Promise<IIssueLabel[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/labels/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectLabels(workspaceSlug: string, projectId: string): Promise<IIssueLabel[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueLabel(workspaceSlug: string, projectId: string, data: any): Promise<IIssueLabel> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchIssueLabel(workspaceSlug: string, projectId: string, labelId: string, data: any): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/${labelId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueLabel(workspaceSlug: string, projectId: string, labelId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/${labelId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
