// types
// import type { IModule, ILinkDetails, ModuleLink, TIssuesResponse } from "@plane/types";
// services
import { APIService } from "../api.service";

export class ModuleOperationService extends APIService {
  constructor(baseURL: string) {
    super(baseURL);
  }

  /**
   * Add issues to a module
   * @param {string} workspaceSlug - The slug of the workspace
   * @param {string} projectId - The ID of the project
   * @param {string} moduleId - The ID of the module
   * @param {object} data - The data to be sent in the request body
   * @param {string[]} data.issues - The IDs of the issues to be added
   * @returns {Promise<void>}
   */
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

  /**
   * Add modules to an issue
   * @param {string} workspaceSlug - The slug of the workspace
   * @param {string} projectId - The ID of the project
   * @param {string} issueId - The ID of the issue
   * @param {object} data - The data to be sent in the request body
   * @param {string[]} data.modules - The IDs of the modules to be added
   * @param {string[]} [data.removed_modules] - The IDs of the modules to be removed
   * @returns {Promise<void>}
   */
  async addModulesToIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: { modules: string[]; removed_modules?: string[] }
  ): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/modules/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Remove issues from a module
   * @param {string} workspaceSlug - The slug of the workspace
   * @param {string} projectId - The ID of the project
   * @param {string} moduleId - The ID of the module
   * @param {string[]} issueIds - The IDs of the issues to be removed
   * @returns {Promise<void>}
   */
  async removeIssuesFromModuleBulk(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueIds: string[]
  ): Promise<void> {
    const promiseDataUrls: any = [];
    issueIds.forEach((issueId) => {
      promiseDataUrls.push(
        this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/issues/${issueId}/`)
      );
    });
    await Promise.all(promiseDataUrls)
      .then((response) => response)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Remove modules from an issue
   * @param {string} workspaceSlug - The slug of the workspace
   * @param {string} projectId - The ID of the project
   * @param {string} issueId - The ID of the issue
   * @param {string[]} moduleIds - The IDs of the modules to be removed
   * @returns {Promise<void>}
   */
  async removeModulesFromIssueBulk(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    moduleIds: string[]
  ): Promise<void> {
    const promiseDataUrls: any = [];
    moduleIds.forEach((moduleId) => {
      promiseDataUrls.push(
        this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/issues/${issueId}/`)
      );
    });
    await Promise.all(promiseDataUrls)
      .then((response) => response)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Add a module to favorites
   * @param {string} workspaceSlug - The slug of the workspace
   * @param {string} projectId - The ID of the project
   * @param {object} data - The data to be sent in the request body
   * @param {string} data.module - The ID of the module to be added
   * @returns {Promise<any>}
   */
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

  /**
   * Remove a module from favorites
   * @param {string} workspaceSlug - The slug of the workspace
   * @param {string} projectId - The ID of the project
   * @param {string} moduleId - The ID of the module to be removed
   * @returns {Promise<any>}
   */
  async removeModuleFromFavorites(workspaceSlug: string, projectId: string, moduleId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-modules/${moduleId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
