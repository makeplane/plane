// store
import { action, makeObservable, observable, runInAction } from "mobx";
import { IIssueRootStore } from "./root.store";
// types
import { IIssue } from "types";

export interface IIssueStore {
  issues: { [key: string]: IIssue };
  // actions
  addIssue(issues: IIssue[]): void;
  updateIssue(issueId: string, issue: Partial<IIssue>): void;
  removeIssue(issueId: string): void;
  // helper Methods
  getIssueById(id: string): undefined | IIssue;
  getIssuesByWorkspace(workspaceSlug: string): undefined | { [key: string]: IIssue };
  getIssuesByProject(projectId: string): undefined | { [key: string]: IIssue };
  getIssuesByCycle(cycleId: string): undefined | { [key: string]: IIssue };
  getIssuesByModule(moduleId: string): undefined | { [key: string]: IIssue };
}

export class IssueStore implements IIssueStore {
  issues: { [key: string]: IIssue } = {};
  // root store
  rootStore: IIssueRootStore;

  constructor(rootStore: IIssueRootStore) {
    this.rootStore = rootStore;

    makeObservable(this, {
      // observable
      issues: observable,
      // actions
      addIssue: action,
      updateIssue: action,
      removeIssue: action,
    });
  }

  addIssue = (issues: IIssue[]) => {
    if (issues && issues.length <= 0) return;

    const _issues = { ...this.issues };
    issues.forEach((issue) => {
      _issues[issue.id] = issue;
    });
    runInAction(() => {
      this.issues = _issues;
    });
  };

  updateIssue = (issueId: string, issue: Partial<IIssue>) => {
    if (!issue || !issueId || !this.issues[issueId]) return;
    this.issues[issueId] = { ...this.issues[issueId], ...issue };
  };

  removeIssue = (issueId: string) => {
    if (issueId) return;
    delete this.issues[issueId];
  };

  // helper methods
  getIssueById = (id: string) => {
    if (!id) return undefined;
    return this.issues[id];
  };

  getIssuesByWorkspace = (workspaceSlug: string) => {
    if (!workspaceSlug || !this.issues) return undefined;
    const projectIssues = Object.values(this.issues).filter((issue) => issue?.workspace === workspaceSlug);
    const filteredIssues: { [key: string]: IIssue } = {};
    projectIssues.map((issue) => {
      filteredIssues[issue.id] = issue;
    });
    return filteredIssues;
  };

  getIssuesByProject = (projectId: string) => {
    if (!projectId || !this.issues) return undefined;
    const projectIssues = Object.values(this.issues).filter((issue) => issue?.project === projectId);
    const filteredIssues: { [key: string]: IIssue } = {};
    projectIssues.map((issue) => {
      filteredIssues[issue.id] = issue;
    });
    return filteredIssues;
  };

  getIssuesByCycle = (projectId: string) => {
    if (!projectId || !this.issues) return undefined;
    const projectIssues = Object.values(this.issues).filter((issue) => issue?.project === projectId);
    const filteredIssues: { [key: string]: IIssue } = {};
    projectIssues.map((issue) => {
      filteredIssues[issue.id] = issue;
    });
    return filteredIssues;
  };

  getIssuesByModule = (projectId: string) => {
    if (!projectId || !this.issues) return undefined;
    const projectIssues = Object.values(this.issues).filter((issue) => issue?.project === projectId);
    const filteredIssues: { [key: string]: IIssue } = {};
    projectIssues.map((issue) => {
      filteredIssues[issue.id] = issue;
    });
    return filteredIssues;
  };
}
