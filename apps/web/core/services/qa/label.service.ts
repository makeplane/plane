// plane imports
import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export class LabelService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getLabels(workspaceSlug: string, queries?: any): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/label/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createLabel(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/label/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getLabel(workspaceSlug: string, labelId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/label/${labelId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateLabel(workspaceSlug: string, labelId: string, data: any): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/test/label/${labelId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteLabel(workspaceSlug: string, labelId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/test/label/${labelId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}