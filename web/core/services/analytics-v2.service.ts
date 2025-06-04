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
    params?: Record<string, any>,
    isPeekView?: boolean
  ): Promise<T> {
    return this.get(
      this.processUrl<TAnalyticsTabsV2Base>("advance-analytics", workspaceSlug, tab, params, isPeekView),
      {
        params: {
          tab,
          ...params,
        },
      }
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getAdvanceAnalyticsStats<T>(
    workspaceSlug: string,
    tab: Exclude<TAnalyticsTabsV2Base, "overview">,
    params?: Record<string, any>,
    isPeekView?: boolean
  ): Promise<T> {
    const processedUrl = this.processUrl<Exclude<TAnalyticsTabsV2Base, "overview">>(
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
    tab: TAnalyticsGraphsV2Base,
    params?: Record<string, any>,
    isPeekView?: boolean
  ): Promise<T> {
    const processedUrl = this.processUrl<TAnalyticsGraphsV2Base>(
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
    if (isPeekView && (tab === "work-items" || tab === "custom-work-items")) {
      const projectId = params?.project_ids.split(",")[0];
      processedUrl += `/projects/${projectId}`;
    }
    return `${processedUrl}/${endpoint}`;
  }
}
