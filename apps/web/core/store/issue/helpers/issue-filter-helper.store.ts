/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isEmpty } from "lodash-es";
// plane constants
import type { EIssueFilterType } from "@plane/constants";
import {
  EIssueGroupByToServerOptions,
  EServerGroupByToFilterOptions,
  ENABLE_ISSUE_DEPENDENCIES,
} from "@plane/constants";
import type {
  EIssuesStoreType,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IIssueFilters,
  IIssueFiltersResponse,
  IssuePaginationOptions,
  TIssueKanbanFilters,
  TIssueParams,
  TStaticViewTypes,
  TWorkItemFilterConditionData,
  TWorkItemFilterExpression,
} from "@plane/types";
import { EIssueLayoutTypes, LOGICAL_OPERATOR } from "@plane/types";
// helpers
import { getComputedDisplayFilters, getComputedDisplayProperties } from "@plane/utils";
// lib
import { storage } from "@/lib/local-storage";
import { getEnabledDisplayFilters } from "@/plane-web/store/issue/helpers/filter-utils";

interface ILocalStoreIssueFilters {
  key: EIssuesStoreType;
  workspaceSlug: string;
  viewId: string | undefined; // It can be projectId, moduleId, cycleId, projectViewId
  userId: string | undefined;
  filters: IIssueFilters;
}

type TSpreadsheetDisplayFilters = IIssueDisplayFilterOptions & {
  spreadsheet_columns?: (keyof IIssueDisplayProperties)[];
};

export interface IBaseIssueFilterStore {
  // observables
  filters: Record<string, IIssueFilters>;
  //computed
  appliedFilters: Partial<Record<TIssueParams, string | boolean>> | undefined;
  issueFilters: IIssueFilters | undefined;
}

export interface IIssueFilterHelperStore {
  computedIssueFilters(filters: IIssueFilters): IIssueFilters;
  computedFilteredParams(
    richFilters: TWorkItemFilterExpression,
    displayFilters: IIssueDisplayFilterOptions | undefined,
    acceptableParamsByLayout: TIssueParams[],
    currentUserId?: string
  ): Partial<Record<TIssueParams, string | boolean>>;
  computedFilters(filters: IIssueFilterOptions): IIssueFilterOptions;
  getFilterConditionBasedOnViews: (
    currentUserId: string | undefined,
    type: TStaticViewTypes
  ) => Partial<Record<TIssueParams, string>> | undefined;
  computedDisplayFilters(
    displayFilters: IIssueDisplayFilterOptions,
    defaultValues?: IIssueDisplayFilterOptions
  ): IIssueDisplayFilterOptions;
  computedDisplayProperties(filters: IIssueDisplayProperties): IIssueDisplayProperties;
}

export class IssueFilterHelperStore implements IIssueFilterHelperStore {
  private isAssigneeCondition = (condition: TWorkItemFilterConditionData) =>
    Object.keys(condition).some((key) => key.startsWith("assignee_id__"));

  private omitAssigneeConditions = (richFilters: TWorkItemFilterExpression): TWorkItemFilterExpression => {
    if (!richFilters || isEmpty(richFilters)) return {};

    if (LOGICAL_OPERATOR.AND in richFilters) {
      const filteredConditions = richFilters[LOGICAL_OPERATOR.AND].filter(
        (condition) => !this.isAssigneeCondition(condition)
      );

      return filteredConditions.length > 0
        ? {
            [LOGICAL_OPERATOR.AND]: filteredConditions,
          }
        : {};
    }

    const filteredEntries = Object.entries(richFilters).filter(([key]) => !key.startsWith("assignee_id__"));

    return Object.fromEntries(filteredEntries) as TWorkItemFilterExpression;
  };

  /**
   * @description This method is used to apply the display filters on the issues
   * @param {IIssueFilters} filters
   * @returns {IIssueFilters}
   */
  computedIssueFilters = (filters: IIssueFilters): IIssueFilters => ({
    richFilters: isEmpty(filters?.richFilters) ? {} : filters?.richFilters,
    displayFilters: isEmpty(filters?.displayFilters) ? undefined : filters?.displayFilters,
    displayProperties: isEmpty(filters?.displayProperties) ? undefined : filters?.displayProperties,
    kanbanFilters: isEmpty(filters?.kanbanFilters) ? undefined : filters?.kanbanFilters,
  });

