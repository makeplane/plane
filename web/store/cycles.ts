import { action, computed, observable, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
// services
import { ProjectService } from "services/project.service";
import { IssueService } from "services/issue.service";
import { ICycle } from "types";
import { CycleService } from "services/cycles.service";

export interface ICycleStore {
  loader: boolean;
  error: any | null;

  cycles: {
    [project_id: string]: ICycle[];
  };

  cycle_details: {
    [cycle_id: string]: ICycle;
  };

  fetchCycles: (
    workspaceSlug: string,
    projectId: string,
    params: "all" | "current" | "upcoming" | "draft" | "completed" | "incomplete"
  ) => Promise<void>;
  createCycle: (workspaceSlug: string, projectId: string, data: any) => Promise<ICycle>;

  addCycleToFavorites: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<any>;
  removeCycleFromFavorites: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;
}

class CycleStore implements ICycleStore {
  loader: boolean = false;
  error: any | null = null;

  cycles: {
    [project_id: string]: ICycle[];
  } = {};

  cycle_details: {
    [cycle_id: string]: ICycle;
  } = {};

  // root store
  rootStore;
  // services
  projectService;
  issueService;
  cycleService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable,
      error: observable.ref,

      cycles: observable.ref,

      // computed
      projectCycles: computed,
      // actions
      fetchCycles: action,
      createCycle: action,

      addCycleToFavorites: action,
      removeCycleFromFavorites: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.issueService = new IssueService();
    this.cycleService = new CycleService();
  }

  // computed
  get projectCycles() {
    if (!this.rootStore.project.projectId) return null;
    return this.cycles[this.rootStore.project.projectId] || null;
  }

  // actions
  fetchCycles = async (
    workspaceSlug: string,
    projectId: string,
    params: "all" | "current" | "upcoming" | "draft" | "completed" | "incomplete"
  ) => {
    try {
      this.loader = true;
      this.error = null;

      const cyclesResponse = await this.cycleService.getCyclesWithParams(workspaceSlug, projectId, params);

      runInAction(() => {
        this.cycles = {
          ...this.cycles,
          [projectId]: cyclesResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Failed to fetch project cycles in project store", error);
      this.loader = false;
      this.error = error;
    }
  };

  createCycle = async (workspaceSlug: string, projectId: string, data: any) => {
    try {
      const response = await this.cycleService.createCycle(
        workspaceSlug,
        projectId,
        data,
        this.rootStore.user.currentUser
      );

      runInAction(() => {
        this.cycles = {
          ...this.cycles,
          [projectId]: [...this.cycles[projectId], response],
        };
      });

      return response;
    } catch (error) {
      console.log("Failed to create cycle from cycle store");
      throw error;
    }
  };

  addCycleToFavorites = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      runInAction(() => {
        this.cycles = {
          ...this.cycles,
          [projectId]: this.cycles[projectId].map((cycle) => {
            if (cycle.id === cycleId) return { ...cycle, is_favorite: true };
            return cycle;
          }),
        };
      });
      // updating through api.
      const response = await this.cycleService.addCycleToFavorites(workspaceSlug, projectId, { cycle: cycleId });
      return response;
    } catch (error) {
      console.log("Failed to add cycle to favorites in the cycles store", error);
      // resetting the local state
      runInAction(() => {
        this.cycles = {
          ...this.cycles,
          [projectId]: this.cycles[projectId].map((cycle) => {
            if (cycle.id === cycleId) return { ...cycle, is_favorite: false };
            return cycle;
          }),
        };
      });

      throw error;
    }
  };

  removeCycleFromFavorites = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      runInAction(() => {
        this.cycles = {
          ...this.cycles,
          [projectId]: this.cycles[projectId].map((cycle) => {
            if (cycle.id === cycleId) return { ...cycle, is_favorite: false };
            return cycle;
          }),
        };
      });
      // updating through api
      const response = await this.cycleService.removeCycleFromFavorites(workspaceSlug, projectId, cycleId);
      return response;
    } catch (error) {
      console.log("Failed to remove cycle from favorites - Cycle Store", error);
      // resetting the local state
      runInAction(() => {
        this.cycles = {
          ...this.cycles,
          [projectId]: this.cycles[projectId].map((cycle) => {
            if (cycle.id === cycleId) return { ...cycle, is_favorite: true };
            return cycle;
          }),
        };
      });
      throw error;
    }
  };
}

export default CycleStore;
