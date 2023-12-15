import get from "lodash/get";
// store
import { action, makeObservable, observable, runInAction } from "mobx";
import { IIssueRootStore } from "./root.store";
// types
import { IIssue } from "types";

export interface IIssueStore {
  allIssues: { [key: string]: IIssue };
  // actions
  addIssue(issues: IIssue[]): void;
  updateIssue(issueId: string, issue: Partial<IIssue>): void;
  removeIssue(issueId: string): void;
  // helper Methods
  getIssueById(id: string): undefined | IIssue;
  getIssuesByKey(issueKey: string, value: string): undefined | { [key: string]: IIssue };
}

export class IssueStore implements IIssueStore {
  allIssues: { [key: string]: IIssue } = {};
  // root store
  rootStore: IIssueRootStore;

  constructor(rootStore: IIssueRootStore) {
    this.rootStore = rootStore;

    makeObservable(this, {
      // observable
      allIssues: observable,
      // actions
      addIssue: action,
      updateIssue: action,
      removeIssue: action,
    });
  }

  addIssue = (issues: IIssue[]) => {
    if (issues && issues.length <= 0) return;

    const _issues = { ...this.allIssues };
    issues.forEach((issue) => {
      _issues[issue.id] = issue;
    });

    runInAction(() => {
      this.allIssues = _issues;
    });
  };

  updateIssue = (issueId: string, issue: Partial<IIssue>) => {
    if (!issue || !issueId || !this.allIssues[issueId]) return;
    this.allIssues[issueId] = { ...this.allIssues[issueId], ...issue };
  };

  removeIssue = (issueId: string) => {
    if (issueId) return;
    delete this.allIssues[issueId];
  };

  // helper methods
  getIssueById = (id: string) => {
    if (!id) return undefined;
    return this.allIssues[id];
  };

  getIssuesByKey = (issueKey: keyof IIssue, value: string) => {
    if (!issueKey || !value || !this.allIssues) return undefined;
    const filteredIssues: { [key: string]: IIssue } = {};

    Object.values(this.allIssues).forEach((issue) => {
      const issueKeyValue = get(issue, issueKey);
      if (issueKeyValue == value) {
        filteredIssues[issue.id] = issue;
      }
    });

    return filteredIssues;
  };
}
