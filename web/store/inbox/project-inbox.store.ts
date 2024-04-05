import omit from "lodash/omit";
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
  TInboxIssuePaginationInfo,
} from "@plane/types";
// root store
import { IInboxIssueStore, InboxIssueStore } from "@/store/inbox/inbox-issue.store";
import { RootStore } from "@/store/root.store";
// store helpers
import { InboxIssueHelpers } from "./helpers";

type TLoader = "init-loading" | "filter-loading" | "pagination-loading" | undefined;

export interface IProjectInboxStore {
  currentTab: TInboxIssueCurrentTab;
  isLoading: TLoader;
  error: { message: string; status: "init-error" | "pagination-error" } | undefined;
  inboxFilters: Partial<TInboxIssueFilter>;
  inboxSorting: Partial<TInboxIssueSorting>;
  inboxIssuePaginationInfo: TInboxIssuePaginationInfo | undefined;
  inboxIssues: Record<string, IInboxIssueStore>;
  // computed
  getAppliedFiltersCount: number;
  inboxIssuesArray: IInboxIssueStore[];
  getIssueInboxByIssueId: (issueId: string) => IInboxIssueStore | undefined;
  // actions
  handleCurrentTab: (tab: TInboxIssueCurrentTab) => void;
  handleInboxIssueFilters: <T extends keyof TInboxIssueFilter>(key: T, value: TInboxIssueFilter[T]) => void; // if user sends me undefined, I will remove the value from the filter key
  handleInboxIssueSorting: <T extends keyof TInboxIssueSorting>(key: T, value: TInboxIssueSorting[T]) => void; // if user sends me undefined, I will remove the value from the filter key
  fetchInboxIssues: (workspaceSlug: string, projectId: string, loadingType?: TLoader) => Promise<void>;
  fetchInboxPaginationIssues: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchInboxIssueById: (workspaceSlug: string, projectId: string, inboxIssueId: string) => Promise<void>;
  createInboxIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TInboxIssue>
  ) => Promise<TInboxIssue | undefined>;
  deleteInboxIssue: (workspaceSlug: string, projectId: string, inboxIssueId: string) => Promise<void>;
}

