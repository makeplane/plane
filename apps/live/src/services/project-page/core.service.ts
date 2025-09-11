import { TPage } from "@plane/types";
// services
import { APIService } from "../api.service";

export type TPageDescriptionPayload = {
  description_binary: string;
  description_html: string;
  description: object;
};

export class ProjectPageCoreService extends APIService {
  constructor() {
    super();
  }

  protected async fetchDetails(workspaceSlug: string, projectId: string, pageId: string): Promise<TPage> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`, {
      headers: this.getHeader(),
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  protected async fetchDescriptionBinary(workspaceSlug: string, projectId: string, pageId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/description/`, {
      headers: {
        ...this.getHeader(),
        "Content-Type": "application/octet-stream",
      },
      responseType: "arraybuffer",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  protected async updateDescriptionBinary(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    data: TPageDescriptionPayload
  ): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/description/`, data, {
      headers: this.getHeader(),
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }
}
