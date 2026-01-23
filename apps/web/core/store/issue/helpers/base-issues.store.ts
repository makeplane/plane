import { isEqual, concat, get, indexOf, isEmpty, orderBy, pull, set, uniq, update, clone } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane constants
import { ALL_ISSUES, ISSUE_PRIORITIES } from "@plane/constants";
// types
import type {
  TIssue,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  TGroupedIssues,
  TSubGroupedIssues,
  TLoader,
  IssuePaginationOptions,
  TIssuesResponse,
  TIssues,
  TIssuePaginationData,
  TGroupedIssueCount,
  TPaginationData,
  TBulkOperationsPayload,
  IBlockUpdateDependencyData,
} from "@plane/types";
import { EIssueServiceType, EIssueLayoutTypes } from "@plane/types";
// helpers
import { convertToISODateString } from "@plane/utils";
// plane web imports
import { workItemSortWithOrderByExtended } from "@/plane-web/store/issue/helpers/base-issue.store";
// services
import { CycleService } from "@/services/cycle.service";
import { IssueArchiveService, IssueService } from "@/services/issue";
import { ModuleService } from "@/services/module.service";
//
import type { IIssueRootStore } from "../root.store";
import {
  getDifference,
  getGroupIssueKeyActions,
  getGroupKey,
  getIssueIds,
  getSortOrderToFilterEmptyValues,
  getSubGroupIssueKeyActions,
} from "./base-issues-utils";
import type { IBaseIssueFilterStore } from "./issue-filter-helper.store";

export type TIssueDisplayFilterOptions = Exclude<TIssueGroupByOptions, null> | "target_date";

export enum EIssueGroupedAction {
  ADD = "ADD",
  DELETE = "DELETE",
  REORDER = "REORDER",
}
export interface IBaseIssuesStore {
  // observable
  loader: Record<string, TLoader>;

  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | undefined; // object to store Issue Ids based on group or subgroup
  groupedIssueCount: TGroupedIssueCount; // map of groupId/subgroup and issue count of that particular group/subgroup
  issuePaginationData: TIssuePaginationData; // map of groupId/subgroup and pagination Data of that particular group/subgroup

  //actions
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  clear(shouldClearPaginationOptions?: boolean): void;
  // helper methods
  getIssueIds: (groupId?: string, subGroupId?: string) => string[] | undefined;
  issuesSortWithOrderBy(issueIds: string[], key: Partial<TIssueOrderByOptions>): string[];
  getPaginationData(groupId: string | undefined, subGroupId: string | undefined): TPaginationData | undefined;
  getIssueLoader(groupId?: string, subGroupId?: string): TLoader;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;

  addIssueToCycle: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    issueIds: string[],
    fetchAddedIssues?: boolean
  ) => Promise<void>;
  removeIssueFromCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  addCycleToIssue: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  removeCycleFromIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;

  addIssueToList: (issueId: string) => void;
  removeIssueFromList: (issueId: string) => void;
  addIssuesToModule: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueIds: string[],
    fetchAddedIssues?: boolean
  ) => Promise<void>;
  removeIssuesFromModule: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueIds: string[]
  ) => Promise<void>;
  changeModulesInIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    addModuleIds: string[],
    removeModuleIds: string[]
  ): Promise<void>;
  updateIssueDates(workspaceSlug: string, updates: IBlockUpdateDependencyData[], projectId?: string): Promise<void>;
}

// This constant maps the group by keys to the respective issue property that the key relies on
export const ISSUE_GROUP_BY_KEY: Record<TIssueDisplayFilterOptions, keyof TIssue> = {
  project: "project_id",
  state: "state_id",
  "state_detail.group": "state_id", // state_detail.group is only being used for state_group display,
  priority: "priority",
  labels: "label_ids",
  created_by: "created_by",
  assignees: "assignee_ids",
  target_date: "target_date",
  cycle: "cycle_id",
  module: "module_ids",
  team_project: "project_id",
};

export const ISSUE_FILTER_DEFAULT_DATA: Record<TIssueDisplayFilterOptions, keyof TIssue> = {
  project: "project_id",
  cycle: "cycle_id",
  module: "module_ids",
  state: "state_id",
  "state_detail.group": "state__group", // state_detail.group is only being used for state_group display,
  priority: "priority",
  labels: "label_ids",
  created_by: "created_by",
  assignees: "assignee_ids",
  target_date: "target_date",
  team_project: "project_id",
};

// This constant maps the order by keys to the respective issue property that the key relies on
const ISSUE_ORDERBY_KEY: Record<TIssueOrderByOptions, keyof TIssue> = {
  created_at: "created_at",
  "-created_at": "created_at",
  updated_at: "updated_at",
  "-updated_at": "updated_at",
  priority: "priority",
  "-priority": "priority",
  sort_order: "sort_order",
  state__name: "state_id",
  "-state__name": "state_id",
  assignees__first_name: "assignee_ids",
  "-assignees__first_name": "assignee_ids",
  labels__name: "label_ids",
  "-labels__name": "label_ids",
  issue_module__module__name: "module_ids",
  "-issue_module__module__name": "module_ids",
  issue_cycle__cycle__name: "cycle_id",
  "-issue_cycle__cycle__name": "cycle_id",
  target_date: "target_date",
  "-target_date": "target_date",
  estimate_point__key: "estimate_point",
  "-estimate_point__key": "estimate_point",
  start_date: "start_date",
  "-start_date": "start_date",
  link_count: "link_count",
  "-link_count": "link_count",
  attachment_count: "attachment_count",
  "-attachment_count": "attachment_count",
  sub_issues_count: "sub_issues_count",
  "-sub_issues_count": "sub_issues_count",
};

export abstract class BaseIssuesStore implements IBaseIssuesStore {
  loader: Record<string, TLoader> = {};
  groupedIssueIds: TIssues | undefined = undefined;
  issuePaginationData: TIssuePaginationData = {};

  groupedIssueCount: TGroupedIssueCount = {};
  //
  paginationOptions: IssuePaginationOptions | undefined = undefined;

  isArchived: boolean;

  // services
  issueService;
  issueArchiveService;
  moduleService;
  cycleService;
  // root store
  rootIssueStore;
  issueFilterStore;
  // API Abort controller
  controller: AbortController;

  constructor(
    _rootStore: IIssueRootStore,
    issueFilterStore: IBaseIssueFilterStore,
    isArchived = false,
    serviceType = EIssueServiceType.ISSUES
  ) {
    makeObservable(this, {
      // observable
      loader: observable,
      groupedIssueIds: observable,
      issuePaginationData: observable,
      groupedIssueCount: observable,

      paginationOptions: observable,
      // computed
      moduleId: computed,
      cycleId: computed,
      orderBy: computed,
      groupBy: computed,
      subGroupBy: computed,
      orderByKey: computed,
      issueGroupKey: computed,
      issueSubGroupKey: computed,
      // action
      storePreviousPaginationValues: action.bound,

      onfetchIssues: action.bound,
      onfetchNexIssues: action.bound,
      clear: action.bound,
      setLoader: action.bound,
      addIssue: action.bound,
      removeIssueFromList: action.bound,

      createIssue: action,
      issueUpdate: action,
      updateIssueDates: action,
      issueQuickAdd: action.bound,
      removeIssue: action.bound,
      issueArchive: action.bound,
      removeBulkIssues: action.bound,
      bulkArchiveIssues: action.bound,
      bulkUpdateProperties: action.bound,

      addIssueToCycle: action.bound,
      removeIssueFromCycle: action.bound,
      addCycleToIssue: action.bound,
      removeCycleFromIssue: action.bound,

      addIssuesToModule: action.bound,
      removeIssuesFromModule: action.bound,
      changeModulesInIssue: action.bound,
    });
    this.rootIssueStore = _rootStore;
    this.issueFilterStore = issueFilterStore;

    this.isArchived = isArchived;

    this.issueService = new IssueService(serviceType);
    this.issueArchiveService = new IssueArchiveService();
    this.moduleService = new ModuleService();
    this.cycleService = new CycleService();

    this.controller = new AbortController();
  }

  // Abstract class to be implemented to fetch parent stats such as project, module or cycle details
  abstract fetchParentStats: (workspaceSlug: string, projectId?: string, id?: string) => void;

  abstract updateParentStats: (prevIssueState?: TIssue, nextIssueState?: TIssue, id?: string) => void;

  // current Module Id from url
  get moduleId() {
    return this.rootIssueStore.moduleId;
  }

  // current Cycle Id from url
  get cycleId() {
    return this.rootIssueStore.cycleId;
  }

  // current Order by value
  get orderBy() {
    const displayFilters = this.issueFilterStore?.issueFilters?.displayFilters;
    if (!displayFilters) return;

    return displayFilters?.order_by;
  }