export class ProjectInboxStore extends InboxIssueHelpers implements IProjectInboxStore {
  // constants
  PER_PAGE_COUNT = 10;
  // observables
  currentTab: TInboxIssueCurrentTab = "open";
  isLoading: TLoader = undefined;
  error: { message: string; status: "init-error" | "pagination-error" } | undefined = undefined;
  inboxFilters: Partial<TInboxIssueFilter> = {
    status: [-2],
  };
  inboxSorting: Partial<TInboxIssueSorting> = {
    order_by: "issue__created_at",
    sort_by: "desc",
  };
  inboxIssuePaginationInfo: TInboxIssuePaginationInfo | undefined = undefined;
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
      getAppliedFiltersCount: computed,
      inboxIssuesArray: computed,
      // actions
      handleInboxIssueFilters: action,
      handleInboxIssueSorting: action,
      fetchInboxIssues: action,
      fetchInboxPaginationIssues: action,
      fetchInboxIssueById: action,
      createInboxIssue: action,
      deleteInboxIssue: action,
    });
    this.inboxIssueService = new InboxIssueService();
  }

  // computed
  get getAppliedFiltersCount() {
    let count = 0;
    this.inboxFilters != undefined &&
      Object.keys(this.inboxFilters).forEach((key) => {
        const filterKey = key as keyof TInboxIssueFilter;
        if (this.inboxFilters[filterKey] && this.inboxFilters?.[filterKey])
          count = count + (this.inboxFilters?.[filterKey]?.length ?? 0);
      });
    return count;
  }

  get inboxIssuesArray() {
    return Object.values(this.inboxIssues || {}).filter((inbox) =>
      (this.currentTab === "open" ? [-2] : [-1, 0, 1, 2]).includes(inbox.status)
    );
  }

  getIssueInboxByIssueId = computedFn((issueId: string) => this.inboxIssues?.[issueId] || undefined);

  // actions
  handleCurrentTab = (tab: TInboxIssueCurrentTab) => {
    set(this, "currentTab", tab);
    set(this, "inboxFilters", undefined);
    set(this, ["inboxSorting", "order_by"], "issue__created_at");
    set(this, ["inboxSorting", "sort_by"], "desc");
    if (tab === "closed") set(this, ["inboxFilters", "status"], [-1, 0, 1, 2]);
    else set(this, ["inboxFilters", "status"], [-2]);
    const { workspaceSlug, projectId } = this.store.app.router;
    if (workspaceSlug && projectId) this.fetchInboxIssues(workspaceSlug, projectId, "filter-loading");
  };

  handleInboxIssueFilters = <T extends keyof TInboxIssueFilter>(key: T, value: TInboxIssueFilter[T]) => {
    set(this.inboxFilters, key, value);
    const { workspaceSlug, projectId } = this.store.app.router;
    if (workspaceSlug && projectId) this.fetchInboxIssues(workspaceSlug, projectId, "filter-loading");
  };

  handleInboxIssueSorting = <T extends keyof TInboxIssueSorting>(key: T, value: TInboxIssueSorting[T]) => {
    set(this.inboxSorting, key, value);
    const { workspaceSlug, projectId } = this.store.app.router;
    if (workspaceSlug && projectId) this.fetchInboxIssues(workspaceSlug, projectId, "filter-loading");
  };

  /**
   * @description fetch inbox issues with paginated data
   * @param workspaceSlug
   * @param projectId
   */
  fetchInboxIssues = async (workspaceSlug: string, projectId: string, loadingType: TLoader = undefined) => {
    try {
      if (loadingType) this.isLoading = loadingType;
      else this.isLoading = "init-loading";
      this.inboxIssuePaginationInfo = undefined;
      this.inboxIssues = {};

      const queryParams = this.inboxIssueQueryParams(
        this.inboxFilters,
        this.inboxSorting,
        this.PER_PAGE_COUNT,
        `${this.PER_PAGE_COUNT}:0:0`
      );
      const { results, ...paginationInfo } = await this.inboxIssueService.list(workspaceSlug, projectId, queryParams);

      runInAction(() => {
        this.isLoading = undefined;
        set(this, "inboxIssuePaginationInfo", paginationInfo);
        if (results && results.length > 0)
          results.forEach((value: TInboxIssue) => {
            set(this.inboxIssues, value?.issue?.id, new InboxIssueStore(workspaceSlug, projectId, value));
          });
      });
    } catch (error) {
      console.error("Error fetching the inbox issues", error);
      this.isLoading = undefined;
      this.error = {
        message: "Error fetching the inbox issues please try again later.",
        status: "init-error",
      };
      throw error;
    }
  };

  /**
   * @description fetch inbox issues with paginated data
   * @param workspaceSlug
   * @param projectId
   */
  fetchInboxPaginationIssues = async (workspaceSlug: string, projectId: string) => {
    try {
      if (
        !this.inboxIssuePaginationInfo?.total_results ||
        (this.inboxIssuePaginationInfo?.total_results &&
          this.inboxIssuesArray.length < this.inboxIssuePaginationInfo?.total_results)
      ) {
        this.isLoading = "pagination-loading";

        const queryParams = this.inboxIssueQueryParams(
          this.inboxFilters,
          this.inboxSorting,
          this.PER_PAGE_COUNT,
          this.inboxIssuePaginationInfo?.next_cursor || `${this.PER_PAGE_COUNT}:0:0`
        );
        const { results, ...paginationInfo } = await this.inboxIssueService.list(workspaceSlug, projectId, queryParams);

        runInAction(() => {
          this.isLoading = undefined;
          set(this, "inboxIssuePaginationInfo", paginationInfo);
          if (results && results.length > 0)
            results.forEach((value: TInboxIssue) => {
              set(this.inboxIssues, value?.issue?.id, new InboxIssueStore(workspaceSlug, projectId, value));
            });
        });
      } else set(this, ["inboxIssuePaginationInfo", "next_page_results"], false);
    } catch (error) {
      console.error("Error fetching the inbox issues", error);
      this.isLoading = undefined;
      this.error = {
        message: "Error fetching the paginated inbox issues please try again later.",
        status: "pagination-error",
      };
      throw error;
    }
  };

  /**
   * @description fetch inbox issue with issue id
   * @param workspaceSlug
   * @param projectId
   * @param inboxIssueId
   */
  fetchInboxIssueById = async (workspaceSlug: string, projectId: string, inboxIssueId: string) => {
    try {
      const inboxIssue = await this.inboxIssueService.retrieve(workspaceSlug, projectId, inboxIssueId);
      if (inboxIssue)
        runInAction(() => {
          set(this.inboxIssues, inboxIssue?.issue?.id, new InboxIssueStore(workspaceSlug, projectId, inboxIssue));
        });
    } catch {
      console.error("Error fetching the inbox issue with inbox issue id");
    }
  };

  /**
   * @description create inbox issue
   * @param workspaceSlug
   * @param projectId
   * @param data
   */
  createInboxIssue = async (workspaceSlug: string, projectId: string, data: Partial<TInboxIssue>) => {
    try {
      const inboxIssueResponse = await this.inboxIssueService.create(workspaceSlug, projectId, data);
      if (inboxIssueResponse)
        runInAction(() => {
          set(
            this.inboxIssues,
            inboxIssueResponse?.issue?.id,
            new InboxIssueStore(workspaceSlug, projectId, inboxIssueResponse)
          );
          set(
            this,
            ["inboxIssuePaginationInfo", "total_results"],
            (this.inboxIssuePaginationInfo?.total_results || 0) + 1
          );
        });
      return inboxIssueResponse;
    } catch {
      console.error("Error creating the inbox issue");
    }
  };

  /**
   * @description delete inbox issue
   * @param workspaceSlug
   * @param projectId
   * @param inboxIssueId
   */
  deleteInboxIssue = async (workspaceSlug: string, projectId: string, inboxIssueId: string) => {
    const currentIssue = this.inboxIssues?.[inboxIssueId];
    try {
      if (!currentIssue) return;
      omit(this.inboxIssues, inboxIssueId);
      await this.inboxIssueService.destroy(workspaceSlug, projectId, inboxIssueId);
    } catch {
      console.error("Error removing the inbox issue");
      set(this.inboxIssues, [inboxIssueId], currentIssue);
    }
  };
}
