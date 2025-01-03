import set from "lodash/set";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane web imports
import {
  TLoader,
  TTeamWorkload,
  TWorkloadFilter,
  TTeamDependencies,
  TTeamStatistics,
  TStatisticsFilter,
} from "@plane/types";
import { TeamAnalyticsService } from "@/plane-web/services/teams/team-analytics.service";
// store
import { RootStore } from "@/plane-web/store/root.store";

export interface ITeamAnalyticsStore {
  // observables
  teamWorkloadLoader: Record<string, TLoader>; // teamId => loader
  teamDependenciesLoader: Record<string, TLoader>; // teamId => loader
  teamStatisticsLoader: Record<string, TLoader>; // teamId => loader
  teamWorkloadMap: Record<string, TTeamWorkload>; // teamId => workload
  teamDependenciesMap: Record<string, TTeamDependencies>; // teamId => dependencies
  teamStatisticsMap: Record<string, TTeamStatistics>; // teamId => statistics
  teamWorkloadFilter: Record<string, TWorkloadFilter>; // teamId => workload filter
  teamStatisticsFilter: Record<string, TStatisticsFilter>; // teamId => statistics filter
  // computed functions
  getTeamWorkloadLoader: (teamId: string) => TLoader | undefined;
  getTeamDependenciesLoader: (teamId: string) => TLoader | undefined;
  getTeamStatisticsLoader: (teamId: string) => TLoader | undefined;
  getTeamWorkload: (teamId: string) => TTeamWorkload | undefined;
  getTeamDependencies: (teamId: string) => TTeamDependencies | undefined;
  getTeamStatistics: (teamId: string) => TTeamStatistics | undefined;
  getTeamWorkloadFilter: (teamId: string) => TWorkloadFilter;
  getTeamStatisticsFilter: (teamId: string) => TStatisticsFilter;
  // helper action
  initTeamWorkloadFilter: (teamId: string) => void;
  initTeamStatisticsFilter: (teamId: string) => void;
  updateTeamWorkloadFilter: (workspaceSlug: string, teamId: string, payload: Partial<TWorkloadFilter>) => Promise<void>;
  updateTeamStatisticsFilter: <T extends keyof TStatisticsFilter>(
    workspaceSlug: string,
    teamId: string,
    key: T,
    value: TStatisticsFilter[T]
  ) => Promise<void>;
  fetchTeamAnalytics: (workspaceSlug: string, teamId: string) => Promise<void>;
  // actions
  fetchTeamWorkload: (workspaceSlug: string, teamId: string, filter?: TWorkloadFilter) => Promise<void>;
  fetchTeamDependencies: (workspaceSlug: string, teamId: string) => Promise<void>;
  fetchTeamStatistics: (workspaceSlug: string, teamId: string, filter?: TStatisticsFilter) => Promise<void>;
}

