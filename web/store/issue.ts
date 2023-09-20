import { observable, action, computed, makeObservable, runInAction } from "mobx";
import { IIssue } from "types";
import { RootStore } from "./root";

export interface IIssueStore {
  loader: boolean;
  error: any | null;
}

class IssueStore implements IIssueStore {
  loader: boolean = false;
  error: any | null = null;
  issues: {
    [project_id: string]: {
      grouped: any;
      ungrouped: IIssue[];
    };
  } = {};

  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,
      issues: observable.ref,
    });
    this.rootStore = _rootStore;
  }

  fetchIssuesWithParams() {}
}

export default IssueStore;
