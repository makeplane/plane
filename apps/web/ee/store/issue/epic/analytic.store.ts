import set from "lodash/set";
import { action, observable, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { IEpicService, TEpicAnalytics, TEpicAnalyticsGroup, TEpicStats, TLoader } from "@plane/types";
// plane web imports
import { epicService } from "@/plane-web/services/issue-types/epics";
import { RootStore } from "@/plane-web/store/root.store";

export interface IEpicAnalyticStore {
  // observables
  epicAnalyticsLoader: Record<string, TLoader>; // epic id -> TLoader
  epicAnalyticsMap: Record<string, TEpicAnalytics>; // epic id -> TEpicAnalytics
  epicStatsLoader: Record<string, TLoader>; // epic id -> TLoader
  epicStatsMap: Record<string, TEpicStats>; // epic id -> TEpicStats
  // computed functions
  getEpicAnalyticsById: (epicId: string) => TEpicAnalytics | undefined;
  getEpicStatsById: (epicId: string) => TEpicStats | undefined;
  // actions
  fetchEpicAnalytics: (workspaceSlug: string, projectId: string, epicId: string) => Promise<TEpicAnalytics | undefined>;
  fetchEpicStats: (workspaceSlug: string, projectId: string) => Promise<TEpicStats[] | undefined>;
  updateEpicAnalytics: (
    workspaceSlug: string,
    projectId: string,
    epicId: string,
    data: {
      incrementStateGroupCount?: TEpicAnalyticsGroup;
      decrementStateGroupCount?: TEpicAnalyticsGroup;
    }
  ) => void;
}

export class EpicAnalytics implements IEpicAnalyticStore {
  // observables
  epicAnalyticsMap: Record<string, TEpicAnalytics> = {};
  epicAnalyticsLoader: Record<string, TLoader> = {};
  loader: TLoader = "init-loader";
  epicStatsLoader: Record<string, TLoader> = {};
  epicStatsMap: Record<string, TEpicStats> = {};
  // root store
  rootStore: RootStore;
  // epic services
  epicService: IEpicService;

  constructor(protected store: RootStore) {
    makeObservable(this, {
      // observables
      epicAnalyticsMap: observable,
      epicAnalyticsLoader: observable,
      loader: observable.ref,
      epicStatsLoader: observable,
      epicStatsMap: observable,
      // actions
      fetchEpicAnalytics: action,
      fetchEpicStats: action,
      updateEpicAnalytics: action,
    });
    // root store
    this.rootStore = store;
    // services
    this.epicService = epicService;
  }

  // computed functions
  /**
   * @description Get epic analytics by epic id
   * @param epicId
   * @returns {TEpicAnalytics | undefined}
   */
  getEpicAnalyticsById = computedFn((epicId: string) =>
    this.epicAnalyticsMap[epicId] ? this.epicAnalyticsMap[epicId] : undefined
  );

  /**
   * @description Get epic stats by epic id
   * @param epicId
   * @returns {TEpicStats | undefined}
   */
  getEpicStatsById = computedFn((epicId: string) => this.epicStatsMap[epicId]);

  // actions
  /**
   * @description Fetch epic analytics
   * @param workspaceSlug
   * @param projectId
   * @param epicId
   */
  fetchEpicAnalytics = async (workspaceSlug: string, projectId: string, epicId: string) => {
    if (!workspaceSlug || !projectId || !epicId) return;
    if (!this.epicService.getIssueProgressAnalytics) throw new Error("Get epic analytics service not available.");
    try {
      this.epicAnalyticsLoader[epicId] = "init-loader";
      const analytics = await this.epicService.getIssueProgressAnalytics(workspaceSlug, projectId, epicId);
      runInAction(() => {
        set(this.epicAnalyticsMap, epicId, analytics);
        set(this.epicStatsMap, epicId, {
          total_issues:
            analytics.backlog_issues +
            analytics.unstarted_issues +
            analytics.started_issues +
            analytics.completed_issues +
            analytics.cancelled_issues,
          cancelled_issues: analytics.cancelled_issues,
          completed_issues: analytics.completed_issues,
        });
        this.epicAnalyticsLoader[epicId] = "loaded";
      });
      return analytics;
    } catch (error) {
      this.epicAnalyticsLoader[epicId] = "loaded";
      throw error;
    }
  };

  /**
   * @description Fetch epic stats
   * @param workspaceSlug
   * @param projectId
   */
  fetchEpicStats = async (workspaceSlug: string, projectId: string) => {
    if (!workspaceSlug || !projectId) return;
    if (!this.epicService.fetchEpicStats) throw new Error("Fetch epic stats service not available.");
    try {
      this.epicStatsLoader[projectId] = "init-loader";
      const response = await this.epicService.fetchEpicStats(workspaceSlug, projectId);

      runInAction(() => {
        if (!response) return;

        if (!this.epicStatsMap) this.epicStatsMap = {};

        response.forEach((stats) => {
          if (!stats) return;

          this.epicStatsMap![stats.epic_id] = stats;
        });
        this.epicStatsLoader[projectId] = "loaded";
      });

      return response;
    } catch (error) {
      this.epicStatsLoader[projectId] = "loaded";
      throw error;
    }
  };

  /**
   * @description Update epic analytics
   * @param workspaceSlug
   * @param projectId
   * @param epicId
   * @param data
   */
  updateEpicAnalytics = (
    workspaceSlug: string,
    projectId: string,
    epicId: string,
    data: {
      incrementStateGroupCount?: TEpicAnalyticsGroup;
      decrementStateGroupCount?: TEpicAnalyticsGroup;
    }
  ) => {
    // Early return if required params are missing or no analytics exist
    if (!workspaceSlug || !projectId || !epicId || !this.epicAnalyticsMap[epicId]) return;

    const { incrementStateGroupCount, decrementStateGroupCount } = data;
    if (!incrementStateGroupCount && !decrementStateGroupCount) return;

    // Create update payload
    const payload: Partial<TEpicAnalytics> = {};

    if (incrementStateGroupCount) {
      payload[incrementStateGroupCount] = this.epicAnalyticsMap[epicId][incrementStateGroupCount] + 1;
    }

    if (decrementStateGroupCount) {
      payload[decrementStateGroupCount] =
        this.epicAnalyticsMap[epicId][decrementStateGroupCount] > 0
          ? this.epicAnalyticsMap[epicId][decrementStateGroupCount] - 1
          : 0;
    }

    // Update analytics in a single operation
    runInAction(() => {
      this.epicAnalyticsMap[epicId] = {
        ...this.epicAnalyticsMap[epicId],
        ...payload,
      };
      this.epicStatsMap[epicId] = {
        ...this.epicStatsMap[epicId],
        ...payload,
      };
    });
  };
}
