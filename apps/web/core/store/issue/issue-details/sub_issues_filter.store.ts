/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type { EIssueFilterType } from "@plane/constants";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  ISubWorkItemFilters,
  TGroupedIssues,
  TIssue,
} from "@plane/types";
import { getFilteredWorkItems, getGroupedWorkItemIds, updateSubWorkItemFilters } from "../helpers/base-issues-utils";
import type { IssueSubIssuesStore } from "./sub_issues.store";

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
  subIssueFilters: Record<string, Partial<ISubWorkItemFilters>>;
  // helpers methods
  initializeFilters: (workItemId: string) => void;
  updateSubWorkItemFilters: (
    filterType: EIssueFilterType,
    filters: IIssueDisplayFilterOptions | IIssueDisplayProperties | IIssueFilterOptions,
    workItemId: string
  ) => void;
  getGroupedSubWorkItems: (workItemId: string) => TGroupedIssues;
  getFilteredSubWorkItems: (workItemId: string, filters: IIssueFilterOptions) => TIssue[];
  getSubIssueFilters: (workItemId: string) => Partial<ISubWorkItemFilters>;
  resetFilters: (workItemId: string) => void;
}

export class WorkItemSubIssueFiltersStore implements IWorkItemSubIssueFiltersStore {
  // observables
  subIssueFilters: Record<string, Partial<ISubWorkItemFilters>> = {};

  // root store
  subIssueStore: IssueSubIssuesStore;

  constructor(subIssueStore: IssueSubIssuesStore) {
    makeObservable(this, {
      subIssueFilters: observable,
      initializeFilters: action,
      updateSubWorkItemFilters: action,
      resetFilters: action,
    });

    // root store
    this.subIssueStore = subIssueStore;
  }

  /**
   * @description This method is used to initialize the sub issue filters.
   * Must be called before reading filters for a workItemId.
   * @param workItemId
   */
  initializeFilters = (workItemId: string) => {
    set(this.subIssueFilters, [workItemId, "displayProperties"], DEFAULT_DISPLAY_PROPERTIES);
    set(this.subIssueFilters, [workItemId, "filters"], {});
    set(this.subIssueFilters, [workItemId, "displayFilters"], {});
  };

  /**
   * @description Pure getter — returns existing filters for a workItemId,
   * or a default empty object if not yet initialized.
   * Does NOT mutate state (safe to call from computedFn).
   * @param workItemId
   */
  getSubIssueFilters = (workItemId: string): Partial<ISubWorkItemFilters> => {
    return this.subIssueFilters[workItemId] ?? {};
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
      updateSubWorkItemFilters(this.subIssueFilters, filterType, filters, workItemId);
    });
  };

  /**
   * @description This method is used to get the grouped sub work items
   * @param parentWorkItemId
   * @returns
   */
  getGroupedSubWorkItems = computedFn((parentWorkItemId: string) => {
    // Read observable directly — avoids calling an action inside computedFn.
    // Falls back to default values if not yet initialized.
    const subIssueFilters = this.subIssueFilters[parentWorkItemId] ?? {};

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
    runInAction(() => {
      this.initializeFilters(workItemId);
    });
  };
}
