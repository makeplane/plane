// plane imports
import { API_BASE_URL } from "@plane/constants";
import { IAnalyticsResponse, TAnalyticsTabsBase, TAnalyticsGraphsBase, TAnalyticsFilterParams } from "@plane/types";
// services
import { APIService } from "./api.service";

export class AnalyticsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getAdvanceAnalytics<T extends IAnalyticsResponse>(
    workspaceSlug: string,
    tab: TAnalyticsTabsBase,
    params?: TAnalyticsFilterParams,
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
    params?: TAnalyticsFilterParams,
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
    params?: TAnalyticsFilterParams,
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
    tab: TAnalyticsGraphsBase | TAnalyticsTabsBase,
    params?: TAnalyticsFilterParams,
    isPeekView?: boolean
  ) {
    let processedUrl = `/api/workspaces/${workspaceSlug}`;
    if (isPeekView && (tab === "work-items" || tab === "custom-work-items")) {
      const projectIds = params?.project_ids;
      if (typeof projectIds !== "string" || !projectIds.trim()) {
        throw new Error("project_ids parameter is required for peek view of work items");
      }
      const projectId = projectIds.split(",")[0];
      if (!projectId) {
        throw new Error("Invalid project_ids format - no project ID found");
      }
      processedUrl += `/projects/${projectId}`;
    }
    return `${processedUrl}/${endpoint}`;
  }
}
