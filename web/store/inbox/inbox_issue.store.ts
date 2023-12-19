import { observable, action, makeObservable, runInAction, autorun, computed } from "mobx";
import { set } from "lodash";
// services
import { InboxService } from "services/inbox.service";
// types
import { RootStore } from "store/root.store";
import { IInboxIssue, IIssue, TInboxStatus } from "types";
// constants
import { INBOX_ISSUE_SOURCE } from "constants/inbox";

export interface IInboxIssuesStore {
  // states
  loader: boolean;
  error: any | null;
  // observables
  issueMap: { [inboxId: string]: Record<string, IInboxIssue> };
  // computed
  currentInboxIssues: string[] | null;
  // computed actions
  getIssueById: (inboxId: string, issueId: string) => IInboxIssue | null;
  // actions
  fetchIssues: (workspaceSlug: string, projectId: string, inboxId: string) => Promise<IInboxIssue[]>;
  fetchIssueDetails: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    issueId: string
  ) => Promise<IInboxIssue>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    data: Partial<IIssue>
  ) => Promise<IInboxIssue>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    issueId: string,
    data: Partial<IInboxIssue>
  ) => Promise<void>;
  updateIssueStatus: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    issueId: string,
    data: TInboxStatus
  ) => Promise<void>;
  deleteIssue: (workspaceSlug: string, projectId: string, inboxId: string, issueId: string) => Promise<void>;
}

export class InboxIssuesStore implements IInboxIssuesStore {
  // states
  loader: boolean = false;
  error: any | null = null;
  // observables
  issueMap: { [inboxId: string]: Record<string, IInboxIssue> } = {};
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
      issueMap: observable,
      // computed
      currentInboxIssues: computed,
      // computed actions
      getIssueById: action,
      // actions
      fetchIssues: action,
      fetchIssueDetails: action,
      createIssue: action,
      updateIssue: action,
      updateIssueStatus: action,
      deleteIssue: action,
    });

    // root store
    this.rootStore = _rootStore;
    // services
    this.inboxService = new InboxService();

    autorun(() => {
      const routerStore = this.rootStore.app.router;

      const workspaceSlug = routerStore?.workspaceSlug;
      const projectId = routerStore?.projectId;
      const inboxId = routerStore?.inboxId;

      if (workspaceSlug && projectId && inboxId && this.rootStore.inboxRoot.inboxFilters.inboxFilters[inboxId])
        this.fetchIssues(workspaceSlug, projectId, inboxId);
    });
  }

  get currentInboxIssues() {
    const inboxId = this.rootStore.app.router.inboxId;
    if (!inboxId) return null;
    return Object.keys(this.issueMap?.[inboxId] ?? {}) ?? null;
  }

  getIssueById = (inboxId: string, issueId: string): IInboxIssue | null => this.issueMap?.[inboxId]?.[issueId] ?? null;

  fetchIssues = async (workspaceSlug: string, projectId: string, inboxId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const queryParams = this.rootStore.inboxRoot.inboxFilters.appliedFilters ?? undefined;

      const issuesResponse = await this.inboxService.getInboxIssues(workspaceSlug, projectId, inboxId, queryParams);

      runInAction(() => {
        this.loader = false;
        issuesResponse.forEach((issue) => {
          set(this.issueMap, [inboxId, issue.issue_inbox?.[0].id], issue);
        });
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

  fetchIssueDetails = async (workspaceSlug: string, projectId: string, inboxId: string, issueId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const issueResponse = await this.inboxService.getInboxIssueById(workspaceSlug, projectId, inboxId, issueId);

      runInAction(() => {
        this.loader = false;
        set(this.issueMap, [inboxId, issueId], issueResponse);
      });

      return issueResponse;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  createIssue = async (workspaceSlug: string, projectId: string, inboxId: string, data: Partial<IIssue>) => {
    const payload = {
      issue: {
        name: data.name,
        description: data.description,
        description_html: data.description_html,
        priority: data.priority,
      },
      source: INBOX_ISSUE_SOURCE,
    };

    try {
      const response = await this.inboxService.createInboxIssue(workspaceSlug, projectId, inboxId, payload);

      runInAction(() => {
        set(this.issueMap, [inboxId, response.issue_inbox?.[0].id], response);
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    issueId: string,
    data: Partial<IInboxIssue>
  ) => {
    const issueDetails = this.rootStore.inboxRoot.inboxIssues.getIssueById(inboxId, issueId);

    try {
      runInAction(() => {
        set(this.issueMap, [inboxId, issueId], {
          ...issueDetails,
          ...data,
        });
      });

      await this.inboxService.patchInboxIssue(workspaceSlug, projectId, inboxId, issueId, { issue: data });
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      this.rootStore.inboxRoot.inboxIssues.fetchIssues(workspaceSlug, projectId, inboxId);
      this.fetchIssueDetails(workspaceSlug, projectId, inboxId, issueId);

      throw error;
    }
  };

  updateIssueStatus = async (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    issueId: string,
    data: TInboxStatus
  ) => {
    const issueDetails = this.rootStore.inboxRoot.inboxIssues.getIssueById(inboxId, issueId);

    try {
      runInAction(() => {
        set(this.issueMap, [inboxId, issueId, "issue_inbox", 0], {
          ...issueDetails?.issue_inbox?.[0],
          ...data,
        });
      });

      await this.inboxService.markInboxStatus(workspaceSlug, projectId, inboxId, issueId, data);
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      this.rootStore.inboxRoot.inboxIssues.fetchIssues(workspaceSlug, projectId, inboxId);
      this.fetchIssueDetails(workspaceSlug, projectId, inboxId, issueId);

      throw error;
    }
  };

  deleteIssue = async (workspaceSlug: string, projectId: string, inboxId: string, issueId: string) => {
    try {
      runInAction(() => {
        delete this.issueMap?.[inboxId]?.[issueId];
      });

      await this.inboxService.deleteInboxIssue(workspaceSlug, projectId, inboxId, issueId);
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      this.rootStore.inboxRoot.inboxIssues.fetchIssues(workspaceSlug, projectId, inboxId);
      this.fetchIssueDetails(workspaceSlug, projectId, inboxId, issueId);

      throw error;
    }
  };
}
