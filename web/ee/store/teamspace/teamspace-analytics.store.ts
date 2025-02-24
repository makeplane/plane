import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import set from "lodash/set";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { EStatisticsLegend, ETeamspaceAnalyticsDataKeys, ETeamspaceAnalyticsValueKeys, ETeamspaceEntityScope } from "@plane/constants";
import { TLoader, TTeamspaceRelations, TTeamspaceStatistics, TTeamspaceProgressSummary } from "@plane/types";
// plane web imports
import { TeamspaceAnalyticsService } from "@/plane-web/services/teamspace/teamspace-analytics.service";
import { RootStore } from "@/plane-web/store/root.store";
import { TStatisticsFilter, TTeamspaceProgressChart, TWorkloadFilter } from "@/plane-web/types/teamspace";

const DEFAULT_TEAM_STATISTICS_FILTER: TStatisticsFilter = {
  scope: ETeamspaceEntityScope.PROJECT,
  data_key: ETeamspaceAnalyticsDataKeys.PROJECTS,
  value_key: ETeamspaceAnalyticsValueKeys.ISSUES,
  issue_type: [],
  state_group: [],
  dependency_type: undefined,
  target_date: [],
  legend: EStatisticsLegend.STATE,
};

export interface ITeamspaceAnalyticsStore {
  // observables
  teamspaceProgressChartLoader: Record<string, TLoader>; // teamspaceId => loader
  teamspaceProgressSummaryLoader: Record<string, TLoader>; // teamspaceId => loader
  teamspaceRelationsLoader: Record<string, TLoader>; // teamspaceId => loader
  teamspaceStatisticsLoader: Record<string, TLoader>; // teamspaceId => loader
  teamspaceProgressChartMap: Record<string, TTeamspaceProgressChart>; // teamspaceId => progress chart details
  teamspaceProgressSummaryMap: Record<string, TTeamspaceProgressSummary>; // teamspaceId => progress summary
  teamspaceRelationsMap: Record<string, TTeamspaceRelations>; // teamspaceId => relations
  teamspaceStatisticsMap: Record<string, TTeamspaceStatistics>; // teamspaceId => statistics
  teamspaceProgressFilter: Record<string, TWorkloadFilter>; // teamspaceId => progress filter
  teamspaceStatisticsFilter: Record<string, TStatisticsFilter>; // teamspaceId => statistics filter
  // computed functions
  getTeamspaceProgressChartLoader: (teamspaceId: string) => TLoader | undefined;
  getTeamspaceProgressSummaryLoader: (teamspaceId: string) => TLoader | undefined;
  getTeamspaceRelationsLoader: (teamspaceId: string) => TLoader | undefined;
  getTeamspaceStatisticsLoader: (teamspaceId: string) => TLoader | undefined;
  getTeamspaceProgressChart: (teamspaceId: string) => TTeamspaceProgressChart | undefined;
  getTeamspaceProgressSummary: (teamspaceId: string) => TTeamspaceProgressSummary | undefined;
  getTeamspaceRelations: (teamspaceId: string) => TTeamspaceRelations | undefined;
  getTeamspaceStatistics: (teamspaceId: string) => TTeamspaceStatistics | undefined;
  getTeamspaceProgressFilter: (teamspaceId: string) => TWorkloadFilter;
  getTeamspaceStatisticsFilter: (teamspaceId: string) => TStatisticsFilter;
  // helper action
  initTeamspaceProgressFilter: (teamspaceId: string) => void;
  initTeamspaceStatisticsFilter: (teamspaceId: string) => void;
  updateTeamspaceProgressFilter: (workspaceSlug: string, teamspaceId: string, payload: Partial<TWorkloadFilter>) => Promise<void>;
  updateTeamspaceStatisticsFilter: <T extends keyof TStatisticsFilter>(
    workspaceSlug: string,
    teamspaceId: string,
    key: T,
    value: TStatisticsFilter[T]
  ) => Promise<void>;
  clearTeamspaceStatisticsFilter: (workspaceSlug: string, teamspaceId: string) => Promise<void>;
  fetchTeamspaceAnalytics: (workspaceSlug: string, teamspaceId: string) => Promise<void>;
  // actions
  fetchTeamspaceProgressChartDetails: (workspaceSlug: string, teamspaceId: string, filter?: TWorkloadFilter) => Promise<void>;
  fetchTeamspaceProgressSummary: (workspaceSlug: string, teamspaceId: string) => Promise<void>;
  fetchTeamspaceRelations: (workspaceSlug: string, teamspaceId: string) => Promise<void>;
  fetchTeamspaceStatistics: (workspaceSlug: string, teamspaceId: string, filter?: TStatisticsFilter) => Promise<void>;
}

