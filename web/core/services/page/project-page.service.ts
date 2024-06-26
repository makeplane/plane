// types
import { TPage } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class ProjectPageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(workspaceSlug: string, projectId: string): Promise<TPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchById(workspaceSlug: string, projectId: string, pageId: string): Promise<TPage> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, projectId: string, data: Partial<TPage>): Promise<TPage> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, projectId: string, pageId: string, data: Partial<TPage>): Promise<TPage> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async remove(workspaceSlug: string, projectId: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchFavorites(workspaceSlug: string, projectId: string): Promise<TPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/favorite-pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addToFavorites(workspaceSlug: string, projectId: string, pageId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/favorite-pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeFromFavorites(workspaceSlug: string, projectId: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/favorite-pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchArchived(workspaceSlug: string, projectId: string): Promise<TPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/archived-pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async archive(
    workspaceSlug: string,
    projectId: string,
    pageId: string
  ): Promise<{
    archived_at: string;
  }> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restore(workspaceSlug: string, projectId: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async lock(workspaceSlug: string, projectId: string, pageId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unlock(workspaceSlug: string, projectId: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchDescriptionYJS(workspaceSlug: string, projectId: string, pageId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/description/`, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
      responseType: "arraybuffer",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateDescriptionYJS(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    data: {
      description_binary: string;
      description_html: string;
    }
  ): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/description/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }
}
