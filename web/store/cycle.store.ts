import { action, computed, observable, makeObservable, runInAction } from "mobx";
// types
import { ICycle, TCycleView, CycleDateCheckData } from "types";
// mobx
import { RootStore } from "store/root.store";
// services
import { ProjectService } from "services/project";
import { IssueService } from "services/issue";
import { CycleService } from "services/cycle.service";

export interface ICycleStore {
  loader: boolean;
  error: any | null;

  cycleView: TCycleView;

  cycleId: string | null;
  cycleMap: {
    [projectId: string]: {
      [cycleId: string]: ICycle;
    };
  };
  cycles: {
    [projectId: string]: {
      [filterType: string]: string[];
    };
  };

  // computed
  getCycleById: (cycleId: string) => ICycle | null;
  projectCycles: string[] | null;
  projectCompletedCycles: string[] | null;
  projectUpcomingCycles: string[] | null;
  projectDraftCycles: string[] | null;

  // actions
  validateDate: (workspaceSlug: string, projectId: string, payload: CycleDateCheckData) => Promise<any>;

  fetchCycles: (
    workspaceSlug: string,
    projectId: string,
    params: "all" | "current" | "upcoming" | "draft" | "completed" | "incomplete"
  ) => Promise<void>;
  fetchCycleDetails: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<ICycle>;

  createCycle: (workspaceSlug: string, projectId: string, data: Partial<ICycle>) => Promise<ICycle>;
  updateCycleDetails: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: Partial<ICycle>
  ) => Promise<ICycle>;
  deleteCycle: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;

  addCycleToFavorites: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<any>;
  removeCycleFromFavorites: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;
}

export class CycleStore implements ICycleStore {
  loader: boolean = false;
  error: any | null = null;

  cycleView: TCycleView = "all";

  cycleId: string | null = null;
  cycleMap: {
    [projectId: string]: {
      [cycleId: string]: ICycle;
    };
  } = {};
  cycles: {
    [projectId: string]: {
      [filterType: string]: string[];
    };
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

      cycleId: observable.ref,
      cycleMap: observable.ref,
      cycles: observable.ref,

      // computed
      projectCycles: computed,
      projectCompletedCycles: computed,
      projectUpcomingCycles: computed,
      projectDraftCycles: computed,

      // actions
      getCycleById: action,

      fetchCycles: action,
      fetchCycleDetails: action,

      createCycle: action,
      updateCycleDetails: action,
      deleteCycle: action,

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
    const projectId = this.rootStore.project.projectId;

    if (!projectId) return null;
    return this.cycles[projectId]?.all || null;
  }

  get projectCompletedCycles() {
    const projectId = this.rootStore.project.projectId;

    if (!projectId) return null;

    return this.cycles[projectId]?.completed || null;
  }

  get projectUpcomingCycles() {
    const projectId = this.rootStore.project.projectId;

    if (!projectId) return null;

    return this.cycles[projectId]?.upcoming || null;
  }

  get projectDraftCycles() {
    const projectId = this.rootStore.project.projectId;

    if (!projectId) return null;

    return this.cycles[projectId]?.draft || null;
  }

  getCycleById = (cycleId: string) => this.cycleMap[this.rootStore.project][cycleId] || null;

  // actions
  setCycleView = (_cycleView: TCycleView) => (this.cycleView = _cycleView);

