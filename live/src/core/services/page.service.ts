// types
import { TPage } from "@plane/types";
// services
import { API_BASE_URL, APIService } from "@/core/services/api.service.js";

export class PageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchDetails(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    cookie: string
  ): Promise<TPage> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`,
      {
        headers: {
          Cookie: cookie,
        },
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchDescriptionBinary(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    cookie: string
  ): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/description/`,
      {
        headers: {
          "Content-Type": "application/octet-stream",
          Cookie: cookie,
        },
        responseType: "arraybuffer",
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateDescription(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    data: {
      description_binary: string;
      description_html: string;
      description: object;
    },
    cookie: string
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/description/`,
      data,
      {
        headers: {
          Cookie: cookie,
        },
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }
}
