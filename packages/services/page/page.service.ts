import { API_BASE_URL } from "helpers/common.helper";
// services
import { APIService } from "services/api.service";
// types
import { IPage, IPageBlock, TIssue } from "@plane/types";

export class PageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createPage(workspaceSlug: string, projectId: string, data: Partial<IPage>): Promise<IPage> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchPage(workspaceSlug: string, projectId: string, pageId: string, data: Partial<IPage>): Promise<IPage> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        console.error("error", error?.response?.data);
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

  async addPageToFavorites(workspaceSlug: string, projectId: string, pageId: string): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-pages/`, { page: pageId })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removePageFromFavorites(workspaceSlug: string, projectId: string, pageId: string) {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-pages/${pageId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectPages(workspaceSlug: string, projectId: string): Promise<IPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPagesWithParams(
    workspaceSlug: string,
    projectId: string,
    pageType: "all" | "favorite" | "private" | "shared"
  ): Promise<IPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/`, {
      params: {
        page_view: pageType,
      },
    })
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
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/`, data)
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

  async deletePageBlock(workspaceSlug: string, projectId: string, pageId: string, pageBlockId: string): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/${pageBlockId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listPageBlocks(workspaceSlug: string, projectId: string, pageId: string): Promise<IPageBlock[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/`)
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
  ): Promise<TIssue> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/${blockId}/issues/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // =============== Archiving & Unarchiving Pages =================
  async archivePage(workspaceSlug: string, projectId: string, pageId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restorePage(workspaceSlug: string, projectId: string, pageId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/unarchive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getArchivedPages(workspaceSlug: string, projectId: string): Promise<IPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/archived-pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }
  // ==================== Pages Locking Services ==========================
  async lockPage(workspaceSlug: string, projectId: string, pageId: string): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unlockPage(workspaceSlug: string, projectId: string, pageId: string): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/unlock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
