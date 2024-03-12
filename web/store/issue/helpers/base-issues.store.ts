import { action, computed, makeObservable, observable, runInAction } from "mobx";
import update from "lodash/update";
import uniq from "lodash/uniq";
import concat from "lodash/concat";
import pull from "lodash/pull";
import orderBy from "lodash/orderBy";
import get from "lodash/get";
import indexOf from "lodash/indexOf";
import isEmpty from "lodash/isEmpty";
import values from "lodash/values";
// types
import {
  TIssue,
  TIssueMap,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  TGroupedIssues,
  TSubGroupedIssues,
  TUnGroupedIssues,
  TLoader,
  IssuePaginationOptions,
  TIssuesResponse,
} from "@plane/types";
import { IIssueRootStore } from "../root.store";
import { IBaseIssueFilterStore } from "./issue-filter-helper.store";
// constants
import { ISSUE_PRIORITIES } from "constants/issue";
import { STATE_GROUPS } from "constants/state";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// services
import { IssueArchiveService, IssueDraftService, IssueService } from "services/issue";

export type TIssueDisplayFilterOptions = Exclude<TIssueGroupByOptions, null> | "target_date";

export interface IBaseIssuesStore {
  // observable
  loader: TLoader;

  issues: string[] | undefined;

  nextCursor: string | undefined;
  prevCursor: string | undefined;
  issueCount: number | undefined;
  pageCount: number | undefined;

  groupedIssueCount: Record<string, number> | undefined;

  // computed
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;

  //actions
  removeIssue(workspaceSlug: string, projectId: string, issueId: string): Promise<void>;
  // helper methods
  groupedIssues(
    groupBy: TIssueDisplayFilterOptions,
    orderBy: TIssueOrderByOptions,
    issues: TIssueMap,
    groupedIssueCount: Record<string, number>,
    isCalendarIssues?: boolean
  ): TGroupedIssues;
  subGroupedIssues(
    subGroupBy: TIssueDisplayFilterOptions,
    groupBy: TIssueDisplayFilterOptions,
    orderBy: TIssueOrderByOptions,
    issues: TIssueMap,
    groupedIssueCount: Record<string, number>
  ): TSubGroupedIssues;
  unGroupedIssues(orderBy: TIssueOrderByOptions, issues: TIssueMap, count: number): TUnGroupedIssues;
  issueDisplayFiltersDefaultData(groupBy: string | null): string[];
  issuesSortWithOrderBy(issueObject: TIssueMap, key: Partial<TIssueOrderByOptions>): TIssue[];
  getGroupArray(value: boolean | number | string | string[] | null, isDate?: boolean): string[];
}

const ISSUE_FILTER_DEFAULT_DATA: Record<TIssueDisplayFilterOptions, keyof TIssue> = {
  project: "project_id",
  state: "state_id",
  "state_detail.group": "state_group" as keyof TIssue, // state_detail.group is only being used for state_group display,
  priority: "priority",
  labels: "label_ids",
  created_by: "created_by",
  assignees: "assignee_ids",
  target_date: "target_date",
  cycle: "cycle_id",
  module: "module_ids",
};

export class BaseIssuesStore implements IBaseIssuesStore {
  loader: TLoader = "init-loader";
  issues: string[] | undefined = undefined;
  groupedIssueCount: Record<string, number> | undefined = undefined;

  nextCursor: string | undefined = undefined;
  prevCursor: string | undefined = undefined;

  issueCount: number | undefined = undefined;
  pageCount: number | undefined = undefined;

  paginationOptions: IssuePaginationOptions | undefined = undefined;

  isArchived: boolean;

