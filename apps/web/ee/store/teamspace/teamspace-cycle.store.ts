import { set } from "lodash-es";
import { observable, action, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { ICycle, TLoader } from "@plane/types";
// plane web services
import { TeamspaceCycleService } from "@/plane-web/services/teamspace/teamspace-cycles.service";
// plane web store
import { ICycleStore } from "@/plane-web/store/cycle";
import { RootStore } from "@/plane-web/store/root.store";

export interface ITeamspaceCycleStore {
  // observables
  teamspaceCyclesLoader: Record<string, TLoader>; // teamspace ID -> loader
  teamspaceCyclesFetchedMap: Record<string, boolean>; // teamspace ID -> fetched
  // computed functions
  getTeamspaceCyclesLoader: (teamspaceId: string) => TLoader;
  getTeamspaceFilteredCycleIds: (teamspaceId: string) => string[];
  getTeamspaceFilteredActiveCycleIds: (teamspaceId: string) => string[];
  getTeamspaceFilteredCompletedCycleIds: (teamspaceId: string) => string[];
  getTeamspaceFilteredUpcomingCycleIds: (teamspaceId: string) => string[];
  getTeamspaceGroupedActiveCycleIds: (teamspaceId: string) => Record<string, string>; // project_id -> teamspace active cycle ID
  getTeamspaceGroupedUpcomingCycleIds: (teamspaceId: string) => Record<string, string[]>; // project_id -> teamspace upcoming cycle IDs
  getTeamspaceGroupedCompletedCycleIds: (teamspaceId: string) => Record<string, string[]>; // project_id -> teamspace completed cycle IDs
  // actions
  fetchTeamspaceCycles: (workspaceSlug: string, teamspaceId: string) => Promise<ICycle[]>;
}

export class TeamspaceCycleStore implements ITeamspaceCycleStore {
  // observables
  teamspaceCyclesLoader: Record<string, TLoader> = {};
  teamspaceCyclesFetchedMap: Record<string, boolean> = {};
  // store
  cycleStore: ICycleStore;
  // service
  teamspaceCycleService: TeamspaceCycleService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      teamspaceCyclesLoader: observable,
      teamspaceCyclesFetchedMap: observable,
      // actions
      fetchTeamspaceCycles: action,
    });
    // store
    this.cycleStore = store.cycle;
    // service
    this.teamspaceCycleService = new TeamspaceCycleService();
  }

  // computed functions
  /**
   * Returns teamspace cycles loader
   * @param teamspaceId
   * @returns TLoader
   */
  getTeamspaceCyclesLoader = computedFn((teamspaceId: string): TLoader => this.teamspaceCyclesLoader[teamspaceId]);

  /**
   * Returns teamspace filtered cycle IDs
   * @param teamspaceId
   * @returns string[] cycle IDs
   */
  getTeamspaceFilteredCycleIds = computedFn((teamspaceId: string): string[] => {
    // get teamspace project ids
    const teamspaceProjectIds = this.store.teamspaceRoot.teamspaces.getTeamspaceProjectIds(teamspaceId);
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
    // get teamspace cycle ids
    const teamspaceCycleIds: string[] = [];
    teamspaceProjectIds?.forEach((projectId) => {
      const cycles = projectCyclesMap.get(projectId) ?? [];
      const cycleIds = cycles.map((c) => c.id);
      if (cycleIds) {
        teamspaceCycleIds.push(...cycleIds);
      }
    });
    return teamspaceCycleIds;
  });

  /**
   * Returns teamspace filtered active cycle IDs
   * @param teamspaceId
   * @returns string[] cycle IDs
   */
  getTeamspaceFilteredActiveCycleIds = computedFn((teamspaceId: string): string[] => {
    const teamspaceCycleIds = this.getTeamspaceFilteredCycleIds(teamspaceId);
    return teamspaceCycleIds.filter(
      (cycleId) => this.cycleStore.getCycleById(cycleId)?.status?.toLowerCase() === "current"
    );
  });

  /**
   * Returns teamspace filtered completed cycle IDs
   * @param teamspaceId
   * @returns string[] cycle IDs
   */
  getTeamspaceFilteredCompletedCycleIds = computedFn((teamspaceId: string): string[] => {
    const teamspaceCycleIds = this.getTeamspaceFilteredCycleIds(teamspaceId);
    return teamspaceCycleIds.filter(
      (cycleId) => this.cycleStore.getCycleById(cycleId)?.status?.toLowerCase() === "completed"
    );
  });

  /**
   * Returns teamspace filtered upcoming cycle IDs
   * @param teamspaceId
   * @returns string[] cycle IDs
   */
  getTeamspaceFilteredUpcomingCycleIds = computedFn((teamspaceId: string): string[] => {
    const teamspaceCycleIds = this.getTeamspaceFilteredCycleIds(teamspaceId);
    return teamspaceCycleIds.filter(
      (cycleId) => this.cycleStore.getCycleById(cycleId)?.status?.toLowerCase() === "upcoming"
    );
  });

  /**
   * Returns teamspace grouped active cycle IDs
   * @param teamspaceId
   * @returns Record<string, string> project_id -> teamspace active cycle ID
   */
  getTeamspaceGroupedActiveCycleIds = computedFn((teamspaceId: string): Record<string, string> => {
    const teamActiveCycleIds = this.getTeamspaceFilteredActiveCycleIds(teamspaceId);
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
   * Returns teamspace grouped upcoming cycle IDs
   * @param teamspaceId
   * @returns Record<string, string[]> project_id -> teamspace upcoming cycle IDs
   */
  getTeamspaceGroupedUpcomingCycleIds = computedFn((teamspaceId: string): Record<string, string[]> => {
    const teamUpcomingCycleIds = this.getTeamspaceFilteredUpcomingCycleIds(teamspaceId);
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
   * Returns teamspace grouped completed cycle IDs
   * @param teamspaceId
   * @returns Record<string, string[]> project_id -> teamspace completed cycle IDs
   */
  getTeamspaceGroupedCompletedCycleIds = computedFn((teamspaceId: string): Record<string, string[]> => {
    const teamCompletedCycleIds = this.getTeamspaceFilteredCompletedCycleIds(teamspaceId);
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
   * Fetches teamspace cycles for a teamspace and updates the store
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<ICycle[]>
   */
  fetchTeamspaceCycles = action(async (workspaceSlug: string, teamspaceId: string): Promise<ICycle[]> => {
    try {
      if (this.teamspaceCyclesFetchedMap[teamspaceId]) {
        set(this.teamspaceCyclesLoader, [teamspaceId], "mutation");
      } else {
        set(this.teamspaceCyclesLoader, [teamspaceId], "init-loader");
      }
      const cycles = await this.teamspaceCycleService.getTeamspaceCycles(workspaceSlug, teamspaceId);
      runInAction(() => {
        // set cycles in the store
        cycles.forEach((cycle) => {
          set(this.cycleStore.cycleMap, [cycle.id], cycle);
        });
        // set fetched map
        set(this.teamspaceCyclesFetchedMap, [teamspaceId], true);
      });
      return cycles;
    } catch (error) {
      console.error("Failed to fetch teamspace cycles", error);
      throw error;
    } finally {
      set(this.teamspaceCyclesLoader, [teamspaceId], "loaded");
    }
  });
}
