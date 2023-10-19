import { observable, action, makeObservable, runInAction, computed } from "mobx";
// services
import { IssueService } from "services/issue";
// types
import { RootStore } from "../root";
import { IUser, IIssue } from "types";

export type IPeekMode = "side" | "modal" | "full";

export interface IIssueDetailStore {
  loader: boolean;
  error: any | null;

  peekId: string | null;
  peekMode: IPeekMode | null;

  issues: {
    [issueId: string]: IIssue;
  };

  setPeekId: (issueId: string | null) => void;
  setPeekMode: (issueId: IPeekMode | null) => void;

  // computed
  getIssue: IIssue | null;

  // fetch issue details
  fetchIssueDetails: (workspaceSlug: string, projectId: string, issueId: string) => void;
  // creating issue
  createIssue: (workspaceSlug: string, projectId: string, data: Partial<IIssue>, user: IUser) => Promise<IIssue>;
  // updating issue
  updateIssue: (
    workspaceId: string,
    projectId: string,
    issueId: string,
    data: Partial<IIssue>,
    user: IUser | undefined
  ) => void;
  // deleting issue
  deleteIssue: (workspaceSlug: string, projectId: string, issueId: string, user: IUser) => void;
}

export class IssueDetailStore implements IIssueDetailStore {
  loader: boolean = false;
  error: any | null = null;

  peekId: string | null = null;
  peekMode: IPeekMode | null = null;

  issues: {
    [issueId: string]: IIssue;
  } = {};

  // root store
  rootStore;
  // service
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,

      peekId: observable.ref,
      peekMode: observable.ref,

      issues: observable.ref,

      getIssue: computed,

      setPeekId: action,
      setPeekMode: action,

      fetchIssueDetails: action,
      createIssue: action,
      updateIssue: action,
      deleteIssue: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
  }

  get getIssue() {
    if (!this.peekId) return null;
    const _issue = this.issues[this.peekId];
    return _issue || null;
  }

  setPeekId = (issueId: string | null) => (this.peekId = issueId);

  setPeekMode = (mode: IPeekMode | null) => (this.peekMode = mode);

  fetchIssueDetails = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      this.loader = true;
      this.error = null;
      this.peekId = issueId;

      const issueDetailsResponse = await this.issueService.retrieve(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.issues = {
          ...this.issues,
          [issueId]: issueDetailsResponse,
        };
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      return error;
    }
  };

  createIssue = async (workspaceSlug: string, projectId: string, data: Partial<IIssue>, user: IUser) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const response = await this.issueService.createIssue(workspaceSlug, projectId, data, user);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.issues = {
          ...this.issues,
          [response.id]: response,
        };
      });

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;

      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<IIssue>,
    user: IUser | undefined
  ) => {
    const newIssues = { ...this.issues };
    newIssues[issueId] = {
      ...newIssues[issueId],
      ...data,
    };

    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
        this.issues = newIssues;
      });

      const response = await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data, user);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.issues = {
          ...this.issues,
          [issueId]: {
            ...this.issues[issueId],
            ...response,
          },
        };
      });
    } catch (error) {
      this.fetchIssueDetails(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      return error;
    }
  };

  deleteIssue = async (workspaceSlug: string, projectId: string, issueId: string, user: IUser) => {
    const newIssues = { ...this.issues };
    delete newIssues[issueId];

    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
        this.issues = newIssues;
      });

      await this.issueService.deleteIssue(workspaceSlug, projectId, issueId, user);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      this.fetchIssueDetails(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      return error;
    }
  };
}
