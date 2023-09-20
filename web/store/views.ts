import { action, computed, observable, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
// services
import { ProjectServices } from "services/project.service";
import { IssueServices } from "services/issue.service";

export interface IViewStore {
  loader: boolean;
  error: any | null;

  viewId: string | null;

  setViewId: (viewSlug: string) => void;
}

class ViewStore implements IViewStore {
  loader: boolean = false;
  error: any | null = null;

  viewId: string | null = null;

  // root store
  rootStore;
  // services
  projectService;
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable,
      error: observable.ref,

      viewId: observable.ref,

      // computed

      // actions
      setViewId: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectServices();
    this.issueService = new IssueServices();
  }

  // computed

  // actions
  setViewId = (viewSlug: string) => {
    this.viewId = viewSlug ?? null;
  };
}

export default ViewStore;
