// types
import { API_BASE_URL } from "@plane/constants";
import type { TProjectPublishSettings } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class ProjectPublishService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchPublishSettings(workspaceSlug: string, projectID: string): Promise<TProjectPublishSettings> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectID}/project-deploy-boards/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async publishProject(
    workspaceSlug: string,
    projectID: string,
    data: Partial<TProjectPublishSettings>
  ): Promise<TProjectPublishSettings> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectID}/project-deploy-boards/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updatePublishSettings(
    workspaceSlug: string,
    projectID: string,
    project_publish_id: string,
    data: Partial<TProjectPublishSettings>
  ): Promise<TProjectPublishSettings> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectID}/project-deploy-boards/${project_publish_id}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async unpublishProject(workspaceSlug: string, projectID: string, project_publish_id: string): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectID}/project-deploy-boards/${project_publish_id}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
