import { action, computed, observable, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
// services
import { ProjectService } from "services/project.service";
import { IssueService } from "services/issue.service";
import { ICycle } from "types";

export interface ICycleStore {
  loader: boolean;
  error: any | null;

  cycles: {
    [cycle_id: string]: ICycle;
  };
}

class CycleStore implements ICycleStore {
  loader: boolean = false;
  error: any | null = null;

  cycles: {
    [cycle_id: string]: ICycle;
  } = {};

  // root store
  rootStore;
  // services
  projectService;
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable,
      error: observable.ref,

      cycles: observable.ref,

      // computed

      // actions
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.issueService = new IssueService();
  }

  // computed

  // actions
}

export default CycleStore;
