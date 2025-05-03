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
} from "@plane/types";
import { getFilteredWorkItems, getGroupedWorkItemIds, updateFilters } from "../helpers/base-issues-utils";
import { IIssueSubIssuesStore, IssueSubIssuesStore } from "./sub_issues.store";

export interface IWorkItemSubIssueFiltersStore {
  subIssueFilters: Record<string, Partial<IIssueFilters>>;
  // helpers methods
  updateSubWorkItemFilters: (
    filterType: EIssueFilterType,
    filters: IIssueDisplayFilterOptions | IIssueDisplayProperties | IIssueFilterOptions,
    workItemId: string
  ) => void;
  getGroupedSubWorkItems: (workItemId: string) => TGroupedIssues;
  getSubIssueFilters: (workItemId: string) => Partial<IIssueFilters>;
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
      getGroupedSubWorkItems: action,
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
      this.initSubIssueFilters(workItemId);
    }
    return this.subIssueFilters[workItemId];
  };

  /**
   * @description This method is used to initialize the sub issue filters
   * @param workItemId
   */
  initSubIssueFilters = (workItemId: string) => {
    set(this.subIssueFilters, [workItemId], {
      displayProperties: {
        key: true,
        issue_type: true,
        assignee: true,
        start_date: true,
        due_date: true,
        labels: true,
        priority: true,
      },
    });
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
    const subIssueIds = this.subIssueStore.subIssuesByIssueId(parentWorkItemId);
    const workItems = this.subIssueStore.rootIssueDetailStore.rootIssueStore.issues.getIssuesByIds(
      subIssueIds,
      "un-archived"
    );

    const subIssueFilters = this.getSubIssueFilters(parentWorkItemId);
    const orderByKey = subIssueFilters.displayFilters?.order_by;
    const groupByKey = subIssueFilters.displayFilters?.group_by;

    const filteredWorkItems = getFilteredWorkItems(workItems, subIssueFilters.filters);

    const groupedWorkItemIds = getGroupedWorkItemIds(filteredWorkItems, groupByKey, orderByKey);

    return groupedWorkItemIds;
  });
}