  /**
   * @description This method is used to convert the filters array params to string params
   * @param {TWorkItemFilterExpression} richFilters
   * @param {IIssueDisplayFilterOptions} displayFilters
   * @param {string[]} acceptableParamsByLayout
   * @returns {Partial<Record<TIssueParams, string | boolean>>}
   */
  computedFilteredParams = (
    richFilters: TWorkItemFilterExpression,
    displayFilters: IIssueDisplayFilterOptions | undefined,
    acceptableParamsByLayout: TIssueParams[],
    currentUserId?: string
  ): Partial<Record<TIssueParams, string | boolean>> => {
    const computedDisplayFilters: Partial<Record<TIssueParams, undefined | string[] | boolean | string>> = {
      group_by: displayFilters?.group_by ? EIssueGroupByToServerOptions[displayFilters.group_by] : undefined,
      sub_group_by: displayFilters?.sub_group_by
        ? EIssueGroupByToServerOptions[displayFilters.sub_group_by]
        : undefined,
      order_by: displayFilters?.order_by || undefined,
      sub_issue: displayFilters?.sub_issue ?? true,
    };

    const issueFiltersParams: Partial<Record<TIssueParams, boolean | string>> = {};
    Object.keys(computedDisplayFilters).forEach((key) => {
      const _key = key as TIssueParams;
      const _value: string | boolean | string[] | undefined = computedDisplayFilters[_key];
      const nonEmptyArrayValue = Array.isArray(_value) && _value.length === 0 ? undefined : _value;
      if (nonEmptyArrayValue != undefined && acceptableParamsByLayout.includes(_key))
        issueFiltersParams[_key] = Array.isArray(nonEmptyArrayValue)
          ? nonEmptyArrayValue.join(",")
          : nonEmptyArrayValue;
    });

    const isAssignedToMeEnabled = displayFilters?.assigned_to_me === true && !!currentUserId;
    const effectiveRichFilters = isAssignedToMeEnabled ? this.omitAssigneeConditions(richFilters) : richFilters;

    // work item filters
    if (effectiveRichFilters && !isEmpty(effectiveRichFilters))
      issueFiltersParams.filters = JSON.stringify(effectiveRichFilters);

    if (isAssignedToMeEnabled) issueFiltersParams.assignees = currentUserId;

    if (displayFilters?.layout) issueFiltersParams.layout = displayFilters?.layout;

    if (ENABLE_ISSUE_DEPENDENCIES && displayFilters?.layout === EIssueLayoutTypes.GANTT)
      issueFiltersParams["expand"] = "issue_relation,issue_related";

    return issueFiltersParams;
  };

  /**
   * @description This method is used to apply the filters on the issues
   * @param {IIssueFilterOptions} filters
   * @returns {IIssueFilterOptions}
   */
  computedFilters = (filters: IIssueFilterOptions): IIssueFilterOptions => ({
    priority: filters?.priority || null,
    state: filters?.state || null,
    state_group: filters?.state_group || null,
    assignees: filters?.assignees || null,
    mentions: filters?.mentions || null,
    created_by: filters?.created_by || null,
    labels: filters?.labels || null,
    cycle: filters?.cycle || null,
    module: filters?.module || null,
    start_date: filters?.start_date || null,
    target_date: filters?.target_date || null,
    project: filters?.project || null,
    team_project: filters?.team_project || null,
    subscriber: filters?.subscriber || null,
    issue_type: filters?.issue_type || null,
  });

  /**
   * @description This method is used to get the filter conditions based on the views
   * @param currentUserId
   * @param type
   * @returns
   */
  getFilterConditionBasedOnViews: IIssueFilterHelperStore["getFilterConditionBasedOnViews"] = (currentUserId, type) => {
    if (!currentUserId) return undefined;
    switch (type) {
      case "assigned":
        return {
          assignees: currentUserId,
        };
      case "created":
        return {
          created_by: currentUserId,
        };
      case "subscribed":
        return {
          subscriber: currentUserId,
        };
      case "all-issues":
      default:
        return undefined;
    }
  };

  /**
   * @description This method is used to apply the display filters on the issues
   * @param {IIssueDisplayFilterOptions} displayFilters
   * @returns {IIssueDisplayFilterOptions}
   */
  computedDisplayFilters = (
    displayFilters: IIssueDisplayFilterOptions,
    defaultValues?: IIssueDisplayFilterOptions
  ): IIssueDisplayFilterOptions => {
    const spreadsheetColumns =
      (displayFilters as TSpreadsheetDisplayFilters | undefined)?.spreadsheet_columns ??
      (defaultValues as TSpreadsheetDisplayFilters | undefined)?.spreadsheet_columns;
    const computedFilters = getComputedDisplayFilters(displayFilters, defaultValues);
    const enabledDisplayFilters = getEnabledDisplayFilters(computedFilters);

    return {
      ...enabledDisplayFilters,
      spreadsheet_columns: spreadsheetColumns,
    } as TSpreadsheetDisplayFilters;
  };

  /**
   * @description This method is used to apply the display properties on the issues
   * @param {IIssueDisplayProperties} displayProperties
   * @returns {IIssueDisplayProperties}
   */
  computedDisplayProperties = (displayProperties: IIssueDisplayProperties): IIssueDisplayProperties =>
    getComputedDisplayProperties(displayProperties);

