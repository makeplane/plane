// plane imports
import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export class CaseService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getCases(workspaceSlug: string, queries?: any): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/case/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createCase(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/case/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCase(workspaceSlug: string, caseId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/case/${caseId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateCase(workspaceSlug: string, caseId: string, data: any): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/test/case/${caseId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteCase(workspaceSlug: string, caseId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/test/case/${caseId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}