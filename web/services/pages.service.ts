// services
import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";

// types
import { IPage, IPageBlock, RecentPagesResponse, IIssue, ICurrentUserResponse } from "types";

import getConfig from "next/config";
const { publicRuntimeConfig: { NEXT_PUBLIC_API_BASE_URL } } = getConfig();

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

class PageServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createPage(
    workspaceSlug: string,
    projectId: string,
    data: Partial<IPage>,
    user: ICurrentUserResponse | undefined
  ): Promise<IPage> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/`, data)
      .then((response) => {
        if (trackEvent) trackEventServices.trackPageEvent(response?.data, "PAGE_CREATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchPage(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    data: Partial<IPage>,
    user: ICurrentUserResponse | undefined
  ): Promise<IPage> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackPageEvent(response?.data, "PAGE_UPDATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deletePage(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`)
      .then((response) => {
        if (trackEvent) trackEventServices.trackPageEvent(response?.data, "PAGE_DELETE", user);
        return response?.data;
      })
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

  async getPagesWithParams(
    workspaceSlug: string,
    projectId: string,
    pageType: "all" | "favorite" | "created_by_me" | "created_by_other"
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

  async getRecentPages(workspaceSlug: string, projectId: string): Promise<RecentPagesResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/`, {
      params: {
        page_view: "recent",
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
    data: Partial<IPageBlock>,
    user: ICurrentUserResponse | undefined
  ): Promise<IPageBlock> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/`,
      data
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackPageBlockEvent(response?.data, "PAGE_BLOCK_CREATE", user);
        return response?.data;
      })
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
    data: Partial<IPageBlock>,
    user: ICurrentUserResponse | undefined
  ): Promise<IPage> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/${pageBlockId}/`,
      data
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackPageBlockEvent(response?.data, "PAGE_BLOCK_UPDATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deletePageBlock(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    pageBlockId: string,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/${pageBlockId}/`
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackPageBlockEvent(response?.data, "PAGE_BLOCK_DELETE", user);
        return response?.data;
      })
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
    blockId: string,
    user: ICurrentUserResponse | undefined
  ): Promise<IIssue> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/page-blocks/${blockId}/issues/`
    )
      .then((response) => {
        if (trackEvent)
          trackEventServices.trackPageBlockEvent(
            response?.data,
            "PAGE_BLOCK_CONVERTED_TO_ISSUE",
            user
          );
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new PageServices();
