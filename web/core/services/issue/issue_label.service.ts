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

  async getProjectLabels(workspaceSlug: string, projectId: string): Promise<IIssueLabel[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/`)
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

  async createLabel(workspaceSlug: string, projectId: string | undefined, data: any): Promise<IIssueLabel> {
    const apiUrl = `/api/workspaces/${workspaceSlug}` + (projectId ? `/projects/` + projectId : '') + `/issue-labels/`;
    return this.post(apiUrl, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchIssueLabel(workspaceSlug: string, projectId: string | undefined, labelId: string, data: any): Promise<any> {
    const apiUrl = `/api/workspaces/${workspaceSlug}` + (projectId ? `/projects/` + projectId : '') + `/issue-labels/${labelId}/`;
    return this.patch(apiUrl, data)
    .then((response) => response?.data)
    .catch((error) => {
      throw error?.response?.data;
    });
  }
  
  async deleteIssueLabel(workspaceSlug: string, projectId: string | undefined, labelId: string): Promise<any> {
    const apiUrl = `/api/workspaces/${workspaceSlug}` + (projectId ? `/projects/` + projectId : '') + `/issue-labels/${labelId}/`;
    return this.delete(apiUrl)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
