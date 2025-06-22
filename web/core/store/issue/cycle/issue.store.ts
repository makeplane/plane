// base class
// types
import concat from "lodash/concat";
import get from "lodash/get";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, observable, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
// plane constants
import { ALL_ISSUES } from "@plane/constants";
import {
  TIssue,
  TLoader,
  IssuePaginationOptions,
  TIssuesResponse,
  ViewFlags,
  TBulkOperationsPayload,
} from "@plane/types";
// helpers
import { getDistributionPathsPostUpdate } from "@plane/utils";
//local
import { storage } from "@/lib/local-storage";
import { persistence } from "@/local-db/storage.sqlite";
import { BaseIssuesStore, IBaseIssuesStore } from "../helpers/base-issues.store";
//
import { IIssueRootStore } from "../root.store";
import { ICycleIssuesFilter } from "./filter.store";

export const ACTIVE_CYCLE_ISSUES = "ACTIVE_CYCLE_ISSUES";

export interface ActiveCycleIssueDetails {
  issueIds: string[];
  issueCount: number;
  nextCursor: string;
  nextPageResults: boolean;
  perPageCount: number;
}

export interface ICycleIssues extends IBaseIssuesStore {
  viewFlags: ViewFlags;
  activeCycleIds: Record<string, ActiveCycleIssueDetails>;
  //action helpers
  getActiveCycleById: (cycleId: string) => ActiveCycleIssueDetails | undefined;
  // actions
  getIssueIds: (groupId?: string, subGroupId?: string) => string[] | undefined;
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    options: IssuePaginationOptions,
    cycleId: string
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    cycleId: string
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    groupId?: string,
    subGroupId?: string
  ) => Promise<TIssuesResponse | undefined>;

  fetchActiveCycleIssues: (
    workspaceSlug: string,
    projectId: string,
    perPageCount: number,
    cycleId: string
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextActiveCycleIssues: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string
  ) => Promise<TIssuesResponse | undefined>;

  createIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>, cycleId: string) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  quickAddIssue: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    cycleId: string
  ) => Promise<TIssue | undefined>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  archiveBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => Promise<void>;

  transferIssuesFromCycle: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    payload: {
      new_cycle_id: string;
    }
  ) => Promise<TIssue>;
}

