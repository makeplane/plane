import { action, computed, observable, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
// services
import { ProjectService } from "services/project.service";
import { IssueService } from "services/issue.service";

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
    this.projectService = new ProjectService();
    this.issueService = new IssueService();
  }

  // computed

  // actions
  setCycleId = (cycleSlug: string) => {
    this.cycleId = cycleSlug ?? null;
  };
}

export default CycleStore;
