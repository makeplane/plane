// plane imports
import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export class CaseModuleService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getCaseModules(workspaceSlug: string, queries?: any): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/module`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createCaseModule(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/module`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCaseModule(workspaceSlug: string, moduleId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/module/${moduleId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateCaseModule(workspaceSlug: string, moduleId: string, data: any): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/test/module/${moduleId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteCaseModule(workspaceSlug: string, moduleId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/test/module/${moduleId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}