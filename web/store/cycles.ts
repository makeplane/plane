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
    projectSlug: string,
    params: "all" | "current" | "upcoming" | "draft" | "completed" | "incomplete"
  ) => Promise<void>;
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
    projectSlug: string,
    params: "all" | "current" | "upcoming" | "draft" | "completed" | "incomplete"
  ) => {
    try {
      this.loader = true;
      this.error = null;

      const cyclesResponse = await this.cycleService.getCyclesWithParams(workspaceSlug, projectSlug, params);

      runInAction(() => {
        this.cycles = {
          ...this.cycles,
          [projectSlug]: cyclesResponse,
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
}

export default CycleStore;
