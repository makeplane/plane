// plane imports
import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export class RepositoryService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getRepositories(workspaceSlug: string, queries?: any): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/repository/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createRepository(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/repository/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateRepository(workspaceSlug: string, data: any): Promise<any> {
    return this.put(`/api/workspaces/${workspaceSlug}/test/repository/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteRepository(workspaceSlug: string, data: { ids: string[] }): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/test/repository/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }



  async enumsList(workspaceSlug: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/enums/`)
    .then((response) => response?.data)
    .catch((error) => {
      throw error?.response?.data;
    });
}
}
