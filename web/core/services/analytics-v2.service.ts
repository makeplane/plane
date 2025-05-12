import { API_BASE_URL } from "@plane/constants";
import { IAnalyticsResponseV2, TAnalyticsTabsV2Base, TAnalyticsGraphsV2Base } from "@plane/types";
import { APIService } from "./api.service";

export class AnalyticsV2Service extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getAdvanceAnalytics<T extends IAnalyticsResponseV2>(
    workspaceSlug: string,
    tab: TAnalyticsTabsV2Base,
    params?: Record<string, any>
  ): Promise<T> {
    return this.get(`/api/workspaces/${workspaceSlug}/advance-analytics/`, {
      params: {
        tab,
        ...params,
      },
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getAdvanceAnalyticsStats<T>(
    workspaceSlug: string,
    tab: Exclude<TAnalyticsTabsV2Base, "overview">,
    params?: Record<string, any>
  ): Promise<T> {
    return this.get(`/api/workspaces/${workspaceSlug}/advance-analytics-stats/`, {
      params: {
        type: tab,
        ...params,
      },
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getAdvanceAnalyticsCharts<T>(
    workspaceSlug: string,
    tab: TAnalyticsGraphsV2Base,
    params?: Record<string, any>
  ): Promise<T> {
    return this.get(`/api/workspaces/${workspaceSlug}/advance-analytics-charts/`, {
      params: {
        type: tab,
        ...params,
      },
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
