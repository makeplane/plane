import { uniq, update } from "lodash";
import isEmpty from "lodash/isEmpty";
import omit from "lodash/omit";
import orderBy from "lodash/orderBy";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import {
  TInboxIssue,
  TInboxIssueCurrentTab,
  TInboxIssueFilter,
  TInboxIssueSorting,
  TInboxIssuePaginationInfo,
  TInboxIssueSortingOrderByQueryParam,
} from "@plane/types";
// helpers
import { EInboxIssueCurrentTab, EInboxIssueStatus, EPastDurationFilters, getCustomDates } from "@/helpers/inbox.helper";
// services
import { InboxIssueService } from "@/services/inbox";
// root store
import { IInboxIssueStore, InboxIssueStore } from "@/store/inbox/inbox-issue.store";
import { RootStore } from "@/store/root.store";

type TLoader =
  | "init-loading"
  | "mutation-loading"
  | "filter-loading"
  | "pagination-loading"
  | "issue-loading"
  | undefined;

export interface IProjectInboxStore {
  currentTab: TInboxIssueCurrentTab;
  loader: TLoader;
  error: { message: string; status: "init-error" | "pagination-error" } | undefined;
  currentInboxProjectId: string;
  inboxFilters: Partial<TInboxIssueFilter>;
  inboxSorting: Partial<TInboxIssueSorting>;
  inboxIssuePaginationInfo: TInboxIssuePaginationInfo | undefined;
  inboxIssues: Record<string, IInboxIssueStore>; // issue_id -> IInboxIssueStore
  inboxIssueIds: string[];
  // computed
  getAppliedFiltersCount: number;
  // computed functions
  getIssueInboxByIssueId: (issueId: string) => IInboxIssueStore;
  getIsIssueAvailable: (inboxIssueId: string) => boolean;
  // helper actions
  inboxIssueSorting: (issues: IInboxIssueStore[]) => IInboxIssueStore[];
  inboxIssueQueryParams: (
    inboxFilters: Partial<TInboxIssueFilter>,
    inboxSorting: Partial<TInboxIssueSorting>,
    pagePerCount: number,
    paginationCursor: string
  ) => Partial<Record<keyof TInboxIssueFilter, string>>;
  createOrUpdateInboxIssue: (inboxIssues: TInboxIssue[], workspaceSlug: string, projectId: string) => void;
  // actions
  handleCurrentTab: (tab: TInboxIssueCurrentTab) => void;
  handleInboxIssueFilters: <T extends keyof TInboxIssueFilter>(key: T, value: TInboxIssueFilter[T]) => void; // if user sends me undefined, I will remove the value from the filter key
  handleInboxIssueSorting: <T extends keyof TInboxIssueSorting>(key: T, value: TInboxIssueSorting[T]) => void; // if user sends me undefined, I will remove the value from the filter key
  fetchInboxIssues: (workspaceSlug: string, projectId: string, loadingType?: TLoader) => Promise<void>;
  fetchInboxPaginationIssues: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchInboxIssueById: (workspaceSlug: string, projectId: string, inboxIssueId: string) => Promise<TInboxIssue>;
  createInboxIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TInboxIssue>
  ) => Promise<TInboxIssue | undefined>;
  deleteInboxIssue: (workspaceSlug: string, projectId: string, inboxIssueId: string) => Promise<void>;
}

export class ProjectInboxStore implements IProjectInboxStore {
  // constants
  PER_PAGE_COUNT = 10;
  // observables
  currentTab: TInboxIssueCurrentTab = EInboxIssueCurrentTab.OPEN;
  loader: TLoader = "init-loading";
  error: { message: string; status: "init-error" | "pagination-error" } | undefined = undefined;
  currentInboxProjectId: string = "";
  inboxFilters: Partial<TInboxIssueFilter> = {
    status: [EInboxIssueStatus.PENDING],
  };
  inboxSorting: Partial<TInboxIssueSorting> = {
    order_by: "issue__created_at",
    sort_by: "desc",
  };
  inboxIssuePaginationInfo: TInboxIssuePaginationInfo | undefined = undefined;
  inboxIssues: Record<string, IInboxIssueStore> = {};
  inboxIssueIds: string[] = [];
  // services
  inboxIssueService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      currentTab: observable.ref,
      loader: observable.ref,
      error: observable,
      currentInboxProjectId: observable.ref,
      inboxFilters: observable,
      inboxSorting: observable,
      inboxIssuePaginationInfo: observable,
      inboxIssues: observable,
      inboxIssueIds: observable,
      // computed
      getAppliedFiltersCount: computed,
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

