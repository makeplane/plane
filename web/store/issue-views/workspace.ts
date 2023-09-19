import { action, computed, makeObservable } from "mobx";
// types
import { RootStore } from "../root";

export interface IIssueWorkspace {}

class IssueWorkspace implements IIssueWorkspace {
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // computed
      // actions
    });

    this.rootStore = _rootStore;
  }
}

export default IssueWorkspace;
