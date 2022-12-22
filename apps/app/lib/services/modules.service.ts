// api routes
import {
  MODULES_ENDPOINT,
  MODULE_DETAIL,
  MODULE_ISSUES,
  MODULE_ISSUE_DETAIL,
} from "constants/api-routes";
// services
import APIService from "lib/services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class ProjectIssuesServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async getModules(workspaceSlug: string, projectId: string): Promise<any> {
    return this.get(MODULES_ENDPOINT(workspaceSlug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createModule(workspaceSlug: string, projectId: string, data: any): Promise<any> {
    return this.post(MODULES_ENDPOINT(workspaceSlug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateModule(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: any
  ): Promise<any> {
    return this.put(MODULE_DETAIL(workspaceSlug, projectId, moduleId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getModuleDetails(workspaceSlug: string, projectId: string, moduleId: string): Promise<any> {
    return this.get(MODULE_DETAIL(workspaceSlug, projectId, moduleId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchModule(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: any
  ): Promise<any> {
    return this.patch(MODULE_DETAIL(workspaceSlug, projectId, moduleId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteModule(workspaceSlug: string, projectId: string, moduleId: string): Promise<any> {
    return this.delete(MODULE_DETAIL(workspaceSlug, projectId, moduleId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getModuleIssues(workspaceSlug: string, projectId: string, moduleId: string): Promise<any> {
    return this.get(MODULE_ISSUES(workspaceSlug, projectId, moduleId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addIssuesToModule(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: { issues: string[] }
  ): Promise<any> {
    return this.post(MODULE_ISSUES(workspaceSlug, projectId, moduleId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeIssueFromModule(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    bridgeId: string
  ): Promise<any> {
    return this.delete(MODULE_ISSUE_DETAIL(workspaceSlug, projectId, moduleId, bridgeId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectIssuesServices();