  getIssueInboxByIssueId = computedFn((issueId: string) => this.inboxIssues?.[issueId]);

  getIsIssueAvailable = computedFn((inboxIssueId: string) => {
    if (!this.inboxIssueIds) return true;
    return this.inboxIssueIds.includes(inboxIssueId);
  });

  // helpers
  inboxIssueSorting = (issues: IInboxIssueStore[]) => {
    let inboxIssues: IInboxIssueStore[] = issues;
    inboxIssues = orderBy(inboxIssues, "issue.sequence_id", "desc");
    if (this.inboxSorting?.order_by && this.inboxSorting?.sort_by) {
      switch (this.inboxSorting.order_by) {
        case "issue__created_at":
          if (this.inboxSorting.sort_by === "desc") inboxIssues = orderBy(inboxIssues, "issue.created_at", "desc");
          else inboxIssues = orderBy(inboxIssues, "issue.created_at", "asc");
        case "issue__updated_at":
          if (this.inboxSorting.sort_by === "desc") inboxIssues = orderBy(inboxIssues, "issue.updated_at", "desc");
          else inboxIssues = orderBy(inboxIssues, "issue.updated_at", "asc");
        case "issue__sequence_id":
          if (this.inboxSorting.sort_by === "desc") inboxIssues = orderBy(inboxIssues, "issue.sequence_id", "desc");
          else inboxIssues = orderBy(inboxIssues, "issue.sequence_id", "asc");
        default:
          inboxIssues = inboxIssues;
      }
    }
    return inboxIssues;
  };

  inboxIssueQueryParams = (
    inboxFilters: Partial<TInboxIssueFilter>,
    inboxSorting: Partial<TInboxIssueSorting>,
    pagePerCount: number,
    paginationCursor: string
  ) => {
    const filters: Partial<Record<keyof TInboxIssueFilter, string>> = {};
    !isEmpty(inboxFilters) &&
      Object.keys(inboxFilters).forEach((key) => {
        const filterKey = key as keyof TInboxIssueFilter;
        if (inboxFilters[filterKey] && inboxFilters[filterKey]?.length) {
          if (["created_at", "updated_at"].includes(filterKey) && (inboxFilters[filterKey] || [])?.length > 0) {
            const appliedDateFilters: string[] = [];
            inboxFilters[filterKey]?.forEach((value) => {
              const dateValue = value as EPastDurationFilters;
              appliedDateFilters.push(getCustomDates(dateValue));
            });
            filters[filterKey] = appliedDateFilters?.join(",");
          } else filters[filterKey] = inboxFilters[filterKey]?.join(",");
        }
      });

    const sorting: TInboxIssueSortingOrderByQueryParam = {
      order_by: "-issue__created_at",
    };
    if (inboxSorting?.order_by && inboxSorting?.sort_by) {
      switch (inboxSorting.order_by) {
        case "issue__created_at":
          if (inboxSorting.sort_by === "desc") sorting.order_by = `-issue__created_at`;
          else sorting.order_by = "issue__created_at";
          break;
        case "issue__updated_at":
          if (inboxSorting.sort_by === "desc") sorting.order_by = `-issue__updated_at`;
          else sorting.order_by = "issue__updated_at";
          break;
        case "issue__sequence_id":
          if (inboxSorting.sort_by === "desc") sorting.order_by = `-issue__sequence_id`;
          else sorting.order_by = "issue__sequence_id";
          break;
        default:
          sorting.order_by = "-issue__created_at";
          break;
      }
    }

    return {
      ...filters,
      ...sorting,
      per_page: pagePerCount,
      cursor: paginationCursor,
    };
  };

