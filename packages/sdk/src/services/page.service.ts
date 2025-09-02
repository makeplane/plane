import { APIService } from "@/services/api.service";
// types
import { ClientOptions, ExPage } from "@/types/types";

export class PageService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async getWorkspacePage(slug: string, pageId: string): Promise<ExPage> {
    return this.get(`/api/v1/workspaces/${slug}/pages/${pageId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  async getProjectPage(slug: string, projectId: string, pageId: string): Promise<ExPage> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/pages/${pageId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  async getPublishedPage(anchor: string): Promise<ExPage> {
    return this.get(`/api/v1/pages/public/anchor/${anchor}/pages/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }
}
