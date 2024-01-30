import isEmpty from "lodash/isEmpty";
// types
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IIssueFilters,
  IIssueFiltersResponse,
  TIssueKanbanFilters,
  TIssueParams,
  TStaticViewTypes,
} from "@plane/types";
// constants
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";
// lib
import { storage } from "lib/local-storage";

interface ILocalStoreIssueFilters {
  key: EIssuesStoreType;
  workspaceSlug: string;
  viewId: string | undefined; // It can be projectId, moduleId, cycleId, projectViewId
  userId: string | undefined;
  filters: IIssueFilters;
}

export interface IIssueFilterHelperStore {
  computedIssueFilters(filters: IIssueFilters): IIssueFilters;
  computedFilteredParams(
    filters: IIssueFilterOptions,
    displayFilters: IIssueDisplayFilterOptions,
    filteredParams: TIssueParams[]
  ): Partial<Record<TIssueParams, string | boolean>>;
  computedFilters(filters: IIssueFilterOptions): IIssueFilterOptions;
  computedDisplayFilters(
    displayFilters: IIssueDisplayFilterOptions,
    defaultValues?: IIssueDisplayFilterOptions
  ): IIssueDisplayFilterOptions;
  computedDisplayProperties(filters: IIssueDisplayProperties): IIssueDisplayProperties;
}

export class IssueFilterHelperStore implements IIssueFilterHelperStore {
  constructor() {}

  /**
   * @description This method is used to apply the display filters on the issues
   * @param {IIssueFilters} filters
   * @returns {IIssueFilters}
   */
  computedIssueFilters = (filters: IIssueFilters): IIssueFilters => ({
    filters: isEmpty(filters?.filters) ? undefined : filters?.filters,
    displayFilters: isEmpty(filters?.displayFilters) ? undefined : filters?.displayFilters,
    displayProperties: isEmpty(filters?.displayProperties) ? undefined : filters?.displayProperties,
    kanbanFilters: isEmpty(filters?.kanbanFilters) ? undefined : filters?.kanbanFilters,
  });

  /**
   * @description This method is used to convert the filters array params to string params
   * @param {IIssueFilterOptions} filters
   * @param {IIssueDisplayFilterOptions} displayFilters
   * @param {string[]} acceptableParamsByLayout
   * @returns {Partial<Record<TIssueParams, string | boolean>>}
   */
  computedFilteredParams = (
    filters: IIssueFilterOptions,
    displayFilters: IIssueDisplayFilterOptions,
    acceptableParamsByLayout: TIssueParams[]
  ) => {
    const computedFilters: Partial<Record<TIssueParams, undefined | string[] | boolean | string>> = {
      // issue filters
      priority: filters?.priority || undefined,
      state_group: filters?.state_group || undefined,
      state: filters?.state || undefined,
      assignees: filters?.assignees || undefined,
      mentions: filters?.mentions || undefined,
      created_by: filters?.created_by || undefined,
      labels: filters?.labels || undefined,
      start_date: filters?.start_date || undefined,
      target_date: filters?.target_date || undefined,
      project: filters.project || undefined,
      subscriber: filters.subscriber || undefined,
      // display filters
      type: displayFilters?.type || undefined,
      sub_issue: displayFilters?.sub_issue ?? true,
    };

    const issueFiltersParams: Partial<Record<TIssueParams, boolean | string>> = {};
    Object.keys(computedFilters).forEach((key) => {
      const _key = key as TIssueParams;
      const _value: string | boolean | string[] | undefined = computedFilters[_key];
      if (_value != undefined && acceptableParamsByLayout.includes(_key))
        issueFiltersParams[_key] = Array.isArray(_value) ? _value.join(",") : _value;
    });

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
    start_date: filters?.start_date || null,
    target_date: filters?.target_date || null,
    project: filters?.project || null,
    subscriber: filters?.subscriber || null,
  });

  /**
   * This PR is to get the filters of the fixed global views
   * @param currentUserId current logged in user id
   * @param type fixed view type
   * @returns filterOptions based on views
   */
  getComputedFiltersBasedOnViews = (currentUserId: string | undefined, type: TStaticViewTypes) => {
    const noFilters = this.computedFilters({});

    if (!currentUserId) return noFilters;

    switch (type) {
      case "assigned":
        return {
          ...noFilters,
          assignees: [currentUserId],
        };
      case "created":
        return {
          ...noFilters,
          created_by: [currentUserId],
        };
      case "subscribed":
        return {
          ...noFilters,
          subscriber: [currentUserId],
        };
      case "all-issues":
      default:
        return noFilters;
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
    const filters = displayFilters || defaultValues;

    return {
      calendar: {
        show_weekends: filters?.calendar?.show_weekends || false,
        layout: filters?.calendar?.layout || "month",
      },
      layout: filters?.layout || "list",
      order_by: filters?.order_by || "sort_order",
      group_by: filters?.group_by || null,
      sub_group_by: filters?.sub_group_by || null,
      type: filters?.type || null,
      sub_issue: filters?.sub_issue || false,
      show_empty_groups: filters?.show_empty_groups || false,
    };
  };

  /**
   * @description This method is used to apply the display properties on the issues
   * @param {IIssueDisplayProperties} displayProperties
   * @returns {IIssueDisplayProperties}
   */
  computedDisplayProperties = (displayProperties: IIssueDisplayProperties): IIssueDisplayProperties => ({
    assignee: displayProperties?.assignee ?? true,
    start_date: displayProperties?.start_date ?? true,
    due_date: displayProperties?.due_date ?? true,
    labels: displayProperties?.labels ?? true,
    priority: displayProperties?.priority ?? true,
    state: displayProperties?.state ?? true,
    sub_issue_count: displayProperties?.sub_issue_count ?? true,
    attachment_count: displayProperties?.attachment_count ?? true,
    link: displayProperties?.link ?? true,
    estimate: displayProperties?.estimate ?? true,
    key: displayProperties?.key ?? true,
    created_on: displayProperties?.created_on ?? true,
    updated_on: displayProperties?.updated_on ?? true,
  });

  /**
   * This Method returns true if the display properties changed requires a server side update
   * @param displayFilters
   * @returns
   */
  requiresServerUpdate = (displayFilters: IIssueDisplayFilterOptions) => {
    const SERVER_DISPLAY_FILTERS = ["sub_issue", "type"];
    const displayFilterKeys = Object.keys(displayFilters);

    return SERVER_DISPLAY_FILTERS.some((serverDisplayfilter: string) =>
      displayFilterKeys.includes(serverDisplayfilter)
    );
  };

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
      if (!currentFilterIndex && currentFilterIndex.length < 0) return undefined;

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
            [filterType]: filters[filterType],
          },
        };

      storage.set("issue_local_filters", JSON.stringify(storageFilters));
    },
  };
}
