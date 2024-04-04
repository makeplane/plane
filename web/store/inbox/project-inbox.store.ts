import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// services
import { InboxIssueService } from "services/inbox";
// types
import {
  TInboxIssue,
  TInboxIssueCurrentTab,
  TInboxIssueFilter,
  TInboxIssueSorting,
  TPaginationInfo,
} from "@plane/types";
// root store
import { IInboxIssueStore, InboxIssueStore } from "@/store/inbox/inbox-issue.store";
import { RootStore } from "@/store/root.store";
// store helpers
import { InboxIssueHelpers } from "./helpers";

export interface IProjectInboxStore {
  currentTab: TInboxIssueCurrentTab;
  isLoading: boolean;
  inboxFilters: Partial<TInboxIssueFilter>;
  inboxSorting: Partial<TInboxIssueSorting>;
  inboxIssuePaginationInfo: TPaginationInfo | undefined;
  inboxIssues: Record<string, IInboxIssueStore>;
  // computed
  inboxIssuesArray: IInboxIssueStore[];
  getIssueInboxByIssueId: (issueId: string) => IInboxIssueStore | undefined;
  // actions
  handleCurrentTab: (tab: TInboxIssueCurrentTab) => void;
  handleInboxIssueFilters: <T extends keyof TInboxIssueFilter>(key: T, value: TInboxIssueFilter[T]) => void; // if user sends me undefined, I will remove the value from the filter key
  handleInboxIssueSorting: <T extends keyof TInboxIssueSorting>(key: T, value: TInboxIssueSorting[T]) => void; // if user sends me undefined, I will remove the value from the filter key
  fetchInboxIssues: (workspaceSlug: string, projectId: string) => Promise<void>;
  // fetchInboxIssueById: (workspaceSlug: string, projectId: string, inboxIssueId: string) => Promise<void>;
  // createInboxIssue: (workspaceSlug: string, projectId: string, data: any) => Promise<void>;
  // deleteInboxIssue: (workspaceSlug: string, projectId: string, inboxIssueId: string) => Promise<void>;
}

export class ProjectInboxStore extends InboxIssueHelpers implements IProjectInboxStore {
  // constants
  PER_PAGE_COUNT = 10;
  // observables
  currentTab: TInboxIssueCurrentTab = "open";
  isLoading: boolean = false;
  inboxFilters: Partial<TInboxIssueFilter> = {};
  inboxSorting: Partial<TInboxIssueSorting> = {
    order_by: "issue__created_at",
    sort_by: "desc",
  };
  inboxIssuePaginationInfo: TPaginationInfo | undefined = undefined;
  inboxIssues: Record<string, IInboxIssueStore> = {};
  // services
  inboxIssueService;

  constructor(private store: RootStore) {
    super();
    makeObservable(this, {
      currentTab: observable.ref,
      isLoading: observable.ref,
      inboxFilters: observable,
      inboxSorting: observable,
      inboxIssuePaginationInfo: observable,
      inboxIssues: observable,
      // computed
      inboxIssuesArray: computed,
      // actions
      handleInboxIssueFilters: action,
      handleInboxIssueSorting: action,
      fetchInboxIssues: action,
      // fetchInboxIssueById: action,
      // createInboxIssue: action,
      // deleteInboxIssue: action,
    });
    this.inboxIssueService = new InboxIssueService();
  }

  // computed
  get inboxIssuesArray() {
    return Object.values(this.inboxIssues || {});
  }

  getIssueInboxByIssueId = computedFn((issueId: string) => this.inboxIssues?.[issueId] || undefined);

  // actions
  handleCurrentTab = (tab: TInboxIssueCurrentTab) => {
    set(this, "currentTab", tab);
    set(this, "inboxFilters", undefined);
    set(this, "inboxSorting", undefined);
    if (tab === "closed") set(this.inboxFilters, "inbox_status", [-1, 0, 1, 2]);
    const { workspaceSlug, projectId } = this.store.app.router;
    if (workspaceSlug && projectId) this.fetchInboxIssues(workspaceSlug, projectId);
  };

  handleInboxIssueFilters = <T extends keyof TInboxIssueFilter>(key: T, value: TInboxIssueFilter[T]) => {
    set(this.inboxFilters, key, value);
    const { workspaceSlug, projectId } = this.store.app.router;
    if (workspaceSlug && projectId) this.fetchInboxIssues(workspaceSlug, projectId);
  };

  handleInboxIssueSorting = <T extends keyof TInboxIssueSorting>(key: T, value: TInboxIssueSorting[T]) => {
    set(this.inboxSorting, key, value);
    const { workspaceSlug, projectId } = this.store.app.router;
    if (workspaceSlug && projectId) this.fetchInboxIssues(workspaceSlug, projectId);
  };

  /**
   * @description fetch inbox issues with paginated data
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  fetchInboxIssues = async (workspaceSlug: string, projectId: string) => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.inboxIssues = {};
        this.inboxIssuePaginationInfo = undefined;
      });

      const queryParams = this.inboxIssueQueryParams(
        this.inboxFilters,
        this.inboxSorting,
        this.PER_PAGE_COUNT,
        this.inboxIssuePaginationInfo?.next_cursor || ""
      );
      const { results, ...paginationInfo } = await this.inboxIssueService.list(workspaceSlug, projectId, queryParams);

      runInAction(() => {
        this.isLoading = false;
        if (results && results.length > 0)
          results.forEach((value: TInboxIssue) => {
            set(this.inboxIssues, value?.id, new InboxIssueStore(workspaceSlug, projectId, value));
          });
        set(this, "inboxIssuePaginationInfo", paginationInfo);
      });
    } catch (error) {
      console.error("Error fetching the inbox issues", error);
      this.isLoading = false;
      throw error;
    }
  };

  /**
   * create inbox issue
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns
   */
  // createInboxIssue = async (workspaceSlug: string, projectId: string, data: Partial<TInboxIssue>) => {
  //   try {
  //     const inboxIssueResponse = await this.inboxIssueService.create(workspaceSlug, projectId, data);

  //     this.inboxIssues[response.id] = new InboxIssueStore(workspaceSlug, projectId, response);
  //     return response;
  //   } catch {}
  //   runInAction(() => {});
  // };

  /**
   * delete inbox issue
   * @param workspaceSlug
   * @param projectId
   * @param inboxIssueId
   * @returns
   */
  // deleteInboxIssue = async (workspaceSlug: string, projectId: string, inboxIssueId: string) => {
  //   await this.inboxIssueService.destroy(workspaceSlug, projectId, inboxIssueId);
  //   runInAction(() => {
  //     delete this.inboxIssues[inboxIssueId];
  //   });
  // };
}