  validateDate = async (workspaceSlug: string, projectId: string, payload: CycleDateCheckData) => {
    try {
      const response = await this.cycleService.cycleDateCheck(workspaceSlug, projectId, payload);
      return response;
    } catch (error) {
      console.log("Failed to validate cycle dates", error);
      throw error;
    }
  };

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
        this.cycleMap = {
          ...this.cycleMap,
          [projectId]: {
            ...this.cycleMap[projectId],
            ...cyclesResponse,
          },
        };
        this.cycles = {
          ...this.cycles,
          [projectId]: { ...this.cycles[projectId], [params]: Object.keys(cyclesResponse) },
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

  fetchCycleDetails = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const response = await this.cycleService.getCycleDetails(workspaceSlug, projectId, cycleId);

      runInAction(() => {
        this.cycleMap = {
          ...this.cycleMap,
          [projectId]: {
            ...this.cycleMap[projectId],
            [response?.id]: response,
          },
        };
      });

      return response;
    } catch (error) {
      console.log("Failed to fetch cycle detail from cycle store");
      throw error;
    }
  };

  createCycle = async (workspaceSlug: string, projectId: string, data: Partial<ICycle>) => {
    try {
      const response = await this.cycleService.createCycle(workspaceSlug, projectId, data);

      runInAction(() => {
        this.cycleMap = {
          ...this.cycleMap,
          [projectId]: {
            ...this.cycleMap[projectId],
            [response?.id]: response,
          },
        };
      });

      const _currentView = this.cycleView === "active" ? "current" : this.cycleView;
      this.fetchCycles(workspaceSlug, projectId, _currentView);

      return response;
    } catch (error) {
      console.log("Failed to create cycle from cycle store");
      throw error;
    }
  };

  updateCycleDetails = async (workspaceSlug: string, projectId: string, cycleId: string, data: Partial<ICycle>) => {
    try {
      const _response = await this.cycleService.patchCycle(workspaceSlug, projectId, cycleId, data);

      const currentCycle = this.cycleMap[projectId][cycleId];

      runInAction(() => {
        this.cycleMap = {
          ...this.cycleMap,
          [projectId]: {
            ...this.cycleMap[projectId],
            [cycleId]: { ...currentCycle, ...data },
          },
        };
      });

      const _currentView = this.cycleView === "active" ? "current" : this.cycleView;
      this.fetchCycles(workspaceSlug, projectId, _currentView);

      return _response;
    } catch (error) {
      console.log("Failed to patch cycle from cycle store");
      throw error;
    }
  };

  deleteCycle = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const currentProjectCycles = this.cycleMap[projectId];
      delete currentProjectCycles[cycleId];

      runInAction(() => {
        this.cycleMap = {
          ...this.cycleMap,
          [projectId]: currentProjectCycles,
        };
      });

      const _response = await this.cycleService.deleteCycle(workspaceSlug, projectId, cycleId);

      return _response;
    } catch (error) {
      console.log("Failed to delete cycle from cycle store");

      const _currentView = this.cycleView === "active" ? "current" : this.cycleView;
      this.fetchCycles(workspaceSlug, projectId, _currentView);
      throw error;
    }
  };

  addCycleToFavorites = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const currentCycle = this.cycleMap[projectId][cycleId];

      if (currentCycle.is_favorite) return;

      runInAction(() => {
        this.cycleMap = {
          ...this.cycleMap,
          [projectId]: {
            ...this.cycleMap[projectId],
            [cycleId]: { ...currentCycle, is_favorite: true },
          },
        };
      });

      // updating through api.
      const response = await this.cycleService.addCycleToFavorites(workspaceSlug, projectId, { cycle: cycleId });

      return response;
    } catch (error) {
      console.log("Failed to add cycle to favorites in the cycles store", error);

      // reset on error
      const currentCycle = this.cycleMap[projectId][cycleId];

      runInAction(() => {
        this.cycleMap = {
          ...this.cycleMap,
          [projectId]: {
            ...this.cycleMap[projectId],
            [cycleId]: { ...currentCycle, is_favorite: false },
          },
        };
      });

      throw error;
    }
  };

  removeCycleFromFavorites = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const currentCycle = this.cycleMap[projectId][cycleId];

      if (!currentCycle.is_favorite) return;

      runInAction(() => {
        this.cycleMap = {
          ...this.cycleMap,
          [projectId]: {
            ...this.cycleMap[projectId],
            [cycleId]: { ...currentCycle, is_favorite: false },
          },
        };
      });

      const response = await this.cycleService.removeCycleFromFavorites(workspaceSlug, projectId, cycleId);

      return response;
    } catch (error) {
      console.log("Failed to remove cycle from favorites - Cycle Store", error);

      // reset on error
      const currentCycle = this.cycleMap[projectId][cycleId];
      runInAction(() => {
        this.cycleMap = {
          ...this.cycleMap,
          [projectId]: {
            ...this.cycleMap[projectId],
            [cycleId]: { ...currentCycle, is_favorite: true },
          },
        };
      });
      throw error;
    }
  };
}
