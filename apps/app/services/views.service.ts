// services
import APIService from "services/api.service";
// types
import { IView } from "types/views";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class ViewServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createView(workspaceSlug: string, projectId: string, data: IView): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateView(
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: IView
  ): Promise<any> {
    return this.put(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchView(
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: Partial<IView>
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteView(projectId: string, viewId: string): Promise<any> {
    return this.delete(`/api/projects/${projectId}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getViews(workspaceSlug: string, projectId: string): Promise<IView[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getViewDetails(workspaceSlug: string, projectId: string, viewId: string): Promise<IView> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getViewIssues(workspaceSlug: string, projectId: string, viewId: string): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/issues/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ViewServices();
