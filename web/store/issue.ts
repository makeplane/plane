import { observable, action, computed, makeObservable, runInAction } from "mobx";
import { IIssue } from "types";

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

  constructor() {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,
      issues: observable.ref,
    });
  }

  fetchIssuesWithParams() {}
}

export default IssueStore;
