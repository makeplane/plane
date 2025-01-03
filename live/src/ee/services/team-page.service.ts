// types
import { TDocumentPayload, TPage } from "@plane/types";
// services
import { API_BASE_URL, APIService } from "../../core/services/api.service.js";

export class TeamPageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchDetails(workspaceSlug: string, teamId: string, pageId: string, cookie: string): Promise<TPage> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/`, {
      headers: {
        Cookie: cookie,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchDescriptionBinary(workspaceSlug: string, teamId: string, pageId: string, cookie: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/description/`, {
      headers: {
        "Content-Type": "application/octet-stream",
        Cookie: cookie,
      },
      responseType: "arraybuffer",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateDescription(
    workspaceSlug: string,
    teamId: string,
    pageId: string,
    data: TDocumentPayload,
    cookie: string
  ): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/description/`, data, {
      headers: {
        Cookie: cookie,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }
}
