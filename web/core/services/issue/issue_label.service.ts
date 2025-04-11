import { IIssueLabel } from "@plane/types";
import { API_BASE_URL } from "@/helpers/common.helper";
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

  async getLabels(workspaceSlug: string): Promise<IIssueLabel[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/issue-labels/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueLabel(workspaceSlug: string, data: any): Promise<IIssueLabel> {
    return this.post(`/api/workspaces/${workspaceSlug}/issue-labels/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchIssueLabel(workspaceSlug: string, labelId: string, data: any): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/issue-labels/${labelId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueLabel(workspaceSlug: string, labelId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/issue-labels/${labelId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
