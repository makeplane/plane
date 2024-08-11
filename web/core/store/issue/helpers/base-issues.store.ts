import clone from "lodash/clone";
import concat from "lodash/concat";
import get from "lodash/get";
import indexOf from "lodash/indexOf";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import isNil from "lodash/isNil";
import orderBy from "lodash/orderBy";
import pull from "lodash/pull";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import {
  TIssue,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  TLoader,
  TIssuesResponse,
  TIssues,
  TIssuePaginationData,
  TBulkOperationsPayload,
  TIssueMap,
  IIssueFilterOptions,
  IIssueDisplayFilterOptions,
} from "@plane/types";
import { EIssueLayoutTypes, ISSUE_PRIORITIES } from "@/constants/issue";
import { convertToISODateString, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { CycleService } from "@/services/cycle.service";
import { IssueArchiveService, IssueDraftService, IssueService } from "@/services/issue";
import { ModuleService } from "@/services/module.service";
import { IIssueRootStore } from "../root.store";
import { getSortOrderToFilterEmptyValues } from "./base-issues-utils";
import { IBaseIssueFilterStore } from "./issue-filter-helper.store";
import { STATE_GROUPS } from "@/constants/state";
import { perfTestIssues } from "./test";
// constants
// helpers
// services

export type TIssueDisplayFilterOptions = Exclude<TIssueGroupByOptions, null> | "target_date";

export enum EIssueGroupedAction {
  ADD = "ADD",
  DELETE = "DELETE",
  REORDER = "REORDER",
}
export interface IBaseIssuesStore {
  // observable
  loader: TLoader;
  issueIds: string[] | undefined;
  groupedIssueIds: TIssues | undefined; // object to store Issue Ids based on group or subgroup

  //actions
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  // helper methods
  getIssueLoader(groupId?: string, subGroupId?: string): TLoader;

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
}

// This constant maps the group by keys to the respective issue property that the key relies on
const ISSUE_GROUP_BY_KEY: Record<TIssueDisplayFilterOptions, keyof TIssue> = {
  project: "project_id",
  state: "state_id",
  "state_detail.group": "state_id" as keyof TIssue, // state_detail.group is only being used for state_group display,
  priority: "priority",
  labels: "label_ids",
  created_by: "created_by",
  assignees: "assignee_ids",
  target_date: "target_date",
  cycle: "cycle_id",
  module: "module_ids",
};

export const ISSUE_FILTER_DEFAULT_DATA: Record<TIssueDisplayFilterOptions, keyof TIssue> = {
  project: "project_id",
  cycle: "cycle_id",
  module: "module_ids",
  state: "state_id",
  "state_detail.group": "state_group" as keyof TIssue, // state_detail.group is only being used for state_group display,
  priority: "priority",
  labels: "label_ids",
  created_by: "created_by",
  assignees: "assignee_ids",
  target_date: "target_date",
};

export const ISSUE_FILTER_MAP: Record<keyof IIssueFilterOptions, keyof TIssue> = {
  project: "project_id",
  cycle: "cycle_id",
  module: "module_ids",
  state: "state_id",
  state_group: "state_group" as keyof TIssue, // state_detail.group is only being used for state_group display,
  priority: "priority",
  labels: "label_ids",
  created_by: "created_by",
  assignees: "assignee_ids",
  target_date: "target_date",
  start_date: "start_date",
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
  estimate_point: "estimate_point",
  "-estimate_point": "estimate_point",
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
  loader: TLoader = undefined;
  issueIds: string[] | undefined = undefined;
  issuePaginationData: TIssuePaginationData = {};

  isArchived: boolean;

  // services
  issueService;
  issueArchiveService;
  issueDraftService;
  moduleService;
  cycleService;
  // root store
  rootIssueStore;
  issueFilterStore;
  // API Abort controller
  controller: AbortController;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IBaseIssueFilterStore, isArchived = false) {
    makeObservable(this, {
      // observable
      loader: observable,
      issueIds: observable,

      // computed
      moduleId: computed,
      cycleId: computed,
      currentLayout: computed,
      orderBy: computed,
      groupBy: computed,
      subGroupBy: computed,
      orderByKey: computed,
      groupedIssueIds: computed,
      issueGroupKey: computed,
      issueSubGroupKey: computed,
      // action

      onfetchIssues: action.bound,
      clear: action.bound,
      setLoader: action.bound,

      createIssue: action,
      issueUpdate: action,
      createDraftIssue: action,
      updateDraftIssue: action,
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

    this.issueService = new IssueService();
    this.issueArchiveService = new IssueArchiveService();
    this.issueDraftService = new IssueDraftService();
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
    if (!displayFilters) return "-created_at";

    if (displayFilters.layout === EIssueLayoutTypes.CALENDAR) return "target_date";

    return displayFilters?.order_by ?? "-created_at";
  }

  // current Group by value
  get groupBy() {
    const displayFilters = this.issueFilterStore?.issueFilters?.displayFilters;
    if (!displayFilters || !displayFilters?.layout) return;

    const layout = displayFilters?.layout;

    if (layout === EIssueLayoutTypes.CALENDAR) return "target_date";

    return [EIssueLayoutTypes.LIST, EIssueLayoutTypes.KANBAN]?.includes(layout) ? displayFilters?.group_by : undefined;
  }

  // current Sub group by value
  get subGroupBy() {
    const displayFilters = this.issueFilterStore?.issueFilters?.displayFilters;
    if (!displayFilters || displayFilters.group_by === displayFilters.sub_group_by) return;

    return displayFilters?.layout === EIssueLayoutTypes.KANBAN ? displayFilters?.sub_group_by : undefined;
  }

  get currentLayout() {
    const displayFilters = this.issueFilterStore?.issueFilters?.displayFilters;
    if (!displayFilters || !displayFilters.layout) return;

    return displayFilters?.layout;
  }

  get groupedIssueIds() {
    if (!this.issueIds) return;

    const startTime = performance.now();
    const currentIssues = this.rootIssueStore.issues.getIssuesByIds(this.issueIds, "un-archived");
    if (!currentIssues) return [];

    // const filteredIssues = this.issueFilterByValues(
    //   currentIssues,
    //   this.issueFilterStore?.issueFilters?.filters,
    //   this.issueFilterStore?.issueFilters?.displayFilters
    // );
    // if (!filteredIssues) return [];

    const sortedIssues = this.issuesSortWithOrderBy(currentIssues, this.orderBy);

    let issues: TIssues;

    if (this.currentLayout === EIssueLayoutTypes.LIST) {
      if (this.groupBy) issues = this.groupedIssues(this.groupBy, sortedIssues);
      else issues = sortedIssues.map((issue) => issue.id);
    } else if (this.currentLayout === EIssueLayoutTypes.KANBAN && this.groupBy) {
      if (this.subGroupBy) issues = this.subGroupedIssues(this.subGroupBy, this.groupBy, sortedIssues);
      else issues = this.groupedIssues(this.groupBy, sortedIssues);
    } else if (this.currentLayout === EIssueLayoutTypes.CALENDAR)
      issues = this.groupedIssues("target_date", sortedIssues, true);
    else if (this.currentLayout === EIssueLayoutTypes.SPREADSHEET) issues = sortedIssues.map((issue) => issue.id);
    else if (this.currentLayout === EIssueLayoutTypes.GANTT) issues = sortedIssues.map((issue) => issue.id);
    else return;

    console.log("### grouping issues Took, ", performance.now() - startTime, "ms");
    return issues;
  }

  // testPerformance() {
  //   const currentIssues = perfTestIssues as unknown as TIssue[];
  //   if (!currentIssues) return [];

  //   const startTimeFind = performance.now();
  //   const issue  = currentIssues.find((issueValue) => issueValue.id === "1a8fcff2-6694-4df3-b231-bdddb7e67ee6");
  //   console.log("finding an issue ", performance.now()- startTimeFind);

  //   const startTime = performance.now();
  //   const filteredIssues = this.issueFilterByValues(
  //     currentIssues,
  //     this.issueFilterStore?.issueFilters?.filters,
  //     this.issueFilterStore?.issueFilters?.displayFilters
  //   );

  //   const sortedIssues = this.issuesSortWithOrderBy(filteredIssues, this.orderBy);

  //   let issues: TIssues = [];

  //   if (this.currentLayout === EIssueLayoutTypes.LIST) {
  //     if (this.groupBy) issues = this.groupedIssues(this.groupBy, sortedIssues);
  //     else issues = sortedIssues.map((issue) => issue.id);
  //   } else if (this.currentLayout === EIssueLayoutTypes.KANBAN && this.groupBy) {
  //     if (this.subGroupBy) issues = this.subGroupedIssues(this.subGroupBy, this.groupBy, sortedIssues);
  //     else issues = this.groupedIssues(this.groupBy, sortedIssues);
  //   } else if (this.currentLayout === EIssueLayoutTypes.CALENDAR)
  //     issues = this.groupedIssues("target_date", sortedIssues, true);
  //   else if (this.currentLayout === EIssueLayoutTypes.SPREADSHEET) issues = sortedIssues.map((issue) => issue.id);
  //   else if (this.currentLayout === EIssueLayoutTypes.GANTT) issues = sortedIssues.map((issue) => issue.id);

  //   console.log("Total operations took ", performance.now() - startTime, "ms", issues);
  // }

  groupedIssues = (groupBy: TIssueDisplayFilterOptions, issues: TIssue[], isCalendarIssues: boolean = false) => {
    const currentIssues: { [group_id: string]: string[] } = {};
    if (!groupBy) return currentIssues;

    this.issueDisplayFiltersDefaultData(groupBy).forEach((group) => {
      currentIssues[group] = [];
    });

    for (const issue in issues) {
      const currentIssue = issues[issue];
      let groupArray = [];

      if (groupBy === "state_detail.group") {
        // if groupBy state_detail.group is coming from the project level the we are using stateDetails from root store else we are looping through the stateMap
        const state_group =
          (this.rootIssueStore?.rootStore?.state?.stateMap || {})?.[currentIssue?.state_id ?? ""]?.group || "None";
        groupArray = [state_group];
      } else {
        const groupValue = get(currentIssue, ISSUE_FILTER_DEFAULT_DATA[groupBy]) as
          | boolean
          | number
          | string
          | string[]
          | null;
        groupArray = groupValue !== undefined ? this.getGroupArray(groupValue, isCalendarIssues) : ["None"];
      }

      for (const group of groupArray) {
        if (group && currentIssues[group]) currentIssues[group].push(currentIssue.id);
        else if (group) currentIssues[group] = [currentIssue.id];
      }
    }

    return currentIssues;
  };

  subGroupedIssues = (
    subGroupBy: TIssueDisplayFilterOptions,
    groupBy: TIssueDisplayFilterOptions,
    issues: TIssue[]
  ) => {
    const currentIssues: { [sub_group_id: string]: { [group_id: string]: string[] } } = {};
    if (!subGroupBy || !groupBy) return currentIssues;

    this.issueDisplayFiltersDefaultData(subGroupBy).forEach((sub_group) => {
      const groupByIssues: { [group_id: string]: string[] } = {};
      this.issueDisplayFiltersDefaultData(groupBy).forEach((group) => {
        groupByIssues[group] = [];
      });
      currentIssues[sub_group] = groupByIssues;
    });

    for (const issue in issues) {
      const currentIssue = issues[issue];
      let subGroupArray = [];
      let groupArray = [];
      if (subGroupBy === "state_detail.group" || groupBy === "state_detail.group") {
        const state_group =
          (this.rootIssueStore?.rootStore?.state?.stateMap || {})?.[currentIssue?.state_id ?? ""]?.group || "None";

        subGroupArray = [state_group];
        groupArray = [state_group];
      } else {
        const subGroupValue = get(currentIssue, ISSUE_FILTER_DEFAULT_DATA[subGroupBy]) as
          | boolean
          | number
          | string
          | string[]
          | null;
        const groupValue = get(currentIssue, ISSUE_FILTER_DEFAULT_DATA[groupBy]) as
          | boolean
          | number
          | string
          | string[]
          | null;

        subGroupArray = subGroupValue != undefined ? this.getGroupArray(subGroupValue) : ["None"];
        groupArray = groupValue != undefined ? this.getGroupArray(groupValue) : ["None"];
      }

      for (const subGroup of subGroupArray) {
        for (const group of groupArray) {
          if (subGroup && group && currentIssues?.[subGroup]?.[group])
            currentIssues[subGroup][group].push(currentIssue.id);
          else if (subGroup && group && currentIssues[subGroup]) currentIssues[subGroup][group] = [currentIssue.id];
          else if (subGroup && group) currentIssues[subGroup] = { [group]: [currentIssue.id] };
        }
      }
    }

    return currentIssues;
  };

  issueDisplayFiltersDefaultData = (groupBy: string | null): string[] => {
    switch (groupBy) {
      case "state":
        return Object.keys(this.rootIssueStore?.rootStore?.state?.stateMap || {});
      case "state_detail.group":
        return Object.keys(STATE_GROUPS);
      case "priority":
        return ISSUE_PRIORITIES.map((i) => i.key);
      case "labels":
        return Object.keys(this.rootIssueStore?.rootStore?.label?.labelMap || {});
      case "created_by":
        return Object.keys(this.rootIssueStore?.rootStore?.memberRoot?.workspace?.workspaceMemberMap || {});
      case "assignees":
        return Object.keys(this.rootIssueStore?.rootStore?.memberRoot?.workspace?.workspaceMemberMap || {});
      case "project":
        return Object.keys(this.rootIssueStore?.rootStore?.projectRoot?.project?.projectMap || {});
      case "cycle":
        return Object.keys(this.rootIssueStore?.rootStore?.cycle?.cycleMap || {});
      case "module":
        return Object.keys(this.rootIssueStore?.rootStore?.module.moduleMap || {});
      default:
        return [];
    }
  };

  getGroupArray(value: boolean | number | string | string[] | null, isDate: boolean = false): string[] {
    if (!value || value === null || value === undefined) return ["None"];
    if (Array.isArray(value))
      if (value && value.length) return value;
      else return ["None"];
    else if (typeof value === "boolean") return [value ? "True" : "False"];
    else if (typeof value === "number") return [value.toString()];
    else if (isDate) return [renderFormattedPayloadDate(value) || "None"];
    else return [value || "None"];
  }

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
   * Sets the loader value of the particular groupId/subGroupId, or to ALL_ISSUES if both are undefined
   * @param loaderValue
   * @param groupId
   * @param subGroupId
   */
  setLoader(loaderValue: TLoader) {
    runInAction(() => {
      this.loader = loaderValue;
    });
  }

  /**
   * gets the Loader value of particular group/subgroup/ALL_ISSUES
   */
  getIssueLoader = () => this.loader;

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
  onfetchIssues(issueList: TIssue[]) {
    // The Issue list is added to the main Issue Map
    this.rootIssueStore.issues.addIssue(issueList, true);

    // Update all the GroupIds to this Store's groupedIssueIds and update Individual group issue counts
    runInAction(() => {
      set(
        this,
        "issueIds",
        issueList.map((issue) => issue.id)
      );
      this.loader = undefined;
    });
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
    try {
      // perform an API call
      const response = await this.issueService.createIssue(workspaceSlug, projectId, data);

      // add Issue to Store
      this.addIssue(response, shouldUpdateList);

      // If shouldUpdateList is true, call fetchParentStats
      shouldUpdateList && (await this.fetchParentStats(workspaceSlug, projectId));

      return response;
    } catch (error) {
      throw error;
    }
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
      throw error;
    }
  }

  /**
   * Similar to Create Issue but for creating Draft issues
   * @param workspaceSlug
   * @param projectId
   * @param data draft issue data
   * @returns
   */
  async createDraftIssue(workspaceSlug: string, projectId: string, data: Partial<TIssue>) {
    try {
      // call API to create a Draft issue
      const response = await this.issueDraftService.createDraftIssue(workspaceSlug, projectId, data);

      // call Fetch parent stats
      this.fetchParentStats(workspaceSlug, projectId);

      // Add issue to store
      this.addIssue(response);

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Similar to update issue but for draft issues.
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   * @param data Partial Issue Data to be updated
   */
  async updateDraftIssue(workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) {
    // Store Before state of the issue
    const issueBeforeUpdate = clone(this.rootIssueStore.issues.getIssueById(issueId));
    try {
      // Update the Respective Stores
      this.rootIssueStore.issues.updateIssue(issueId, data);

      // call API to update the issue
      await this.issueDraftService.updateDraftIssue(workspaceSlug, projectId, issueId, data);

      // call Fetch parent stats
      this.fetchParentStats(workspaceSlug, projectId);

      // If the issue is updated to not a draft issue anymore remove from the store list
      if (!isNil(data.is_draft) && !data.is_draft) this.removeIssueFromList(issueId);
    } catch (error) {
      // If errored out update store again to revert the change
      this.rootIssueStore.issues.updateIssue(issueId, issueBeforeUpdate ?? {});
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
    try {
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * This method is called to Archive an issue
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   */
  async issueArchive(workspaceSlug: string, projectId: string, issueId: string) {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Method to perform Quick add of issues
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns
   */
  async issueQuickAdd(workspaceSlug: string, projectId: string, data: TIssue) {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * This is a method to delete issues in bulk
   * @param workspaceSlug
   * @param projectId
   * @param issueIds
   * @returns
   */
  async removeBulkIssues(workspaceSlug: string, projectId: string, issueIds: string[]) {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk Archive issues
   * @param workspaceSlug
   * @param projectId
   * @param issueIds
   */
  bulkArchiveIssues = async (workspaceSlug: string, projectId: string, issueIds: string[]) => {
    try {
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
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description bulk update properties of selected issues
   * @param {TBulkOperationsPayload} data
   */
  bulkUpdateProperties = async (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => {
    const issueIds = data.issue_ids;
    try {
      // make request to update issue properties
      await this.issueService.bulkOperations(workspaceSlug, projectId, data);
      // update issues in the store
      runInAction(() => {
        issueIds.forEach((issueId) => {
          const issueBeforeUpdate = clone(this.rootIssueStore.issues.getIssueById(issueId));
          if (!issueBeforeUpdate) throw new Error("Issue not found");
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
        });
      });
    } catch (error) {
      throw error;
    }
  };

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
    try {
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * This method is used to remove issue from a cycle
   * @param workspaceSlug
   * @param projectId
   * @param cycleId
   * @param issueId
   */
  async removeIssueFromCycle(workspaceSlug: string, projectId: string, cycleId: string, issueId: string) {
    try {
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
    } catch (error) {
      throw error;
    }
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
    try {
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
    } catch (error) {
      throw error;
    }
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
    try {
      // Perform an APi call to remove issue to module
      const response = await this.moduleService.removeIssuesFromModuleBulk(
        workspaceSlug,
        projectId,
        moduleId,
        issueIds
      );

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
    } catch (error) {
      throw error;
    }
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
    try {
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
    } catch (error) {
      throw error;
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
    if (shouldUpdateList) this.issueIds;
  }

  /**
   * Method called to clear out the current store
   */
  clear() {
    runInAction(() => {
      this.issueIds = undefined;
    });
  }

  /**
   * Method called to add issue id to list.
   * This will only work if the issue already exists in the main issue map
   * @param issueId
   */
  addIssueToList(issueId: string) {
    update(this, "issueIds", (issueIds: string[] = []) => {
      return uniq([...issueIds, issueId]);
    });
  }

  /**
   * Method called to remove issue id from list.
   * This will only work if the issue already exists in the main issue map
   * @param issueId
   */
  removeIssueFromList(issueId: string) {
    update(this, "issueIds", (issueIds: string[] = []) => {
      return issueIds.filter((id) => id !== issueId);
    });
  }

  /**
   * This method processes the issueResponse to provide data that can be used to update the store
   * @param issueResponse
   * @returns  issueList, list of issue Data
   * @returns groupedIssues, grouped issue Ids
   * @returns groupedIssueCount, object containing issue counts of individual groups
   */
  processIssueResponse(issueResponse: TIssuesResponse): TIssue[] {
    const issueResult = issueResponse?.results;

    // if undefined return empty objects
    if (!issueResult) return [];

    //if is an array then it's an ungrouped response. return values with groupId as ALL_ISSUES
    if (Array.isArray(issueResult)) {
      return issueResult;
    }

    return [];
  }

  /**
   * This Method is used to get data of the issue based on the ids of the data for states, labels adn assignees
   * @param dataType what type of data is being sent
   * @param dataIds id/ids of the data that is to be populated
   * @param order ascending or descending for arrays of data
   * @returns string | string[] of sortable fields to be used for sorting
   */
  populateIssueDataForSorting(
    dataType: "state_id" | "label_ids" | "assignee_ids" | "module_ids" | "cycle_id",
    dataIds: string | string[] | null | undefined,
    order?: "asc" | "desc"
  ) {
    if (!dataIds) return;

    const dataValues: string[] = [];
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
    }

    return isDataIdsArray ? (order ? orderBy(dataValues, undefined, [order])[0] : dataValues) : dataValues[0];
  }

  issueFilterByValues = (
    issues: TIssue[],
    filters: IIssueFilterOptions | undefined,
    displayFilters: IIssueDisplayFilterOptions | undefined
  ) => {
    if (!filters || !displayFilters) return issues;

    return issues.filter((issue) => {
      const filterKeys = Object.keys(filters) as (keyof IIssueFilterOptions)[];

      for (const filterKey of filterKeys) {
        const filterIssueKey = ISSUE_FILTER_MAP[filterKey];

        const filterValue = filters[filterKey];
        const issueValue = issue[filterIssueKey] as string | string[] | null | undefined;

        if (!filterValue || filterValue.length <= 0) continue;

        if (!issueValue || this.shouldFilterOutIssue(issueValue, filterValue, filterKey)) return false;
      }

      if (!displayFilters.sub_issue && issue.parent) return false;

      return true;
    });
  };

  shouldFilterOutIssue(issueValue: string | string[], filterValue: string[], filterKey: keyof IIssueFilterOptions) {
    if (filterKey.endsWith("date")) {
    } else if (filterKey === "state_group" && !Array.isArray(issueValue)) {
      const issueStateGroup = this.rootIssueStore?.rootStore?.state?.stateMap?.[issueValue]?.group;

      if (!issueStateGroup || !filterValue.includes(issueStateGroup)) return true;
    } else {
      if (Array.isArray(issueValue)) {
        if (!filterValue.every((value: string) => issueValue.includes(value))) return true;
      } else if (!filterValue.includes(issueValue)) {
        return true;
      }
    }

    return false;
  }

  issuesSortWithOrderBy = (issues: TIssue[], key: TIssueOrderByOptions | undefined): TIssue[] => {
    const array = orderBy(issues, (issue) => convertToISODateString(issue["created_at"]), ["desc"]);

    switch (key) {
      case "sort_order":
        return orderBy(array, "sort_order");
      case "state__name":
        return orderBy(array, (issue) => this.populateIssueDataForSorting("state_id", issue?.["state_id"]));
      case "-state__name":
        return orderBy(array, (issue) => this.populateIssueDataForSorting("state_id", issue?.["state_id"]), ["desc"]);
      // dates
      case "created_at":
        return orderBy(array, (issue) => convertToISODateString(issue["created_at"]));
      case "-created_at":
        return orderBy(array, (issue) => convertToISODateString(issue["created_at"]), ["desc"]);
      case "updated_at":
        return orderBy(array, (issue) => convertToISODateString(issue["updated_at"]));
      case "-updated_at":
        return orderBy(array, (issue) => convertToISODateString(issue["updated_at"]), ["desc"]);
      case "start_date":
        return orderBy(array, [getSortOrderToFilterEmptyValues.bind(null, "start_date"), "start_date"]); //preferring sorting based on empty values to always keep the empty values below
      case "-start_date":
        return orderBy(
          array,
          [getSortOrderToFilterEmptyValues.bind(null, "start_date"), "start_date"], //preferring sorting based on empty values to always keep the empty values below
          ["asc", "desc"]
        );

      case "target_date":
        return orderBy(array, [getSortOrderToFilterEmptyValues.bind(null, "target_date"), "target_date"]); //preferring sorting based on empty values to always keep the empty values below
      case "-target_date":
        return orderBy(
          array,
          [getSortOrderToFilterEmptyValues.bind(null, "target_date"), "target_date"], //preferring sorting based on empty values to always keep the empty values below
          ["asc", "desc"]
        );

      // custom
      case "priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return orderBy(array, (currentIssue: TIssue) => indexOf(sortArray, currentIssue?.priority));
      }
      case "-priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return orderBy(array, (currentIssue: TIssue) => indexOf(sortArray, currentIssue?.priority), ["desc"]);
      }

      // number
      case "attachment_count":
        return orderBy(array, "attachment_count");
      case "-attachment_count":
        return orderBy(array, "attachment_count", ["desc"]);

      case "estimate_point":
        return orderBy(array, [getSortOrderToFilterEmptyValues.bind(null, "estimate_point"), "estimate_point"]); //preferring sorting based on empty values to always keep the empty values below
      case "-estimate_point":
        return orderBy(
          array,
          [getSortOrderToFilterEmptyValues.bind(null, "estimate_point"), "estimate_point"], //preferring sorting based on empty values to always keep the empty values below
          ["asc", "desc"]
        );

      case "link_count":
        return orderBy(array, "link_count");
      case "-link_count":
        return orderBy(array, "link_count", ["desc"]);

      case "sub_issues_count":
        return orderBy(array, "sub_issues_count");
      case "-sub_issues_count":
        return orderBy(array, "sub_issues_count", ["desc"]);

      // Array
      case "labels__name":
        return orderBy(array, [
          getSortOrderToFilterEmptyValues.bind(null, "label_ids"), //preferring sorting based on empty values to always keep the empty values below
          (issue) => this.populateIssueDataForSorting("label_ids", issue?.["label_ids"], "asc"),
        ]);
      case "-labels__name":
        return orderBy(
          array,
          [
            getSortOrderToFilterEmptyValues.bind(null, "label_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("label_ids", issue?.["label_ids"], "asc"),
          ],
          ["asc", "desc"]
        );

      case "issue_module__module__name":
        return orderBy(array, [
          getSortOrderToFilterEmptyValues.bind(null, "module_ids"), //preferring sorting based on empty values to always keep the empty values below
          (issue) => this.populateIssueDataForSorting("module_ids", issue?.["module_ids"], "asc"),
        ]);
      case "-issue_module__module__name":
        return orderBy(
          array,
          [
            getSortOrderToFilterEmptyValues.bind(null, "module_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("module_ids", issue?.["module_ids"], "asc"),
          ],
          ["asc", "desc"]
        );

      case "issue_cycle__cycle__name":
        return orderBy(array, [
          getSortOrderToFilterEmptyValues.bind(null, "cycle_id"), //preferring sorting based on empty values to always keep the empty values below
          (issue) => this.populateIssueDataForSorting("cycle_id", issue?.["cycle_id"], "asc"),
        ]);
      case "-issue_cycle__cycle__name":
        return orderBy(
          array,
          [
            getSortOrderToFilterEmptyValues.bind(null, "cycle_id"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("cycle_id", issue?.["cycle_id"], "asc"),
          ],
          ["asc", "desc"]
        );

      case "assignees__first_name":
        return orderBy(array, [
          getSortOrderToFilterEmptyValues.bind(null, "assignee_ids"), //preferring sorting based on empty values to always keep the empty values below
          (issue) => this.populateIssueDataForSorting("assignee_ids", issue?.["assignee_ids"], "asc"),
        ]);
      case "-assignees__first_name":
        return orderBy(
          array,
          [
            getSortOrderToFilterEmptyValues.bind(null, "assignee_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("assignee_ids", issue?.["assignee_ids"], "asc"),
          ],
          ["asc", "desc"]
        );

      default:
        return array;
    }
  };
}