  handleIssuesLocalFilters = {
    fetchFiltersFromStorage: () => {
      const _filters = storage.get("issue_local_filters");
      return _filters ? JSON.parse(_filters) : [];
    },

    get: (
      currentView: EIssuesStoreType,
      workspaceSlug: string,
      viewId: string | undefined, // It can be projectId, moduleId, cycleId, projectViewId
      userId: string | undefined
    ) => {
      const storageFilters = this.handleIssuesLocalFilters.fetchFiltersFromStorage();
      const currentFilterIndex = storageFilters.findIndex(
        (filter: ILocalStoreIssueFilters) =>
          filter.key === currentView &&
          filter.workspaceSlug === workspaceSlug &&
          filter.viewId === viewId &&
          filter.userId === userId
      );
      if (currentFilterIndex < 0) return undefined;

      return storageFilters[currentFilterIndex]?.filters || {};
    },

    set: (
      currentView: EIssuesStoreType,
      filterType: EIssueFilterType,
      workspaceSlug: string,
      viewId: string | undefined, // It can be projectId, moduleId, cycleId, projectViewId
      userId: string | undefined,
      filters: Partial<IIssueFiltersResponse & { kanban_filters: TIssueKanbanFilters }>
    ) => {
      const storageFilters = this.handleIssuesLocalFilters.fetchFiltersFromStorage();
      const currentFilterIndex = storageFilters.findIndex(
        (filter: ILocalStoreIssueFilters) =>
          filter.key === currentView &&
          filter.workspaceSlug === workspaceSlug &&
          filter.viewId === viewId &&
          filter.userId === userId
      );

      if (currentFilterIndex < 0)
        storageFilters.push({
          key: currentView,
          workspaceSlug: workspaceSlug,
          viewId: viewId,
          userId: userId,
          filters: filters,
        });
      else
        storageFilters[currentFilterIndex] = {
          ...storageFilters[currentFilterIndex],
          filters: {
            ...storageFilters[currentFilterIndex].filters,
            [filterType]: filters[filterType as keyof IIssueFiltersResponse],
          },
        };
      // All group_by "filters" are stored in a single array, will cause inconsistency in case of duplicated values
      storage.set("issue_local_filters", JSON.stringify(storageFilters));
    },
  };

  /**
   * This Method returns true if the display properties changed requires a server side update
   * @param displayFilters
   * @returns
   */
  getShouldReFetchIssues = (displayFilters: IIssueDisplayFilterOptions) => {
    const NON_SERVER_DISPLAY_FILTERS = ["order_by", "sub_issue", "type", "assigned_to_me"];
    const displayFilterKeys = Object.keys(displayFilters);

    return NON_SERVER_DISPLAY_FILTERS.some((serverDisplayfilter: string) =>
      displayFilterKeys.includes(serverDisplayfilter)
    );
  };

  /**
   * This Method returns true if the display properties changed requires a server side update
   * @param displayFilters
   * @returns
   */
  getShouldClearIssues = (displayFilters: IIssueDisplayFilterOptions) => {
    const NON_SERVER_DISPLAY_FILTERS = ["layout"];
    const displayFilterKeys = Object.keys(displayFilters);

    return NON_SERVER_DISPLAY_FILTERS.some((serverDisplayfilter: string) =>
      displayFilterKeys.includes(serverDisplayfilter)
    );
  };

  /**
   * This Method is used to construct the url params along with paginated values
   * @param filterParams params generated from filters
   * @param options pagination options
   * @param cursor cursor if exists
   * @param groupId groupId if to fetch By group
   * @param subGroupId groupId if to fetch By sub group
   * @returns
   */
  getPaginationParams(
    filterParams: Partial<Record<TIssueParams, string | boolean>> | undefined,
    options: IssuePaginationOptions,
    cursor: string | undefined,
    groupId?: string,
    subGroupId?: string
  ) {
    // if cursor exists, use the cursor. If it doesn't exist construct the cursor based on per page count
    const pageCursor = cursor ? cursor : groupId ? `${options.perPageCount}:1:0` : `${options.perPageCount}:0:0`;

    // pagination params
    const paginationParams: Partial<Record<TIssueParams, string | boolean>> = {
      ...filterParams,
      cursor: pageCursor,
      per_page: options.perPageCount.toString(),
    };

    // If group by is specifically sent through options, like that for calendar layout, use that to group
    if (options.groupedBy) {
      paginationParams.group_by = options.groupedBy;
    }

    // If before and after dates are sent from option to filter by then, add them to filter the options
    if (options.after && options.before) {
      paginationParams["target_date"] = `${options.after};after,${options.before};before`;
    }

    // If groupId is passed down, add a filter param for that group Id
    if (groupId) {
      const groupBy = paginationParams["group_by"] as EIssueGroupByToServerOptions | undefined;
      delete paginationParams["group_by"];

      if (groupBy) {
        const groupByFilterOption = EServerGroupByToFilterOptions[groupBy];
        paginationParams[groupByFilterOption] = groupId;
      }
    }

    // If subGroupId is passed down, add a filter param for that subGroup Id
    if (subGroupId) {
      const subGroupBy = paginationParams["sub_group_by"] as EIssueGroupByToServerOptions | undefined;
      delete paginationParams["sub_group_by"];

      if (subGroupBy) {
        const subGroupByFilterOption = EServerGroupByToFilterOptions[subGroupBy];
        paginationParams[subGroupByFilterOption] = subGroupId;
      }
    }

    return paginationParams;
  }
}
