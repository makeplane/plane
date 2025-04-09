/* eslint-disable no-useless-catch */

// plane imports
import { TProject, TProjectLink, TStateAnalytics } from "@plane/types";
// plane web imports
import { TProjectAttributesParams, TProjectAttributesResponse, TProjectFeatures } from "@/plane-web/types";
// services
import { ProjectService as CeProjectService } from "@/services/project";

export class ProjectService extends CeProjectService {
  constructor() {
    super();
  }

  // create project using template
  async createProjectUsingTemplate(
    workspaceSlug: string,
    templateId: string,
    data: Partial<TProject>
  ): Promise<TProject> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/use-template/`, {
      template_id: templateId,
      ...data,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  // attributes
  async getProjectAttributes(
    workspaceSlug: string,
    params?: TProjectAttributesParams
  ): Promise<TProjectAttributesResponse[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/project-attributes/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // analytics
  async fetchProjectAnalytics(workspaceSlug: string, projectId: string): Promise<TStateAnalytics> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/analytics/`);
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

  async getProjectFeatures(workspaceSlug: string): Promise<TProjectFeatures[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/workspace-project-features/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async toggleProjectFeatures(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TProjectFeatures>
  ): Promise<TProjectFeatures> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/features/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

const projectService = new ProjectService();

export default projectService;
