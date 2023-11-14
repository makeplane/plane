import { API_BASE_URL } from "helpers/common.helper";
// services
import { APIService } from "services/api.service";
// types
import { IProjectPublishSettings } from "store/project";

export class ProjectPublishService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getProjectSettingsAsync(workspace_slug: string, project_slug: string): Promise<any> {
    return this.get(`/api/workspaces/${workspace_slug}/projects/${project_slug}/project-deploy-boards/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createProjectSettingsAsync(
    workspace_slug: string,
    project_slug: string,
    data: IProjectPublishSettings
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspace_slug}/projects/${project_slug}/project-deploy-boards/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateProjectSettingsAsync(
    workspace_slug: string,
    project_slug: string,
    project_publish_id: string,
    data: IProjectPublishSettings
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspace_slug}/projects/${project_slug}/project-deploy-boards/${project_publish_id}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteProjectSettingsAsync(
    workspace_slug: string,
    project_slug: string,
    project_publish_id: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspace_slug}/projects/${project_slug}/project-deploy-boards/${project_publish_id}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