export class TeamspaceAnalyticsStore implements ITeamspaceAnalyticsStore {
  // observables
  teamspaceProgressChartLoader: Record<string, TLoader> = {}; // teamspaceId => loader
  teamspaceProgressSummaryLoader: Record<string, TLoader> = {}; // teamspaceId => loader
  teamspaceRelationsLoader: Record<string, TLoader> = {}; // teamspaceId => loader
  teamspaceStatisticsLoader: Record<string, TLoader> = {}; // teamspaceId => loader
  teamspaceProgressChartMap: Record<string, TTeamspaceProgressChart> = {}; // teamspaceId => progress chart details
  teamspaceProgressSummaryMap: Record<string, TTeamspaceProgressSummary> = {}; // teamspaceId => progress summary
  teamspaceRelationsMap: Record<string, TTeamspaceRelations> = {}; // teamspaceId => relations
  teamspaceStatisticsMap: Record<string, TTeamspaceStatistics> = {}; // teamspaceId => statistics
  teamspaceProgressFilter: Record<string, TWorkloadFilter> = {}; // teamspaceId => progress filter
  teamspaceStatisticsFilter: Record<string, TStatisticsFilter> = {}; // teamspaceId => statistics filter
  // store
  rootStore: RootStore;
  // service
  teamspaceAnalyticsService: TeamspaceAnalyticsService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      teamspaceProgressChartLoader: observable,
      teamspaceProgressSummaryLoader: observable,
      teamspaceRelationsLoader: observable,
      teamspaceStatisticsLoader: observable,
      teamspaceProgressChartMap: observable,
      teamspaceProgressSummaryMap: observable,
      teamspaceRelationsMap: observable,
      teamspaceStatisticsMap: observable,
      teamspaceProgressFilter: observable,
      teamspaceStatisticsFilter: observable,
      // helper action
      initTeamspaceProgressFilter: action,
      initTeamspaceStatisticsFilter: action,
      updateTeamspaceProgressFilter: action,
      updateTeamspaceStatisticsFilter: action,
      fetchTeamspaceAnalytics: action,
      // actions
      fetchTeamspaceProgressChartDetails: action,
      fetchTeamspaceProgressSummary: action,
      fetchTeamspaceRelations: action,
      fetchTeamspaceStatistics: action,
    });
    // store
    this.rootStore = _rootStore;
    // service
    this.teamspaceAnalyticsService = new TeamspaceAnalyticsService();
  }

  // computed functions
  /**
   * Get teamspace progress chart loader
   * @param teamspaceId
   * @returns TLoader | undefined
   */
  getTeamspaceProgressChartLoader = computedFn((teamspaceId: string) => this.teamspaceProgressChartLoader[teamspaceId]);

  /** Get teamspace progress summary loader
   * @param teamspaceId
   * @returns TLoader | undefined
   */
  getTeamspaceProgressSummaryLoader = computedFn((teamspaceId: string) => this.teamspaceProgressSummaryLoader[teamspaceId]);

  /**
   * Get teamspace relations loader
   * @param teamspaceId
   * @returns TLoader | undefined
   */
  getTeamspaceRelationsLoader = computedFn((teamspaceId: string) => this.teamspaceRelationsLoader[teamspaceId]);

  /**
   * Get teamspace statistics loader
   * @param teamspaceId
   * @returns TLoader | undefined
   */
  getTeamspaceStatisticsLoader = computedFn((teamspaceId: string) => this.teamspaceStatisticsLoader[teamspaceId]);

  /**
   * Get teamspace progress
   * @param teamspaceId
   * @returns TTeamspaceProgressChart
   */
  getTeamspaceProgressChart = computedFn((teamspaceId: string) => this.teamspaceProgressChartMap[teamspaceId]);

  /** Get teamspace progress summary
   * @param teamspaceId
   * @returns TTeamspaceProgressSummary
   */
  getTeamspaceProgressSummary = computedFn((teamspaceId: string) => this.teamspaceProgressSummaryMap[teamspaceId]);

  /**
   * Get teamspace relations
   * @param teamspaceId
   * @returns TTeamspaceStatistics
   */
  getTeamspaceRelations = computedFn((teamspaceId: string) => this.teamspaceRelationsMap[teamspaceId]);

  /**
   * Get teamspace statistics
   * @param teamspaceId
   * @returns TTeamspaceStatistics
   */
  getTeamspaceStatistics = computedFn((teamspaceId: string) => this.teamspaceStatisticsMap[teamspaceId]);

  /**
   * Get teamspace progress filter
   * @param teamspaceId
   * @returns TWorkloadFilter
   */
  getTeamspaceProgressFilter = computedFn((teamspaceId: string) => {
    if (!this.teamspaceProgressFilter[teamspaceId]) this.initTeamspaceProgressFilter(teamspaceId);
    return this.teamspaceProgressFilter[teamspaceId];
  });

  /**
   * Get teamspace statistics filter
   * @param teamspaceId
   * @returns TStatisticsFilter
   */
  getTeamspaceStatisticsFilter = computedFn((teamspaceId: string) => {
    if (!this.teamspaceStatisticsFilter[teamspaceId]) this.initTeamspaceStatisticsFilter(teamspaceId);
    return this.teamspaceStatisticsFilter[teamspaceId];
  });

  // helper actions
  /**
   * Initialize teamspace progress filter
   * @param teamspaceId
   */
  initTeamspaceProgressFilter = (teamspaceId: string) => {
    set(this.teamspaceProgressFilter, teamspaceId, {
      yAxisKey: "issues",
      xAxisKey: "target_date",
    });
  };

  /**
   * Initialize teamspace statistics filter
   * @param teamspaceId
   */
  initTeamspaceStatisticsFilter = (teamspaceId: string) => {
    set(this.teamspaceStatisticsFilter, teamspaceId, DEFAULT_TEAM_STATISTICS_FILTER);
  };

  /**
   * Update teamspace progress filter and fetch teamspace progress
   * @param workspaceSlug
   * @param teamspaceId
   * @param payload
   */
  updateTeamspaceProgressFilter = async (workspaceSlug: string, teamspaceId: string, payload: Partial<TWorkloadFilter>) => {
    const filterBeforeUpdate = cloneDeep(this.getTeamspaceProgressFilter(teamspaceId));
    try {
      // optimistic update
      update(this.teamspaceProgressFilter, teamspaceId, (filter) => ({ ...filter, ...payload }));
      await this.fetchTeamspaceProgressChartDetails(workspaceSlug, teamspaceId, { ...filterBeforeUpdate, ...payload });
    } catch (error) {
      // revert changes if API call fails
      set(this.teamspaceProgressFilter, teamspaceId, filterBeforeUpdate);
      console.error(error);
    }
  };

  /**
   * Update teamspace statistics filter and fetch teamspace statistics
   * @param workspaceSlug
   * @param teamspaceId
   * @param key - key of the filter
   * @param value - value of the filter
   */
  updateTeamspaceStatisticsFilter = async <K extends keyof TStatisticsFilter>(
    workspaceSlug: string,
    teamspaceId: string,
    key: K,
    value: TStatisticsFilter[K]
  ) => {
    const filterBeforeUpdate = cloneDeep(this.getTeamspaceStatisticsFilter(teamspaceId));
    const updatedFilter = { ...filterBeforeUpdate, [key]: value };
    if (isEqual(updatedFilter, filterBeforeUpdate)) return;
    try {
      // optimistic update
      update(this.teamspaceStatisticsFilter, teamspaceId, (filter) => ({ ...filter, [key]: value }));
      if (key !== "legend") {
        await this.fetchTeamspaceStatistics(workspaceSlug, teamspaceId, updatedFilter); // API call is not required when legend is changed
      }
    } catch (error) {
      // revert changes if API call fails
      set(this.teamspaceStatisticsFilter, teamspaceId, filterBeforeUpdate);
      console.error(error);
    }
  };

  /**
   * Remove applied filters and reset to default
   * @param workspaceSlug
   * @param teamspaceId
   */
  clearTeamspaceStatisticsFilter = async (workspaceSlug: string, teamspaceId: string) => {
    await this.fetchTeamspaceStatistics(workspaceSlug, teamspaceId, DEFAULT_TEAM_STATISTICS_FILTER).then(() => {
      this.initTeamspaceStatisticsFilter(teamspaceId);
    });
  };

  /**
   * Fetch teamspace analytics
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<void>
   */
  fetchTeamspaceAnalytics = async (workspaceSlug: string, teamspaceId: string) => {
    Promise.all([
      this.fetchTeamspaceProgressChartDetails(workspaceSlug, teamspaceId),
      this.fetchTeamspaceProgressSummary(workspaceSlug, teamspaceId),
      this.fetchTeamspaceRelations(workspaceSlug, teamspaceId),
      this.fetchTeamspaceStatistics(workspaceSlug, teamspaceId),
    ]);
  };

  // actions
  /**
   * Fetch teamspace progress
   * @param workspaceSlug
   * @param teamspaceId
   * @param filter
   * @returns Promise<void>
   */
  fetchTeamspaceProgressChartDetails = async (workspaceSlug: string, teamspaceId: string, filter?: TWorkloadFilter) => {
    try {
      // return if no projects are available
      if (this.rootStore.teamspaceRoot.teamspaces.getTeamspaceProjectIds(teamspaceId)?.length === 0) return;
      // Set loader
      if (this.getTeamspaceProgressChart(teamspaceId)) {
        set(this.teamspaceProgressChartLoader, teamspaceId, "mutation");
      } else {
        set(this.teamspaceProgressChartLoader, teamspaceId, "init-loader");
      }
      // get the teamspace progress filter
      const params = filter || this.getTeamspaceProgressFilter(teamspaceId);
      // Fetch teamspace progress
      const response = await this.teamspaceAnalyticsService.getTeamspaceProgressChart(workspaceSlug, teamspaceId, params);
      // Update teamspace progress store
      runInAction(() => {
        set(this.teamspaceProgressChartMap, teamspaceId, response);
      });
    } catch (e) {
      console.log("error while fetching teamspace progress", e);
      throw e;
    } finally {
      set(this.teamspaceProgressChartLoader, teamspaceId, "loaded");
    }
  };

  /** Fetch teamspace progress summary
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<void>
   */
  fetchTeamspaceProgressSummary = async (workspaceSlug: string, teamspaceId: string) => {
    try {
      // return if no projects are available
      if (this.rootStore.teamspaceRoot.teamspaces.getTeamspaceProjectIds(teamspaceId)?.length === 0) return;
      // Set loader
      if (this.getTeamspaceProgressSummary(teamspaceId)) {
        set(this.teamspaceProgressSummaryLoader, teamspaceId, "mutation");
      } else {
        set(this.teamspaceProgressSummaryLoader, teamspaceId, "init-loader");
      }
      // Fetch teamspace progress summary
      const response = await this.teamspaceAnalyticsService.getTeamspaceProgressSummary(workspaceSlug, teamspaceId);
      // Update teamspace progress summary store
      runInAction(() => {
        set(this.teamspaceProgressSummaryMap, teamspaceId, response);
      });
    } catch (e) {
      console.log("error while fetching teamspace progress summary", e);
      throw e;
    } finally {
      set(this.teamspaceProgressSummaryLoader, teamspaceId, "loaded");
    }
  };

  /**
   * Fetch teamspace relations
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<void>
   */
  fetchTeamspaceRelations = async (workspaceSlug: string, teamspaceId: string) => {
    try {
      // return if no projects are available
      if (this.rootStore.teamspaceRoot.teamspaces.getTeamspaceProjectIds(teamspaceId)?.length === 0) return;
      // Set loader
      if (this.getTeamspaceRelations(teamspaceId)) {
        set(this.teamspaceRelationsLoader, teamspaceId, "mutation");
      } else {
        set(this.teamspaceRelationsLoader, teamspaceId, "init-loader");
      }
      // Fetch teamspace relations
      const response = await this.teamspaceAnalyticsService.getTeamspaceRelations(workspaceSlug, teamspaceId);
      // Update teamspace relations store
      runInAction(() => {
        set(this.teamspaceRelationsMap, teamspaceId, response);
      });
    } catch (e) {
      console.log("error while fetching teamspace relations", e);
      throw e;
    } finally {
      set(this.teamspaceRelationsLoader, teamspaceId, "loaded");
    }
  };

  /**
   * Fetch teamspace statistics
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<void>
   */
  fetchTeamspaceStatistics = async (workspaceSlug: string, teamspaceId: string, filter?: TStatisticsFilter) => {
    try {
      // return if no projects are available
      if (this.rootStore.teamspaceRoot.teamspaces.getTeamspaceProjectIds(teamspaceId)?.length === 0) return;
      // Set loader
      if (this.getTeamspaceStatistics(teamspaceId)) {
        set(this.teamspaceStatisticsLoader, teamspaceId, "mutation");
      } else {
        set(this.teamspaceStatisticsLoader, teamspaceId, "init-loader");
      }
      // get the teamspace statistics filter
      const params = filter || this.getTeamspaceStatisticsFilter(teamspaceId);
      // Fetch teamspace statistics
      const response = await this.teamspaceAnalyticsService.getTeamspaceStatistics(workspaceSlug, teamspaceId, params);
      // Update teamspace statistics store
      runInAction(() => {
        set(this.teamspaceStatisticsMap, teamspaceId, response);
      });
    } catch (e) {
      console.log("error while fetching teamspace statistics", e);
      throw e;
    } finally {
      set(this.teamspaceStatisticsLoader, teamspaceId, "loaded");
    }
  };
}
