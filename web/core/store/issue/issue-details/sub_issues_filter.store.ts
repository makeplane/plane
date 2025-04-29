import set from "lodash/set";
import { action, makeObservable, observable } from "mobx";
import { ALL_ISSUES, EIssueFilterType, EIssueGroupByToServerOptions } from "@plane/constants";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilters,
  TGroupedIssueCount,
  TGroupedIssues,
  TIssue,
  TIssueParams,
  TIssues,
  TSubGroupedIssues,
  TSubIssueResponse,
} from "@plane/types";
import { IIssueSubIssuesStore } from "./sub_issues.store";

export interface IWorkItemSubIssueFiltersStore {
  subIssueFiltersMap: Record<string, Partial<IIssueFilters>>;
  // helpers methods
  updateSubIssueFilters: (
    workspaceSlug: string,
    projectId: string,
    filterType: EIssueFilterType,
    filters: IIssueDisplayFilterOptions | IIssueDisplayProperties,
    parentId: string
  ) => Promise<void>;
  getSubIssueFilters: (parentId: string) => Partial<IIssueFilters>;
  computedFilterParams: (parentId: string) => Partial<Record<TIssueParams, string | boolean>>;
  processSubIssueResponse: (issueResponse: TSubIssueResponse) => {
    issueList: TIssue[];
    groupedIssues: TIssues;
    groupedIssueCount: TGroupedIssueCount;
  };
}

export class WorkItemSubIssueFiltersStore implements IWorkItemSubIssueFiltersStore {
  // observables
  subIssueFiltersMap: Record<string, Partial<IIssueFilters>> = {};

  subIssueStore: IIssueSubIssuesStore;

  constructor(subIssueStore: IIssueSubIssuesStore) {
    makeObservable(this, {
      subIssueFiltersMap: observable,
      updateSubIssueFilters: action,
      getSubIssueFilters: action,
    });
    // sub issue store
    this.subIssueStore = subIssueStore;
  }

  /**
   * @description This method is used to initialize the sub issue filters
   * @param parentId
   */
  initSubIssueFilters = (parentId: string) => {
    set(this.subIssueFiltersMap, [parentId], {
      displayFilters: {},
      displayProperties: {
        key: true,
        issue_type: true,
        assignee: true,
        start_date: true,
        due_date: true,
        labels: true,
        priority: true,
        state: true,
      },
    });
  };

  /**
   * @description This method is used to process the sub issue response to provide the data to update the store
   * @param issueResponse
   * @returns issueList, list of issues data
   * @returns groupedIssues, grouped issue ids
   * @returns groupedIssueCount, object containing issue counts of individual groups
   */
  processSubIssueResponse = (
    issueResponse: TSubIssueResponse
  ): {
    issueList: TIssue[];
    groupedIssues: TIssues;
    groupedIssueCount: TGroupedIssueCount;
  } => {
    const issueResult = issueResponse;

    if (!issueResult) {
      return {
        issueList: [],
        groupedIssues: {},
        groupedIssueCount: {},
      };
    }

    //if is an array then it's an ungrouped response. return values with groupId as ALL_ISSUES
    if (Array.isArray(issueResult)) {
      return {
        issueList: issueResult,
        groupedIssues: {
          [ALL_ISSUES]: issueResult.map((issue) => issue.id),
        },
        groupedIssueCount: {
          [ALL_ISSUES]: issueResult.length,
        },
      };
    }

    const issueList: TIssue[] = [];
    const groupedIssues: TGroupedIssues | TSubGroupedIssues = {};
    const groupedIssueCount: TGroupedIssueCount = {};

    // update total issue count to ALL_ISSUES
    set(groupedIssueCount, [ALL_ISSUES], issueResult.length);

    // loop through all the groupIds from issue Result
    for (const groupId in issueResult) {
      const groupIssueResult = issueResult[groupId];

      // if groupIssueResult is undefined then continue the loop
      if (!groupIssueResult) continue;

      // set grouped Issue count of the current groupId
      set(groupedIssueCount, [groupId], groupIssueResult.length);

      // add the result to issueList
      issueList.push(...groupIssueResult);
      // set the issue Ids to the groupId path
      set(
        groupedIssues,
        [groupId],
        groupIssueResult.map((issue) => issue.id)
      );
    }

    return { issueList, groupedIssues, groupedIssueCount };
  };

  /**
   * @description This method is used to get the sub issue filters
   * @param parentId
   * @returns IIssueFilters
   */
  getSubIssueFilters = (parentId: string) => {
    if (!this.subIssueFiltersMap[parentId]) {
      this.initSubIssueFilters(parentId);
    }
    return this.subIssueFiltersMap[parentId];
  };

  computedFilterParams = (parentId: string) => {
    const displayFilters = this.getSubIssueFilters(parentId).displayFilters;

    const computedFilters: Partial<Record<TIssueParams, undefined | string[] | boolean | string>> = {
      order_by: displayFilters?.order_by || undefined,
      group_by: displayFilters?.group_by ? EIssueGroupByToServerOptions[displayFilters.group_by] : undefined,
    };

    const issueFiltersParams: Partial<Record<TIssueParams, boolean | string>> = {};
    Object.keys(computedFilters).forEach((key) => {
      const _key = key as TIssueParams;
      const _value: string | boolean | string[] | undefined = computedFilters[_key];
      const nonEmptyArrayValue = Array.isArray(_value) && _value.length === 0 ? undefined : _value;
      if (nonEmptyArrayValue != undefined)
        issueFiltersParams[_key] = Array.isArray(nonEmptyArrayValue)
          ? nonEmptyArrayValue.join(",")
          : nonEmptyArrayValue;
    });

    return issueFiltersParams;
  };

  /**
   * @description This method is used to update the sub issue filters
   * @param projectId
   * @param filterType
   * @param filters
   */
  updateSubIssueFilters = async (
    workspaceSlug: string,
    projectId: string,
    filterType: EIssueFilterType,
    filters: IIssueDisplayFilterOptions | IIssueDisplayProperties,
    parentId: string
  ) => {
    const _filters = this.getSubIssueFilters(parentId);
    switch (filterType) {
      case EIssueFilterType.DISPLAY_FILTERS: {
        set(this.subIssueFiltersMap, [parentId, "displayFilters"], { ..._filters.displayFilters, ...filters });
        this.subIssueStore.fetchSubIssues(workspaceSlug, projectId, parentId);
        break;
      }
      case EIssueFilterType.DISPLAY_PROPERTIES:
        set(this.subIssueFiltersMap, [parentId, "displayProperties"], {
          ..._filters.displayProperties,
          ...filters,
        });
        break;
    }
  };
}
