import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";

export interface IIssueFilterStore {
  loader: boolean;
  error: any | null;
  userDisplayProperties: any;
  userDisplayFilters: any;
}

class IssueFilterStore implements IIssueFilterStore {
  loader: boolean = false;
  error: any | null = null;
  // observables
  userDisplayProperties: any = {};
  userDisplayFilters: any = {};
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,
      userDisplayProperties: observable.ref,
      userDisplayFilters: observable.ref,
    });

    this.rootStore = _rootStore;
  }
}

export default IssueFilterStore;
