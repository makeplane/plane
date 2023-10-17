import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
// services
import { InboxService } from "services/inbox.service";
// types
import { IInboxIssue } from "types";

export interface IInboxIssuesStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  inboxIssues: {
    [inboxId: string]: IInboxIssue[];
  };

  // actions
  fetchInboxIssues: (workspaceSlug: string, projectId: string, inboxId: string) => Promise<IInboxIssue[]>;
}

export class InboxIssuesStore implements IInboxIssuesStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  inboxIssues: {
    [inboxId: string]: IInboxIssue[];
  } = {};

  // root store
  rootStore;

  // services
  inboxService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      inboxIssues: observable.ref,

      // actions
      fetchInboxIssues: action,
    });

    this.rootStore = _rootStore;
    this.inboxService = new InboxService();
  }

  fetchInboxIssues = async (workspaceSlug: string, projectId: string, inboxId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const queryParams = this.rootStore.inboxFilters.appliedFilters ?? undefined;

      const issuesResponse = await this.inboxService.getInboxIssues(workspaceSlug, projectId, inboxId, queryParams);

      runInAction(() => {
        this.loader = false;
        this.inboxIssues = {
          ...this.inboxIssues,
          [inboxId]: issuesResponse,
        };
      });

      return issuesResponse;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };
}