  // current Group by value
  get groupBy() {
    const displayFilters = this.issueFilterStore?.issueFilters?.displayFilters;
    if (!displayFilters || !displayFilters?.layout) return;

    const layout = displayFilters?.layout;

    return layout === EIssueLayoutTypes.CALENDAR
      ? "target_date"
      : [EIssueLayoutTypes.LIST, EIssueLayoutTypes.KANBAN]?.includes(layout)
        ? displayFilters?.group_by
        : undefined;
  }

  // current Sub group by value
  get subGroupBy() {
    const displayFilters = this.issueFilterStore?.issueFilters?.displayFilters;
    if (!displayFilters || displayFilters.group_by === displayFilters.sub_group_by) return;

    return displayFilters?.layout === "kanban" ? displayFilters?.sub_group_by : undefined;
  }

  getIssueIds = (groupId?: string, subGroupId?: string) => {
    const groupedIssueIds = this.groupedIssueIds;

    if (!groupedIssueIds) return undefined;

    const allIssues = groupedIssueIds[ALL_ISSUES] ?? [];
    if (!this.groupBy && !this.subGroupBy && allIssues && Array.isArray(allIssues)) {
      return allIssues;
    }

    if (this.groupBy && groupId && groupedIssueIds?.[groupId] && Array.isArray(groupedIssueIds[groupId])) {
      return groupedIssueIds[groupId] ?? [];
    }

    if (this.groupBy && this.subGroupBy && groupId && subGroupId) {
      return (groupedIssueIds as TSubGroupedIssues)[groupId]?.[subGroupId] ?? [];
    }

    return undefined;
  };

  // The Issue Property corresponding to the order by value
  get orderByKey() {
    const orderBy = this.orderBy;
    if (!orderBy) return;

    return ISSUE_ORDERBY_KEY[orderBy];
  }

  // The Issue Property corresponding to the group by value
  get issueGroupKey() {
    const groupBy = this.groupBy;

    if (!groupBy) return;

    return ISSUE_GROUP_BY_KEY[groupBy];
  }

  // The Issue Property corresponding to the sub group by value
  get issueSubGroupKey() {
    const subGroupBy = this.subGroupBy;

    if (!subGroupBy) return;

    return ISSUE_GROUP_BY_KEY[subGroupBy];
  }

  /**
   * Store the pagination data required for next subsequent issue pagination calls
   * @param prevCursor cursor value of previous page
   * @param nextCursor cursor value of next page
   * @param nextPageResults boolean to indicate if the next page results exist i.e, have we reached end of pages
   * @param groupId groupId and subGroupId to add the pagination data for the particular group/subgroup
   * @param subGroupId
   */
  setPaginationData(
    prevCursor: string,
    nextCursor: string,
    nextPageResults: boolean,
    groupId?: string,
    subGroupId?: string
  ) {
    const cursorObject = {
      prevCursor,
      nextCursor,
      nextPageResults,
    };

    set(this.issuePaginationData, [getGroupKey(groupId, subGroupId)], cursorObject);
  }

  /**
   * Sets the loader value of the particular groupId/subGroupId, or to ALL_ISSUES if both are undefined
   * @param loaderValue
   * @param groupId
   * @param subGroupId
   */
  setLoader(loaderValue: TLoader, groupId?: string, subGroupId?: string) {
    runInAction(() => {
      set(this.loader, getGroupKey(groupId, subGroupId), loaderValue);
    });
  }

  /**
   * gets the Loader value of particular group/subgroup/ALL_ISSUES
   */
  getIssueLoader = (groupId?: string, subGroupId?: string) => get(this.loader, getGroupKey(groupId, subGroupId));

  /**
   * gets the pagination data of particular group/subgroup/ALL_ISSUES
   */
  getPaginationData = computedFn(
    (groupId: string | undefined, subGroupId: string | undefined): TPaginationData | undefined =>
      get(this.issuePaginationData, [getGroupKey(groupId, subGroupId)])
  );

  /**
   * gets the issue count of particular group/subgroup/ALL_ISSUES
   *
   * if isSubGroupCumulative is true, sum up all the issueCount of the subGroupId, across all the groupIds
   */
  getGroupIssueCount = computedFn(
    (
      groupId: string | undefined,
      subGroupId: string | undefined,
      isSubGroupCumulative: boolean
    ): number | undefined => {
      if (isSubGroupCumulative && subGroupId) {
        const groupIssuesKeys = Object.keys(this.groupedIssueCount);
        let subGroupCumulativeCount = 0;

        for (const groupKey of groupIssuesKeys) {
          if (groupKey.includes(`_${subGroupId}`)) subGroupCumulativeCount += this.groupedIssueCount[groupKey];
        }

        return subGroupCumulativeCount;
      }

      return get(this.groupedIssueCount, [getGroupKey(groupId, subGroupId)]);
    }
  );

  /**
   * Gets the next page cursor based on number of issues currently available
   * @param groupId groupId for the cursor
   * @param subGroupId subgroupId for cursor
   * @returns next page cursor or undefined
   */
  getNextCursor = (groupId: string | undefined, subGroupId: string | undefined): string | undefined => {
    const groupedIssues = this.getIssueIds(groupId, subGroupId) ?? [];
    const currentIssueCount = groupedIssues.length;

    if (!this.paginationOptions) return;

    const { perPageCount } = this.paginationOptions;
    const nextPage = Math.floor(currentIssueCount / perPageCount);

    return `${perPageCount}:${nextPage}:0`;
  };

  /**
   * This Method is called after fetching the first paginated issues
   *
   * This method updates the appropriate issue list based on if groupByKey or subGroupByKey are defined
   * If both groupByKey and subGroupByKey are not defined, then the issue list are added to another group called ALL_ISSUES
   * @param issuesResponse  Paginated Response received from the API
   * @param options Pagination options
   * @param workspaceSlug
   * @param projectId
   * @param id Id can be anything from cycleId, moduleId, viewId or userId based on the store
   */
  onfetchIssues(
    issuesResponse: TIssuesResponse,
    options: IssuePaginationOptions,
    workspaceSlug: string,
    projectId?: string,
    id?: string,
    shouldClearPaginationOptions = true
  ) {
    // Process the Issue Response to get the following data from it
    const { issueList, groupedIssues, groupedIssueCount } = this.processIssueResponse(issuesResponse);

    // The Issue list is added to the main Issue Map
    this.rootIssueStore.issues.addIssue(issueList);

    // Update all the GroupIds to this Store's groupedIssueIds and update Individual group issue counts
    runInAction(() => {
      this.clear(shouldClearPaginationOptions);
      this.updateGroupedIssueIds(groupedIssues, groupedIssueCount);
      this.loader[getGroupKey()] = undefined;
    });

    // fetch parent stats if required, to be handled in the Implemented class
    this.fetchParentStats(workspaceSlug, projectId, id);

    this.rootIssueStore.issueDetail.relation.extractRelationsFromIssues(issueList);

    // store Pagination options for next subsequent calls and data like next cursor etc
    this.storePreviousPaginationValues(issuesResponse, options);
  }

  /**
   * This Method is called on the subsequent pagination calls after the first initial call
   *
   * This method updates the appropriate issue list based on if groupId or subgroupIds are Passed
   * @param issuesResponse Paginated Response received from the API
   * @param groupId
   * @param subGroupId
   */
  onfetchNexIssues(issuesResponse: TIssuesResponse, groupId?: string, subGroupId?: string) {
    // Process the Issue Response to get the following data from it
    const { issueList, groupedIssues, groupedIssueCount } = this.processIssueResponse(issuesResponse);

    // The Issue list is added to the main Issue Map
    this.rootIssueStore.issues.addIssue(issueList);

    // Update all the GroupIds to this Store's groupedIssueIds and update Individual group issue counts
    runInAction(() => {
      this.updateGroupedIssueIds(groupedIssues, groupedIssueCount, groupId, subGroupId);
      this.loader[getGroupKey(groupId, subGroupId)] = undefined;
    });

    this.rootIssueStore.issueDetail.relation.extractRelationsFromIssues(issueList);

    // store Pagination data like next cursor etc
    this.storePreviousPaginationValues(issuesResponse, undefined, groupId, subGroupId);
  }

  /**
   * Method to create Issue. This method updates the store and calls the API to create an issue
   * @param workspaceSlug
   * @param projectId
   * @param data Default Issue Data
   * @param id optional id like moduleId and cycleId, not used here but required in overridden the Module or cycle issues methods
   * @param shouldUpdateList If false, then it would not update the Issue Id list but only makes an API call and adds to the main Issue Map
   * @returns
   */
  async createIssue(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    id?: string,
    shouldUpdateList = true
  ) {
    // perform an API call
    const response = await this.issueService.createIssue(workspaceSlug, projectId, data);

    // add Issue to Store
    this.addIssue(response, shouldUpdateList);

    // If shouldUpdateList is true, call fetchParentStats
    shouldUpdateList && (await this.fetchParentStats(workspaceSlug, projectId));

    return response;
  }

