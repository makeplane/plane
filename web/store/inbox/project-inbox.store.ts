// import isArray from "lodash/isArray";
// import keyBy from "lodash/keyBy";
// import mapValues from "lodash/mapValues";
// import reduce from "lodash/reduce";
import concat from "lodash/concat";
import includes from "lodash/includes";
import pull from "lodash/pull";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, computed, makeObservable, observable } from "mobx";
// services
import { InboxIssueService } from "services/inbox";
// types
import { TInboxIssueFilter, TInboxIssueSorting, TInboxIssuesQueryParams, TPaginationInfo } from "@plane/types";
// root store
import { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";
import { RootStore } from "@/store/root.store";

export interface IProjectInboxStore {
  isLoading: boolean;
  inboxFilters: Partial<TInboxIssueFilter>;
  inboxSorting: Partial<TInboxIssueSorting>;
  inboxIssuePaginationInfo: TPaginationInfo | undefined;
  inboxIssues: Record<string, IInboxIssueStore>;
  // computed
  getInboxIssuesQueryParams: Partial<TInboxIssuesQueryParams> | undefined;
  inboxIssuesArray: IInboxIssueStore[];
  // actions
  handleInboxIssueFilters: <T extends keyof TInboxIssueFilter>(key: T, value: TInboxIssueFilter[T]) => void; // if user sends me undefined, I will remove the value from the filter key
  handleInboxIssueSorting: <T extends keyof TInboxIssueSorting>(key: T, value: TInboxIssueSorting[T]) => void; // if user sends me undefined, I will remove the value from the filter key
  // fetchInboxIssues: (workspaceSlug: string, projectId: string) => Promise<void>;
  // fetchInboxIssueById: (workspaceSlug: string, projectId: string, inboxIssueId: string) => Promise<void>;
  // createInboxIssue: (workspaceSlug: string, projectId: string, data: any) => Promise<void>;
  // deleteInboxIssue: (workspaceSlug: string, projectId: string, inboxIssueId: string) => Promise<void>;
}

export class ProjectInboxStore implements IProjectInboxStore {
  // constants
  PER_PAGE_COUNT = 10;
  // observables
  isLoading: boolean = false;
  inboxFilters: Partial<TInboxIssueFilter> = {};
  inboxSorting: Partial<TInboxIssueSorting> = {};
  inboxIssuePaginationInfo: TPaginationInfo | undefined = undefined;
  inboxIssues: Record<string, IInboxIssueStore> = {};
  // store
  rootStore;
  // services
  inboxIssueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      isLoading: observable.ref,
      inboxFilters: observable,
      inboxSorting: observable,
      inboxIssuePaginationInfo: observable,
      inboxIssues: observable,
      // computed
      getInboxIssuesQueryParams: computed,
      // inboxIssuesArray: computed,
      // getIssueInboxByIssueId: computed,
      // actions
      handleInboxIssueFilters: action,
      handleInboxIssueSorting: action,
      // fetchInboxIssues: action,
      // fetchInboxIssueById: action,
      // createInboxIssue: action,
      // deleteInboxIssue: action,
    });
    this.rootStore = _rootStore;
    this.inboxIssueService = new InboxIssueService();
  }

  get inboxIssuesArray() {
    return Object.values(this.inboxIssues || {});
  }

  // computed
  get getInboxIssuesQueryParams() {
    return undefined;
  }

  // actions
  handleInboxIssueFilters = <T extends keyof TInboxIssueFilter>(key: T, value: TInboxIssueFilter[T]) =>
    set(this.inboxFilters, key, value);

  handleInboxIssueSorting = <T extends keyof TInboxIssueSorting>(key: T, value: TInboxIssueSorting[T]) =>
    set(this.inboxSorting, key, value);

  /**
   * fetch inbox issues
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  // fetchInboxIssues = async (workspaceSlug: string, projectId: string, params = {}) => {
  //   try {
  //     runInAction(() => {
  //       this.isLoading = true;
  //       this.inboxIssues = {};
  //       this.inboxIssuePaginationInfo = undefined;
  //     });
  //     const { results, ...paginationInfo } = await this.inboxIssueService.list(workspaceSlug, projectId, {
  //       ...params,
  //       per_page: this.PER_PAGE_COUNT,
  //     });
  //     runInAction(() => {
  //       this.inboxIssues = mapValues(
  //         keyBy(results, "id"),
  //         (value) => new InboxIssueStore(workspaceSlug, projectId, value)
  //       );
  //       this.isLoading = false;
  //       this.inboxIssuePaginationInfo = { ...this.inboxIssuePaginationInfo, ...paginationInfo };
  //     });
  //     return results;
  //   } catch (error) {
  //     console.error("Error fetching the inbox issues", error);
  //     this.isLoading = false;
  //     throw error;
  //   }
  // };

  /**
   * fetch inbox issues next page
   * @param workspaceSlug
   * @param projectId
   */
  // fetchInboxIssuesNextPage = async (workspaceSlug: string, projectId: string) => {
  //   if (this.inboxIssuePaginationInfo?.next_cursor && this.inboxIssuePaginationInfo?.next_page_results) {
  //     runInAction(() => {
  //       this.isLoading = true;
  //     });
  //     const { results, ...paginationInfo } = await this.inboxIssueService.list(workspaceSlug, projectId, {
  //       ...this.inboxIssuePaginationInfo,
  //       cursor: this.inboxIssuePaginationInfo.next_cursor,
  //       per_page: this.PER_PAGE_COUNT,
  //     });
  //     runInAction(() => {
  //       this.inboxIssues = {
  //         ...this.inboxIssues,
  //         ...mapValues(keyBy(results, "id"), (value) => new InboxIssueStore(workspaceSlug, projectId, value)),
  //       };
  //       this.isLoading = false;
  //       this.inboxIssuePaginationInfo = {
  //         ...this.inboxIssuePaginationInfo,
  //         ...paginationInfo,
  //       };
  //     });
  //   }
  // };

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
