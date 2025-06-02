import { API_BASE_URL } from "@plane/constants";
import { IAnalyticsResponse, TAnalyticsTabsBase, TAnalyticsGraphsBase } from "@plane/types";
import { APIService } from "./api.service";

export class AnalyticsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getAdvanceAnalytics<T extends IAnalyticsResponse>(
    workspaceSlug: string,
    tab: TAnalyticsTabsBase,
    params?: Record<string, any>,
    isPeekView?: boolean
  ): Promise<T> {
    return this.get(this.processUrl<TAnalyticsTabsBase>("advance-analytics", workspaceSlug, tab, params, isPeekView), {
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
    tab: Exclude<TAnalyticsTabsBase, "overview">,
    params?: Record<string, any>,
    isPeekView?: boolean
  ): Promise<T> {
    const processedUrl = this.processUrl<Exclude<TAnalyticsTabsBase, "overview">>(
      "advance-analytics-stats",
      workspaceSlug,
      tab,
      params,
      isPeekView
    );
    return this.get(processedUrl, {
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
    tab: TAnalyticsGraphsBase,
    params?: Record<string, any>,
    isPeekView?: boolean
  ): Promise<T> {
    const processedUrl = this.processUrl<TAnalyticsGraphsBase>(
      "advance-analytics-charts",
      workspaceSlug,
      tab,
      params,
      isPeekView
    );
    return this.get(processedUrl, {
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

  processUrl<T extends string>(
    endpoint: string,
    workspaceSlug: string,
    tab: T,
    params?: Record<string, any>,
    isPeekView?: boolean
  ) {
    let processedUrl = `/api/workspaces/${workspaceSlug}`;
    if (isPeekView && tab === "work-items") {
      const projectId = params?.project_ids.split(",")[0];
      processedUrl += `/projects/${projectId}`;
    }
    return `${processedUrl}/${endpoint}`;
  }
}
