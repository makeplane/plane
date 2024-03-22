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
import {
  TInboxIssueFilterOptions,
  TInboxIssue,
  TIssue,
  TPaginationInfo,
  TInboxIssueStatus,
  TInboxIssueDisplayFilters,
} from "@plane/types";
// root store
import { RootStore } from "./root.store";
import { IInboxIssueStore, InboxIssueStore } from "./inbox-issue.store";

export interface IProjectInboxStore {
  isLoading: boolean;
  inboxIssues: Record<string, IInboxIssueStore>;
  displayFilters: TInboxIssueDisplayFilters | undefined;
  inboxFilters: Partial<TInboxIssueFilterOptions>;
  inboxIssuePaginationInfo: Partial<TPaginationInfo>;
  totalIssues: number;
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
  fetchInboxIssuesByIssueId: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TInboxIssue>;
  createInboxIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => Promise<TInboxIssue>;
  deleteInboxIssue: (workspaceSlug: string, projectId: string, inboxIssueId: string) => Promise<void>;

  updateDisplayFilters: (workspaceSlug: string, projectId: string, displayFilters: TInboxIssueDisplayFilters) => void;
  updateInboxIssueStatusFilter: (workspaceSlug: string, projectId: string, value: TInboxIssueStatus) => void;
  updateInboxIssuePriorityFilter: (workspaceSlug: string, projectId: string, value: string) => void;
  updateInboxIssueAssigneeFilter: (workspaceSlug: string, projectId: string, value: string) => void;
  updateInboxIssueCreatedByFilter: (workspaceSlug: string, projectId: string, value: string) => void;
  updateInboxIssueLabelFilter: (workspaceSlug: string, projectId: string, value: string) => void;
  updateInboxIssueCreatedAtFilter: (workspaceSlug: string, projectId: string, value: string) => void;
  updateInboxIssueUpdatedAtFilter: (workspaceSlug: string, projectId: string, value: string) => void;

  applyResolvedInboxIssueFilter: (workspaceSlug: string, projectId: string) => void;
  // updateFilters: (workspaceSlug: string, projectId: string, filters: TInboxIssueFilterOptions) => void;
  resetInboxFilters: (workspaceSlug: string, projectId: string) => void;
  resetInboxPriorityFilters: (workspaceSlug: string, projectId: string) => void;
  resetInboxStatusFilters: (workspaceSlug: string, projectId: string) => void;
}

export class ProjectInboxStore implements IProjectInboxStore {
  isLoading: boolean = false;
  inboxIssues: Record<string, IInboxIssueStore> = {};
  displayFilters: TInboxIssueDisplayFilters = {
    order_by: "-issue__created_at",
  };
  inboxFilters: Partial<TInboxIssueFilterOptions> = {};
  inboxIssuePaginationInfo: Partial<TPaginationInfo> = {};
  totalIssues: number = 0;
  PER_PAGE_COUNT = 10;
  rootStore;
  inboxIssueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      isLoading: observable.ref,
      inboxIssues: observable,
      inboxFilters: observable,
      displayFilters: observable,
      inboxIssuePaginationInfo: observable,
      totalIssues: observable,
      // computed
      inboxIssuesArray: computed,
      inboxIssuesFiltersLength: computed,
      // actions
      getIssueInboxByIssueId: action,
      fetchInboxIssues: action,
      fetchInboxIssuesNextPage: action,
      fetchInboxIssuesByIssueId: action,
      createInboxIssue: action,
      deleteInboxIssue: action,
      updateDisplayFilters: action,
      updateInboxIssueStatusFilter: action,
      updateInboxIssuePriorityFilter: action,
      updateInboxIssueAssigneeFilter: action,
      updateInboxIssueCreatedByFilter: action,
      updateInboxIssueLabelFilter: action,
      updateInboxIssueCreatedAtFilter: action,
      updateInboxIssueUpdatedAtFilter: action,
      applyResolvedInboxIssueFilter: action,
      // updateFilters: action,
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

