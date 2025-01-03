import set from "lodash/set";
import { observable, action, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { ICycle, TLoader } from "@plane/types";
// plane web services
import { TeamCycleService } from "@/plane-web/services/teams/team-cycles.service";
// plane web store
import { ICycleStore } from "@/plane-web/store/cycle.store";
import { RootStore } from "@/plane-web/store/root.store";

export interface ITeamCycleStore {
  // observables
  teamCyclesLoader: Record<string, TLoader>; // team ID -> loader
  teamCyclesFetchedMap: Record<string, boolean>; // team ID -> fetched
  // computed functions
  getTeamCyclesLoader: (teamId: string) => TLoader;
  getTeamFilteredCycleIds: (teamId: string) => string[];
  getTeamFilteredActiveCycleIds: (teamId: string) => string[];
  getTeamFilteredCompletedCycleIds: (teamId: string) => string[];
  getTeamFilteredUpcomingCycleIds: (teamId: string) => string[];
  getTeamGroupedActiveCycleIds: (teamId: string) => Record<string, string>; // project_id -> team active cycle ID
  getTeamGroupedUpcomingCycleIds: (teamId: string) => Record<string, string[]>; // project_id -> team upcoming cycle IDs
  getTeamGroupedCompletedCycleIds: (teamId: string) => Record<string, string[]>; // project_id -> team completed cycle IDs
  // actions
  fetchTeamCycles: (workspaceSlug: string, teamId: string) => Promise<ICycle[]>;
}

export class TeamCycleStore implements ITeamCycleStore {
  // observables
  teamCyclesLoader: Record<string, TLoader> = {};
  teamCyclesFetchedMap: Record<string, boolean> = {};
  // store
  cycleStore: ICycleStore;
  // service
  teamCycleService: TeamCycleService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      teamCyclesLoader: observable,
      teamCyclesFetchedMap: observable,
      // actions
      fetchTeamCycles: action,
    });
    // store
    this.cycleStore = store.cycle;
    // service
    this.teamCycleService = new TeamCycleService();
  }

  // computed functions
  /**
   * Returns team cycles loader
   * @param teamId
   * @returns TLoader
   */
  getTeamCyclesLoader = computedFn((teamId: string): TLoader => this.teamCyclesLoader[teamId]);

  /**
   * Returns team filtered cycle IDs
   * @param teamId
   * @returns string[] cycle IDs
   */
  getTeamFilteredCycleIds = computedFn((teamId: string): string[] => {
    // get team project ids
    const teamProjectIds = this.store.teamRoot.team.getTeamProjectIds(teamId);
    // map to store project cycles
    const projectCyclesMap = new Map<string, ICycle[]>();
    // Group cycles by project_id
    Object.values(this.cycleStore.cycleMap ?? {})
      .filter((c) => !c?.archived_at)
      .forEach((cycle) => {
        const projectCycles = projectCyclesMap.get(cycle.project_id) ?? [];
        projectCycles.push(cycle);
        projectCyclesMap.set(cycle.project_id, projectCycles);
      });
    // get team cycle ids
    const teamCycleIds: string[] = [];
    teamProjectIds?.forEach((projectId) => {
      const cycles = projectCyclesMap.get(projectId) ?? [];
      const cycleIds = cycles.map((c) => c.id);
      if (cycleIds) {
        teamCycleIds.push(...cycleIds);
      }
    });
    return teamCycleIds;
  });

  /**
   * Returns team filtered active cycle IDs
   * @param teamId
   * @returns string[] cycle IDs
   */
  getTeamFilteredActiveCycleIds = computedFn((teamId: string): string[] => {
    const teamCycleIds = this.getTeamFilteredCycleIds(teamId);
    return teamCycleIds.filter((cycleId) => this.cycleStore.getCycleById(cycleId)?.status?.toLowerCase() === "current");
  });

  /**
   * Returns team filtered completed cycle IDs
   * @param teamId
   * @returns string[] cycle IDs
   */
  getTeamFilteredCompletedCycleIds = computedFn((teamId: string): string[] => {
    const teamCycleIds = this.getTeamFilteredCycleIds(teamId);
    return teamCycleIds.filter(
      (cycleId) => this.cycleStore.getCycleById(cycleId)?.status?.toLowerCase() === "completed"
    );
  });

  /**
   * Returns team filtered upcoming cycle IDs
   * @param teamId
   * @returns string[] cycle IDs
   */
  getTeamFilteredUpcomingCycleIds = computedFn((teamId: string): string[] => {
    const teamCycleIds = this.getTeamFilteredCycleIds(teamId);
    return teamCycleIds.filter(
      (cycleId) => this.cycleStore.getCycleById(cycleId)?.status?.toLowerCase() === "upcoming"
    );
  });

  /**
   * Returns team grouped active cycle IDs
   * @param teamId
   * @returns Record<string, string> project_id -> team active cycle ID
   */
  getTeamGroupedActiveCycleIds = computedFn((teamId: string): Record<string, string> => {
    const teamActiveCycleIds = this.getTeamFilteredActiveCycleIds(teamId);
    // Group by project_id -> cycle_id, only one active cycle per project
    const projectGroupedActiveCycleIds: Record<string, string> = {};
    teamActiveCycleIds.forEach((cycleId) => {
      const cycle = this.cycleStore.getCycleById(cycleId);
      const projectId = cycle?.project_id;
      if (projectId) {
        projectGroupedActiveCycleIds[projectId] = cycleId;
      }
    });
    return projectGroupedActiveCycleIds;
  });

  /**
   * Returns team grouped upcoming cycle IDs
   * @param teamId
   * @returns Record<string, string[]> project_id -> team upcoming cycle IDs
   */
  getTeamGroupedUpcomingCycleIds = computedFn((teamId: string): Record<string, string[]> => {
    const teamUpcomingCycleIds = this.getTeamFilteredUpcomingCycleIds(teamId);
    // Group by project_id -> cycle_ids
    const projectGroupedUpcomingCycleIds: Record<string, string[]> = {};
    teamUpcomingCycleIds.forEach((cycleId) => {
      const cycle = this.cycleStore.getCycleById(cycleId);
      const projectId = cycle?.project_id;
      if (projectId) {
        if (!projectGroupedUpcomingCycleIds[projectId]) {
          projectGroupedUpcomingCycleIds[projectId] = [];
        }
        projectGroupedUpcomingCycleIds[projectId].push(cycleId);
      }
    });
    return projectGroupedUpcomingCycleIds;
  });

  /**
   * Returns team grouped completed cycle IDs
   * @param teamId
   * @returns Record<string, string[]> project_id -> team completed cycle IDs
   */
  getTeamGroupedCompletedCycleIds = computedFn((teamId: string): Record<string, string[]> => {
    const teamCompletedCycleIds = this.getTeamFilteredCompletedCycleIds(teamId);
    // Group by project_id -> cycle_ids
    const projectGroupedCompletedCycleIds: Record<string, string[]> = {};
    teamCompletedCycleIds.forEach((cycleId) => {
      const cycle = this.cycleStore.getCycleById(cycleId);
      const projectId = cycle?.project_id;
      if (projectId) {
        if (!projectGroupedCompletedCycleIds[projectId]) {
          projectGroupedCompletedCycleIds[projectId] = [];
        }
        projectGroupedCompletedCycleIds[projectId].push(cycleId);
      }
    });
    return projectGroupedCompletedCycleIds;
  });

  // actions
  /**
   * Fetches team cycles for a team and updates the store
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<ICycle[]>
   */
  fetchTeamCycles = action(async (workspaceSlug: string, teamId: string): Promise<ICycle[]> => {
    try {
      if (this.teamCyclesFetchedMap[teamId]) {
        set(this.teamCyclesLoader, [teamId], "mutation");
      } else {
        set(this.teamCyclesLoader, [teamId], "init-loader");
      }
      const cycles = await this.teamCycleService.getTeamCycles(workspaceSlug, teamId);
      runInAction(() => {
        // set cycles in the store
        cycles.forEach((cycle) => {
          set(this.cycleStore.cycleMap, [cycle.id], cycle);
        });
        // set fetched map
        set(this.teamCyclesFetchedMap, [teamId], true);
      });
      return cycles;
    } catch (error) {
      console.error("Failed to fetch team cycles", error);
      throw error;
    } finally {
      set(this.teamCyclesLoader, [teamId], "loaded");
    }
  });
}