export class CycleIssues extends BaseIssuesStore implements ICycleIssues {
  activeCycleIds: Record<string, ActiveCycleIssueDetails> = {};
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  // filter store
  issueFilterStore;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: ICycleIssuesFilter) {
    super(_rootStore, issueFilterStore);
    makeObservable(this, {
      // observable
      activeCycleIds: observable,
      // action
      fetchIssues: action,
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,

      transferIssuesFromCycle: action,
      fetchActiveCycleIssues: action,

      quickAddIssue: action,
    });
    // filter store
    this.issueFilterStore = issueFilterStore;
  }

  getActiveCycleById = computedFn((cycleId: string) => this.activeCycleIds[cycleId]);

  /**
   * Fetches the cycle details
   * @param workspaceSlug
   * @param projectId
   * @param id is the cycle Id
   */
  fetchParentStats = (workspaceSlug: string, projectId?: string | undefined, id?: string | undefined) => {
    const cycleId = id ?? this.cycleId;

    projectId && cycleId && this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);
    // fetch cycle progress
    const isSidebarCollapsed = storage.get("cycle_sidebar_collapsed");
    projectId &&
      cycleId &&
      this.rootIssueStore.rootStore.cycle.getCycleById(cycleId)?.version === 2 &&
      isSidebarCollapsed &&
      JSON.parse(isSidebarCollapsed) === false &&
      this.rootIssueStore.rootStore.cycle.fetchActiveCycleProgressPro(workspaceSlug, projectId, cycleId);
  };

  updateParentStats = (prevIssueState?: TIssue, nextIssueState?: TIssue, id?: string | undefined) => {
    try {
      const distributionUpdates = getDistributionPathsPostUpdate(
        prevIssueState,
        nextIssueState,
        this.rootIssueStore.rootStore.state.stateMap,
        this.rootIssueStore.rootStore.projectEstimate?.currentActiveEstimate?.estimatePointById
      );

      const cycleId = id ?? this.cycleId;

      cycleId && this.rootIssueStore.rootStore.cycle.updateCycleDistribution(distributionUpdates, cycleId);
    } catch (e) {
      console.warn("could not update cycle statistics");
    }
  };

  /**
   * This method is called to fetch the first issues of pagination
   * @param workspaceSlug
   * @param projectId
   * @param loadType
   * @param options
   * @param cycleId
   * @returns
   */
  fetchIssues = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    options: IssuePaginationOptions,
    cycleId: string,
    isExistingPaginationOptions: boolean = false
  ) => {
    try {
      // set loader and clear store
      runInAction(() => {
        this.setLoader(loadType);
        this.clear(!isExistingPaginationOptions, false); // clear while fetching from server.
        if (!this.groupBy) this.clear(!isExistingPaginationOptions, true); // clear while using local to have the no load effect.
      });

      // get params from pagination options
      const params = this.issueFilterStore?.getFilterParams(options, cycleId, undefined, undefined, undefined);
      // call the fetch issues API with the params
      const response = await this.issueService.getIssues(workspaceSlug, projectId, params, {
        signal: this.controller.signal,
      });

      // after fetching issues, call the base method to process the response further
      this.onfetchIssues(response, options, workspaceSlug, projectId, cycleId, !isExistingPaginationOptions);
      return response;
    } catch (error) {
      // set loader to undefined once errored out
      this.setLoader(undefined);
      throw error;
    }
  };

  /**
   * This method is called subsequent pages of pagination
   * if groupId/subgroupId is provided, only that specific group's next page is fetched
   * else all the groups' next page is fetched
   * @param workspaceSlug
   * @param projectId
   * @param cycleId
   * @param groupId
   * @param subGroupId
   * @returns
   */
  fetchNextIssues = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    groupId?: string,
    subGroupId?: string
  ) => {
    const cursorObject = this.getPaginationData(groupId, subGroupId);
    // if there are no pagination options and the next page results do not exist the return
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return;
    try {
      // set Loader
      this.setLoader("pagination", groupId, subGroupId);

      // get params from stored pagination options
      const params = this.issueFilterStore?.getFilterParams(
        this.paginationOptions,
        cycleId,
        this.getNextCursor(groupId, subGroupId),
        groupId,
        subGroupId
      );
      // call the fetch issues API with the params for next page in issues
      const response = await this.issueService.getIssues(workspaceSlug, projectId, params);

      // after the next page of issues are fetched, call the base method to process the response
      this.onfetchNexIssues(response, groupId, subGroupId);
      return response;
    } catch (error) {
      // set Loader as undefined if errored out
      this.setLoader(undefined, groupId, subGroupId);
      throw error;
    }
  };

  /**
   * This Method exists to fetch the first page of the issues with the existing stored pagination
   * This is useful for refetching when filters, groupBy, orderBy etc changes
   * @param workspaceSlug
   * @param projectId
   * @param loadType
   * @param cycleId
   * @returns
   */
  fetchIssuesWithExistingPagination = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    cycleId: string
  ) => {
    if (!this.paginationOptions) return;
    return await this.fetchIssues(workspaceSlug, projectId, loadType, this.paginationOptions, cycleId, true);
  };

  /**
   * Override inherited create issue, to also add issue to cycle
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @param cycleId
   * @returns
   */
  override createIssue = async (workspaceSlug: string, projectId: string, data: Partial<TIssue>, cycleId: string) => {
    const response = await super.createIssue(workspaceSlug, projectId, data, cycleId, false);
    await this.addIssueToCycle(workspaceSlug, projectId, cycleId, [response.id], false);
    return response;
  };

  /**
   * This method is used to transfer issues from completed cycles to a new cycle
   * @param workspaceSlug
   * @param projectId
   * @param cycleId
   * @param payload contains new cycle Id
   * @returns
   */
  transferIssuesFromCycle = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    payload: {
      new_cycle_id: string;
    }
  ) => {
    // call API call to transfer issues
    const response = await this.cycleService.transferIssues(
      workspaceSlug as string,
      projectId as string,
      cycleId as string,
      payload
    );
    // call fetch issues
    if (this.paginationOptions) {
      await persistence.syncIssues(projectId.toString());
      await this.fetchIssues(workspaceSlug, projectId, "mutation", this.paginationOptions, cycleId);
    }

    return response;
  };

  /**
   * This is Pagination for active cycle issues
   * This method is called to fetch the first page of issues pagination
   * @param workspaceSlug
   * @param projectId
   * @param perPageCount
   * @param cycleId
   * @returns
   */
  fetchActiveCycleIssues = async (workspaceSlug: string, projectId: string, perPageCount: number, cycleId: string) => {
    // set loader
    set(this.activeCycleIds, [cycleId], undefined);

    // set params for urgent and high
    const params = { priority: `urgent,high`, cursor: `${perPageCount}:0:0`, per_page: perPageCount };
    // call the fetch issues API
    const response = await this.cycleService.getCycleIssues(workspaceSlug, projectId, cycleId, params);

    // Process issue response
    const { issueList, groupedIssues } = this.processIssueResponse(response);

    // add issues to the main Issue Map
    this.rootIssueStore.issues.addIssue(issueList);
    const activeIssueIds = groupedIssues[ALL_ISSUES] as string[];

    // store the processed data in the current store
    set(this.activeCycleIds, [cycleId], {
      issueIds: activeIssueIds,
      issueCount: response.total_count,
      nextCursor: response.next_cursor,
      nextPageResults: response.next_page_results,
      perPageCount: perPageCount,
    });

    return response;
  };

  /**
   * This is Pagination for active cycle issues
   * This method is called subsequent pages of pagination
   * @param workspaceSlug
   * @param projectId
   * @param cycleId
   * @returns
   */
  fetchNextActiveCycleIssues = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    //get the previous pagination data for the cycle id
    const activeCycle = get(this.activeCycleIds, [cycleId]);

    // if there is no active cycle and the next pages does not exist return
    if (!activeCycle || !activeCycle.nextPageResults) return;

    // create params
    const params = { priority: `urgent,high`, cursor: activeCycle.nextCursor, per_page: activeCycle.perPageCount };
    // fetch API response
    const response = await this.cycleService.getCycleIssues(workspaceSlug, projectId, cycleId, params);

    // Process the response
    const { issueList, groupedIssues } = this.processIssueResponse(response);

    // add issues to main issue Map
    this.rootIssueStore.issues.addIssue(issueList);

    const activeIssueIds = groupedIssues[ALL_ISSUES] as string[];

    // store the processed data for subsequent pages
    set(this.activeCycleIds, [cycleId, "issueCount"], response.total_count);
    set(this.activeCycleIds, [cycleId, "nextCursor"], response.next_cursor);
    set(this.activeCycleIds, [cycleId, "nextPageResults"], response.next_page_results);
    set(this.activeCycleIds, [cycleId, "issueCount"], response.total_count);
    update(this.activeCycleIds, [cycleId, "issueIds"], (issueIds: string[] = []) =>
      this.issuesSortWithOrderBy(uniq(concat(issueIds, activeIssueIds)), this.orderBy)
    );

    return response;
  };

  /**
   * This Method overrides the base quickAdd issue
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @param cycleId
   * @returns
   */
  quickAddIssue = async (workspaceSlug: string, projectId: string, data: TIssue, cycleId: string) => {
    // add temporary issue to store list
    this.addIssue(data);

    // call overridden create issue
    const response = await this.createIssue(workspaceSlug, projectId, data, cycleId);

    // remove temp Issue from store list
    runInAction(() => {
      this.removeIssueFromList(data.id);
      this.rootIssueStore.issues.removeIssue(data.id);
    });

    const currentModuleIds =
      data.module_ids && data.module_ids.length > 0 ? data.module_ids.filter((moduleId) => moduleId != "None") : [];

    if (currentModuleIds.length > 0) {
      await this.changeModulesInIssue(workspaceSlug, projectId, response.id, currentModuleIds, []);
    }

    return response;
  };

  // Using aliased names as they cannot be overridden in other stores
  archiveBulkIssues = this.bulkArchiveIssues;
  updateIssue = this.issueUpdate;
  archiveIssue = this.issueArchive;
}