  get inboxDisplayFiltersParams() {
    return this.displayFilters;
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
      const { results, total_results, ...paginationInfo } = await this.inboxIssueService.list(
        workspaceSlug,
        projectId,
        {
          ...params,
          per_page: this.PER_PAGE_COUNT,
        }
      );
      runInAction(() => {
        this.inboxIssues = mapValues(
          keyBy(results, "id"),
          (value) => new InboxIssueStore(workspaceSlug, projectId, value)
        );
        this.isLoading = false;
        this.inboxIssuePaginationInfo = { ...this.inboxIssuePaginationInfo, ...paginationInfo };
        this.totalIssues = total_results;
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

  fetchInboxIssuesByIssueId = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      runInAction(() => {
        this.isLoading = true;
      });
      const response = await this.inboxIssueService.retrieve(workspaceSlug, projectId, issueId);
      runInAction(() => {
        this.isLoading = false;
        this.inboxIssues[response.id] = new InboxIssueStore(workspaceSlug, projectId, response);
      });
      return response;
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
   * @description update display filters of a project
   * @param {string} projectId
   * @param {TInboxIssueDisplayFilters} displayFilters
   */
  updateDisplayFilters = (workspaceSlug: string, projectId: string, displayFilters: TInboxIssueDisplayFilters) => {
    runInAction(() => {
      this.displayFilters = displayFilters;
    });
    this.fetchInboxIssues(workspaceSlug, projectId, { ...this.inboxFiltersParams, ...this.inboxDisplayFiltersParams });
  };

  /**
   * update inbox issue status filters
   * @param projectId
   * @param key
   * @param value
   */
  updateInboxIssueStatusFilter = (workspaceSlug: string, projectId: string, value: TInboxIssueStatus) => {
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
    this.fetchInboxIssues(workspaceSlug, projectId, { ...this.inboxFiltersParams, ...this.inboxDisplayFiltersParams });
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
    this.fetchInboxIssues(workspaceSlug, projectId, { ...this.inboxFiltersParams, ...this.inboxDisplayFiltersParams });
  };

  /**
   * update inbox issue priority filters
   * @param projectId
   * @param key
   * @param value
   */
  updateInboxIssueAssigneeFilter = (workspaceSlug: string, projectId: string, value: string) => {
    runInAction(() => {
      const assigneeList = this.inboxFilters?.assignee ?? [];
      if (includes(assigneeList, value)) {
        pull(assigneeList, value);
      } else {
        assigneeList.push(value);
        this.inboxFilters = {
          ...this.inboxFilters,
          assignee: uniq(assigneeList),
        };
      }
    });
    this.fetchInboxIssues(workspaceSlug, projectId, { ...this.inboxFiltersParams, ...this.inboxDisplayFiltersParams });
  };

  updateInboxIssueCreatedByFilter = (workspaceSlug: string, projectId: string, value: string) => {
    runInAction(() => {
      const createdByList = this.inboxFilters?.created_by ?? [];
      if (includes(createdByList, value)) {
        pull(createdByList, value);
      } else {
        createdByList.push(value);
        this.inboxFilters = {
          ...this.inboxFilters,
          created_by: uniq(createdByList),
        };
      }
    });
    this.fetchInboxIssues(workspaceSlug, projectId, { ...this.inboxFiltersParams, ...this.inboxDisplayFiltersParams });
  };

  updateInboxIssueLabelFilter = (workspaceSlug: string, projectId: string, value: string) => {
    runInAction(() => {
      const labelList = this.inboxFilters?.label ?? [];
      if (includes(labelList, value)) {
        pull(labelList, value);
      } else {
        labelList.push(value);
        this.inboxFilters = {
          ...this.inboxFilters,
          label: uniq(labelList),
        };
      }
    });
    this.fetchInboxIssues(workspaceSlug, projectId, { ...this.inboxFiltersParams, ...this.inboxDisplayFiltersParams });
  };

  updateInboxIssueCreatedAtFilter = (workspaceSlug: string, projectId: string, value: string) => {
    runInAction(() => {
      // check if the value is already in the array
      const createdAtList = this.inboxFilters?.created_at ?? [];
      if (includes(createdAtList, value)) {
        pull(createdAtList, value);
      } else {
        createdAtList.push(value);
        this.inboxFilters = {
          ...this.inboxFilters,
          created_at: uniq(createdAtList),
        };
      }
    });
    this.fetchInboxIssues(workspaceSlug, projectId, { ...this.inboxFiltersParams, ...this.inboxDisplayFiltersParams });
  };

  updateInboxIssueUpdatedAtFilter = (workspaceSlug: string, projectId: string, value: string) => {
    runInAction(() => {
      // check if the value is already in the array
      const updatedAtList = this.inboxFilters?.updated_at ?? [];
      if (includes(updatedAtList, value)) {
        pull(updatedAtList, value);
      } else {
        updatedAtList.push(value);
        this.inboxFilters = {
          ...this.inboxFilters,
          updated_at: uniq(updatedAtList),
        };
      }
    });
    this.fetchInboxIssues(workspaceSlug, projectId, { ...this.inboxFiltersParams, ...this.inboxDisplayFiltersParams });
  };

  // /**
  //  * @description update filters of a project
  //  * @param {string} projectId
  //  * @param {TInboxIssueFilterOptions} filters
  //  */
  // updateFilters = (workspaceSlug: string, projectId: string, filters: TInboxIssueFilterOptions) => {
  //   runInAction(() => {
  //     Object.keys(filters).forEach((key) => {
  //       set(this.inboxFilters, [projectId, key], filters[key as keyof TInboxIssueFilterOptions]);
  //     });
  //   });
  //   this.fetchInboxIssues(workspaceSlug, projectId, { ...this.inboxFiltersParams, ...this.inboxDisplayFiltersParams });
  // };

  applyResolvedInboxIssueFilter = (workspaceSlug: string, projectId: string) => {
    runInAction(() => {
      const resolvedStatus = [-1, 0, 1, 2] as TInboxIssueStatus[];
      this.inboxFilters = {
        ...this.inboxFilters,
        inbox_status: uniq(resolvedStatus),
      };
    });
    this.fetchInboxIssues(workspaceSlug, projectId, { ...this.inboxFiltersParams, ...this.inboxDisplayFiltersParams });
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
