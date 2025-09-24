// constants
import { API_BASE_URL, EPageSharedUserAccess } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export type TPageSharedUser = {
  user_id: string;
  access: EPageSharedUserAccess;
};

export type TPageSharedUserResponse = {
  user: string; // user id
  access: EPageSharedUserAccess;
};

export class PageShareService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // Project page sharing methods
  async getProjectPageSharedUsers(
    workspaceSlug: string,
    projectId: string,
    pageId: string
  ): Promise<TPageSharedUser[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/share/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkUpdateProjectPageSharedUsers(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    sharedUsers: TPageSharedUser[]
  ): Promise<TPageSharedUserResponse[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/share/`, sharedUsers)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addProjectPageSharedUsers(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    sharedUsers: TPageSharedUser[]
  ): Promise<TPageSharedUserResponse[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/share/`, sharedUsers)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectPageSharedUserAccess(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    userId: string,
    access: EPageSharedUserAccess
  ): Promise<TPageSharedUserResponse> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/share/${userId}/`, {
      access,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeProjectPageSharedUser(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    userId: string
  ): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/share/${userId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // Workspace page sharing methods
  async getWorkspacePageSharedUsers(workspaceSlug: string, pageId: string): Promise<TPageSharedUser[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/share/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkUpdateWorkspacePageSharedUsers(
    workspaceSlug: string,
    pageId: string,
    sharedUsers: TPageSharedUser[]
  ): Promise<TPageSharedUserResponse[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/share/`, sharedUsers)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addWorkspacePageSharedUsers(
    workspaceSlug: string,
    pageId: string,
    sharedUsers: TPageSharedUser[]
  ): Promise<TPageSharedUserResponse[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/share/`, sharedUsers)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspacePageSharedUserAccess(
    workspaceSlug: string,
    pageId: string,
    userId: string,
    access: EPageSharedUserAccess
  ): Promise<TPageSharedUserResponse> {
    return this.patch(`/api/workspaces/${workspaceSlug}/pages/${pageId}/share/${userId}/`, {
      access,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeWorkspacePageSharedUser(workspaceSlug: string, pageId: string, userId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/pages/${pageId}/share/${userId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
