import set from "lodash/set";
import isEmpty from "lodash/isEmpty";
// store
import { action, makeObservable, observable, runInAction } from "mobx";
// types
import { IIssue } from "types";

export interface IIssueStore {
  // observables
  issuesMap: Record<string, IIssue>; // Record defines issue_id as key and IIssue as value
  // actions
  addIssue(issues: IIssue[]): void;
  updateIssue(issueId: string, issue: Partial<IIssue>): void;
  removeIssue(issueId: string): void;
  // helper methods
  getIssueById(issueId: string): undefined | IIssue;
  getIssuesByIds(issueIds: string[]): undefined | Record<string, IIssue>; // Record defines issue_id as key and IIssue as value
}

export class IssueStore implements IIssueStore {
  // observables
  issuesMap: { [issue_id: string]: IIssue } = {};

  constructor() {
    makeObservable(this, {
      // observable
      issuesMap: observable,
      // actions
      addIssue: action,
      updateIssue: action,
      removeIssue: action,
    });
  }

  // actions
  /**
   * @description This method will add issues to the issuesMap
   * @param {IIssue[]} issues
   * @returns {void}
   */
  addIssue = (issues: IIssue[]) => {
    if (issues && issues.length <= 0) return;
    runInAction(() => {
      issues.forEach((issue) => {
        set(this.issuesMap, issue.id, issue);
      });
    });
  };

  /**
   * @description This method will update the issue in the issuesMap
   * @param {string} issueId
   * @param {Partial<IIssue>} issue
   * @returns {void}
   */
  updateIssue = (issueId: string, issue: Partial<IIssue>) => {
    if (!issue || !issueId || isEmpty(this.issuesMap) || !this.issuesMap[issueId]) return;
    runInAction(() => {
      Object.keys(issue).forEach((key) => {
        set(this.issuesMap, [issueId, key], issue[key as keyof IIssue]);
      });
    });
  };

  /**
   * @description This method will remove the issue from the issuesMap
   * @param {string} issueId
   * @returns {void}
   */
  removeIssue = (issueId: string) => {
    if (!issueId || isEmpty(this.issuesMap) || !this.issuesMap[issueId]) return;
    runInAction(() => {
      delete this.issuesMap[issueId];
    });
  };

  // helper methods
  /**
   * @description This method will return the issue from the issuesMap
   * @param {string} issueId
   * @returns {IIssue | undefined}
   */
  getIssueById = (issueId: string) => {
    if (!issueId || isEmpty(this.issuesMap) || !this.issuesMap[issueId]) return undefined;
    return this.issuesMap[issueId];
  };

  /**
   * @description This method will return the issues from the issuesMap
   * @param {string[]} issueIds
   * @returns {Record<string, IIssue> | undefined}
   */
  getIssuesByIds = (issueIds: string[]) => {
    if (!issueIds || issueIds.length <= 0 || isEmpty(this.issuesMap)) return undefined;
    const filteredIssues: { [key: string]: IIssue } = {};
    Object.values(this.issuesMap).forEach((issue) => {
      if (issueIds.includes(issue.id)) {
        filteredIssues[issue.id] = issue;
      }
    });
    return isEmpty(filteredIssues) ? undefined : filteredIssues;
  };
}
