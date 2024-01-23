import { observable, action, makeObservable, runInAction, autorun, computed } from "mobx";
import { computedFn } from "mobx-utils";
import { set } from "lodash";
// services
import { InboxService } from "services/inbox.service";
// types
import { RootStore } from "store/root.store";
import { IInboxIssue, TIssue, TInboxStatus } from "@plane/types";
// constants
import { INBOX_ISSUE_SOURCE } from "constants/inbox";

export interface IInboxIssuesStore {
  // observables
  issueMap: Record<string, Record<string, IInboxIssue>>; // {inboxId: {issueId: IInboxIssue}}
  // computed
  currentInboxIssueIds: string[] | null;
  // computed actions
  getIssueById: (inboxId: string, issueId: string) => IInboxIssue | null;
  // fetch actions
  fetchIssues: (workspaceSlug: string, projectId: string, inboxId: string) => Promise<IInboxIssue[]>;
  fetchIssueDetails: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    issueId: string
  ) => Promise<IInboxIssue>;
  // CRUD actions
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    data: Partial<TIssue>
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
  // observables
  issueMap: { [inboxId: string]: Record<string, IInboxIssue> } = {};
  // root store
  rootStore;
  // services
  inboxService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      issueMap: observable,
      // computed
      currentInboxIssueIds: computed,
      // fetch actions
      fetchIssues: action,
      fetchIssueDetails: action,
      // CRUD actions
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

  /**
   * Returns the issue IDs belong to a specific inbox issues list
   */
  get currentInboxIssueIds() {
    const inboxId = this.rootStore.app.router.inboxId;
    if (!inboxId) return null;
    return Object.keys(this.issueMap?.[inboxId] ?? {}) ?? null;
  }

  /**
   * Returns the issue details belongs to a specific inbox issue
   */
  getIssueById = computedFn(
    (inboxId: string, issueId: string): IInboxIssue | null => this.issueMap?.[inboxId]?.[issueId] ?? null
  );

  /**
   * Fetches issues of a specific inbox and adds it to the store
   * @param workspaceSlug
   * @param projectId
   * @param inboxId
   * @returns Promise<IInbox[]>
   */
  fetchIssues = async (workspaceSlug: string, projectId: string, inboxId: string) => {
    const queryParams = this.rootStore.inboxRoot.inboxFilters.appliedFilters ?? undefined;
    return await this.inboxService
      .getInboxIssues(workspaceSlug, projectId, inboxId, queryParams)
      .then((issuesResponse) => {
        runInAction(() => {
          issuesResponse.forEach((issue) => {
            set(this.issueMap, [inboxId, issue.issue_inbox?.[0].id], issue);
          });
        });
        return issuesResponse;
      });
  };

  /**
   * Fetches issue details of a specific inbox issue and updates it to the store
   * @param workspaceSlug
   * @param projectId
   * @param inboxId
   * @param issueId
   * returns Promise<IInboxIssue>
   */
  fetchIssueDetails = async (workspaceSlug: string, projectId: string, inboxId: string, issueId: string) => {
    return await this.inboxService
      .getInboxIssueById(workspaceSlug, projectId, inboxId, issueId)
      .then((issueResponse) => {
        runInAction(() => {
          set(this.issueMap, [inboxId, issueId], issueResponse);
        });
        return issueResponse;
      });
  };

  /**
   * Creates a new issue for a specific inbox and add it to the store
   * @param workspaceSlug
   * @param projectId
   * @param inboxId
   * @param data
   * @returns Promise<IInboxIssue>
   */
  createIssue = async (workspaceSlug: string, projectId: string, inboxId: string, data: Partial<TIssue>) => {
    const payload = {
      issue: {
        name: data.name,
        // description: data.description,
        description_html: data.description_html,
        priority: data.priority,
      },
      source: INBOX_ISSUE_SOURCE,
    };
    return await this.inboxService.createInboxIssue(workspaceSlug, projectId, inboxId, payload).then((response) => {
      runInAction(() => {
        set(this.issueMap, [inboxId, response.issue_inbox?.[0].id], response);
      });
      return response;
    });
  };

  /**
   * Updates an issue for a specific inbox and update it in the store
   * @param workspaceSlug
   * @param projectId
   * @param inboxId
   * @param issueId
   * @param data
   * @returns Promise<IInboxIssue>
   */
  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    issueId: string,
    data: Partial<IInboxIssue>
  ) => {
    const issueDetails = this.rootStore.inboxRoot.inboxIssues.getIssueById(inboxId, issueId);
    return await this.inboxService
      .patchInboxIssue(workspaceSlug, projectId, inboxId, issueId, { issue: data })
      .then((issueResponse) => {
        runInAction(() => {
          set(this.issueMap, [inboxId, issueId], {
            ...issueDetails,
            ...issueResponse,
          });
        });
        return issueResponse;
      });
  };

  /**
   * Updates an issue status for a specific inbox issue and update it in the store
   * @param workspaceSlug
   * @param projectId
   * @param inboxId
   * @param issueId
   * @param data
   * @returns Promise<IInboxIssue>
   */
  updateIssueStatus = async (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    issueId: string,
    data: TInboxStatus
  ) => {
    const issueDetails = this.rootStore.inboxRoot.inboxIssues.getIssueById(inboxId, issueId);
    await this.inboxService.markInboxStatus(workspaceSlug, projectId, inboxId, issueId, data).then((response) => {
      runInAction(() => {
        set(this.issueMap, [inboxId, issueId, "issue_inbox", 0], {
          ...issueDetails?.issue_inbox?.[0],
          ...response?.issue_inbox?.[0],
        });
      });
      return response;
    });
  };

  /**
   * Deletes an issue for a specific inbox and removes it from the store
   * @param workspaceSlug
   * @param projectId
   * @param inboxId
   * @param issueId
   * @returns Promise<void>
   */
  deleteIssue = async (workspaceSlug: string, projectId: string, inboxId: string, issueId: string) => {
    await this.inboxService.deleteInboxIssue(workspaceSlug, projectId, inboxId, issueId).then((_) => {
      runInAction(() => {
        delete this.issueMap?.[inboxId]?.[issueId];
      });
    });
  };
}
