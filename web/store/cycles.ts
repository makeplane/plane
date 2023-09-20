import { action, computed, observable, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
// services
import { ProjectServices } from "services/project.service";
import { IssueServices } from "services/issue.service";

export interface ICycleStore {
  loader: boolean;
  error: any | null;

  cycleId: string | null;

  setCycleId: (cycleSlug: string) => void;
}

class CycleStore implements ICycleStore {
  loader: boolean = false;
  error: any | null = null;

  cycleId: string | null = null;

  // root store
  rootStore;
  // services
  projectService;
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable,
      error: observable.ref,

      cycleId: observable.ref,

      // computed

      // actions
      setCycleId: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectServices();
    this.issueService = new IssueServices();
  }

  // computed

  // actions
  setCycleId = (cycleSlug: string) => {
    this.cycleId = cycleSlug ?? null;
  };
}

export default CycleStore;
