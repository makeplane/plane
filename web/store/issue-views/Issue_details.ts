import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";

export interface IIssueViewStore {
  loader: boolean;
  error: any | null;
}

class IssueViewStore implements IIssueViewStore {
  loader: boolean = false;
  error: any | null = null;

  // root store
  rootStore;
  // service

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,
    });

    this.rootStore = _rootStore;
  }
}

export default IssueViewStore;
