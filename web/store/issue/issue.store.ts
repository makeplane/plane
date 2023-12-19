import get from "lodash/get";
import set from "lodash/set";
import isEmpty from "lodash/isEmpty";
// store
import { action, makeObservable, observable, runInAction } from "mobx";
import { IIssueRootStore } from "./root.store";
// types
import { IIssue } from "types";

export interface IIssueStore {
  issuesMap: { [issue_id: string]: IIssue };
  // actions
  addIssue(issues: IIssue[]): void;
  updateIssue(issueId: string, issue: Partial<IIssue>): void;
  removeIssue(issueId: string): void;
  // helper Methods
  getIssueById(id: string): undefined | IIssue;
  getIssuesByKey(issueKey: string, value: string): undefined | { [key: string]: IIssue };
}

export class IssueStore implements IIssueStore {
  issuesMap: { [issue_id: string]: IIssue } = {};
  // root store
  rootStore: IIssueRootStore;

  constructor(rootStore: IIssueRootStore) {
    this.rootStore = rootStore;

    makeObservable(this, {
      // observable
      issuesMap: observable,
      // actions
      addIssue: action,
      updateIssue: action,
      removeIssue: action,
    });
  }

  addIssue = (issues: IIssue[]) => {
    if (issues && issues.length <= 0) return;

    runInAction(() => {
      issues.forEach((issue) => {
        set(this.issuesMap, issue.id, issue);
      });
    });
  };

  updateIssue = (issueId: string, issue: Partial<IIssue>) => {
    if (!issue || !issueId || isEmpty(this.issuesMap) || !this.issuesMap[issueId]) return;

    runInAction(() => {
      Object.keys(issue).forEach((key) => {
        set(this.issuesMap, [issueId, key], issue[key as keyof IIssue]);
      });
    });
  };

  removeIssue = (issueId: string) => {
    if (!issueId || isEmpty(this.issuesMap) || !this.issuesMap[issueId]) return;

    runInAction(() => {
      delete this.issuesMap[issueId];
    });
  };

  // helper methods
  getIssueById = (issueId: string) => {
    if (!issueId || isEmpty(this.issuesMap) || !this.issuesMap[issueId]) return undefined;

    return this.issuesMap[issueId];
  };

  getIssuesByKey = (issueKey: keyof IIssue, value: string) => {
    if (!issueKey || !value || isEmpty(this.issuesMap)) return undefined;

    const filteredIssues: { [key: string]: IIssue } = {};
    Object.values(this.issuesMap).forEach((issue) => {
      const issueKeyValue = get(issue, issueKey);
      if (issueKeyValue == value) {
        filteredIssues[issue.id] = issue;
      }
    });

    return filteredIssues;
  };
}