  createOrUpdateInboxIssue = (inboxIssues: TInboxIssue[], workspaceSlug: string, projectId: string) => {
    if (inboxIssues && inboxIssues.length > 0) {
      inboxIssues.forEach((inbox: TInboxIssue) => {
        const existingInboxIssueDetail = this.getIssueInboxByIssueId(inbox?.issue?.id);
        if (existingInboxIssueDetail)
          Object.assign(existingInboxIssueDetail, {
            ...inbox,
            issue: {
              ...existingInboxIssueDetail.issue,
              ...inbox.issue,
            },
          });
        else
          set(this.inboxIssues, [inbox?.issue?.id], new InboxIssueStore(workspaceSlug, projectId, inbox, this.store));
      });
    }
  };

  // actions
  handleCurrentTab = (tab: TInboxIssueCurrentTab) => {
    runInAction(() => {
      set(this, "currentTab", tab);
      set(this, "inboxFilters", undefined);
      set(this, ["inboxSorting", "order_by"], "issue__created_at");
      set(this, ["inboxSorting", "sort_by"], "desc");
      set(this, ["inboxIssueIds"], []);
      set(this, ["inboxIssuePaginationInfo"], undefined);
      if (tab === "closed") set(this, ["inboxFilters", "status"], [-1, 1, 2]);
      else set(this, ["inboxFilters", "status"], [-2]);
    });
    const { workspaceSlug, projectId } = this.store.router;
    if (workspaceSlug && projectId) this.fetchInboxIssues(workspaceSlug, projectId, "filter-loading");
  };

  handleInboxIssueFilters = <T extends keyof TInboxIssueFilter>(key: T, value: TInboxIssueFilter[T]) => {
    runInAction(() => {
      set(this.inboxFilters, key, value);
      set(this, ["inboxIssuePaginationInfo"], undefined);
    });
    const { workspaceSlug, projectId } = this.store.router;
    if (workspaceSlug && projectId) this.fetchInboxIssues(workspaceSlug, projectId, "filter-loading");
  };

  handleInboxIssueSorting = <T extends keyof TInboxIssueSorting>(key: T, value: TInboxIssueSorting[T]) => {
    runInAction(() => {
      set(this.inboxSorting, key, value);
      set(this, ["inboxIssuePaginationInfo"], undefined);
    });
    const { workspaceSlug, projectId } = this.store.router;
    if (workspaceSlug && projectId) this.fetchInboxIssues(workspaceSlug, projectId, "filter-loading");
  };

