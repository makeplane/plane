// helpers
import { API_BASE_URL  } from "@plane/constants";
// plane web types
import { TPagePublishSettings } from "@/plane-web/types";
// services
import { APIService } from "@/services/api.service";

export class PublishPageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // project level
  async publishProjectPage(
    workspaceSlug: string,
    projectID: string,
    pageID: string,
    data: Partial<TPagePublishSettings>
  ): Promise<TPagePublishSettings> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectID}/pages/${pageID}/publish/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchProjectPagePublishSettings(
    workspaceSlug: string,
    projectID: string,
    pageID: string
  ): Promise<TPagePublishSettings> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectID}/pages/${pageID}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectPagePublishSettings(
    workspaceSlug: string,
    projectID: string,
    pageID: string,
    data: Partial<TPagePublishSettings>
  ): Promise<TPagePublishSettings> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectID}/pages/${pageID}/publish/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unpublishProjectPage(workspaceSlug: string, projectID: string, pageID: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectID}/pages/${pageID}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // workspace level
  async publishWorkspacePage(
    workspaceSlug: string,
    pageID: string,
    data: Partial<TPagePublishSettings>
  ): Promise<TPagePublishSettings> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageID}/publish/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchWorkspacePagePublishSettings(workspaceSlug: string, pageID: string): Promise<TPagePublishSettings> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageID}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspacePagePublishSettings(
    workspaceSlug: string,
    pageID: string,
    data: Partial<TPagePublishSettings>
  ): Promise<TPagePublishSettings> {
    return this.patch(`/api/workspaces/${workspaceSlug}/pages/${pageID}/publish/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unpublishWorkspacePage(workspaceSlug: string, pageID: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/pages/${pageID}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
