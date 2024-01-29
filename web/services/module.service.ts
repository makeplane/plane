// services
import { APIService } from "services/api.service";
// types
import type { IModule, TIssue, ILinkDetails, ModuleLink } from "@plane/types";
import { API_BASE_URL } from "helpers/common.helper";

export class ModuleService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getModules(workspaceSlug: string, projectId: string): Promise<IModule[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createModule(workspaceSlug: string, projectId: string, data: any): Promise<IModule> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateModule(workspaceSlug: string, projectId: string, moduleId: string, data: any): Promise<any> {
    return this.put(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getModuleDetails(workspaceSlug: string, projectId: string, moduleId: string): Promise<IModule> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchModule(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: Partial<IModule>
  ): Promise<IModule> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteModule(workspaceSlug: string, projectId: string, moduleId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getModuleIssues(workspaceSlug: string, projectId: string, moduleId: string, queries?: any): Promise<TIssue[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/issues/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addIssuesToModule(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: { issues: string[] }
  ): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/issues/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addModulesToIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: { modules: string[] }
  ): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/modules/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeIssueFromModule(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueId: string
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/issues/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeIssuesFromModuleBulk(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueIds: string[]
  ): Promise<any> {
    const promiseDataUrls: any = [];
    issueIds.forEach((issueId) => {
      promiseDataUrls.push(
        this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/issues/${issueId}/`)
      );
    });
    return await Promise.all(promiseDataUrls)
      .then((response) => response)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeModulesFromIssueBulk(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    moduleIds: string[]
  ): Promise<any> {
    const promiseDataUrls: any = [];
    moduleIds.forEach((moduleId) => {
      promiseDataUrls.push(
        this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/issues/${issueId}/`)
      );
    });
    return await Promise.all(promiseDataUrls)
      .then((response) => response)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createModuleLink(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: Partial<ModuleLink>
  ): Promise<ILinkDetails> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-links/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateModuleLink(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    linkId: string,
    data: Partial<ModuleLink>
  ): Promise<ILinkDetails> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-links/${linkId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteModuleLink(workspaceSlug: string, projectId: string, moduleId: string, linkId: string): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-links/${linkId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addModuleToFavorites(
    workspaceSlug: string,
    projectId: string,
    data: {
      module: string;
    }
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-modules/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeModuleFromFavorites(workspaceSlug: string, projectId: string, moduleId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-modules/${moduleId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
