import { action, computed, makeObservable, observable, runInAction } from "mobx";
import keyBy from "lodash/keyBy";
import includes from "lodash/includes";
import pull from "lodash/pull";
import reduce from "lodash/reduce";
import mapValues from "lodash/mapValues";
import isArray from "lodash/isArray";
import uniq from "lodash/uniq";
// services
import { InboxIssueService } from "services/inbox";
// types
import { TInboxIssueFilterOptions, TInboxIssue, TIssue, TPaginationInfo } from "@plane/types";
// root store
import { RootStore } from "./root.store";
import { IInboxIssueStore, InboxIssueStore } from "./inbox-issue.store";

export interface IProjectInboxStore {
  isLoading: boolean;
  inboxIssues: Record<string, IInboxIssueStore>;
  inboxFilters: Partial<TInboxIssueFilterOptions>;
  inboxIssuePaginationInfo: Partial<TPaginationInfo>;
  // computed
  inboxIssuesArray: IInboxIssueStore[];
  inboxIssuesFiltersLength: number;
  // actions
  getIssueInboxByIssueId: (issueId: string) => IInboxIssueStore | undefined;
  fetchInboxIssues: (
    workspaceSlug: string,
    projectId: string,
    params?: Partial<TInboxIssueFilterOptions & TPaginationInfo>
  ) => Promise<TInboxIssue[]>;
  fetchInboxIssuesNextPage: (workspaceSlug: string, projectId: string) => Promise<void>;
  createInboxIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => Promise<TInboxIssue>;
  deleteInboxIssue: (workspaceSlug: string, projectId: string, inboxIssueId: string) => Promise<void>;
  updateInboxIssuePriorityFilter: (workspaceSlug: string, projectId: string, value: string) => void;
  updateInboxIssueStatusFilter: (workspaceSlug: string, projectId: string, value: number) => void;
  resetInboxFilters: (workspaceSlug: string, projectId: string) => void;
  resetInboxPriorityFilters: (workspaceSlug: string, projectId: string) => void;
  resetInboxStatusFilters: (workspaceSlug: string, projectId: string) => void;
}

export class ProjectInboxStore implements IProjectInboxStore {
  isLoading: boolean = false;
  inboxIssues: Record<string, IInboxIssueStore> = {};
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
      getIssueInboxByIssueId: action,
      fetchInboxIssues: action,
      fetchInboxIssuesNextPage: action,
      createInboxIssue: action,
      deleteInboxIssue: action,
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

  getIssueInboxByIssueId = (issueId: string) =>
    Object.values(this.inboxIssues).find((issue) => issue.issue?.id === issueId);

  /**
   * fetch inbox issues
   * @param workspaceSlug
   * @param projectId
   * @param params
   * @returns
   */
  fetchInboxIssues = async (workspaceSlug: string, projectId: string, params = {}) => {
    try {
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
        this.inboxIssues = mapValues(
          keyBy(results, "id"),
          (value) => new InboxIssueStore(workspaceSlug, projectId, value)
        );
        this.isLoading = false;
        this.inboxIssuePaginationInfo = { ...this.inboxIssuePaginationInfo, ...paginationInfo };
      });
      return results;
    } catch (error) {
      console.error("Error fetching the inbox issues", error);
      this.isLoading = false;
      throw error;
    }
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
        this.inboxIssues = {
          ...this.inboxIssues,
          ...mapValues(keyBy(results, "id"), (value) => new InboxIssueStore(workspaceSlug, projectId, value)),
        };
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
      this.inboxIssues[response.id] = new InboxIssueStore(workspaceSlug, projectId, response);
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
    await this.inboxIssueService.destroy(workspaceSlug, projectId, inboxIssueId);
    runInAction(() => {
      delete this.inboxIssues[inboxIssueId];
    });
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
  resetInboxFilters = (workspaceSlug: string, projectId: string) => {
    this.inboxFilters = {};
    this.fetchInboxIssues(workspaceSlug, projectId);
  };

  /**
   * reset all inbox priority filters to default
   */
  resetInboxPriorityFilters = (workspaceSlug: string, projectId: string) => {
    this.inboxFilters = { ...this.inboxFilters, priority: [] };
    this.fetchInboxIssues(workspaceSlug, projectId);
  };

  /**
   * reset all inbox status filters to default
   */
  resetInboxStatusFilters = (workspaceSlug: string, projectId: string) => {
    this.inboxFilters = { ...this.inboxFilters, inbox_status: [] };
    this.fetchInboxIssues(workspaceSlug, projectId);
  };
}