  // services
  issueService;
  issueArchiveService;
  issueDraftService;
  // root store
  rootIssueStore;
  issueFilterStore;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IBaseIssueFilterStore, isArchived = false) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      groupedIssueCount: observable,
      issues: observable,

      nextCursor: observable.ref,
      prevCursor: observable.ref,
      issueCount: observable.ref,
      pageCount: observable.ref,

      paginationOptions: observable,
      // computed
      groupedIssueIds: computed,
      // action
      storePreviousPaginationValues: action.bound,

      onfetchIssues: action.bound,
      onfetchNexIssues: action.bound,
      clear: action.bound,

      createIssue: action,
      updateIssue: action,
      removeIssue: action,
      archiveIssue: action,
      quickAddIssue: action,
      removeBulkIssues: action,
    });
    this.rootIssueStore = _rootStore;
    this.issueFilterStore = issueFilterStore;

    this.isArchived = isArchived;

    this.issueService = new IssueService();
    this.issueArchiveService = new IssueArchiveService();
    this.issueDraftService = new IssueDraftService();
  }

  storePreviousPaginationValues = (issuesResponse: TIssuesResponse, options?: IssuePaginationOptions) => {
    if (options) this.paginationOptions = options;

    this.nextCursor = issuesResponse.next_cursor;
    this.prevCursor = issuesResponse.prev_cursor;

    this.issueCount = issuesResponse.count;
    this.pageCount = issuesResponse.total_pages;
  };

  get groupedIssueIds() {
    const displayFilters = this.issueFilterStore?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    if (!this.issues) return;

    const currentIssues = this.rootIssueStore.issues.getIssuesByIds(
      this.issues,
      this.isArchived ? "archived" : "un-archived"
    );
    if (!currentIssues) return {};

    let groupedIssues: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues = {};

    if (layout === "list" && orderBy) {
      if (groupBy) groupedIssues = this.groupedIssues(groupBy, orderBy, currentIssues, this.groupedIssueCount);
      else groupedIssues = this.unGroupedIssues(orderBy, currentIssues, this.issueCount);
    } else if (layout === "kanban" && groupBy && orderBy) {
      if (subGroupBy)
        groupedIssues = this.subGroupedIssues(subGroupBy, groupBy, orderBy, currentIssues, this.groupedIssueCount);
      else groupedIssues = this.groupedIssues(groupBy, orderBy, currentIssues, this.groupedIssueCount);
    } else if (layout === "calendar")
      groupedIssues = this.groupedIssues("target_date", "target_date", currentIssues, this.groupedIssueCount, true);
    else if (layout === "spreadsheet")
      groupedIssues = this.unGroupedIssues(orderBy ?? "-created_at", currentIssues, this.issueCount);
    else if (layout === "gantt_chart")
      groupedIssues = this.unGroupedIssues(orderBy ?? "sort_order", currentIssues, this.issueCount);

    return groupedIssues;
  }

  onfetchIssues(issuesResponse: TIssuesResponse, options: IssuePaginationOptions) {
    const { issueList, groupedIssueCount } = this.processIssueResponse(issuesResponse);

    runInAction(() => {
      this.issues = issueList.map((issue) => issue.id);
      this.groupedIssueCount = groupedIssueCount;
      this.loader = undefined;
    });

    this.rootIssueStore.issues.addIssue(issueList);

    this.storePreviousPaginationValues(issuesResponse, options);
  }

  onfetchNexIssues(issuesResponse: TIssuesResponse) {
    const { issueList, groupedIssueCount } = this.processIssueResponse(issuesResponse);
    const newIssueIds = issueList.map((issue) => issue.id);

    runInAction(() => {
      update(this, "issues", (issueIds: string[] = []) => {
        return uniq(concat(issueIds, newIssueIds));
      });

      this.groupedIssueCount = groupedIssueCount;
      this.loader = undefined;
    });

    this.rootIssueStore.issues.addIssue(issueList);

    this.storePreviousPaginationValues(issuesResponse);
  }

  async createIssue(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    id?: string,
    shouldAddStore = true
  ) {
    try {
      const response = await this.issueService.createIssue(workspaceSlug, projectId, data);

      if (shouldAddStore) this.addIssue(response);

      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateIssue(workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) {
    const issueBeforeUpdate = { ...this.rootIssueStore.issues.getIssueById(issueId) };
    try {
      this.rootIssueStore.issues.updateIssue(issueId, data);

      await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data);
    } catch (error) {
      this.rootIssueStore.issues.updateIssue(issueId, issueBeforeUpdate);
      throw error;
    }
  }

  async createDraftIssue(workspaceSlug: string, projectId: string, data: Partial<TIssue>) {
    try {
      const response = await this.issueDraftService.createDraftIssue(workspaceSlug, projectId, data);

      this.addIssue(response);

      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateDraftIssue(workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) {
    const issueBeforeUpdate = { ...this.rootIssueStore.issues.getIssueById(issueId) };
    try {
      this.rootIssueStore.issues.updateIssue(issueId, data);

      await this.issueDraftService.updateDraftIssue(workspaceSlug, projectId, issueId, data);
    } catch (error) {
      this.rootIssueStore.issues.updateIssue(issueId, issueBeforeUpdate);
      throw error;
    }
  }

  async removeIssue(workspaceSlug: string, projectId: string, issueId: string) {
    try {
      await this.issueService.deleteIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        if (this.issues) pull(this.issues, issueId);
      });

      this.rootIssueStore.issues.removeIssue(issueId);
    } catch (error) {
      throw error;
    }
  }

  async archiveIssue(workspaceSlug: string, projectId: string, issueId: string) {
    try {
      const response = await this.issueArchiveService.archiveIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.rootIssueStore.issues.updateIssue(issueId, {
          archived_at: response.archived_at,
        });
        if (this.issues) pull(this.issues, issueId);
      });
    } catch (error) {
      throw error;
    }
  }

  async quickAddIssue(workspaceSlug: string, projectId: string, data: TIssue) {
    if (!this.issues) this.issues = [];
    try {
      this.addIssue(data);

      const response = await this.createIssue(workspaceSlug, projectId, data);
      return response;
    } catch (error) {
      throw error;
    } finally {
      if (!this.issues) return;
      const quickAddIssueIndex = this.issues.findIndex((currentIssueId) => currentIssueId === data.id);
      if (quickAddIssueIndex >= 0)
        runInAction(() => {
          this.issues!.splice(quickAddIssueIndex, 1);
          this.rootIssueStore.issues.removeIssue(data.id);
        });
    }
  }

  async removeBulkIssues(workspaceSlug: string, projectId: string, issueIds: string[]) {
    try {
      if (!this.issues) return;

      const response = await this.issueService.bulkDeleteIssues(workspaceSlug, projectId, { issue_ids: issueIds });

      runInAction(() => {
        issueIds.forEach((issueId) => {
          pull(this.issues!, issueId);
          this.rootIssueStore.issues.removeIssue(issueId);
        });
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  addIssue(issue: TIssue) {
    runInAction(() => {
      if (!this.issues) this.issues = [];
      this.issues.push(issue.id);
      this.rootIssueStore.issues.addIssue([issue]);
    });
  }

  clear() {
    runInAction(() => {
      this.issues = undefined;
      this.groupedIssueCount = undefined;
      this.groupedIssueCount = undefined;

      this.nextCursor = undefined;
      this.prevCursor = undefined;

      this.issueCount = undefined;
      this.pageCount = undefined;

      this.paginationOptions = undefined;
    });
  }

  groupedIssues = (
    groupBy: TIssueDisplayFilterOptions,
    orderBy: TIssueOrderByOptions,
    issues: TIssueMap,
    groupedIssueCount: Record<string, number> | undefined,
    isCalendarIssues: boolean = false
  ) => {
    const currentIssues: TGroupedIssues = {};
    if (!groupBy || !groupedIssueCount) return currentIssues;

    this.issueDisplayFiltersDefaultData(groupBy).forEach((group) => {
      currentIssues[group] = { issueIds: [], issueCount: groupedIssueCount[group] };
    });

    const projectIssues = this.issuesSortWithOrderBy(issues, orderBy);

    for (const issue in projectIssues) {
      const currentIssue = projectIssues[issue];
      let groupArray = [];

      if (groupBy === "state_detail.group" && currentIssue?.state_id) {
        // if groupBy state_detail.group is coming from the project level the we are using stateDetails from root store else we are looping through the stateMap
        const state_group = (this.rootIssueStore?.stateMap || {})?.[currentIssue?.state_id]?.group || "None";
        groupArray = [state_group];
      } else {
        const groupValue = get(currentIssue, ISSUE_FILTER_DEFAULT_DATA[groupBy]);
        groupArray = groupValue !== undefined ? this.getGroupArray(groupValue, isCalendarIssues) : ["None"];
      }

      for (const group of groupArray) {
        if (group && currentIssues[group]) currentIssues[group].issueIds.push(currentIssue.id);
        else if (group) currentIssues[group].issueIds = [currentIssue.id];
      }
    }

    return currentIssues;
  };

  subGroupedIssues = (
    subGroupBy: TIssueDisplayFilterOptions,
    groupBy: TIssueDisplayFilterOptions,
    orderBy: TIssueOrderByOptions,
    issues: TIssueMap,
    groupedIssueCount: Record<string, number> | undefined
  ) => {
    const currentIssues: TSubGroupedIssues = {};
    if (!subGroupBy || !groupBy|| !groupedIssueCount) return currentIssues;

    this.issueDisplayFiltersDefaultData(subGroupBy).forEach((sub_group) => {
      const groupByIssues: TGroupedIssues = {};
      this.issueDisplayFiltersDefaultData(groupBy).forEach((group) => {
        groupByIssues[group] = { issueIds: [], issueCount: groupedIssueCount[group] };
      });
      currentIssues[sub_group] = groupByIssues;
    });

    const projectIssues = this.issuesSortWithOrderBy(issues, orderBy);

    for (const issue in projectIssues) {
      const currentIssue = projectIssues[issue];
      let subGroupArray = [];
      let groupArray = [];
      if ((subGroupBy === "state_detail.group" || groupBy === "state_detail.group") && currentIssue?.state_id) {
        const state_group = (this.rootIssueStore?.stateMap || {})?.[currentIssue?.state_id]?.group || "None";

        subGroupArray = [state_group];
        groupArray = [state_group];
      } else {
        const subGroupValue = get(currentIssue, ISSUE_FILTER_DEFAULT_DATA[subGroupBy]);
        const groupValue = get(currentIssue, ISSUE_FILTER_DEFAULT_DATA[groupBy]);

        subGroupArray = subGroupValue != undefined ? this.getGroupArray(subGroupValue) : ["None"];
        groupArray = groupValue != undefined ? this.getGroupArray(groupValue) : ["None"];
      }

      for (const subGroup of subGroupArray) {
        for (const group of groupArray) {
          if (subGroup && group && currentIssues?.[subGroup]?.[group]) currentIssues[subGroup][group].issueIds.push(currentIssue.id);
          else if (subGroup && group && currentIssues[subGroup]) currentIssues[subGroup][group].issueIds = [currentIssue.id];
          else if (subGroup && group)
            currentIssues[subGroup] = { [group]: { issueIds: [currentIssue.id], issueCount: groupedIssueCount[group] } };
        }
      }
    }

    return currentIssues;
  };

  unGroupedIssues = (orderBy: TIssueOrderByOptions, issues: TIssueMap, count: number | undefined) => {
    const issueIds = this.issuesSortWithOrderBy(issues, orderBy).map((issue) => issue.id);

    return { "All Issues": { issueIds, issueCount: count || issueIds.length } };
  };

  issueDisplayFiltersDefaultData = (groupBy: string | null): string[] => {
    switch (groupBy) {
      case "state":
        return Object.keys(this.rootIssueStore?.stateMap || {});
      case "state_detail.group":
        return Object.keys(STATE_GROUPS);
      case "priority":
        return ISSUE_PRIORITIES.map((i) => i.key);
      case "labels":
        return Object.keys(this.rootIssueStore?.labelMap || {});
      case "created_by":
        return Object.keys(this.rootIssueStore?.workSpaceMemberRolesMap || {});
      case "assignees":
        return Object.keys(this.rootIssueStore?.workSpaceMemberRolesMap || {});
      case "project":
        return Object.keys(this.rootIssueStore?.projectMap || {});
      default:
        return [];
    }
  };

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
      case "state_id":
        const stateMap = this.rootIssueStore?.stateMap;
        if (!stateMap) break;
        for (const dataId of dataIdsArray) {
          const state = stateMap[dataId];
          if (state && state.name) dataValues.push(state.name.toLocaleLowerCase());
        }
        break;
      case "label_ids":
        const labelMap = this.rootIssueStore?.labelMap;
        if (!labelMap) break;
        for (const dataId of dataIdsArray) {
          const label = labelMap[dataId];
          if (label && label.name) dataValues.push(label.name.toLocaleLowerCase());
        }
        break;
      case "assignee_ids":
        const memberMap = this.rootIssueStore?.memberMap;
        if (!memberMap) break;
        for (const dataId of dataIdsArray) {
          const member = memberMap[dataId];
          if (member && member.first_name) dataValues.push(member.first_name.toLocaleLowerCase());
        }
        break;
      case "module_ids":
        const moduleMap = this.rootIssueStore?.moduleMap;
        if (!moduleMap) break;
        for (const dataId of dataIdsArray) {
          const currentModule = moduleMap[dataId];
          if (currentModule && currentModule.name) dataValues.push(currentModule.name.toLocaleLowerCase());
        }
        break;
      case "cycle_id":
        const cycleMap = this.rootIssueStore?.cycleMap;
        if (!cycleMap) break;
        for (const dataId of dataIdsArray) {
          const cycle = cycleMap[dataId];
          if (cycle && cycle.name) dataValues.push(cycle.name.toLocaleLowerCase());
        }
        break;
    }

    return isDataIdsArray ? (order ? orderBy(dataValues, undefined, [order]) : dataValues) : dataValues[0];
  }

  /**
   * This Method is mainly used to filter out empty values in the begining
   * @param key key of the value that is to be checked if empty
   * @param object any object in which the key's value is to be checked
   * @returns 1 if emoty, 0 if not empty
   */
  getSortOrderToFilterEmptyValues(key: string, object: any) {
    const value = object?.[key];

    if (typeof value !== "number" && isEmpty(value)) return 1;

    return 0;
  }

  issuesSortWithOrderBy = (issueObject: TIssueMap, key: Partial<TIssueOrderByOptions>): TIssue[] => {
    let array = values(issueObject);
    array = orderBy(array, "created_at", ["asc"]);

    switch (key) {
      case "sort_order":
        return orderBy(array, "sort_order");
      case "state__name":
        return orderBy(array, (issue) => this.populateIssueDataForSorting("state_id", issue["state_id"]));
      case "-state__name":
        return orderBy(array, (issue) => this.populateIssueDataForSorting("state_id", issue["state_id"]), ["desc"]);
      // dates
      case "created_at":
        return orderBy(array, "created_at");
      case "-created_at":
        return orderBy(array, "created_at", ["desc"]);
      case "updated_at":
        return orderBy(array, "updated_at");
      case "-updated_at":
        return orderBy(array, "updated_at", ["desc"]);
      case "start_date":
        return orderBy(array, [this.getSortOrderToFilterEmptyValues.bind(null, "start_date"), "start_date"]); //preferring sorting based on empty values to always keep the empty values below
      case "-start_date":
        return orderBy(
          array,
          [this.getSortOrderToFilterEmptyValues.bind(null, "start_date"), "start_date"], //preferring sorting based on empty values to always keep the empty values below
          ["asc", "desc"]
        );

      case "target_date":
        return orderBy(array, [this.getSortOrderToFilterEmptyValues.bind(null, "target_date"), "target_date"]); //preferring sorting based on empty values to always keep the empty values below
      case "-target_date":
        return orderBy(
          array,
          [this.getSortOrderToFilterEmptyValues.bind(null, "target_date"), "target_date"], //preferring sorting based on empty values to always keep the empty values below
          ["asc", "desc"]
        );

      // custom
      case "priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return orderBy(array, (currentIssue: TIssue) => indexOf(sortArray, currentIssue.priority), ["desc"]);
      }
      case "-priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return orderBy(array, (currentIssue: TIssue) => indexOf(sortArray, currentIssue.priority));
      }

      // number
      case "attachment_count":
        return orderBy(array, "attachment_count");
      case "-attachment_count":
        return orderBy(array, "attachment_count", ["desc"]);

      case "estimate_point":
        return orderBy(array, [this.getSortOrderToFilterEmptyValues.bind(null, "estimate_point"), "estimate_point"]); //preferring sorting based on empty values to always keep the empty values below
      case "-estimate_point":
        return orderBy(
          array,
          [this.getSortOrderToFilterEmptyValues.bind(null, "estimate_point"), "estimate_point"], //preferring sorting based on empty values to always keep the empty values below
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
          this.getSortOrderToFilterEmptyValues.bind(null, "label_ids"), //preferring sorting based on empty values to always keep the empty values below
          (issue) => this.populateIssueDataForSorting("label_ids", issue["label_ids"], "asc"),
        ]);
      case "-labels__name":
        return orderBy(
          array,
          [
            this.getSortOrderToFilterEmptyValues.bind(null, "label_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("label_ids", issue["label_ids"], "desc"),
          ],
          ["asc", "desc"]
        );

      case "modules__name":
        return orderBy(array, [
          this.getSortOrderToFilterEmptyValues.bind(null, "module_ids"), //preferring sorting based on empty values to always keep the empty values below
          (issue) => this.populateIssueDataForSorting("module_ids", issue["module_ids"], "asc"),
        ]);
      case "-modules__name":
        return orderBy(
          array,
          [
            this.getSortOrderToFilterEmptyValues.bind(null, "module_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("module_ids", issue["module_ids"], "desc"),
          ],
          ["asc", "desc"]
        );

      case "cycle__name":
        return orderBy(array, [
          this.getSortOrderToFilterEmptyValues.bind(null, "cycle_id"), //preferring sorting based on empty values to always keep the empty values below
          (issue) => this.populateIssueDataForSorting("cycle_id", issue["cycle_id"], "asc"),
        ]);
      case "-cycle__name":
        return orderBy(
          array,
          [
            this.getSortOrderToFilterEmptyValues.bind(null, "cycle_id"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("cycle_id", issue["cycle_id"], "desc"),
          ],
          ["asc", "desc"]
        );

      case "assignees__first_name":
        return orderBy(array, [
          this.getSortOrderToFilterEmptyValues.bind(null, "assignee_ids"), //preferring sorting based on empty values to always keep the empty values below
          (issue) => this.populateIssueDataForSorting("assignee_ids", issue["assignee_ids"], "asc"),
        ]);
      case "-assignees__first_name":
        return orderBy(
          array,
          [
            this.getSortOrderToFilterEmptyValues.bind(null, "assignee_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("assignee_ids", issue["assignee_ids"], "desc"),
          ],
          ["asc", "desc"]
        );

      default:
        return array;
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

  processIssueResponse(issueResponse: TIssuesResponse): {
    issueList: TIssue[];
    groupedIssueCount: Record<string, number>;
  } {
    const issueResult = issueResponse?.results;

    if (!issueResult)
      return {
        issueList: [],
        groupedIssueCount: {},
      };

    if (Array.isArray(issueResult)) {
      return {
        issueList: issueResult,
        groupedIssueCount: { "All Issues": issueResponse.count },
      };
    }

    const issueList: TIssue[] = [];
    const groupedIssueCount: Record<string, number> = {};

    for (const groupId in issueResult) {
      const groupIssueResult = issueResult[groupId];

      if (!groupIssueResult) continue;

      issueList.push(...groupIssueResult.results);
      groupedIssueCount[groupId] = groupIssueResult.total_results;
    }

    return { issueList, groupedIssueCount };
  }
}