  /**
   * Updates the Issue, by calling the API and also updating the store
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   * @param data Partial Issue Data to be updated
   * @param shouldSync If False then only issue is to be updated in the store not call API to update
   * @returns
   */
  async issueUpdate(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    shouldSync = true
  ) {
    // Store Before state of the issue
    const issueBeforeUpdate = clone(this.rootIssueStore.issues.getIssueById(issueId));
    try {
      // Update the Respective Stores
      this.rootIssueStore.issues.updateIssue(issueId, data);
      this.updateIssueList({ ...issueBeforeUpdate, ...data } as TIssue, issueBeforeUpdate);

      // Check if should Sync
      if (!shouldSync) return;

      // update parent stats optimistically
      this.updateParentStats(issueBeforeUpdate, {
        ...issueBeforeUpdate,
        ...data,
      } as TIssue);

      // call API to update the issue
      await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data);

      // call fetch Parent Stats
      this.fetchParentStats(workspaceSlug, projectId);
    } catch (error) {
      // If errored out update store again to revert the change
      this.rootIssueStore.issues.updateIssue(issueId, issueBeforeUpdate ?? {});
      this.updateIssueList(issueBeforeUpdate, { ...issueBeforeUpdate, ...data } as TIssue);
      throw error;
    }
  }

  /**
   * This method is called to delete an issue
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   */
  async removeIssue(workspaceSlug: string, projectId: string, issueId: string) {
    // Store Before state of the issue
    const issueBeforeRemoval = clone(this.rootIssueStore.issues.getIssueById(issueId));
    // update parent stats optimistically
    this.updateParentStats(issueBeforeRemoval, undefined);

    // Male API call
    await this.issueService.deleteIssue(workspaceSlug, projectId, issueId);
    // Remove from Respective issue Id list
    runInAction(() => {
      this.removeIssueFromList(issueId);
    });
    // call fetch Parent stats
    this.fetchParentStats(workspaceSlug, projectId);
    // Remove issue from main issue Map store
    this.rootIssueStore.issues.removeIssue(issueId);
  }

  /**
   * This method is called to Archive an issue
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   */
  async issueArchive(workspaceSlug: string, projectId: string, issueId: string) {
    const issueBeforeArchive = clone(this.rootIssueStore.issues.getIssueById(issueId));
    // update parent stats optimistically
    this.updateParentStats(issueBeforeArchive, undefined);
    // Male API call
    const response = await this.issueArchiveService.archiveIssue(workspaceSlug, projectId, issueId);
    // call fetch Parent stats
    this.fetchParentStats(workspaceSlug, projectId);
    runInAction(() => {
      // Update the Archived at of the issue from store
      this.rootIssueStore.issues.updateIssue(issueId, {
        archived_at: response.archived_at,
      });
      // Since Archived remove the issue Id from the current store
      this.removeIssueFromList(issueId);
    });
  }

  /**
   * Method to perform Quick add of issues
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns
   */
  async issueQuickAdd(workspaceSlug: string, projectId: string, data: TIssue) {
    // Add issue to store with a temporary Id
    this.addIssue(data);
    // call Create issue method
    const response = await this.createIssue(workspaceSlug, projectId, data);
    runInAction(() => {
      this.removeIssueFromList(data.id);
      this.rootIssueStore.issues.removeIssue(data.id);
    });
    const currentCycleId = data.cycle_id !== "" && data.cycle_id === "None" ? undefined : data.cycle_id;
    const currentModuleIds =
      data.module_ids && data.module_ids.length > 0 ? data.module_ids.filter((moduleId) => moduleId != "None") : [];
    const promiseRequests = [];
    if (currentCycleId) {
      promiseRequests.push(this.addCycleToIssue(workspaceSlug, projectId, currentCycleId, response.id));
    }
    if (currentModuleIds.length > 0) {
      promiseRequests.push(this.changeModulesInIssue(workspaceSlug, projectId, response.id, currentModuleIds, []));
    }
    if (promiseRequests && promiseRequests.length > 0) {
      await Promise.all(promiseRequests);
    }
    return response;
  }

  /**
   * This is a method to delete issues in bulk
   * @param workspaceSlug
   * @param projectId
   * @param issueIds
   * @returns
   */
  async removeBulkIssues(workspaceSlug: string, projectId: string, issueIds: string[]) {
    // Make API call to bulk delete issues
    const response = await this.issueService.bulkDeleteIssues(workspaceSlug, projectId, { issue_ids: issueIds });
    // call fetch parent stats
    this.fetchParentStats(workspaceSlug, projectId);
    // Remove issues from the store
    runInAction(() => {
      issueIds.forEach((issueId) => {
        this.removeIssueFromList(issueId);
        this.rootIssueStore.issues.removeIssue(issueId);
      });
    });
    return response;
  }

  /**
   * Bulk Archive issues
   * @param workspaceSlug
   * @param projectId
   * @param issueIds
   */
  bulkArchiveIssues = async (workspaceSlug: string, projectId: string, issueIds: string[]) => {
    const response = await this.issueService.bulkArchiveIssues(workspaceSlug, projectId, { issue_ids: issueIds });

    runInAction(() => {
      issueIds.forEach((issueId) => {
        this.issueUpdate(
          workspaceSlug,
          projectId,
          issueId,
          {
            archived_at: response.archived_at,
          },
          false
        );
        this.removeIssueFromList(issueId);
      });
    });
  };

  /**
   * @description bulk update properties of selected issues
   * @param {TBulkOperationsPayload} data
   */
  bulkUpdateProperties = async (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => {
    const issueIds = data.issue_ids;
    // make request to update issue properties
    await this.issueService.bulkOperations(workspaceSlug, projectId, data);
    // update issues in the store
    runInAction(() => {
      issueIds.forEach((issueId) => {
        const issueBeforeUpdate = clone(this.rootIssueStore.issues.getIssueById(issueId));
        if (!issueBeforeUpdate) throw new Error("Work item not found");
        Object.keys(data.properties).forEach((key) => {
          const property = key as keyof TBulkOperationsPayload["properties"];
          const propertyValue = data.properties[property];
          // update root issue map properties
          if (Array.isArray(propertyValue)) {
            // if property value is array, append it to the existing values
            const existingValue = issueBeforeUpdate[property];
            // convert existing value to an array
            const newExistingValue = Array.isArray(existingValue) ? existingValue : [];
            this.rootIssueStore.issues.updateIssue(issueId, {
              [property]: uniq([...newExistingValue, ...propertyValue]),
            });
          } else {
            // if property value is not an array, simply update the value
            this.rootIssueStore.issues.updateIssue(issueId, {
              [property]: propertyValue,
            });
          }
        });
        const issueDetails = this.rootIssueStore.issues.getIssueById(issueId);
        this.updateIssueList(issueDetails, issueBeforeUpdate);
      });
    });
  };

  async updateIssueDates(
    workspaceSlug: string,
    updates: { id: string; start_date?: string; target_date?: string }[],
    projectId?: string
  ) {
    if (!projectId) return;
    const issueDatesBeforeChange: { id: string; start_date?: string; target_date?: string }[] = [];
    try {
      const getIssueById = this.rootIssueStore.issues.getIssueById;
      runInAction(() => {
        for (const update of updates) {
          const dates: Partial<TIssue> = {};
          if (update.start_date) dates.start_date = update.start_date;
          if (update.target_date) dates.target_date = update.target_date;

          const currIssue = getIssueById(update.id);

          if (currIssue) {
            issueDatesBeforeChange.push({
              id: update.id,
              start_date: currIssue.start_date ?? undefined,
              target_date: currIssue.target_date ?? undefined,
            });
          }

          this.issueUpdate(workspaceSlug, projectId, update.id, dates, false);
        }
      });

      await this.issueService.updateIssueDates(workspaceSlug, projectId, updates);
    } catch (e) {
      runInAction(() => {
        for (const update of issueDatesBeforeChange) {
          const dates: Partial<TIssue> = {};
          if (update.start_date) dates.start_date = update.start_date;
          if (update.target_date) dates.target_date = update.target_date;

          this.issueUpdate(workspaceSlug, projectId, update.id, dates, false);
        }
      });
      console.error("error while updating Timeline dependencies");
      throw e;
    }
  }

  /**
   * This method is used to add issues to a particular Cycle
   * @param workspaceSlug
   * @param projectId
   * @param cycleId
   * @param issueIds
   * @param fetchAddedIssues If True we make an additional call to fetch all the issues from their Ids, Since the addIssueToCycle API does not return them
   */
  async addIssueToCycle(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    issueIds: string[],
    fetchAddedIssues = true
  ) {
    // Perform an APi call to add issue to cycle
    await this.issueService.addIssueToCycle(workspaceSlug, projectId, cycleId, {
      issues: issueIds,
    });

    // if cycle Id is the current Cycle Id then call fetch parent stats
    if (this.cycleId === cycleId) this.fetchParentStats(workspaceSlug, projectId);

    // if true, fetch the issue data for all the issueIds
    if (fetchAddedIssues) await this.rootIssueStore.issues.getIssues(workspaceSlug, projectId, issueIds);

    // Update issueIds from current store
    runInAction(() => {
      // If cycle Id is the current cycle Id, then, add issue to list of issueIds
      if (this.cycleId === cycleId) issueIds.forEach((issueId) => this.addIssueToList(issueId));
      // If cycle Id is not the current cycle Id, then, remove issue to list of issueIds
      else if (this.cycleId) issueIds.forEach((issueId) => this.removeIssueFromList(issueId));
    });

    // For Each issue update cycle Id by calling current store's update Issue, without making an API call
    issueIds.forEach((issueId) => {
      this.issueUpdate(workspaceSlug, projectId, issueId, { cycle_id: cycleId }, false);
    });
  }

  /**
   * This method is used to remove issue from a cycle
   * @param workspaceSlug
   * @param projectId
   * @param cycleId
   * @param issueId
   */
  async removeIssueFromCycle(workspaceSlug: string, projectId: string, cycleId: string, issueId: string) {
    const issueBeforeRemoval = clone(this.rootIssueStore.issues.getIssueById(issueId));

    // update parent stats optimistically
    if (this.cycleId === cycleId) this.updateParentStats(issueBeforeRemoval, undefined, cycleId);

    // Perform an APi call to remove issue from cycle
    await this.issueService.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);

    // if cycle Id is the current Cycle Id then call fetch parent stats
    if (this.cycleId === cycleId) this.fetchParentStats(workspaceSlug, projectId, cycleId);

    runInAction(() => {
      // If cycle Id is the current cycle Id, then, remove issue from list of issueIds
      this.cycleId === cycleId && this.removeIssueFromList(issueId);
    });

    // update Issue cycle Id to null by calling current store's update Issue, without making an API call
    this.issueUpdate(workspaceSlug, projectId, issueId, { cycle_id: null }, false);
  }

  /**
   * Adds cycle to issue optimistically
   * @param workspaceSlug
   * @param projectId
   * @param cycleId
   * @param issueId
   * @returns
   */
  addCycleToIssue = async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
    const issueCycleId = this.rootIssueStore.issues.getIssueById(issueId)?.cycle_id;

    if (issueCycleId === cycleId) return;

    const issueBeforeUpdate = clone(this.rootIssueStore.issues.getIssueById(issueId));

    try {
      // Update issueIds from current store
      runInAction(() => {
        // If cycle Id before update is the same as current cycle Id then, remove issueId from list
        if (this.cycleId === issueCycleId) this.removeIssueFromList(issueId);
        // If cycle Id is the current cycle Id, then, add issue to list of issueIds
        if (this.cycleId === cycleId) this.addIssueToList(issueId);
        // For Each issue update cycle Id by calling current store's update Issue, without making an API call
        this.issueUpdate(workspaceSlug, projectId, issueId, { cycle_id: cycleId }, false);
      });

      const issueAfterUpdate = clone(this.rootIssueStore.issues.getIssueById(issueId));

      // update parent stats optimistically
      if (this.cycleId === cycleId || this.cycleId === issueCycleId)
        this.updateParentStats(issueBeforeUpdate, issueAfterUpdate, this.cycleId);

      await this.issueService.addIssueToCycle(workspaceSlug, projectId, cycleId, {
        issues: [issueId],
      });

      // if cycle Id is the current Cycle Id then call fetch parent stats
      if (this.cycleId === cycleId || this.cycleId === issueCycleId)
        this.fetchParentStats(workspaceSlug, projectId, this.cycleId);
    } catch (error) {
      // remove the new issue ids from the cycle issues map
      runInAction(() => {
        // If cycle Id is the current cycle Id, then, remove issue to list of issueIds
        if (this.cycleId === cycleId) this.removeIssueFromList(issueId);
        // For Each issue update cycle Id to previous value by calling current store's update Issue, without making an API call
        this.issueUpdate(workspaceSlug, projectId, issueId, { cycle_id: issueCycleId }, false);
      });

      throw error;
    }
  };

  /*
   * Remove a cycle from issue
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   * @returns
   */
  removeCycleFromIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const issueBeforeRemoval = clone(this.rootIssueStore.issues.getIssueById(issueId));
    const issueCycleId = this.rootIssueStore.issues.getIssueById(issueId)?.cycle_id;
    if (!issueCycleId) return;
    try {
      // perform optimistic update, update store
      // Update issueIds from current store
      runInAction(() => {
        // If cycle Id is the current cycle Id, then, add issue to list of issueIds
        if (this.cycleId === issueCycleId) this.removeIssueFromList(issueId);
        // For Each issue update cycle Id by calling current store's update Issue, without making an API call
        this.issueUpdate(workspaceSlug, projectId, issueId, { cycle_id: null }, false);
      });

      // update parent stats optimistically
      if (this.cycleId === issueCycleId) this.updateParentStats(issueBeforeRemoval, undefined, issueCycleId);

      // make API call
      await this.issueService.removeIssueFromCycle(workspaceSlug, projectId, issueCycleId, issueId);

      // if cycle Id is the current Cycle Id then call fetch parent stats
      if (this.cycleId === issueCycleId) this.fetchParentStats(workspaceSlug, projectId, issueCycleId);
    } catch (error) {
      // revert back changes if fails
      // Update issueIds from current store
      runInAction(() => {
        // If cycle Id is the current cycle Id, then, add issue to list of issueIds
        if (this.cycleId === issueCycleId) this.addIssueToList(issueId);
        // For Each issue update cycle Id by calling current store's update Issue, without making an API call
        this.issueUpdate(workspaceSlug, projectId, issueId, { cycle_id: issueCycleId }, false);
      });

      throw error;
    }
  };

  /**
   * This method is used to add issues to a module
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @param issueIds
   * @param fetchAddedIssues If True we make an additional call to fetch all the issues from their Ids, Since the addIssuesToModule API does not return them
   */
  async addIssuesToModule(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueIds: string[],
    fetchAddedIssues = true
  ) {
    // Perform an APi call to add issue to module
    await this.moduleService.addIssuesToModule(workspaceSlug, projectId, moduleId, {
      issues: issueIds,
    });

    // if true, fetch the issue data for all the issueIds
    if (fetchAddedIssues) await this.rootIssueStore.issues.getIssues(workspaceSlug, projectId, issueIds);

    // if module Id is the current Module Id then call fetch parent stats
    if (this.moduleId === moduleId) this.fetchParentStats(workspaceSlug, projectId);

    runInAction(() => {
      // if module Id is the current Module Id, then, add issue to list of issueIds
      this.moduleId === moduleId && issueIds.forEach((issueId) => this.addIssueToList(issueId));
    });

    // For Each issue update module Ids by calling current store's update Issue, without making an API call
    issueIds.forEach((issueId) => {
      const issueModuleIds = get(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"]) ?? [];
      const updatedIssueModuleIds = uniq(concat(issueModuleIds, [moduleId]));
      this.issueUpdate(workspaceSlug, projectId, issueId, { module_ids: updatedIssueModuleIds }, false);
    });
  }

  /**
   * This method is used to remove issue from a module
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @param issueIds
   * @returns
   */
  async removeIssuesFromModule(workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) {
    // Perform an APi call to remove issue to module
    const response = await this.moduleService.removeIssuesFromModuleBulk(workspaceSlug, projectId, moduleId, issueIds);

    // if module Id is the current Module Id then call fetch parent stats
    if (this.moduleId === moduleId) this.fetchParentStats(workspaceSlug, projectId);

    runInAction(() => {
      // if module Id is the current Module Id, then remove issue from list of issueIds
      this.moduleId === moduleId && issueIds.forEach((issueId) => this.removeIssueFromList(issueId));
    });

    // For Each issue update module Ids by calling current store's update Issue, without making an API call
    runInAction(() => {
      issueIds.forEach((issueId) => {
        const issueModuleIds = get(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"]) ?? [];
        const updatedIssueModuleIds = pull(issueModuleIds, moduleId);
        this.issueUpdate(workspaceSlug, projectId, issueId, { module_ids: updatedIssueModuleIds }, false);
      });
    });

    return response;
  }

  /*
   * add Modules to Array in a non optimistic way while creating issues
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   * @param moduleIds array of modules to be added
   */
  async addModulesToIssue(workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) {
    // keep a copy of the original module ids
    const originalModuleIds = get(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"]) ?? [];
    //Perform API call
    await this.moduleService.addModulesToIssue(workspaceSlug, projectId, issueId, {
      modules: moduleIds,
      removed_modules: [],
    });

    runInAction(() => {
      // get current Module Ids of the issue
      let currentModuleIds = [...originalModuleIds];

      // If current Module Id is included in the modules list, then add Issue to List
      if (moduleIds.includes(this.moduleId ?? "")) this.addIssueToList(issueId);
      currentModuleIds = uniq(concat([...currentModuleIds], moduleIds));

      // For current Issue, update module Ids by calling current store's update Issue, without making an API call
      this.issueUpdate(workspaceSlug, projectId, issueId, { module_ids: currentModuleIds }, false);
    });

    if (moduleIds.includes(this.moduleId ?? "")) {
      this.fetchParentStats(workspaceSlug, projectId, this.moduleId);
    }
  }

  /*
   * change modules array in issue
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   * @param addModuleIds array of modules to be added
   * @param removeModuleIds array of modules to be removed
   */
  async changeModulesInIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    addModuleIds: string[],
    removeModuleIds: string[]
  ) {
    // keep a copy of the original module ids
    const issueBeforeChanges = clone(this.rootIssueStore.issues.getIssueById(issueId));
    const originalModuleIds = get(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"]) ?? [];
    try {
      runInAction(() => {
        // get current Module Ids of the issue
        let currentModuleIds = [...originalModuleIds];
        // remove the new issue id to the module issues
        removeModuleIds.forEach((moduleId) => {
          // If module Id is equal to current module Id, them remove Issue from List
          this.moduleId === moduleId && this.removeIssueFromList(issueId);
          currentModuleIds = pull(currentModuleIds, moduleId);
        });

        // If current Module Id is included in the modules list, then add Issue to List
        if (addModuleIds.includes(this.moduleId ?? "")) this.addIssueToList(issueId);
        currentModuleIds = uniq(concat([...currentModuleIds], addModuleIds));

        // For current Issue, update module Ids by calling current store's update Issue, without making an API call
        this.issueUpdate(workspaceSlug, projectId, issueId, { module_ids: currentModuleIds }, false);
      });

      const issueAfterChanges = clone(this.rootIssueStore.issues.getIssueById(issueId));

      // update parent stats optimistically
      if (addModuleIds.includes(this.moduleId || "") || removeModuleIds.includes(this.moduleId || "")) {
        this.updateParentStats(issueBeforeChanges, issueAfterChanges, this.moduleId);
      }

      //Perform API call
      await this.moduleService.addModulesToIssue(workspaceSlug, projectId, issueId, {
        modules: addModuleIds,
        removed_modules: removeModuleIds,
      });

      if (addModuleIds.includes(this.moduleId || "") || removeModuleIds.includes(this.moduleId || "")) {
        this.fetchParentStats(workspaceSlug, projectId);
      }
    } catch (error) {
      // revert the issue back to its original module ids
      runInAction(() => {
        // If current Module Id is included in the add modules list, then remove Issue from List
        if (addModuleIds.includes(this.moduleId ?? "")) this.removeIssueFromList(issueId);
        // If current Module Id is included in the removed modules list, then add Issue to List
        if (removeModuleIds.includes(this.moduleId ?? "")) this.addIssueToList(issueId);

        // For current Issue, update module Ids by calling current store's update Issue, without making an API call
        this.issueUpdate(workspaceSlug, projectId, issueId, { module_ids: originalModuleIds }, false);
      });

      throw error;
    }
  }

  /**
   * Add issue to the store
   * @param issue
   * @param shouldUpdateList indicates if the issue Id to be added to the list
   */
  addIssue(issue: TIssue, shouldUpdateList = true) {
    runInAction(() => {
      this.rootIssueStore.issues.addIssue([issue]);
    });

    // if true, add issue id to the list
    if (shouldUpdateList) this.updateIssueList(issue, undefined, EIssueGroupedAction.ADD);
  }

  /**
   * Method called to clear out the current store
   */
  clear(shouldClearPaginationOptions = true) {
    runInAction(() => {
      this.groupedIssueIds = undefined;
      this.issuePaginationData = {};
      this.groupedIssueCount = {};
      if (shouldClearPaginationOptions) {
        this.paginationOptions = undefined;
      }
    });
    this.controller.abort();
    this.controller = new AbortController();
  }

  /**
   * Method called to add issue id to list.
   * This will only work if the issue already exists in the main issue map
   * @param issueId
   */
  addIssueToList(issueId: string) {
    const issue = this.rootIssueStore.issues.getIssueById(issueId);
    this.updateIssueList(issue, undefined, EIssueGroupedAction.ADD);
  }

  /**
   * Method called to remove issue id from list.
   * This will only work if the issue already exists in the main issue map
   * @param issueId
   */
  removeIssueFromList(issueId: string) {
    const issue = this.rootIssueStore.issues.getIssueById(issueId);
    this.updateIssueList(undefined, issue, EIssueGroupedAction.DELETE);
  }

  /**
   * Method called to update the issue list,
   * If an action is passed, this method would add/remove the issue from list according to the action
   * If there is no action, this method compares before and after states of the issue to decide, where to remove the issue id from and where to add it to
   * if only issue is passed down then, the method determines where to add the issue Id and updates the list
   * @param issue current issue state
   * @param issueBeforeUpdate issue state before the update
   * @param action specific action can be provided to force the method to that action
   * @returns
   */
  updateIssueList(
    issue?: TIssue,
    issueBeforeUpdate?: TIssue,
    action?: EIssueGroupedAction.ADD | EIssueGroupedAction.DELETE
  ) {
    if (!issue && !issueBeforeUpdate) return;

    // get Issue ID from one of the issue objects
    const issueId = issue?.id ?? issueBeforeUpdate?.id;
    if (!issueId) return;

    // get issueUpdates from another method by passing down the three arguments
    // issueUpdates is nothing but an array of objects that contain the path of the issueId list that need updating and also the action that needs to be performed at the path
    const issueUpdates = this.getUpdateDetails(issue, issueBeforeUpdate, action);
    const accumulatedUpdatesForCount = {};
    runInAction(() => {
      // The issueUpdates
      for (const issueUpdate of issueUpdates) {
        //if update is add, add it at a particular path
        if (issueUpdate.action === EIssueGroupedAction.ADD) {
          // add issue Id at the path
          update(this, ["groupedIssueIds", ...issueUpdate.path], (issueIds: string[] = []) =>
            this.issuesSortWithOrderBy(uniq(concat(issueIds, issueId)), this.orderBy)
          );
        }

        //if update is delete, remove it at a particular path
        if (issueUpdate.action === EIssueGroupedAction.DELETE) {
          // remove issue Id from the path
          update(this, ["groupedIssueIds", ...issueUpdate.path], (issueIds: string[] = []) => pull(issueIds, issueId));
        }

        // accumulate the updates so that we don't end up updating the count twice for the same issue
        this.accumulateIssueUpdates(accumulatedUpdatesForCount, issueUpdate.path, issueUpdate.action);

        //if update is reorder, reorder it at a particular path
        if (issueUpdate.action === EIssueGroupedAction.REORDER) {
          // re-order/re-sort the issue Ids at the path
          update(this, ["groupedIssueIds", ...issueUpdate.path], (issueIds: string[] = []) =>
            this.issuesSortWithOrderBy(issueIds, this.orderBy)
          );
        }
      }

      // update the respective counts from the accumulation object
      this.updateIssueCount(accumulatedUpdatesForCount);
    });
  }

  /**
   * This method processes the issueResponse to provide data that can be used to update the store
   * @param issueResponse
   * @returns  issueList, list of issue Data
   * @returns groupedIssues, grouped issue Ids
   * @returns groupedIssueCount, object containing issue counts of individual groups
   */
  processIssueResponse(issueResponse: TIssuesResponse): {
    issueList: TIssue[];
    groupedIssues: TIssues;
    groupedIssueCount: TGroupedIssueCount;
  } {
    const issueResult = issueResponse?.results;

    // if undefined return empty objects
    if (!issueResult)
      return {
        issueList: [],
        groupedIssues: {},
        groupedIssueCount: {},
      };

    //if is an array then it's an ungrouped response. return values with groupId as ALL_ISSUES
    if (Array.isArray(issueResult)) {
      return {
        issueList: issueResult,
        groupedIssues: {
          [ALL_ISSUES]: issueResult.map((issue) => issue.id),
        },
        groupedIssueCount: {
          [ALL_ISSUES]: issueResponse.total_count,
        },
      };
    }

    const issueList: TIssue[] = [];
    const groupedIssues: TGroupedIssues | TSubGroupedIssues = {};
    const groupedIssueCount: TGroupedIssueCount = {};

    // update total issue count to ALL_ISSUES
    set(groupedIssueCount, [ALL_ISSUES], issueResponse.total_count);

    // loop through all the groupIds from issue Result
    for (const groupId in issueResult) {
      const groupIssuesObject = issueResult[groupId];
      const groupIssueResult = groupIssuesObject?.results;

      // if groupIssueResult is undefined then continue the loop
      if (!groupIssueResult) continue;

      // set grouped Issue count of the current groupId
      set(groupedIssueCount, [groupId], groupIssuesObject.total_results);

      // if groupIssueResult, the it is not subGrouped
      if (Array.isArray(groupIssueResult)) {
        // add the result to issueList
        issueList.push(...groupIssueResult);
        // set the issue Ids to the groupId path
        set(
          groupedIssues,
          [groupId],
          groupIssueResult.map((issue) => issue.id)
        );
        continue;
      }

      // loop through all the subGroupIds from issue Result
      for (const subGroupId in groupIssueResult) {
        const subGroupIssuesObject = groupIssueResult[subGroupId];
        const subGroupIssueResult = subGroupIssuesObject?.results;

        // if subGroupIssueResult is undefined then continue the loop
        if (!subGroupIssueResult) continue;

        // set sub grouped Issue count of the current groupId
        set(groupedIssueCount, [getGroupKey(groupId, subGroupId)], subGroupIssuesObject.total_results);

        if (Array.isArray(subGroupIssueResult)) {
          // add the result to issueList
          issueList.push(...subGroupIssueResult);
          // set the issue Ids to the [groupId, subGroupId] path
          set(
            groupedIssues,
            [groupId, subGroupId],
            subGroupIssueResult.map((issue) => issue.id)
          );

          continue;
        }
      }
    }

    return { issueList, groupedIssues, groupedIssueCount };
  }

  /**
   * This method is used to update the grouped issue Ids to it's respected lists and also to update group Issue Counts
   * @param groupedIssues Object that contains list of issueIds with respect to their groups/subgroups
   * @param groupedIssueCount Object the contains the issue count of each groups
   * @param groupId groupId string
   * @param subGroupId subGroupId string
   * @returns updates the store with the values
   */
  updateGroupedIssueIds(
    groupedIssues: TIssues,
    groupedIssueCount: TGroupedIssueCount,
    groupId?: string,
    subGroupId?: string
  ) {
    // if groupId exists and groupedIssues has ALL_ISSUES as a group,
    // then it's an individual group/subgroup pagination
    if (groupId && groupedIssues[ALL_ISSUES] && Array.isArray(groupedIssues[ALL_ISSUES])) {
      const issueGroup = groupedIssues[ALL_ISSUES];
      const issueGroupCount = groupedIssueCount[ALL_ISSUES];
      const issuesPath = [groupId];
      // issuesPath is the path for the issue List in the Grouped Issue List
      // issuePath is either [groupId] for grouped pagination or [groupId, subGroupId] for subGrouped pagination
      if (subGroupId) issuesPath.push(subGroupId);

      // update the issue Count of the particular group/subGroup
      set(this.groupedIssueCount, [getGroupKey(groupId, subGroupId)], issueGroupCount);

      // update the issue list in the issuePath
      this.updateIssueGroup(issueGroup, issuesPath);
      return;
    }

    // if not in the above condition the it's a complete grouped pagination not individual group/subgroup pagination
    // update total issue count as ALL_ISSUES count in `groupedIssueCount` object
    set(this.groupedIssueCount, [ALL_ISSUES], groupedIssueCount[ALL_ISSUES]);

    // loop through the groups of groupedIssues.
    for (const groupId in groupedIssues) {
      const issueGroup = groupedIssues[groupId];
      const issueGroupCount = groupedIssueCount[groupId];

      // update the groupId's issue count
      set(this.groupedIssueCount, [groupId], issueGroupCount);

      // This updates the group issue list in the store, if the issueGroup is a string
      const storeUpdated = this.updateIssueGroup(issueGroup, [groupId]);
      // if issueGroup is indeed a string, continue
      if (storeUpdated) continue;

      // if issueGroup is not a string, loop through the sub group Issues
      for (const subGroupId in issueGroup) {
        const issueSubGroup = (issueGroup as TGroupedIssues)[subGroupId];
        const issueSubGroupCount = groupedIssueCount[getGroupKey(groupId, subGroupId)];

        // update the subGroupId's issue count
        set(this.groupedIssueCount, [getGroupKey(groupId, subGroupId)], issueSubGroupCount);
        // This updates the subgroup issue list in the store
        this.updateIssueGroup(issueSubGroup, [groupId, subGroupId]);
      }
    }
  }

  /**
   * This Method is used to update the issue Id list at the particular issuePath
   * @param groupedIssueIds could be an issue Id List for grouped issues or an object that contains a issue Id list in case of subGrouped
   * @param issuePath array of string, to identify the path of the issueList to be updated with the above issue Id list
   * @returns a boolean that indicates if the groupedIssueIds is indeed a array Id list, in which case the issue Id list is added to the store at issuePath
   */
  updateIssueGroup(groupedIssueIds: TGroupedIssues | string[], issuePath: string[]): boolean {
    if (!groupedIssueIds) return true;

    // if groupedIssueIds is an array, update the `groupedIssueIds` store at the issuePath
    if (groupedIssueIds && Array.isArray(groupedIssueIds)) {
      update(this, ["groupedIssueIds", ...issuePath], (issueIds: string[] = []) =>
        this.issuesSortWithOrderBy(uniq(concat(issueIds, groupedIssueIds)), this.orderBy)
      );
      // return true to indicate the store has been updated
      return true;
    }

    // return false to indicate the store has been updated and the groupedIssueIds is likely Object for subGrouped Issues
    return false;
  }

  /**
   * For Every issue update, accumulate it so that when an single issue is added to two groups, it doesn't increment the total count twice
   * @param accumulator
   * @param path
   * @param action
   * @returns
   */
  accumulateIssueUpdates(
    accumulator: { [key: string]: EIssueGroupedAction },
    path: string[],
    action: EIssueGroupedAction
  ) {
    const [groupId, subGroupId] = path;

    if (action !== EIssueGroupedAction.ADD && action !== EIssueGroupedAction.DELETE) return;

    // if both groupId && subGroupId exists update the subgroup key
    if (subGroupId && groupId) {
      const groupKey = getGroupKey(groupId, subGroupId);
      this.updateUpdateAccumulator(accumulator, groupKey, action);
    }

    // after above, if groupId exists update the group key
    if (groupId) {
      this.updateUpdateAccumulator(accumulator, groupId, action);
    }

    // if groupId is not ALL_ISSUES then update the  All_ISSUES key
    // (if groupId is equal to ALL_ISSUES, it would have updated in the previous condition)
    if (groupId !== ALL_ISSUES) {
      this.updateUpdateAccumulator(accumulator, ALL_ISSUES, action);
    }
  }

  /**
   * This method's job is just to check and update the accumulator key
   * @param accumulator accumulator object
   * @param key object key like, subgroupKey, Group Key or ALL_ISSUES
   * @param action
   * @returns
   */
  updateUpdateAccumulator(
    accumulator: { [key: string]: EIssueGroupedAction },
    key: string,
    action: EIssueGroupedAction
  ) {
    // if the key for accumulator is undefined, they update it with the action
    if (!accumulator[key]) {
      accumulator[key] = action;
      return;
    }

    // if the key for accumulator is not the current action,
    // Meaning if the key already has an action ADD and the current one is REMOVE,
    // The key is deleted as both the actions cancel each other out
    if (accumulator[key] !== action) {
      delete accumulator[key];
    }
  }

  /**
   * This method is used to update the count of the issues at the path with the increment
   * @param path issuePath, corresponding key is to be incremented
   * @param increment
   */
  updateIssueCount(accumulatedUpdatesForCount: { [key: string]: EIssueGroupedAction }) {
    const updateKeys = Object.keys(accumulatedUpdatesForCount);
    for (const updateKey of updateKeys) {
      const update = accumulatedUpdatesForCount[updateKey];
      if (!update) continue;

      const increment = update === EIssueGroupedAction.ADD ? 1 : -1;
      // get current count at the key
      const issueCount = get(this.groupedIssueCount, updateKey) ?? 0;
      // update the count at the key
      set(this.groupedIssueCount, updateKey, issueCount + increment);
    }
  }

  /**
   * This method is used to get update Details that would be used to update the issue Ids at the path
   * @param issue current state of issue
   * @param issueBeforeUpdate state of the issue before the update
   * @param action optional action, to force the method to return back that action
   * @returns an array of object that contains the path at which issue to be updated and the action to be performed at the path
   */
  getUpdateDetails = (
    issue?: Partial<TIssue>,
    issueBeforeUpdate?: Partial<TIssue>,
    action?: EIssueGroupedAction.ADD | EIssueGroupedAction.DELETE
  ): { path: string[]; action: EIssueGroupedAction }[] => {
    // check the before and after states to return if there needs to be a re-sorting of issueId list if the issue property that orderBy  depends on has changed
    const orderByUpdates = this.getOrderByUpdateDetails(issue, issueBeforeUpdate);
    // if unGrouped, then return the path as ALL_ISSUES along with orderByUpdates
    if (!this.issueGroupKey) return action ? [{ path: [ALL_ISSUES], action }, ...orderByUpdates] : orderByUpdates;

    const issueGroupKeyValue = issue?.[this.issueGroupKey] as string | string[] | null | undefined;
    const issueBeforeUpdateGroupKey = issueBeforeUpdate?.[this.issueGroupKey] as string | string[] | null | undefined;
    // if grouped, the get the Difference between the two issue properties (this.issueGroupKey) on which groupBy is performed
    const groupActionsArray = getDifference(
      this.getArrayStringArray(issue, issueGroupKeyValue, this.groupBy),
      this.getArrayStringArray(issueBeforeUpdate, issueBeforeUpdateGroupKey, this.groupBy),
      action
    );

    // if not subGrouped, then use the differences to construct an updateDetails Array
    if (!this.issueSubGroupKey)
      return [
        ...getGroupIssueKeyActions(
          groupActionsArray[EIssueGroupedAction.ADD],
          groupActionsArray[EIssueGroupedAction.DELETE]
        ),
        ...orderByUpdates,
      ];

    const issueSubGroupKey = issue?.[this.issueSubGroupKey] as string | string[] | null | undefined;
    const issueBeforeUpdateSubGroupKey = issueBeforeUpdate?.[this.issueSubGroupKey] as
      | string
      | string[]
      | null
      | undefined;
    // if subGrouped, the get the Difference between the two issue properties (this.issueGroupKey) on which subGroupBy is performed
    const subGroupActionsArray = getDifference(
      this.getArrayStringArray(issue, issueSubGroupKey, this.subGroupBy),
      this.getArrayStringArray(issueBeforeUpdate, issueBeforeUpdateSubGroupKey, this.subGroupBy),
      action
    );

    // Use the differences to construct an updateDetails Array
    return [
      ...getSubGroupIssueKeyActions(
        groupActionsArray,
        subGroupActionsArray,
        this.getArrayStringArray(issueBeforeUpdate, issueBeforeUpdateGroupKey, this.groupBy),
        this.getArrayStringArray(issue, issueGroupKeyValue, this.groupBy),
        this.getArrayStringArray(issueBeforeUpdate, issueBeforeUpdateSubGroupKey, this.subGroupBy),
        this.getArrayStringArray(issue, issueSubGroupKey, this.subGroupBy)
      ),
      ...orderByUpdates,
    ];
  };

  /**
   * This method is used to get update Details that would be used to re-order/re-sort the issue Ids at the path
   * @param issue current state of issue
   * @param issueBeforeUpdate state of the issue before the update
   * @returns  an array of object that contains the path at which issue to be re-sorted/re-ordered
   */
  getOrderByUpdateDetails(
    issue: Partial<TIssue> | undefined,
    issueBeforeUpdate: Partial<TIssue> | undefined
  ): { path: string[]; action: EIssueGroupedAction.REORDER }[] {
    // if before and after states of the issue prop on which orderBy depends on then return and empty Array
    if (
      !issue ||
      !issueBeforeUpdate ||
      !this.orderByKey ||
      isEqual(issue[this.orderByKey], issueBeforeUpdate[this.orderByKey])
    )
      return [];

    // if they are not equal and issues are not grouped then, provide path as ALL_ISSUES
    if (!this.issueGroupKey) return [{ path: [ALL_ISSUES], action: EIssueGroupedAction.REORDER }];

    const issueGroupKey = issue?.[this.issueGroupKey] as string | string[] | null | undefined;
    // if they are grouped then identify the paths based on props on which group by is dependent on
    const issueKeyActions: { path: string[]; action: EIssueGroupedAction.REORDER }[] = [];
    const groupByValues = this.getArrayStringArray(issue, issueGroupKey);

    // if issues are not subGrouped then, provide path from groupByValues
    if (!this.issueSubGroupKey) {
      for (const groupKey of groupByValues) {
        issueKeyActions.push({ path: [groupKey], action: EIssueGroupedAction.REORDER });
      }

      return issueKeyActions;
    }

    const issueSubGroupKey = issue?.[this.issueSubGroupKey] as string | string[] | null | undefined;
    // if they are grouped then identify the paths based on props on which sub group by is dependent on
    const subGroupByValues = this.getArrayStringArray(issue, issueSubGroupKey);

    // if issues are subGrouped then, provide path from subGroupByValues
    for (const groupKey of groupByValues) {
      for (const subGroupKey of subGroupByValues) {
        issueKeyActions.push({ path: [groupKey, subGroupKey], action: EIssueGroupedAction.REORDER });
      }
    }

    return issueKeyActions;
  }

  // /**
  //  * Normalizes group values into a consistent string array format
  //  * @param issueObject - The issue object to extract values from
  //  * @param value - The raw value (string, array, or null/undefined)
  //  * @param groupByKey - The group by key to handle special cases
  //  * @returns Normalized array of string values
  //  */
  getArrayStringArray = (
    issueObject: Partial<TIssue> | undefined,
    value: string | string[] | undefined | null,
    groupByKey?: TIssueGroupByOptions
  ): string[] => {
    // if issue object is undefined return empty array
    if (!issueObject) return [];
    // if value is not defined, return None value in array
    if (!value || isEmpty(value)) return ["None"];
    // if array return the array
    if (Array.isArray(value)) return value;

    return this.getDefaultGroupValue(issueObject, value, groupByKey);
  };

  // /**
  //  * Gets the default value for a group when the primary value is empty
  //  * @param issueObject - The issue object to extract fallback values from
  //  * @param groupByKey - The group by key to determine fallback logic
  //  * @returns Default group value as string array
  //  */
  private getDefaultGroupValue = (
    issueObject: Partial<TIssue>,
    value: string,
    groupByKey?: TIssueGroupByOptions
  ): string[] => {
    // Handle special case for state group
    if (groupByKey === "state_detail.group") {
      return [this.rootIssueStore.rootStore.state.stateMap?.[value]?.group ?? issueObject.state__group];
    }

    return [value];
  };

  /**
   * This Method is used to get data of the issue based on the ids of the data for states, labels and assignees
   * @param dataType what type of data is being sent
   * @param dataIds id/ids of the data that is to be populated
   * @param order ascending or descending for arrays of data
   * @returns string | string[] of sortable fields to be used for sorting
   */
  populateIssueDataForSorting(
    dataType: "state_id" | "label_ids" | "assignee_ids" | "module_ids" | "cycle_id" | "estimate_point",
    dataIds: string | string[] | null | undefined,
    projectId: string | undefined | null,
    order?: "asc" | "desc"
  ) {
    if (!dataIds) return;

    const dataValues: (string | number)[] = [];
    const isDataIdsArray = Array.isArray(dataIds);
    const dataIdsArray = isDataIdsArray ? dataIds : [dataIds];

    switch (dataType) {
      case "state_id": {
        const stateMap = this.rootIssueStore?.stateMap;
        if (!stateMap) break;
        for (const dataId of dataIdsArray) {
          const state = stateMap[dataId];
          if (state && state.name) dataValues.push(state.name.toLocaleLowerCase());
        }
        break;
      }
      case "label_ids": {
        const labelMap = this.rootIssueStore?.labelMap;
        if (!labelMap) break;
        for (const dataId of dataIdsArray) {
          const label = labelMap[dataId];
          if (label && label.name) dataValues.push(label.name.toLocaleLowerCase());
        }
        break;
      }
      case "assignee_ids": {
        const memberMap = this.rootIssueStore?.memberMap;
        if (!memberMap) break;
        for (const dataId of dataIdsArray) {
          const member = memberMap[dataId];
          if (member && member.first_name) dataValues.push(member.first_name.toLocaleLowerCase());
        }
        break;
      }
      case "module_ids": {
        const moduleMap = this.rootIssueStore?.moduleMap;
        if (!moduleMap) break;
        for (const dataId of dataIdsArray) {
          const currentModule = moduleMap[dataId];
          if (currentModule && currentModule.name) dataValues.push(currentModule.name.toLocaleLowerCase());
        }
        break;
      }
      case "cycle_id": {
        const cycleMap = this.rootIssueStore?.cycleMap;
        if (!cycleMap) break;
        for (const dataId of dataIdsArray) {
          const cycle = cycleMap[dataId];
          if (cycle && cycle.name) dataValues.push(cycle.name.toLocaleLowerCase());
        }
        break;
      }
      case "estimate_point": {
        // return if project Id does not exist
        if (!projectId) break;
        // get the estimate ID for the current Project
        const currentProjectEstimateId =
          this.rootIssueStore.rootStore.projectEstimate.currentActiveEstimateIdByProjectId(projectId);
        // return if current Estimate Id for the project is not available
        if (!currentProjectEstimateId) break;
        // get Estimate based on Id
        const estimate = this.rootIssueStore.rootStore.projectEstimate.estimateById(currentProjectEstimateId);
        // If Estimate is not available, then return
        if (!estimate) break;
        // Get Estimate Value
        const estimateKey = estimate?.estimatePointById(dataIds as string)?.key;

        // If Value string i not available or empty then return
        if (estimateKey === undefined) break;

        dataValues.push(estimateKey);
      }
    }

    return isDataIdsArray ? (order ? orderBy(dataValues, undefined, [order]) : dataValues) : dataValues;
  }

  issuesSortWithOrderBy = (issueIds: string[], key: TIssueOrderByOptions | undefined): string[] => {
    const issues = this.rootIssueStore.issues.getIssuesByIds(issueIds, this.isArchived ? "archived" : "un-archived");
    const array = orderBy(issues, (issue) => convertToISODateString(issue["created_at"]), ["desc"]);

    switch (key) {
      case "sort_order":
        return getIssueIds(orderBy(array, "sort_order"));
      case "state__name":
        return getIssueIds(
          orderBy(array, (issue) =>
            this.populateIssueDataForSorting("state_id", issue?.["state_id"], issue?.["project_id"])
          )
        );
      case "-state__name":
        return getIssueIds(
          orderBy(
            array,
            (issue) => this.populateIssueDataForSorting("state_id", issue?.["state_id"], issue?.["project_id"]),
            ["desc"]
          )
        );
      // dates
      case "created_at":
        return getIssueIds(orderBy(array, (issue) => convertToISODateString(issue["created_at"])));
      case "-created_at":
        return getIssueIds(orderBy(array, (issue) => convertToISODateString(issue["created_at"]), ["desc"]));
      case "updated_at":
        return getIssueIds(orderBy(array, (issue) => convertToISODateString(issue["updated_at"])));
      case "-updated_at":
        return getIssueIds(orderBy(array, (issue) => convertToISODateString(issue["updated_at"]), ["desc"]));
      case "start_date":
        return getIssueIds(orderBy(array, [getSortOrderToFilterEmptyValues.bind(null, "start_date"), "start_date"])); //preferring sorting based on empty values to always keep the empty values below
      case "-start_date":
        return getIssueIds(
          orderBy(
            array,
            [getSortOrderToFilterEmptyValues.bind(null, "start_date"), "start_date"], //preferring sorting based on empty values to always keep the empty values below
            ["asc", "desc"]
          )
        );

      case "target_date":
        return getIssueIds(orderBy(array, [getSortOrderToFilterEmptyValues.bind(null, "target_date"), "target_date"])); //preferring sorting based on empty values to always keep the empty values below
      case "-target_date":
        return getIssueIds(
          orderBy(
            array,
            [getSortOrderToFilterEmptyValues.bind(null, "target_date"), "target_date"], //preferring sorting based on empty values to always keep the empty values below
            ["asc", "desc"]
          )
        );

      // custom
      case "-priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return getIssueIds(orderBy(array, (currentIssue: TIssue) => indexOf(sortArray, currentIssue?.priority)));
      }
      case "priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return getIssueIds(
          orderBy(array, (currentIssue: TIssue) => indexOf(sortArray, currentIssue?.priority), ["desc"])
        );
      }

      // number
      case "attachment_count":
        return getIssueIds(orderBy(array, "attachment_count"));
      case "-attachment_count":
        return getIssueIds(orderBy(array, "attachment_count", ["desc"]));

      case "estimate_point__key":
        return getIssueIds(
          orderBy(array, [
            getSortOrderToFilterEmptyValues.bind(null, "estimate_point"),
            (issue) =>
              this.populateIssueDataForSorting("estimate_point", issue?.["estimate_point"], issue?.["project_id"]),
          ])
        ); //preferring sorting based on empty values to always keep the empty values below
      case "-estimate_point__key":
        return getIssueIds(
          orderBy(
            array,
            [
              getSortOrderToFilterEmptyValues.bind(null, "estimate_point"),
              (issue) =>
                this.populateIssueDataForSorting("estimate_point", issue?.["estimate_point"], issue?.["project_id"]),
            ], //preferring sorting based on empty values to always keep the empty values below
            ["asc", "desc"]
          )
        );

      case "link_count":
        return getIssueIds(orderBy(array, "link_count"));
      case "-link_count":
        return getIssueIds(orderBy(array, "link_count", ["desc"]));

      case "sub_issues_count":
        return getIssueIds(orderBy(array, "sub_issues_count"));
      case "-sub_issues_count":
        return getIssueIds(orderBy(array, "sub_issues_count", ["desc"]));

      // Array
      case "labels__name":
        return getIssueIds(
          orderBy(array, [
            getSortOrderToFilterEmptyValues.bind(null, "label_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) =>
              this.populateIssueDataForSorting("label_ids", issue?.["label_ids"], issue?.["project_id"], "asc"),
          ])
        );
      case "-labels__name":
        return getIssueIds(
          orderBy(
            array,
            [
              getSortOrderToFilterEmptyValues.bind(null, "label_ids"), //preferring sorting based on empty values to always keep the empty values below
              (issue) =>
                this.populateIssueDataForSorting("label_ids", issue?.["label_ids"], issue?.["project_id"], "asc"),
            ],
            ["asc", "desc"]
          )
        );

      case "issue_module__module__name":
        return getIssueIds(
          orderBy(array, [
            getSortOrderToFilterEmptyValues.bind(null, "module_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) =>
              this.populateIssueDataForSorting("module_ids", issue?.["module_ids"], issue?.["project_id"], "asc"),
          ])
        );
      case "-issue_module__module__name":
        return getIssueIds(
          orderBy(
            array,
            [
              getSortOrderToFilterEmptyValues.bind(null, "module_ids"), //preferring sorting based on empty values to always keep the empty values below
              (issue) =>
                this.populateIssueDataForSorting("module_ids", issue?.["module_ids"], issue?.["project_id"], "asc"),
            ],
            ["asc", "desc"]
          )
        );

      case "issue_cycle__cycle__name":
        return getIssueIds(
          orderBy(array, [
            getSortOrderToFilterEmptyValues.bind(null, "cycle_id"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("cycle_id", issue?.["cycle_id"], issue?.["project_id"], "asc"),
          ])
        );
      case "-issue_cycle__cycle__name":
        return getIssueIds(
          orderBy(
            array,
            [
              getSortOrderToFilterEmptyValues.bind(null, "cycle_id"), //preferring sorting based on empty values to always keep the empty values below
              (issue) =>
                this.populateIssueDataForSorting("cycle_id", issue?.["cycle_id"], issue?.["project_id"], "asc"),
            ],
            ["asc", "desc"]
          )
        );

      case "assignees__first_name":
        return getIssueIds(
          orderBy(array, [
            getSortOrderToFilterEmptyValues.bind(null, "assignee_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) =>
              this.populateIssueDataForSorting("assignee_ids", issue?.["assignee_ids"], issue?.["project_id"], "asc"),
          ])
        );
      case "-assignees__first_name":
        return getIssueIds(
          orderBy(
            array,
            [
              getSortOrderToFilterEmptyValues.bind(null, "assignee_ids"), //preferring sorting based on empty values to always keep the empty values below
              (issue) =>
                this.populateIssueDataForSorting("assignee_ids", issue?.["assignee_ids"], issue?.["project_id"], "asc"),
            ],
            ["asc", "desc"]
          )
        );

      default:
        return workItemSortWithOrderByExtended(array, key);
    }
  };

  /**
   * This Method is called to store the pagination options and paginated data from response
   * @param issuesResponse issue list response
   * @param options pagination options to be stored for next page call
   * @param groupId
   * @param subGroupId
   */
  storePreviousPaginationValues = (
    issuesResponse: TIssuesResponse,
    options?: IssuePaginationOptions,
    groupId?: string,
    subGroupId?: string
  ) => {
    if (options) this.paginationOptions = options;

    this.setPaginationData(
      issuesResponse.prev_cursor,
      issuesResponse.next_cursor,
      issuesResponse.next_page_results,
      groupId,
      subGroupId
    );
  };
}
