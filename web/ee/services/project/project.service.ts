/* eslint-disable no-useless-catch */

// ce services
import { TProjectLink } from "@plane/types";
import { TProject, TProjectAnalytics, TProjectFeatures } from "@/plane-web/types";
import { ProjectService as CeProjectService } from "@/services/project";

export class ProjectService extends CeProjectService {
  constructor() {
    super();
  }

  // analytics
  async fetchProjectAnalytics(workspaceSlug: string, projectId: string): Promise<TProjectAnalytics> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/analytics/`);
      console.log(data);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  // links
  async fetchProjectLinks(workspaceSlug: string, projectId: string): Promise<TProjectLink[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/links/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createProjectLink(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TProjectLink>
  ): Promise<TProjectLink> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/links/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateProjectLink(
    workspaceSlug: string,
    projectId: string,
    linkId: string,
    data: Partial<TProjectLink>
  ): Promise<TProjectLink> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/links/${linkId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteProjectLink(workspaceSlug: string, projectId: string, linkId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/links/${linkId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getFeatures(workspaceSlug: string, projectId: string): Promise<TProjectFeatures> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/features/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async toggleFeatures(workspaceSlug: string, projectId: string, data: Partial<TProject>): Promise<TProject> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/features/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

const projectService = new ProjectService();

export default projectService;
