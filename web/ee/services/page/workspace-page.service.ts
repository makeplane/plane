// types
import { TPage, TPageEmbedType } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class WorkspacePageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(workspaceSlug: string): Promise<TPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchById(workspaceSlug: string, pageId: string): Promise<TPage> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: Partial<TPage>): Promise<TPage> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, pageId: string, data: Partial<TPage>): Promise<TPage> {
    return this.patch(`/api/workspaces/${workspaceSlug}/pages/${pageId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async remove(workspaceSlug: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addToFavorites(workspaceSlug: string, pageId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/favorite-pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeFromFavorites(workspaceSlug: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/favorite-pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async archive(
    workspaceSlug: string,
    pageId: string
  ): Promise<{
    archived_at: string;
  }> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restore(workspaceSlug: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/pages/${pageId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async lock(workspaceSlug: string, pageId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unlock(workspaceSlug: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/pages/${pageId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchDescriptionYJS(workspaceSlug: string, pageId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/description/`, {
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
    pageId: string,
    data: {
      description_binary: string;
      description_html: string;
    }
  ): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/pages/${pageId}/description/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async searchEmbed<T>(
    workspaceSlug: string,
    params: {
      query_type: TPageEmbedType;
      count?: number;
      query: string;
    }
  ): Promise<T | undefined> {
    return this.get(`/api/workspaces/${workspaceSlug}/entity-search/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
