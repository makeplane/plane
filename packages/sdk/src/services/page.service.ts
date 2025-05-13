import { APIService } from "@/services/api.service";
// types
import { ClientOptions } from "@/types/types";

export class PageService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async list(slug: string, projectId: string) {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/pages/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPage(slug: string, projectId: string, id: string) {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/pages/${id}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(slug: string, projectId: string, payload: any) {
    return this.post(`/api/v1/workspaces/${slug}/projects/${projectId}/pages/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
