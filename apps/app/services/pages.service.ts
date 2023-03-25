// services
import APIService from "services/api.service";
import { IIssue } from "types";
// types
import { IPage, IPageBlock, RecentPagesResponse } from "types/pages";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class PageServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createPage(workspaceSlug: string, projectId: string, data: Partial<IPage>): Promise<IPage> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchPage(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    data: Partial<IPage>
  ): Promise<IPage> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deletePage(workspaceSlug: string, projectId: string, pageId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addPageToFavorites(
    workspaceSlug: string,
    projectId: string,
    data: {
      page: string;
    }
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-pages/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removePageFromFavorites(workspaceSlug: string, projectId: string, pageId: string) {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-pages/${pageId}`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getRecentPages(workspaceSlug: string, projectId: string): Promise<RecentPagesResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/recent-pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAllPages(workspaceSlug: string, projectId: string): Promise<IPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getFavoritePages(workspaceSlug: string, projectId: string): Promise<IPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/favorite-pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getMyPages(workspaceSlug: string, projectId: string): Promise<IPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/my-pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getOtherPages(workspaceSlug: string, projectId: string): Promise<IPage[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/created-by-other-pages/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPageDetails(workspaceSlug: string, projectId: string, pageId: string): Promise<IPage> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createPageBlock(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    data: Partial<IPageBlock>
  ): Promise<IPageBlock> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPageBlock(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    pageBlockId: string
  ): Promise<IPageBlock[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/${pageBlockId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchPageBlock(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    pageBlockId: string,
    data: Partial<IPageBlock>
  ): Promise<IPage> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/${pageBlockId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deletePageBlock(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    pageBlockId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/${pageBlockId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listPageBlocks(
    workspaceSlug: string,
    projectId: string,
    pageId: string
  ): Promise<IPageBlock[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async convertPageBlockToIssue(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    blockId: string
  ): Promise<IIssue> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/${blockId}/issues/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new PageServices();
