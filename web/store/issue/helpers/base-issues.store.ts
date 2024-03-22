import { action, computed, makeObservable, observable, runInAction } from "mobx";
import update from "lodash/update";
import uniq from "lodash/uniq";
import concat from "lodash/concat";
import pull from "lodash/pull";
import orderBy from "lodash/orderBy";
import clone from "lodash/clone";
import indexOf from "lodash/indexOf";
import isEmpty from "lodash/isEmpty";
// types
import {
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
import set from "lodash/set";
import { get } from "lodash";
import { computedFn } from "mobx-utils";

export type TIssueDisplayFilterOptions = Exclude<TIssueGroupByOptions, null> | "target_date";

export enum EIssueGroupedAction {
  ADD,
  DELETE,
}

export const ALL_ISSUES = "All Issues";

export interface IBaseIssuesStore {
  // observable
  loader: TLoader;

  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | undefined;
  groupedIssueCount: TGroupedIssueCount;
  issuePaginationData: TIssuePaginationData;

  //actions
  removeIssue(workspaceSlug: string, projectId: string, issueId: string): Promise<void>;
  // helper methods
  issueDisplayFiltersDefaultData(groupBy: string | null): string[];
  issuesSortWithOrderBy(issueIds: string[], key: Partial<TIssueOrderByOptions>): string[];
  getGroupArray(value: boolean | number | string | string[] | null, isDate?: boolean): string[];
  getPaginationData(groupId: string | undefined, subGroupId: string | undefined): TPaginationData | undefined;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
}

const ISSUE_FILTER_DEFAULT_DATA: Record<TIssueDisplayFilterOptions, keyof TIssue> = {
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

export class BaseIssuesStore implements IBaseIssuesStore {
  loader: TLoader = "init-loader";
  groupedIssueIds: TIssues | undefined = undefined;
  issuePaginationData: TIssuePaginationData = {};

  groupedIssueCount: TGroupedIssueCount = {};

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
      groupedIssueIds: observable,
      issuePaginationData: observable,
      groupedIssueCount: observable,

      paginationOptions: observable,
      // computed
      orderBy: computed,
      groupBy: computed,
      subGroupBy: computed,
      issueGroupKey: computed,
      issueSubGroupKey: computed,
      // action
      storePreviousPaginationValues: action.bound,

      onfetchIssues: action.bound,
      onfetchNexIssues: action.bound,
      clear: action.bound,
      getPaginationData: action.bound,

      createIssue: action,
      updateIssue: action,
      removeIssue: action,
      archiveIssue: action,
      removeBulkIssues: action,
    });
    this.rootIssueStore = _rootStore;
    this.issueFilterStore = issueFilterStore;

    this.isArchived = isArchived;

    this.issueService = new IssueService();
    this.issueArchiveService = new IssueArchiveService();
    this.issueDraftService = new IssueDraftService();
  }

  get orderBy() {
    const displayFilters = this.issueFilterStore?.issueFilters?.displayFilters;
    if (!displayFilters) return;

    return displayFilters?.order_by;
  }

  get groupBy() {
    const displayFilters = this.issueFilterStore?.issueFilters?.displayFilters;
    if (!displayFilters) return;

    const layout = displayFilters?.layout;

    return layout === "calendar"
      ? "target_date"
      : ["list", "kanban"]?.includes(layout)
      ? displayFilters?.group_by
      : undefined;
  }

  get subGroupBy() {
    const displayFilters = this.issueFilterStore?.issueFilters?.displayFilters;
    if (!displayFilters || displayFilters.group_by === displayFilters.sub_group_by) return;

    return displayFilters?.layout === "kanban" ? displayFilters?.sub_group_by : undefined;
  }

  get issueGroupKey() {
    const groupBy = this.groupBy;

    if (!groupBy) return;

    return ISSUE_FILTER_DEFAULT_DATA[groupBy];
  }

  get issueSubGroupKey() {
    const subGroupBy = this.subGroupBy;

    if (!subGroupBy) return;

    return ISSUE_FILTER_DEFAULT_DATA[subGroupBy];
  }

  onfetchIssues(issuesResponse: TIssuesResponse, options: IssuePaginationOptions) {
    const { issueList, groupedIssues, groupedIssueCount } = this.processIssueResponse(issuesResponse);

    runInAction(() => {
      this.groupedIssueIds = groupedIssues;
      this.groupedIssueCount = groupedIssueCount;
      this.loader = undefined;
    });

    this.rootIssueStore.issues.addIssue(issueList);

    this.storePreviousPaginationValues(issuesResponse, options);
  }

  onfetchNexIssues(issuesResponse: TIssuesResponse, groupId?: string, subGroupId?: string) {
    const { issueList, groupedIssues, groupedIssueCount } = this.processIssueResponse(issuesResponse);

    this.rootIssueStore.issues.addIssue(issueList);

    runInAction(() => {
      this.updateGroupedIssueIds(groupedIssues, groupedIssueCount, groupId, subGroupId);
      this.loader = undefined;
    });

    this.storePreviousPaginationValues(issuesResponse, undefined, groupId, subGroupId);
  }

  updateGroupedIssueIds(
    groupedIssues: TIssues,
    groupedIssueCount: TGroupedIssueCount,
    groupId?: string,
    subGroupId?: string
  ) {
    if (groupId && groupedIssues[ALL_ISSUES] && Array.isArray(groupedIssues[ALL_ISSUES])) {
      const issueGroup = groupedIssues[ALL_ISSUES];
      const issueGroupCount = groupedIssueCount[ALL_ISSUES];
      const issuesPath = [groupId];

      if (subGroupId) issuesPath.push(subGroupId);

      set(this.groupedIssueCount, [this.getGroupKey(groupId, subGroupId)], issueGroupCount);

      this.updateIssueGroup(issueGroup, issuesPath);
      return;
    }

    set(this.groupedIssueCount, [ALL_ISSUES], groupedIssueCount[ALL_ISSUES]);

    for (const groupId in groupedIssues) {
      const issueGroup = groupedIssues[groupId];
      const issueGroupCount = groupedIssueCount[groupId];

      set(this.groupedIssueCount, [groupId], issueGroupCount);

      const shouldContinue = this.updateIssueGroup(issueGroup, [groupId]);
      if (shouldContinue) continue;

      for (const subGroupId in issueGroup) {
        const issueSubGroup = (issueGroup as TGroupedIssues)[subGroupId];
        const issueSubGroupCount = groupedIssueCount[subGroupId];

        set(this.groupedIssueCount, [this.getGroupKey(groupId, subGroupId)], issueSubGroupCount);
        this.updateIssueGroup(issueSubGroup, [groupId, subGroupId]);
      }
    }
  }

  updateIssueGroup(groupedIssueIds: TGroupedIssues | string[], issuePath: string[]): boolean {
    if (!groupedIssueIds) return true;

    if (groupedIssueIds && Array.isArray(groupedIssueIds)) {
      update(this, ["groupedIssueIds", ...issuePath], (issueIds: string[] = []) => {
        return this.issuesSortWithOrderBy(uniq(concat(issueIds, groupedIssueIds as string[])), this.orderBy);
      });

      return true;
    }

    return false;
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
    const issueBeforeUpdate = clone(this.rootIssueStore.issues.getIssueById(issueId));
    try {
      this.rootIssueStore.issues.updateIssue(issueId, data);
      this.updateIssueList({ ...issueBeforeUpdate, ...data } as TIssue, issueBeforeUpdate);

      await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data);
    } catch (error) {
      this.rootIssueStore.issues.updateIssue(issueId, issueBeforeUpdate ?? {});
      this.updateIssueList(issueBeforeUpdate, { ...issueBeforeUpdate, ...data } as TIssue);
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
    const issueBeforeUpdate = clone(this.rootIssueStore.issues.getIssueById(issueId));
    try {
      this.rootIssueStore.issues.updateIssue(issueId, data);
      this.updateIssueList({ ...issueBeforeUpdate, ...data } as TIssue, issueBeforeUpdate);

      await this.issueDraftService.updateDraftIssue(workspaceSlug, projectId, issueId, data);
    } catch (error) {
      this.rootIssueStore.issues.updateIssue(issueId, issueBeforeUpdate ?? {});
      this.updateIssueList(issueBeforeUpdate, { ...issueBeforeUpdate, ...data } as TIssue);
      throw error;
    }
  }

  async removeIssue(workspaceSlug: string, projectId: string, issueId: string) {
    try {
      await this.issueService.deleteIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.removeIssueFromList(issueId);
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
        this.removeIssueFromList(issueId);
      });
    } catch (error) {
      throw error;
    }
  }

  async issueQuickAdd(workspaceSlug: string, projectId: string, data: TIssue) {
    try {
      this.addIssue(data);

      const response = await this.createIssue(workspaceSlug, projectId, data);
      return response;
    } catch (error) {
      throw error;
    } finally {
      runInAction(() => {
        this.removeIssueFromList(data.id);
        this.rootIssueStore.issues.removeIssue(data.id);
      });
    }
  }

  async removeBulkIssues(workspaceSlug: string, projectId: string, issueIds: string[]) {
    try {
      const response = await this.issueService.bulkDeleteIssues(workspaceSlug, projectId, { issue_ids: issueIds });

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

  addIssue(issue: TIssue) {
    runInAction(() => {
      this.rootIssueStore.issues.addIssue([issue]);
    });

    this.updateIssueList(issue, undefined, EIssueGroupedAction.ADD);
  }

  clear() {
    runInAction(() => {
      this.groupedIssueIds = undefined;
      this.issuePaginationData = {};
      this.groupedIssueCount = {};
      this.paginationOptions = undefined;
    });
  }

  addIssueToList(issueId: string) {
    const issue = this.rootIssueStore.issues.getIssueById(issueId);
    this.updateIssueList(issue, undefined, EIssueGroupedAction.ADD);
  }

  removeIssueFromList(issueId: string) {
    const issue = this.rootIssueStore.issues.getIssueById(issueId);
    this.updateIssueList(issue, undefined, EIssueGroupedAction.DELETE);
  }

  updateIssueList(issue?: TIssue, issueBeforeUpdate?: TIssue, action?: EIssueGroupedAction) {
    if (!issue) return;
    const issueUpdates = this.getUpdateDetails(issue, issueBeforeUpdate, action);
    runInAction(() => {
      for (const issueUpdate of issueUpdates) {
        //if update is add, add it at a particular path
        if (issueUpdate.action === EIssueGroupedAction.ADD) {
          update(this, ["groupedIssueIds", ...issueUpdate.path], (issueIds: string[] = []) => {
            return this.issuesSortWithOrderBy(uniq(concat(issueIds, issue.id)), this.orderBy);
          });
          this.updateIssueCount(issueUpdate.path, 1);
        }

        //if update is delete, remove it at a particular path
        if (issueUpdate.action === EIssueGroupedAction.DELETE) {
          update(this, ["groupedIssueIds", ...issueUpdate.path], (issueIds: string[] = []) => {
            return pull(issueIds, issue.id);
          });
          this.updateIssueCount(issueUpdate.path, -1);
        }
      }
    });
  }

  updateIssueCount(path: string[], increment: number) {
    const [groupId, subGroupId] = path;

    if (subGroupId && groupId) {
      const groupKey = this.getGroupKey(groupId, subGroupId);
      const subGroupIssueCount = get(this.groupedIssueCount, groupKey);

      set(this.groupedIssueCount, groupKey, subGroupIssueCount + increment);
    }

    if (groupId) {
      const groupIssueCount = get(this.groupedIssueCount, [groupId]);

      set(this.groupedIssueCount, groupId, groupIssueCount + increment);
    }

    if (groupId !== ALL_ISSUES) {
      const totalIssueCount = get(this.groupedIssueCount, [ALL_ISSUES]);

      set(this.groupedIssueCount, ALL_ISSUES, totalIssueCount + increment);
    }
  }

  getUpdateDetails = (
    issue?: Partial<TIssue>,
    issueBeforeUpdate?: Partial<TIssue>,
    action?: EIssueGroupedAction
  ): { path: string[]; action: EIssueGroupedAction }[] => {
    if (!this.issueGroupKey || !issue) return action ? [{ path: [ALL_ISSUES], action }] : [];

    const groupActionsArray = this.getDifference(
      this.getArrayStringArray(issue[this.issueGroupKey], this.groupBy),
      this.getArrayStringArray(issueBeforeUpdate?.[this.issueGroupKey], this.groupBy)
    );

    if (!this.issueSubGroupKey)
      return this.getGroupIssueKeyActions(
        groupActionsArray[EIssueGroupedAction.ADD],
        groupActionsArray[EIssueGroupedAction.DELETE]
      );

    const subGroupActionsArray = this.getDifference(
      this.getArrayStringArray(issue[this.issueSubGroupKey], this.subGroupBy),
      this.getArrayStringArray(issueBeforeUpdate?.[this.issueSubGroupKey], this.subGroupBy)
    );

    return this.getSubGroupIssueKeyActions(
      groupActionsArray,
      subGroupActionsArray,
      this.getArrayStringArray(issueBeforeUpdate?.[this.issueGroupKey] ?? issue[this.issueGroupKey], this.groupBy),
      this.getArrayStringArray(issue[this.issueGroupKey], this.groupBy),
      this.getArrayStringArray(
        issueBeforeUpdate?.[this.issueSubGroupKey] ?? issue[this.issueSubGroupKey],
        this.subGroupBy
      ),
      this.getArrayStringArray(issue[this.issueSubGroupKey], this.subGroupBy)
    );
  };

  getArrayStringArray = (
    value: string | string[] | undefined | null,
    groupByKey: TIssueGroupByOptions | undefined
  ): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    if (groupByKey === "state_detail.group") {
      return [this.rootIssueStore.rootStore.state.stateMap?.[value]?.group];
    }

    return [value];
  };

  getSubGroupIssueKeyActions = (
    groupActionsArray: {
      [EIssueGroupedAction.ADD]: string[];
      [EIssueGroupedAction.DELETE]: string[];
    },
    subGroupActionsArray: {
      [EIssueGroupedAction.ADD]: string[];
      [EIssueGroupedAction.DELETE]: string[];
    },
    previousIssueGroupProperties: string[],
    currentIssueGroupProperties: string[],
    previousIssueSubGroupProperties: string[],
    currentIssueSubGroupProperties: string[]
  ): { path: string[]; action: EIssueGroupedAction }[] => {
    const issueKeyActions = [];

    for (const addKey of groupActionsArray[EIssueGroupedAction.ADD]) {
      for (const subGroupProperty of currentIssueSubGroupProperties) {
        issueKeyActions.push({ path: [addKey, subGroupProperty], action: EIssueGroupedAction.ADD });
      }
    }

    for (const deleteKey of groupActionsArray[EIssueGroupedAction.DELETE]) {
      for (const subGroupProperty of previousIssueSubGroupProperties) {
        issueKeyActions.push({
          path: [deleteKey, subGroupProperty],
          action: EIssueGroupedAction.DELETE,
        });
      }
    }

    for (const addKey of subGroupActionsArray[EIssueGroupedAction.ADD]) {
      for (const groupProperty of currentIssueGroupProperties) {
        issueKeyActions.push({ path: [groupProperty, addKey], action: EIssueGroupedAction.ADD });
      }
    }

    for (const deleteKey of subGroupActionsArray[EIssueGroupedAction.DELETE]) {
      for (const groupProperty of previousIssueGroupProperties) {
        issueKeyActions.push({
          path: [groupProperty, deleteKey],
          action: EIssueGroupedAction.DELETE,
        });
      }
    }

    return issueKeyActions;
  };

  getGroupIssueKeyActions = (
    addArray: string[],
    deleteArray: string[]
  ): { path: string[]; action: EIssueGroupedAction }[] => {
    const issueKeyActions = [];

    for (const addKey of addArray) {
      issueKeyActions.push({ path: [addKey], action: EIssueGroupedAction.ADD });
    }

    for (const deleteKey of deleteArray) {
      issueKeyActions.push({ path: [deleteKey], action: EIssueGroupedAction.DELETE });
    }

    return issueKeyActions;
  };

  getDifference = (
    current: string[],
    previous: string[]
  ): { [EIssueGroupedAction.ADD]: string[]; [EIssueGroupedAction.DELETE]: string[] } => {
    const ADD = [];
    const DELETE = [];
    for (const currentValue of current) {
      if (previous.includes(currentValue)) continue;
      ADD.push(currentValue);
    }

    for (const previousValue of previous) {
      if (current.includes(previousValue)) continue;
      DELETE.push(previousValue);
    }

    return { [EIssueGroupedAction.ADD]: ADD, [EIssueGroupedAction.DELETE]: DELETE };
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
   * This Method is mainly used to filter out empty values in the beginning
   * @param key key of the value that is to be checked if empty
   * @param object any object in which the key's value is to be checked
   * @returns 1 if empty, 0 if not empty
   */
  getSortOrderToFilterEmptyValues(key: string, object: any) {
    const value = object?.[key];

    if (typeof value !== "number" && isEmpty(value)) return 1;

    return 0;
  }

  getIssueIds(issues: TIssue[]) {
    return issues.map((issue) => issue?.id);
  }

  issuesSortWithOrderBy = (issueIds: string[], key: TIssueOrderByOptions | undefined): string[] => {
    const issues = this.rootIssueStore.issues.getIssuesByIds(issueIds, this.isArchived ? "archived" : "un-archived");
    const array = orderBy(issues, "created_at", ["asc"]);

    switch (key) {
      case "sort_order":
        return this.getIssueIds(orderBy(array, "sort_order"));
      case "state__name":
        return this.getIssueIds(
          orderBy(array, (issue) => this.populateIssueDataForSorting("state_id", issue["state_id"]))
        );
      case "-state__name":
        return this.getIssueIds(
          orderBy(array, (issue) => this.populateIssueDataForSorting("state_id", issue["state_id"]), ["desc"])
        );
      // dates
      case "created_at":
        return this.getIssueIds(orderBy(array, "created_at"));
      case "-created_at":
        return this.getIssueIds(orderBy(array, "created_at", ["desc"]));
      case "updated_at":
        return this.getIssueIds(orderBy(array, "updated_at"));
      case "-updated_at":
        return this.getIssueIds(orderBy(array, "updated_at", ["desc"]));
      case "start_date":
        return this.getIssueIds(
          orderBy(array, [this.getSortOrderToFilterEmptyValues.bind(null, "start_date"), "start_date"])
        ); //preferring sorting based on empty values to always keep the empty values below
      case "-start_date":
        return this.getIssueIds(
          orderBy(
            array,
            [this.getSortOrderToFilterEmptyValues.bind(null, "start_date"), "start_date"], //preferring sorting based on empty values to always keep the empty values below
            ["asc", "desc"]
          )
        );

      case "target_date":
        return this.getIssueIds(
          orderBy(array, [this.getSortOrderToFilterEmptyValues.bind(null, "target_date"), "target_date"])
        ); //preferring sorting based on empty values to always keep the empty values below
      case "-target_date":
        return this.getIssueIds(
          orderBy(
            array,
            [this.getSortOrderToFilterEmptyValues.bind(null, "target_date"), "target_date"], //preferring sorting based on empty values to always keep the empty values below
            ["asc", "desc"]
          )
        );

      // custom
      case "priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return this.getIssueIds(
          orderBy(array, (currentIssue: TIssue) => indexOf(sortArray, currentIssue.priority), ["desc"])
        );
      }
      case "-priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return this.getIssueIds(orderBy(array, (currentIssue: TIssue) => indexOf(sortArray, currentIssue.priority)));
      }

      // number
      case "attachment_count":
        return this.getIssueIds(orderBy(array, "attachment_count"));
      case "-attachment_count":
        return this.getIssueIds(orderBy(array, "attachment_count", ["desc"]));

      case "estimate_point":
        return this.getIssueIds(
          orderBy(array, [this.getSortOrderToFilterEmptyValues.bind(null, "estimate_point"), "estimate_point"])
        ); //preferring sorting based on empty values to always keep the empty values below
      case "-estimate_point":
        return this.getIssueIds(
          orderBy(
            array,
            [this.getSortOrderToFilterEmptyValues.bind(null, "estimate_point"), "estimate_point"], //preferring sorting based on empty values to always keep the empty values below
            ["asc", "desc"]
          )
        );

      case "link_count":
        return this.getIssueIds(orderBy(array, "link_count"));
      case "-link_count":
        return this.getIssueIds(orderBy(array, "link_count", ["desc"]));

      case "sub_issues_count":
        return this.getIssueIds(orderBy(array, "sub_issues_count"));
      case "-sub_issues_count":
        return this.getIssueIds(orderBy(array, "sub_issues_count", ["desc"]));

      // Array
      case "labels__name":
        return this.getIssueIds(
          orderBy(array, [
            this.getSortOrderToFilterEmptyValues.bind(null, "label_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("label_ids", issue["label_ids"], "asc"),
          ])
        );
      case "-labels__name":
        return this.getIssueIds(
          orderBy(
            array,
            [
              this.getSortOrderToFilterEmptyValues.bind(null, "label_ids"), //preferring sorting based on empty values to always keep the empty values below
              (issue) => this.populateIssueDataForSorting("label_ids", issue["label_ids"], "desc"),
            ],
            ["asc", "desc"]
          )
        );

      case "modules__name":
        return this.getIssueIds(
          orderBy(array, [
            this.getSortOrderToFilterEmptyValues.bind(null, "module_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("module_ids", issue["module_ids"], "asc"),
          ])
        );
      case "-modules__name":
        return this.getIssueIds(
          orderBy(
            array,
            [
              this.getSortOrderToFilterEmptyValues.bind(null, "module_ids"), //preferring sorting based on empty values to always keep the empty values below
              (issue) => this.populateIssueDataForSorting("module_ids", issue["module_ids"], "desc"),
            ],
            ["asc", "desc"]
          )
        );

      case "cycle__name":
        return this.getIssueIds(
          orderBy(array, [
            this.getSortOrderToFilterEmptyValues.bind(null, "cycle_id"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("cycle_id", issue["cycle_id"], "asc"),
          ])
        );
      case "-cycle__name":
        return this.getIssueIds(
          orderBy(
            array,
            [
              this.getSortOrderToFilterEmptyValues.bind(null, "cycle_id"), //preferring sorting based on empty values to always keep the empty values below
              (issue) => this.populateIssueDataForSorting("cycle_id", issue["cycle_id"], "desc"),
            ],
            ["asc", "desc"]
          )
        );

      case "assignees__first_name":
        return this.getIssueIds(
          orderBy(array, [
            this.getSortOrderToFilterEmptyValues.bind(null, "assignee_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("assignee_ids", issue["assignee_ids"], "asc"),
          ])
        );
      case "-assignees__first_name":
        return this.getIssueIds(
          orderBy(
            array,
            [
              this.getSortOrderToFilterEmptyValues.bind(null, "assignee_ids"), //preferring sorting based on empty values to always keep the empty values below
              (issue) => this.populateIssueDataForSorting("assignee_ids", issue["assignee_ids"], "desc"),
            ],
            ["asc", "desc"]
          )
        );

      default:
        return this.getIssueIds(array);
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

  processIssueResponse(issueResponse: TIssuesResponse): {
    issueList: TIssue[];
    groupedIssues: TIssues;
    groupedIssueCount: TGroupedIssueCount;
  } {
    const issueResult = issueResponse?.results;

    if (!issueResult)
      return {
        issueList: [],
        groupedIssues: {},
        groupedIssueCount: {},
      };

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

    set(groupedIssueCount, [ALL_ISSUES], issueResponse.total_count);

    for (const groupId in issueResult) {
      const groupIssuesObject = issueResult[groupId];
      const groupIssueResult = groupIssuesObject?.results;

      if (!groupIssueResult) continue;

      set(groupedIssueCount, [groupId], groupIssuesObject.total_results);

      if (Array.isArray(groupIssueResult)) {
        issueList.push(...groupIssueResult);
        set(
          groupedIssues,
          [groupId],
          groupIssueResult.map((issue) => issue.id)
        );
        continue;
      }

      for (const subGroupId in groupIssueResult) {
        const subGroupIssuesObject = groupIssueResult[subGroupId];
        const subGroupIssueResult = subGroupIssuesObject?.results;

        if (!subGroupIssueResult) continue;

        set(groupedIssueCount, [this.getGroupKey(groupId, subGroupId)], subGroupIssuesObject.total_results);

        if (Array.isArray(subGroupIssueResult)) {
          issueList.push(...subGroupIssueResult);
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

    set(this.issuePaginationData, [this.getGroupKey(groupId, subGroupId)], cursorObject);
  }

  getGroupKey(groupId?: string, subGroupId?: string) {
    if (groupId && subGroupId) return `${groupId}_${subGroupId}`;

    if (groupId) return groupId;

    return ALL_ISSUES;
  }

  getPaginationData = computedFn(
    (groupId: string | undefined, subGroupId: string | undefined): TPaginationData | undefined => {
      return get(this.issuePaginationData, [this.getGroupKey(groupId, subGroupId)]);
    }
  );

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
          if (groupKey.includes(subGroupId)) subGroupCumulativeCount += this.groupedIssueCount[groupKey];
        }
      }

      return get(this.groupedIssueCount, [this.getGroupKey(groupId, subGroupId)]);
    }
  );
}
