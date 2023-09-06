// services
import APIService from "services/api.service";
import trackEventServices from "./track-event.service";

// types
import type { IIssueViewOptions, IModule, IIssue, ICurrentUserResponse } from "types";

import getConfig from "next/config";
const { publicRuntimeConfig: { NEXT_PUBLIC_API_BASE_URL } } = getConfig();

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

class ProjectIssuesServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async getModules(workspaceSlug: string, projectId: string): Promise<IModule[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createModule(
    workspaceSlug: string,
    projectId: string,
    data: any,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/`, data)
      .then((response) => {
        if (trackEvent) trackEventServices.trackModuleEvent(response?.data, "MODULE_CREATE", user);
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
    data: any,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.put(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackModuleEvent(response?.data, "MODULE_UPDATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getModuleDetails(
    workspaceSlug: string,
    projectId: string,
    moduleId: string
  ): Promise<IModule> {
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
    data: Partial<IModule>,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackModuleEvent(response?.data, "MODULE_UPDATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteModule(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/`
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackModuleEvent(response?.data, "MODULE_DELETE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getModuleIssues(
    workspaceSlug: string,
    projectId: string,
    moduleId: string
  ): Promise<IIssue[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-issues/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getModuleIssuesWithParams(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    queries?: any
  ): Promise<
    | IIssue[]
    | {
        [key: string]: IIssue[];
      }
  > {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-issues/`,
      { params: queries }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addIssuesToModule(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: { issues: string[] },
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-issues/`,
      data
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackIssueMovedToCycleOrModuleEvent(
            {
              workspaceSlug,
              workspaceName: response?.data?.[0]?.issue_detail?.workspace_detail?.name,
              projectId,
              projectIdentifier: response?.data?.[0]?.issue_detail?.project_detail?.identifier,
              projectName: response?.data?.[0]?.issue_detail?.project_detail?.name,
              issueId: response?.data?.[0]?.issue_detail?.id,
              moduleId,
            },
            response?.data?.length > 1 ? "ISSUE_MOVED_TO_MODULE_IN_BULK" : "ISSUE_MOVED_TO_MODULE",
            user
          );
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
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-issues/${bridgeId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createModuleLink(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: {
      metadata: any;
      title: string;
      url: string;
    }
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-links/`,
      data
    )
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
    data: {
      metadata: any;
      title: string;
      url: string;
    }
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-links/${linkId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteModuleLink(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    linkId: string
  ): Promise<any> {
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
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-modules/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeModuleFromFavorites(
    workspaceSlug: string,
    projectId: string,
    moduleId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-modules/${moduleId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectIssuesServices();
