import { observable, action, computed, makeObservable, runInAction } from "mobx";
import { IIssue } from "types";
import { RootStore } from "./root";

export interface IIssueStore {
  loader: boolean;
  error: any | null;

  issues: {
    [project_id: string]: {
      grouped: {
        [group_id: string]: IIssue[];
      };
      groupWithSubGroups: {
        [group_id: string]: {
          [sub_group_id: string]: IIssue[];
        };
      };
      ungrouped: IIssue[];
    };
  };

  addIssueToIssuesStore: (projectId: string, issue: IIssue) => void;
  updateIssueInIssuesStore: (projectId: string, issue: IIssue) => void;
  deleteIssueFromIssuesStore: (projectId: string, issueId: string) => void;
}

class IssueStore implements IIssueStore {
  loader: boolean = false;
  error: any | null = null;
  issues: {
    [project_id: string]: {
      grouped: {
        [issueId: string]: IIssue[];
      };
      groupWithSubGroups: {
        [group_id: string]: {
          [sub_group_id: string]: IIssue[];
        };
      };
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

      addIssueToIssuesStore: action,
      updateIssueInIssuesStore: action,
      deleteIssueFromIssuesStore: action,
    });
    this.rootStore = _rootStore;
  }

  addIssueToIssuesStore = (projectId: string, issue: IIssue) => {
    runInAction(() => {
      this.rootStore.issue.issues = {
        ...this.rootStore.issue.issues,
        [projectId]: {
          ...this.rootStore.issue.issues[projectId],
          ungrouped: [...this.rootStore.issue.issues[projectId].ungrouped, issue],
        },
      };
    });
  };

  updateIssueInIssuesStore = (projectId: string, issue: IIssue) => {
    const newUngroupedIssues = this.rootStore.issue.issues[projectId].ungrouped.map((i) => ({
      ...i,
      ...(i.id === issue.id ? issue : {}),
    }));

    runInAction(() => {
      this.rootStore.issue.issues = {
        ...this.rootStore.issue.issues,
        [projectId]: {
          ...this.rootStore.issue.issues[projectId],
          ungrouped: newUngroupedIssues,
        },
      };
    });
  };

  deleteIssueFromIssuesStore = (projectId: string, issueId: string) => {
    const newUngroupedIssues = this.rootStore.issue.issues[projectId].ungrouped.filter((i) => i.id !== issueId);

    runInAction(() => {
      this.rootStore.issue.issues = {
        ...this.rootStore.issue.issues,
        [projectId]: {
          ...this.rootStore.issue.issues[projectId],
          ungrouped: newUngroupedIssues,
        },
      };
    });
  };
}

export default IssueStore;
