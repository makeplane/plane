// services
import { APIService } from "services/api.service";
// types
import {
  IAnalyticsParams,
  IAnalyticsResponse,
  IDefaultAnalyticsResponse,
  IExportAnalyticsFormData,
  ISaveAnalyticsFormData,
} from "@plane/types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export class AnalyticsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getAnalytics(workspaceSlug: string, params: IAnalyticsParams): Promise<IAnalyticsResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/analytics/`, {
      params: {
        ...params,
        project: params?.project ? params.project.toString() : null,
      },
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
      params: {
        ...params,
        project: params?.project ? params.project.toString() : null,
      },
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
