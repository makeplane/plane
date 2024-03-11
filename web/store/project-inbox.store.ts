import { action, computed, makeObservable, observable, runInAction } from "mobx";
import keyBy from "lodash/keyBy";
import includes from "lodash/includes";
import pull from "lodash/pull";
import reduce from "lodash/reduce";
import mapValues from "lodash/mapValues";
import isArray from "lodash/isArray";
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
  // computed
  inboxIssuesArray: TInboxIssue[];
  inboxIssuesFiltersLength: number;
  // actions
  fetchInboxIssues: (
    workspaceSlug: string,
    projectId: string,
    params?: Partial<TInboxIssueFilterOptions & TPaginationInfo>
  ) => Promise<TInboxIssue[]>;
  fetchInboxIssuesNextPage: (workspaceSlug: string, projectId: string) => Promise<void>;
  createInboxIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => Promise<TInboxIssue>;
  updateInboxIssuePriorityFilter: (workspaceSlug: string, projectId: string, value: string) => void;
  updateInboxIssueStatusFilter: (workspaceSlug: string, projectId: string, value: number) => void;
  resetInboxFilters: () => void;
  resetInboxPriorityFilters: () => void;
  resetInboxStatusFilters: () => void;
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
      inboxIssuesFiltersLength: computed,
      // actions
      fetchInboxIssues: action,
      fetchInboxIssuesNextPage: action,
      createInboxIssue: action,
      updateInboxIssuePriorityFilter: action,
      updateInboxIssueStatusFilter: action,
      resetInboxFilters: action,
      resetInboxPriorityFilters: action,
      resetInboxStatusFilters: action,
    });
    this.rootStore = _rootStore;
    this.inboxIssueService = new InboxIssueService();
  }

  get inboxIssuesArray() {
    return Object.values(this.inboxIssues);
  }

  get inboxIssuesFiltersLength() {
    return reduce(this.inboxFilters, (acc, value) => acc + (value?.length || 0), 0);
  }

  get inboxFiltersParams() {
    return mapValues(this.inboxFilters, (value) => {
      if (isArray(value) && value.length > 0) {
        return value.join(",");
      }
      return;
    });
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
      this.inboxIssuePaginationInfo = {};
    });
    const { results, ...paginationInfo } = await this.inboxIssueService.list(workspaceSlug, projectId, {
      ...params,
      per_page: this.PER_PAGE_COUNT,
    });
    runInAction(() => {
      this.inboxIssues = keyBy(results, "id");
      this.isLoading = false;
      this.inboxIssuePaginationInfo = { ...this.inboxIssuePaginationInfo, ...paginationInfo };
    });
    return results;
  };

  /**
   * fetch inbox issues next page
   * @param workspaceSlug
   * @param projectId
   */
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
  updateInboxIssuePriorityFilter = (workspaceSlug: string, projectId: string, value: string) => {
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
    this.fetchInboxIssues(workspaceSlug, projectId, this.inboxFiltersParams);
  };

  /**
   * update inbox issue status filters
   * @param projectId
   * @param key
   * @param value
   */
  updateInboxIssueStatusFilter = (workspaceSlug: string, projectId: string, value: number) => {
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
    this.fetchInboxIssues(workspaceSlug, projectId, this.inboxFiltersParams);
  };

  /**
   * reset all inbox filters to default
   */
  resetInboxFilters = () => {
    this.inboxFilters = {};
  };

  /**
   * reset all inbox priority filters to default
   */
  resetInboxPriorityFilters = () => {
    this.inboxFilters = { ...this.inboxFilters, priority: [] };
  };

  /**
   * reset all inbox status filters to default
   */
  resetInboxStatusFilters = () => {
    this.inboxFilters = { ...this.inboxFilters, inbox_status: [] };
  };
}
