import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import set from "lodash/set";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { EStatisticsLegend, ETeamAnalyticsDataKeys, ETeamAnalyticsValueKeys, ETeamEntityScope } from "@plane/constants";
import { TLoader, TTeamRelations, TTeamStatistics, TTeamProgressSummary } from "@plane/types";
// plane web imports
import { TeamAnalyticsService } from "@/plane-web/services/teams/team-analytics.service";
import { RootStore } from "@/plane-web/store/root.store";
import { TStatisticsFilter, TTeamProgressChart, TWorkloadFilter } from "@/plane-web/types/teams";

const DEFAULT_TEAM_STATISTICS_FILTER: TStatisticsFilter = {
  scope: ETeamEntityScope.PROJECT,
  data_key: ETeamAnalyticsDataKeys.PROJECTS,
  value_key: ETeamAnalyticsValueKeys.ISSUES,
  issue_type: [],
  state_group: [],
  dependency_type: undefined,
  target_date: [],
  legend: EStatisticsLegend.STATE,
};

export interface ITeamAnalyticsStore {
  // observables
  teamProgressChartLoader: Record<string, TLoader>; // teamId => loader
  teamProgressSummaryLoader: Record<string, TLoader>; // teamId => loader
  teamRelationsLoader: Record<string, TLoader>; // teamId => loader
  teamStatisticsLoader: Record<string, TLoader>; // teamId => loader
  teamProgressChartMap: Record<string, TTeamProgressChart>; // teamId => progress chart details
  teamProgressSummaryMap: Record<string, TTeamProgressSummary>; // teamId => progress summary
  teamRelationsMap: Record<string, TTeamRelations>; // teamId => relations
  teamStatisticsMap: Record<string, TTeamStatistics>; // teamId => statistics
  teamProgressFilter: Record<string, TWorkloadFilter>; // teamId => progress filter
  teamStatisticsFilter: Record<string, TStatisticsFilter>; // teamId => statistics filter
  // computed functions
  getTeamProgressChartLoader: (teamId: string) => TLoader | undefined;
  getTeamProgressSummaryLoader: (teamId: string) => TLoader | undefined;
  getTeamRelationsLoader: (teamId: string) => TLoader | undefined;
  getTeamStatisticsLoader: (teamId: string) => TLoader | undefined;
  getTeamProgressChart: (teamId: string) => TTeamProgressChart | undefined;
  getTeamProgressSummary: (teamId: string) => TTeamProgressSummary | undefined;
  getTeamRelations: (teamId: string) => TTeamRelations | undefined;
  getTeamStatistics: (teamId: string) => TTeamStatistics | undefined;
  getTeamProgressFilter: (teamId: string) => TWorkloadFilter;
  getTeamStatisticsFilter: (teamId: string) => TStatisticsFilter;
  // helper action
  initTeamProgressFilter: (teamId: string) => void;
  initTeamStatisticsFilter: (teamId: string) => void;
  updateTeamProgressFilter: (workspaceSlug: string, teamId: string, payload: Partial<TWorkloadFilter>) => Promise<void>;
  updateTeamStatisticsFilter: <T extends keyof TStatisticsFilter>(
    workspaceSlug: string,
    teamId: string,
    key: T,
    value: TStatisticsFilter[T]
  ) => Promise<void>;
  clearTeamStatisticsFilter: (workspaceSlug: string, teamId: string) => Promise<void>;
  fetchTeamAnalytics: (workspaceSlug: string, teamId: string) => Promise<void>;
  // actions
  fetchTeamProgressChartDetails: (workspaceSlug: string, teamId: string, filter?: TWorkloadFilter) => Promise<void>;
  fetchTeamProgressSummary: (workspaceSlug: string, teamId: string) => Promise<void>;
  fetchTeamRelations: (workspaceSlug: string, teamId: string) => Promise<void>;
  fetchTeamStatistics: (workspaceSlug: string, teamId: string, filter?: TStatisticsFilter) => Promise<void>;
}

