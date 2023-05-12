// services
import APIService from "services/api.service";
// types
import {
  IAnalyticsParams,
  IAnalyticsResponse,
  IDefaultAnalyticsResponse,
  IExportAnalyticsFormData,
  ISaveAnalyticsFormData,
} from "types";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class AnalyticsServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async getAnalytics(workspaceSlug: string, params: IAnalyticsParams): Promise<IAnalyticsResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/analytics/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getDefaultAnalytics(
    workspaceSlug: string,
    params?: Partial<IAnalyticsParams>
  ): Promise<IDefaultAnalyticsResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/default-analytics/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async saveAnalytics(workspaceSlug: string, data: ISaveAnalyticsFormData): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/analytic-view/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async exportAnalytics(workspaceSlug: string, data: IExportAnalyticsFormData): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/export-analytics/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new AnalyticsServices();