export class TeamAnalyticsStore implements ITeamAnalyticsStore {
  // observables
  teamWorkloadLoader: Record<string, TLoader> = {}; // teamId => loader
  teamDependenciesLoader: Record<string, TLoader> = {}; // teamId => loader
  teamStatisticsLoader: Record<string, TLoader> = {}; // teamId => loader
  teamWorkloadMap: Record<string, TTeamWorkload> = {}; // teamId => workload
  teamDependenciesMap: Record<string, TTeamDependencies> = {}; // teamId => dependencies
  teamStatisticsMap: Record<string, TTeamStatistics> = {}; // teamId => statistics
  teamWorkloadFilter: Record<string, TWorkloadFilter> = {}; // teamId => workload filter
  teamStatisticsFilter: Record<string, TStatisticsFilter> = {}; // teamId => statistics filter
  // store
  rootStore: RootStore;
  // service
  teamAnalyticsService: TeamAnalyticsService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      teamWorkloadLoader: observable,
      teamDependenciesLoader: observable,
      teamStatisticsLoader: observable,
      teamWorkloadMap: observable,
      teamDependenciesMap: observable,
      teamStatisticsMap: observable,
      teamWorkloadFilter: observable,
      teamStatisticsFilter: observable,
      // helper action
      initTeamWorkloadFilter: action,
      initTeamStatisticsFilter: action,
      updateTeamWorkloadFilter: action,
      updateTeamStatisticsFilter: action,
      fetchTeamAnalytics: action,
      // actions
      fetchTeamWorkload: action,
      fetchTeamDependencies: action,
      fetchTeamStatistics: action,
    });
    // store
    this.rootStore = _rootStore;
    // service
    this.teamAnalyticsService = new TeamAnalyticsService();
  }

  // computed functions
  /**
   * Get team workload loader
   * @param teamId
   * @returns TLoader | undefined
   */
  getTeamWorkloadLoader = computedFn((teamId: string) => this.teamWorkloadLoader[teamId]);

  /**
   * Get team dependencies loader
   * @param teamId
   * @returns TLoader | undefined
   */
  getTeamDependenciesLoader = computedFn((teamId: string) => this.teamDependenciesLoader[teamId]);

  /**
   * Get team statistics loader
   * @param teamId
   * @returns TLoader | undefined
   */
  getTeamStatisticsLoader = computedFn((teamId: string) => this.teamStatisticsLoader[teamId]);

  /**
   * Get team workload
   * @param teamId
   * @returns TStackChartData<TWorkloadDataKeys>[]
   */
  getTeamWorkload = computedFn((teamId: string) => this.teamWorkloadMap[teamId]);

  /**
   * Get team dependencies
   * @param teamId
   * @returns TTeamStatistics
   */
  getTeamDependencies = computedFn((teamId: string) => this.teamDependenciesMap[teamId]);

  /**
   * Get team statistics
   * @param teamId
   * @returns TTeamStatistics
   */
  getTeamStatistics = computedFn((teamId: string) => this.teamStatisticsMap[teamId]);

  /**
   * Get team workload filter
   * @param teamId
   * @returns TWorkloadFilter
   */
  getTeamWorkloadFilter = computedFn((teamId: string) => {
    if (!this.teamWorkloadFilter[teamId]) this.initTeamWorkloadFilter(teamId);
    return this.teamWorkloadFilter[teamId];
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
   * Initialize team workload filter
   * @param teamId
   */
  initTeamWorkloadFilter = (teamId: string) => {
    set(this.teamWorkloadFilter, teamId, {
      yAxisKey: "issues",
      xAxisKey: "target_date",
    });
  };

  /**
   * Initialize team statistics filter
   * @param teamId
   */
  initTeamStatisticsFilter = (teamId: string) => {
    set(this.teamStatisticsFilter, teamId, {
      dataKey: "projects",
      valueKey: "issues",
      issue_type: [],
      state__group: [],
      dependency: undefined,
      due_date: [],
      legend: "state",
    });
  };

  /**
   * Update team workload filter and fetch team workload
   * @param workspaceSlug
   * @param teamId
   * @param payload
   */
  updateTeamWorkloadFilter = async (workspaceSlug: string, teamId: string, payload: Partial<TWorkloadFilter>) => {
    const filter = this.getTeamWorkloadFilter(teamId);
    await this.fetchTeamWorkload(workspaceSlug, teamId, { ...filter, ...payload }).then(() => {
      update(this.teamWorkloadFilter, teamId, (filter) => ({ ...filter, ...payload }));
    });
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
    const filter = this.getTeamStatisticsFilter(teamId);
    if (key === "legend") {
      update(this.teamStatisticsFilter, teamId, (filter) => ({ ...filter, [key]: value })); // API call is not required when legend is changed
    } else {
      await this.fetchTeamStatistics(workspaceSlug, teamId, { ...filter, [key]: value }).then(() => {
        update(this.teamStatisticsFilter, teamId, (filter) => ({ ...filter, [key]: value }));
      });
    }
  };

  /**
   * Fetch team analytics
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<void>
   */
  fetchTeamAnalytics = async (workspaceSlug: string, teamId: string) => {
    Promise.all([
      this.fetchTeamWorkload(workspaceSlug, teamId),
      this.fetchTeamDependencies(workspaceSlug, teamId),
      this.fetchTeamStatistics(workspaceSlug, teamId),
    ]);
  };

  // actions
  /**
   * Fetch team workload
   * @param workspaceSlug
   * @param teamId
   * @param filter
   * @returns Promise<void>
   */
  fetchTeamWorkload = async (workspaceSlug: string, teamId: string, filter?: TWorkloadFilter) => {
    try {
      // Set loader
      if (this.getTeamWorkload(teamId)) {
        set(this.teamWorkloadLoader, teamId, "mutation");
      } else {
        set(this.teamWorkloadLoader, teamId, "init-loader");
      }
      // get the team workload filter
      const params = filter || this.getTeamWorkloadFilter(teamId);
      // Fetch team workload
      const response = await this.teamAnalyticsService.getTeamWorkload(workspaceSlug, teamId, params);
      // Update team workload store
      runInAction(() => {
        set(this.teamWorkloadMap, teamId, response);
      });
    } catch (e) {
      console.log("error while fetching team workload", e);
      throw e;
    } finally {
      set(this.teamWorkloadLoader, teamId, "loaded");
    }
  };

  /**
   * Fetch team dependencies
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<void>
   */
  fetchTeamDependencies = async (workspaceSlug: string, teamId: string) => {
    try {
      // Set loader
      if (this.getTeamDependencies(teamId)) {
        set(this.teamDependenciesLoader, teamId, "mutation");
      } else {
        set(this.teamDependenciesLoader, teamId, "init-loader");
      }
      // Fetch team dependencies
      const response = await this.teamAnalyticsService.getTeamDependencies(workspaceSlug, teamId);
      // Update team dependencies store
      runInAction(() => {
        set(this.teamDependenciesMap, teamId, response);
      });
    } catch (e) {
      console.log("error while fetching team dependencies", e);
      throw e;
    } finally {
      set(this.teamDependenciesLoader, teamId, "loaded");
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
