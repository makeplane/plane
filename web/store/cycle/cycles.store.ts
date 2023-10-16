import { action, computed, observable, makeObservable, runInAction } from "mobx";
// types
import { ICycle, TCycleView, TCycleLayout, CycleDateCheckData, IIssue } from "types";
// mobx
import { RootStore } from "../root";
// services
import { ProjectService } from "services/project";
import { IssueService } from "services/issue";
import { CycleService } from "services/cycle.service";

export interface ICycleStore {
  loader: boolean;
  error: any | null;

  cycleView: TCycleView;
  cycleLayout: TCycleLayout;

  cycleId: string | null;
  cycles: {
    [project_id: string]: ICycle[];
  };
  cycle_details: {
    [cycle_id: string]: ICycle;
  };
  active_cycle_issues: {
    [cycle_id: string]: IIssue[];
  };

  // computed
  getCycleById: (cycleId: string) => ICycle | null;

  // actions
  setCycleView: (_cycleView: TCycleView) => void;
  setCycleLayout: (_cycleLayout: TCycleLayout) => void;
  setCycleId: (cycleId: string) => void;

  validateDate: (workspaceSlug: string, projectId: string, payload: CycleDateCheckData) => Promise<any>;

  fetchCycles: (
    workspaceSlug: string,
    projectId: string,
    params: "all" | "current" | "upcoming" | "draft" | "completed" | "incomplete"
  ) => Promise<void>;
  fetchCycleWithId: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<ICycle>;
  fetchActiveCycleIssues: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<any>;

  createCycle: (workspaceSlug: string, projectId: string, data: any) => Promise<ICycle>;
  updateCycle: (workspaceSlug: string, projectId: string, cycleId: string, data: any) => Promise<ICycle>;
  removeCycle: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;

  addCycleToFavorites: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<any>;
  removeCycleFromFavorites: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;
}

export class CycleStore implements ICycleStore {
  loader: boolean = false;
  error: any | null = null;

  cycleView: TCycleView = "all";
  cycleLayout: TCycleLayout = "list";

  cycleId: string | null = null;
  cycles: {
    [project_id: string]: ICycle[];
  } = {};

  cycle_details: {
    [cycle_id: string]: ICycle;
  } = {};

  active_cycle_issues: {
    [cycle_id: string]: IIssue[];
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

      cycleView: observable,
      cycleLayout: observable,

      cycleId: observable,
      cycles: observable.ref,
      cycle_details: observable.ref,
      active_cycle_issues: observable.ref,

      // computed
      projectCycles: computed,

      // actions
      setCycleView: action,
      setCycleLayout: action,
      setCycleId: action,
      getCycleById: action,

      fetchCycles: action,
      fetchCycleWithId: action,

      fetchActiveCycleIssues: action,

      createCycle: action,
      updateCycle: action,
      removeCycle: action,

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

  getCycleById = (cycleId: string) => this.cycle_details[cycleId] || null;

  // actions
  setCycleView = (_cycleView: TCycleView) => (this.cycleView = _cycleView);
  setCycleLayout = (_cycleLayout: TCycleLayout) => (this.cycleLayout = _cycleLayout);
  setCycleId = (cycleId: string) => (this.cycleId = cycleId);

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

      if (this.cycleView === "active") this.fetchActiveCycleIssues(workspaceSlug, projectId, cyclesResponse[0].id);

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

  fetchCycleWithId = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const response = await this.cycleService.getCycleDetails(workspaceSlug, projectId, cycleId);

      runInAction(() => {
        this.cycle_details = {
          ...this.cycle_details,
          [response?.id]: response,
        };
      });
      return response;
    } catch (error) {
      console.log("Failed to fetch cycle detail from cycle store");
      throw error;
    }
  };

  fetchActiveCycleIssues = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const _cycleIssues = await this.cycleService.getCycleIssuesWithParams(workspaceSlug, projectId, cycleId, {
        priority: `urgent,high`,
      });

      const _activeCycleIssues = {
        ...this.active_cycle_issues,
        [cycleId]: _cycleIssues as IIssue[],
      };

      runInAction(() => {
        this.active_cycle_issues = _activeCycleIssues;
      });

      return _activeCycleIssues;
    } catch (error) {
      console.log("error");
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
        this.cycle_details = {
          ...this.cycle_details,
          [response?.id]: response,
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

  updateCycle = async (workspaceSlug: string, projectId: string, cycleId: string, data: any) => {
    try {
      const response = await this.cycleService.updateCycle(workspaceSlug, projectId, cycleId, data, undefined);

      const _cycleDetails = {
        ...this.cycle_details,
        [cycleId]: { ...this.cycle_details[cycleId], ...response },
      };

      runInAction(() => {
        this.cycle_details = _cycleDetails;
      });

      const _currentView = this.cycleView === "active" ? "current" : this.cycleView;
      this.fetchCycles(workspaceSlug, projectId, _currentView);

      return response;
    } catch (error) {
      console.log("Failed to update cycle from cycle store");
      throw error;
    }
  };

  patchCycle = async (workspaceSlug: string, projectId: string, cycleId: string, data: any) => {
    try {
      const _response = await this.cycleService.patchCycle(workspaceSlug, projectId, cycleId, data, undefined);

      const _cycleDetails = {
        ...this.cycle_details,
        [cycleId]: { ...this.cycle_details[cycleId], ..._response },
      };

      runInAction(() => {
        this.cycle_details = _cycleDetails;
      });

      const _currentView = this.cycleView === "active" ? "current" : this.cycleView;
      this.fetchCycles(workspaceSlug, projectId, _currentView);

      return _response;
    } catch (error) {
      console.log("Failed to patch cycle from cycle store");
      throw error;
    }
  };

  removeCycle = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const _response = await this.cycleService.deleteCycle(workspaceSlug, projectId, cycleId, undefined);

      const _currentView = this.cycleView === "active" ? "current" : this.cycleView;
      this.fetchCycles(workspaceSlug, projectId, _currentView);

      return _response;
    } catch (error) {
      console.log("Failed to delete cycle from cycle store");
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
      const response = await this.cycleService.removeCycleFromFavorites(workspaceSlug, projectId, cycleId);
      return response;
    } catch (error) {
      console.log("Failed to remove cycle from favorites - Cycle Store", error);
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