export class TeamAnalyticsStore implements ITeamAnalyticsStore {
  // observables
  teamProgressChartLoader: Record<string, TLoader> = {}; // teamId => loader
  teamProgressSummaryLoader: Record<string, TLoader> = {}; // teamId => loader
  teamRelationsLoader: Record<string, TLoader> = {}; // teamId => loader
  teamStatisticsLoader: Record<string, TLoader> = {}; // teamId => loader
  teamProgressChartMap: Record<string, TTeamProgressChart> = {}; // teamId => progress chart details
  teamProgressSummaryMap: Record<string, TTeamProgressSummary> = {}; // teamId => progress summary
  teamRelationsMap: Record<string, TTeamRelations> = {}; // teamId => relations
  teamStatisticsMap: Record<string, TTeamStatistics> = {}; // teamId => statistics
  teamProgressFilter: Record<string, TWorkloadFilter> = {}; // teamId => progress filter
  teamStatisticsFilter: Record<string, TStatisticsFilter> = {}; // teamId => statistics filter
  // store
  rootStore: RootStore;
  // service
  teamAnalyticsService: TeamAnalyticsService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      teamProgressChartLoader: observable,
      teamProgressSummaryLoader: observable,
      teamRelationsLoader: observable,
      teamStatisticsLoader: observable,
      teamProgressChartMap: observable,
      teamProgressSummaryMap: observable,
      teamRelationsMap: observable,
      teamStatisticsMap: observable,
      teamProgressFilter: observable,
      teamStatisticsFilter: observable,
      // helper action
      initTeamProgressFilter: action,
      initTeamStatisticsFilter: action,
      updateTeamProgressFilter: action,
      updateTeamStatisticsFilter: action,
      fetchTeamAnalytics: action,
      // actions
      fetchTeamProgressChartDetails: action,
      fetchTeamProgressSummary: action,
      fetchTeamRelations: action,
      fetchTeamStatistics: action,
    });
    // store
    this.rootStore = _rootStore;
    // service
    this.teamAnalyticsService = new TeamAnalyticsService();
  }

  // computed functions
  /**
   * Get team progress chart loader
   * @param teamId
   * @returns TLoader | undefined
   */
  getTeamProgressChartLoader = computedFn((teamId: string) => this.teamProgressChartLoader[teamId]);

  /** Get team progress summary loader
   * @param teamId
   * @returns TLoader | undefined
   */
  getTeamProgressSummaryLoader = computedFn((teamId: string) => this.teamProgressSummaryLoader[teamId]);

  /**
   * Get team relations loader
   * @param teamId
   * @returns TLoader | undefined
   */
  getTeamRelationsLoader = computedFn((teamId: string) => this.teamRelationsLoader[teamId]);

  /**
   * Get team statistics loader
   * @param teamId
   * @returns TLoader | undefined
   */
  getTeamStatisticsLoader = computedFn((teamId: string) => this.teamStatisticsLoader[teamId]);

  /**
   * Get team progress
   * @param teamId
   * @returns TTeamProgressChart
   */
  getTeamProgressChart = computedFn((teamId: string) => this.teamProgressChartMap[teamId]);

  /** Get team progress summary
   * @param teamId
   * @returns TTeamProgressSummary
   */
  getTeamProgressSummary = computedFn((teamId: string) => this.teamProgressSummaryMap[teamId]);

  /**
   * Get team relations
   * @param teamId
   * @returns TTeamStatistics
   */
  getTeamRelations = computedFn((teamId: string) => this.teamRelationsMap[teamId]);

  /**
   * Get team statistics
   * @param teamId
   * @returns TTeamStatistics
   */
  getTeamStatistics = computedFn((teamId: string) => this.teamStatisticsMap[teamId]);

  /**
   * Get team progress filter
   * @param teamId
   * @returns TWorkloadFilter
   */
  getTeamProgressFilter = computedFn((teamId: string) => {
    if (!this.teamProgressFilter[teamId]) this.initTeamProgressFilter(teamId);
    return this.teamProgressFilter[teamId];
  });

  /**
   * Get team statistics filter
   * @param teamId
   * @returns TStatisticsFilter
   */
  getTeamStatisticsFilter = computedFn((teamId: string) => {
    if (!this.teamStatisticsFilter[teamId]) this.initTeamStatisticsFilter(teamId);
    return this.teamStatisticsFilter[teamId];
  });

  // helper actions
  /**
   * Initialize team progress filter
   * @param teamId
   */
  initTeamProgressFilter = (teamId: string) => {
    set(this.teamProgressFilter, teamId, {
      yAxisKey: "issues",
      xAxisKey: "target_date",
    });
  };

  /**
   * Initialize team statistics filter
   * @param teamId
   */
  initTeamStatisticsFilter = (teamId: string) => {
    set(this.teamStatisticsFilter, teamId, DEFAULT_TEAM_STATISTICS_FILTER);
  };

  /**
   * Update team progress filter and fetch team progress
   * @param workspaceSlug
   * @param teamId
   * @param payload
   */
  updateTeamProgressFilter = async (workspaceSlug: string, teamId: string, payload: Partial<TWorkloadFilter>) => {
    const filterBeforeUpdate = cloneDeep(this.getTeamProgressFilter(teamId));
    try {
    // optimistic update
      update(this.teamProgressFilter, teamId, (filter) => ({ ...filter, ...payload }));
      await this.fetchTeamProgressChartDetails(workspaceSlug, teamId, { ...filterBeforeUpdate, ...payload });
    } catch (error) {
      // revert changes if API call fails
      set(this.teamProgressFilter, teamId, filterBeforeUpdate);
      console.error(error);
    }
  };

  /**
   * Update team statistics filter and fetch team statistics
   * @param workspaceSlug
   * @param teamId
   * @param key - key of the filter
   * @param value - value of the filter
   */
  updateTeamStatisticsFilter = async <K extends keyof TStatisticsFilter>(
    workspaceSlug: string,
    teamId: string,
    key: K,
    value: TStatisticsFilter[K]
  ) => {
    const filterBeforeUpdate = cloneDeep(this.getTeamStatisticsFilter(teamId));
    const updatedFilter = { ...filterBeforeUpdate, [key]: value };
    if (isEqual(updatedFilter, filterBeforeUpdate)) return;
    try {
      // optimistic update
      update(this.teamStatisticsFilter, teamId, (filter) => ({ ...filter, [key]: value }));
      if (key !== "legend") {
        await this.fetchTeamStatistics(workspaceSlug, teamId, updatedFilter); // API call is not required when legend is changed
      }
    } catch (error) {
      // revert changes if API call fails
      set(this.teamStatisticsFilter, teamId, filterBeforeUpdate);
      console.error(error);
    }
  };

  /**
   * Remove applied filters and reset to default
   * @param workspaceSlug
   * @param teamId
   */
  clearTeamStatisticsFilter = async (workspaceSlug: string, teamId: string) => {
    await this.fetchTeamStatistics(workspaceSlug, teamId, DEFAULT_TEAM_STATISTICS_FILTER).then(() => {
      this.initTeamStatisticsFilter(teamId);
    });
  };

  /**
   * Fetch team analytics
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<void>
   */
  fetchTeamAnalytics = async (workspaceSlug: string, teamId: string) => {
    Promise.all([
      this.fetchTeamProgressChartDetails(workspaceSlug, teamId),
      this.fetchTeamProgressSummary(workspaceSlug, teamId),
      this.fetchTeamRelations(workspaceSlug, teamId),
      this.fetchTeamStatistics(workspaceSlug, teamId),
    ]);
  };

  // actions
  /**
   * Fetch team progress
   * @param workspaceSlug
   * @param teamId
   * @param filter
   * @returns Promise<void>
   */
  fetchTeamProgressChartDetails = async (workspaceSlug: string, teamId: string, filter?: TWorkloadFilter) => {
    try {
      // return if no projects are available
      if (this.rootStore.teamRoot.team.getTeamProjectIds(teamId)?.length === 0) return;
      // Set loader
      if (this.getTeamProgressChart(teamId)) {
        set(this.teamProgressChartLoader, teamId, "mutation");
      } else {
        set(this.teamProgressChartLoader, teamId, "init-loader");
      }
      // get the team progress filter
      const params = filter || this.getTeamProgressFilter(teamId);
      // Fetch team progress
      const response = await this.teamAnalyticsService.getTeamProgressChart(workspaceSlug, teamId, params);
      // Update team progress store
      runInAction(() => {
        set(this.teamProgressChartMap, teamId, response);
      });
    } catch (e) {
      console.log("error while fetching team progress", e);
      throw e;
    } finally {
      set(this.teamProgressChartLoader, teamId, "loaded");
    }
  };

  /** Fetch team progress summary
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<void>
   */
  fetchTeamProgressSummary = async (workspaceSlug: string, teamId: string) => {
    try {
      // return if no projects are available
      if (this.rootStore.teamRoot.team.getTeamProjectIds(teamId)?.length === 0) return;
      // Set loader
      if (this.getTeamProgressSummary(teamId)) {
        set(this.teamProgressSummaryLoader, teamId, "mutation");
      } else {
        set(this.teamProgressSummaryLoader, teamId, "init-loader");
      }
      // Fetch team progress summary
      const response = await this.teamAnalyticsService.getTeamProgressSummary(workspaceSlug, teamId);
      // Update team progress summary store
      runInAction(() => {
        set(this.teamProgressSummaryMap, teamId, response);
      });
    } catch (e) {
      console.log("error while fetching team progress summary", e);
      throw e;
    } finally {
      set(this.teamProgressSummaryLoader, teamId, "loaded");
    }
  };

  /**
   * Fetch team relations
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<void>
   */
  fetchTeamRelations = async (workspaceSlug: string, teamId: string) => {
    try {
      // return if no projects are available
      if (this.rootStore.teamRoot.team.getTeamProjectIds(teamId)?.length === 0) return;
      // Set loader
      if (this.getTeamRelations(teamId)) {
        set(this.teamRelationsLoader, teamId, "mutation");
      } else {
        set(this.teamRelationsLoader, teamId, "init-loader");
      }
      // Fetch team relations
      const response = await this.teamAnalyticsService.getTeamRelations(workspaceSlug, teamId);
      // Update team relations store
      runInAction(() => {
        set(this.teamRelationsMap, teamId, response);
      });
    } catch (e) {
      console.log("error while fetching team relations", e);
      throw e;
    } finally {
      set(this.teamRelationsLoader, teamId, "loaded");
    }
  };

  /**
   * Fetch team statistics
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<void>
   */
  fetchTeamStatistics = async (workspaceSlug: string, teamId: string, filter?: TStatisticsFilter) => {
    try {
      // return if no projects are available
      if (this.rootStore.teamRoot.team.getTeamProjectIds(teamId)?.length === 0) return;
      // Set loader
      if (this.getTeamStatistics(teamId)) {
        set(this.teamStatisticsLoader, teamId, "mutation");
      } else {
        set(this.teamStatisticsLoader, teamId, "init-loader");
      }
      // get the team statistics filter
      const params = filter || this.getTeamStatisticsFilter(teamId);
      // Fetch team statistics
      const response = await this.teamAnalyticsService.getTeamStatistics(workspaceSlug, teamId, params);
      // Update team statistics store
      runInAction(() => {
        set(this.teamStatisticsMap, teamId, response);
      });
    } catch (e) {
      console.log("error while fetching team statistics", e);
      throw e;
    } finally {
      set(this.teamStatisticsLoader, teamId, "loaded");
    }
  };
}
