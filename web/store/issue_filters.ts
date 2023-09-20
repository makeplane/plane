import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";

export interface IIssueFilterStore {}

class IssueFilterStore implements IIssueFilterStore {
  loader: boolean = false;
  error: any | null = null;
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,
    });

    this.rootStore = _rootStore;
  }
}

export default IssueFilterStore;