  /**
   * @description fetch inbox issues with paginated data
   * @param workspaceSlug
   * @param projectId
   */
  fetchInboxIssues = async (workspaceSlug: string, projectId: string, loadingType: TLoader = undefined) => {
    try {
      if (this.currentInboxProjectId != projectId) {
        runInAction(() => {
          set(this, ["currentInboxProjectId"], projectId);
          set(this, ["inboxIssues"], {});
          set(this, ["inboxIssueIds"], []);
          set(this, ["inboxIssuePaginationInfo"], undefined);
        });
      }
      if (Object.keys(this.inboxIssueIds).length === 0) this.loader = "init-loading";
      else this.loader = "mutation-loading";
      if (loadingType) this.loader = loadingType;

      const queryParams = this.inboxIssueQueryParams(
        this.inboxFilters,
        this.inboxSorting,
        this.PER_PAGE_COUNT,
        `${this.PER_PAGE_COUNT}:0:0`
      );
      const { results, ...paginationInfo } = await this.inboxIssueService.list(workspaceSlug, projectId, queryParams);

      runInAction(() => {
        this.loader = undefined;
        set(this, "inboxIssuePaginationInfo", paginationInfo);
        if (results) {
          const issueIds = results.map((value) => value?.issue?.id);
          set(this, ["inboxIssueIds"], issueIds);
          this.createOrUpdateInboxIssue(results, workspaceSlug, projectId);
        }
      });
    } catch (error) {
      console.error("Error fetching the inbox issues", error);
      this.loader = undefined;
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
        this.inboxIssuePaginationInfo &&
        (!this.inboxIssuePaginationInfo?.total_results ||
          (this.inboxIssuePaginationInfo?.total_results &&
            this.inboxIssueIds.length < this.inboxIssuePaginationInfo?.total_results))
      ) {
        this.loader = "pagination-loading";

        const queryParams = this.inboxIssueQueryParams(
          this.inboxFilters,
          this.inboxSorting,
          this.PER_PAGE_COUNT,
          this.inboxIssuePaginationInfo?.next_cursor || `${this.PER_PAGE_COUNT}:0:0`
        );
        const { results, ...paginationInfo } = await this.inboxIssueService.list(workspaceSlug, projectId, queryParams);

        runInAction(() => {
          this.loader = undefined;
          set(this, "inboxIssuePaginationInfo", paginationInfo);
          if (results && results.length > 0) {
            const issueIds = results.map((value) => value?.issue?.id);
            update(this, ["inboxIssueIds"], (ids) => uniq([...ids, ...issueIds]));
            this.createOrUpdateInboxIssue(results, workspaceSlug, projectId);
          }
        });
      } else set(this, ["inboxIssuePaginationInfo", "next_page_results"], false);
    } catch (error) {
      console.error("Error fetching the inbox issues", error);
      this.loader = undefined;
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
  fetchInboxIssueById = async (
    workspaceSlug: string,
    projectId: string,
    inboxIssueId: string
  ): Promise<TInboxIssue> => {
    try {
      this.loader = "issue-loading";
      const inboxIssue = await this.inboxIssueService.retrieve(workspaceSlug, projectId, inboxIssueId);
      const issueId = inboxIssue?.issue?.id || undefined;

      if (inboxIssue && issueId) {
        runInAction(() => {
          set(this.inboxIssues, [issueId], new InboxIssueStore(workspaceSlug, projectId, inboxIssue, this.store));
          set(this, "loader", undefined);
        });
        await Promise.all([
          // fetching reactions
          this.store.issue.issueDetail.fetchReactions(workspaceSlug, projectId, issueId),
          // fetching activity
          this.store.issue.issueDetail.fetchActivities(workspaceSlug, projectId, issueId),
          // fetching comments
          this.store.issue.issueDetail.fetchComments(workspaceSlug, projectId, issueId),
          // fetching attachments
          this.store.issue.issueDetail.fetchAttachments(workspaceSlug, projectId, issueId),
        ]);
      }
      return inboxIssue;
    } catch (error) {
      console.error("Error fetching the inbox issue with inbox issue id");
      this.loader = undefined;
      throw error;
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
          update(this, ["inboxIssueIds"], (ids) => [...ids, inboxIssueResponse?.issue?.id]);
          set(
            this.inboxIssues,
            [inboxIssueResponse?.issue?.id],
            new InboxIssueStore(workspaceSlug, projectId, inboxIssueResponse, this.store)
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
      runInAction(() => {
        set(
          this,
          ["inboxIssuePaginationInfo", "total_results"],
          (this.inboxIssuePaginationInfo?.total_results || 0) - 1
        );
        set(this, "inboxIssues", omit(this.inboxIssues, inboxIssueId));
        set(
          this,
          ["inboxIssueIds"],
          this.inboxIssueIds.filter((id) => id !== inboxIssueId)
        );
      });
      await this.inboxIssueService.destroy(workspaceSlug, projectId, inboxIssueId);
    } catch {
      console.error("Error removing the inbox issue");
      set(this.inboxIssues, [inboxIssueId], currentIssue);
      set(this, ["inboxIssuePaginationInfo", "total_results"], (this.inboxIssuePaginationInfo?.total_results || 0) + 1);
      set(this, ["inboxIssueIds"], [...this.inboxIssueIds, inboxIssueId]);
    }
  };
}
