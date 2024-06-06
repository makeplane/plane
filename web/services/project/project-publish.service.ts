// types
import { TPublishSettings } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class ProjectPublishService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getProjectSettingsAsync(workspaceSlug: string, projectID: string): Promise<TPublishSettings> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectID}/project-deploy-boards/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createProjectSettingsAsync(
    workspaceSlug: string,
    projectID: string,
    data: Partial<TPublishSettings>
  ): Promise<TPublishSettings> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectID}/project-deploy-boards/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateProjectSettingsAsync(
    workspaceSlug: string,
    projectID: string,
    project_publish_id: string,
    data: Partial<TPublishSettings>
  ): Promise<TPublishSettings> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectID}/project-deploy-boards/${project_publish_id}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteProjectSettingsAsync(workspaceSlug: string, projectID: string, project_publish_id: string): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectID}/project-deploy-boards/${project_publish_id}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
