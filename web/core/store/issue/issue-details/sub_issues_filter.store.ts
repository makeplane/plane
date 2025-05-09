import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { EIssueFilterType } from "@plane/constants";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IIssueFilters,
  TGroupedIssues,
  TIssue,
} from "@plane/types";
import { getFilteredWorkItems, getGroupedWorkItemIds, updateFilters } from "../helpers/base-issues-utils";
import { IssueSubIssuesStore } from "./sub_issues.store";

export const DEFAULT_DISPLAY_PROPERTIES = {
  key: true,
  issue_type: true,
  assignee: true,
  start_date: true,
  due_date: true,
  labels: true,
  priority: true,
  state: true,
};

export interface IWorkItemSubIssueFiltersStore {
  subIssueFilters: Record<string, Partial<IIssueFilters>>;
  // helpers methods
  updateSubWorkItemFilters: (
    filterType: EIssueFilterType,
    filters: IIssueDisplayFilterOptions | IIssueDisplayProperties | IIssueFilterOptions,
    workItemId: string
  ) => void;
  getGroupedSubWorkItems: (workItemId: string) => TGroupedIssues;
  getFilteredSubWorkItems: (workItemId: string, filters: IIssueFilterOptions) => TIssue[];
  getSubIssueFilters: (workItemId: string) => Partial<IIssueFilters>;
  resetFilters: (workItemId: string) => void;
}

export class WorkItemSubIssueFiltersStore implements IWorkItemSubIssueFiltersStore {
  // observables
  subIssueFilters: Record<string, Partial<IIssueFilters>> = {};

  // root store
  subIssueStore: IssueSubIssuesStore;

  constructor(subIssueStore: IssueSubIssuesStore) {
    makeObservable(this, {
      subIssueFilters: observable,
      updateSubWorkItemFilters: action,
      getSubIssueFilters: action,
    });

    // root store
    this.subIssueStore = subIssueStore;
  }

  /**
   * @description This method is used to get the sub issue filters
   * @param workItemId
   * @returns
   */
  getSubIssueFilters = (workItemId: string) => {
    if (!this.subIssueFilters[workItemId]) {
      this.initializeFilters(workItemId);
    }
    return this.subIssueFilters[workItemId];
  };

  /**
   * @description This method is used to initialize the sub issue filters
   * @param workItemId
   */
  initializeFilters = (workItemId: string) => {
    set(this.subIssueFilters, [workItemId, "displayProperties"], DEFAULT_DISPLAY_PROPERTIES);
    set(this.subIssueFilters, [workItemId, "filters"], {});
    set(this.subIssueFilters, [workItemId, "displayFilters"], {});
  };

  /**
   * @description This method updates filters for sub issues.
   * @param filterType
   * @param filters
   */
  updateSubWorkItemFilters = (
    filterType: EIssueFilterType,
    filters: IIssueDisplayFilterOptions | IIssueDisplayProperties | IIssueFilterOptions,
    workItemId: string
  ) => {
    runInAction(() => {
      updateFilters(this.subIssueFilters, filterType, filters, workItemId);
    });
  };

  /**
   * @description This method is used to get the grouped sub work items
   * @param parentWorkItemId
   * @returns
   */
  getGroupedSubWorkItems = computedFn((parentWorkItemId: string) => {
    const subIssueFilters = this.getSubIssueFilters(parentWorkItemId);

    const filteredWorkItems = this.getFilteredSubWorkItems(parentWorkItemId, subIssueFilters.filters ?? {});

    // get group by and order by
    const groupByKey = subIssueFilters.displayFilters?.group_by;
    const orderByKey = subIssueFilters.displayFilters?.order_by;

    const groupedWorkItemIds = getGroupedWorkItemIds(filteredWorkItems, groupByKey, orderByKey);

    return groupedWorkItemIds;
  });

  /**
   * @description This method is used to get the filtered sub work items
   * @param workItemId
   * @returns
   */
  getFilteredSubWorkItems = computedFn((workItemId: string, filters: IIssueFilterOptions) => {
    const subIssueIds = this.subIssueStore.subIssuesByIssueId(workItemId);
    const workItems = this.subIssueStore.rootIssueDetailStore.rootIssueStore.issues.getIssuesByIds(
      subIssueIds,
      "un-archived"
    );

    const filteredWorkItems = getFilteredWorkItems(workItems, filters);

    return filteredWorkItems;
  });

  /**
   * @description This method is used to reset the filters
   * @param workItemId
   */
  resetFilters = (workItemId: string) => {
    this.initializeFilters(workItemId);
  };
}
