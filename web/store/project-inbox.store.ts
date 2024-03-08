import { action, computed, makeObservable, observable, runInAction } from "mobx";
import keyBy from "lodash/keyBy";
import includes from "lodash/includes";
import pull from "lodash/pull";
// services
import { InboxIssueService } from "services/inbox";
// types
import { TInboxIssueFilterOptions, TInboxIssue, TIssue, TPaginationInfo } from "@plane/types";
// root store
import { RootStore } from "./root.store";
import { uniq } from "lodash";

export interface IProjectInboxStore {
  isLoading: boolean;
  inboxIssues: Record<string, TInboxIssue>;
  inboxFilters: Partial<TInboxIssueFilterOptions>;
  inboxIssuePaginationInfo: Partial<TPaginationInfo>;
  inboxIssuesArray: TInboxIssue[];
  fetchInboxIssues: (
    workspaceSlug: string,
    projectId: string,
    params?: Partial<TInboxIssueFilterOptions & TPaginationInfo>
  ) => Promise<TInboxIssue[]>;
  fetchInboxIssuesNextPage: (workspaceSlug: string, projectId: string) => Promise<void>;
  createInboxIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => Promise<TInboxIssue>;
  updateInboxIssuePriorityFilters: (projectId: string, key: string, value: string) => void;
  updateInboxIssueStatusFilters: (workspaceSlug: string, projectId: string, value: number) => void;
}

export class ProjectInboxStore implements IProjectInboxStore {
  isLoading: boolean = false;
  inboxIssues: Record<string, TInboxIssue> = {};
  inboxFilters: Partial<TInboxIssueFilterOptions> = {};
  inboxIssuePaginationInfo: Partial<TPaginationInfo> = {};
  PER_PAGE_COUNT = 10;
  rootStore;
  inboxIssueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      isLoading: observable.ref,
      inboxIssues: observable,
      inboxFilters: observable,
      inboxIssuePaginationInfo: observable,
      // computed
      inboxIssuesArray: computed,
      // actions
      fetchInboxIssues: action,
      fetchInboxIssuesNextPage: action,
      createInboxIssue: action,
      updateInboxIssuePriorityFilters: action,
      updateInboxIssueStatusFilters: action,
    });
    this.rootStore = _rootStore;
    this.inboxIssueService = new InboxIssueService();
  }

  /**
   * fetch inbox issues
   * @param workspaceSlug
   * @param projectId
   * @param params
   * @returns
   */
  fetchInboxIssues = async (workspaceSlug: string, projectId: string, params = {}) => {
    runInAction(() => {
      this.isLoading = true;
      this.inboxIssues = {};
    });
    const { results, ...paginationInfo } = await this.inboxIssueService.list(workspaceSlug, projectId, {
      ...params,
      ...this.inboxFilters,
      per_page: this.PER_PAGE_COUNT,
    });
    console.log("response", results);
    runInAction(() => {
      this.inboxIssues = keyBy(results, "id");
      this.isLoading = false;
      this.inboxIssuePaginationInfo = { ...this.inboxIssuePaginationInfo, ...paginationInfo };
    });
    return results;
  };

  fetchInboxIssuesNextPage = async (workspaceSlug: string, projectId: string) => {
    if (this.inboxIssuePaginationInfo?.next_cursor && this.inboxIssuePaginationInfo?.next_page_results) {
      runInAction(() => {
        this.isLoading = true;
      });
      const { results, ...paginationInfo } = await this.inboxIssueService.list(workspaceSlug, projectId, {
        ...this.inboxIssuePaginationInfo,
        cursor: this.inboxIssuePaginationInfo.next_cursor,
        per_page: this.PER_PAGE_COUNT,
      });
      console.log("response", results);
      runInAction(() => {
        this.inboxIssues = { ...this.inboxIssues, ...keyBy(results, "id") };
        this.isLoading = false;
        this.inboxIssuePaginationInfo = {
          ...this.inboxIssuePaginationInfo,
          ...paginationInfo,
        };
      });
    }
  };

  get inboxIssuesArray() {
    return Object.values(this.inboxIssues);
  }

  /**
   * create inbox issue
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns
   */
  createInboxIssue = async (workspaceSlug: string, projectId: string, data: Partial<TInboxIssue>) => {
    const response = await this.inboxIssueService.create(workspaceSlug, projectId, data);
    runInAction(() => {
      this.inboxIssues[response.id] = response;
    });
    return response;
  };

  /**
   * delete inbox issue
   * @param workspaceSlug
   * @param projectId
   * @param inboxIssueId
   * @returns
   */
  deleteInboxIssue = async (workspaceSlug: string, projectId: string, inboxIssueId: string) => {
    const response = await this.inboxIssueService.destroy(workspaceSlug, projectId, inboxIssueId);
    runInAction(() => {
      delete this.inboxIssues[inboxIssueId];
    });
    return response;
  };

  /**
   * update inbox issue priority filters
   * @param projectId
   * @param key
   * @param value
   */
  updateInboxIssuePriorityFilters = (workspaceSlug: string, projectId: string, value: string) => {
    if (!this.rootStore.app.router.query.workspaceSlug) return;
    runInAction(() => {
      const priorityList = this.inboxFilters?.priority ?? [];
      if (includes(priorityList, value)) {
        pull(priorityList, value);
      } else {
        priorityList.push(value);
        this.inboxFilters = {
          ...this.inboxFilters,
          priority: uniq(priorityList),
        };
      }
    });
    this.fetchInboxIssues(workspaceSlug, projectId, this.inboxFilters);
  };

  /**
   * update inbox issue status filters
   * @param projectId
   * @param key
   * @param value
   */
  updateInboxIssueStatusFilters = (workspaceSlug: string, projectId: string, value: number) => {
    runInAction(() => {
      const inboxStatusFilter = this.inboxFilters?.inbox_status ?? [];
      if (includes(inboxStatusFilter, value)) {
        pull(inboxStatusFilter, value);
      } else {
        inboxStatusFilter.push(value);
        this.inboxFilters = {
          ...this.inboxFilters,
          inbox_status: uniq(inboxStatusFilter),
        };
      }
    });
    this.fetchInboxIssues(workspaceSlug, projectId, this.inboxFilters);
  };
}
