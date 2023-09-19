import { action, computed, makeObservable } from "mobx";
// types
import { RootStore } from "../root";

export interface IIssueProject {}

class IssueProject implements IIssueProject {
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

export default IssueProject;
