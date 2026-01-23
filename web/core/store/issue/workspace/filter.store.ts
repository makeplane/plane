import isArray from "lodash/isArray";
import isEmpty from "lodash/isEmpty";
import pickBy from "lodash/pickBy";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// base class
import { computedFn } from "mobx-utils";
import {
  IIssueFilterOptions,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  TIssueKanbanFilters,
  IIssueFilters,
  TIssueParams,
  TStaticViewTypes,
  IssuePaginationOptions,
} from "@plane/types";
import { EIssueFilterType, EIssueLayoutTypes, EIssuesStoreType } from "@/constants/issue";
// services
import { handleIssueQueryParamsByLayout } from "@/helpers/issue.helper";
import { WorkspaceService } from "@/plane-web/services";
import { IBaseIssueFilterStore, IssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
// helpers
// types
import { IIssueRootStore } from "../root.store";
// constants
// services

type TWorkspaceFilters = "all-issues" | "assigned" | "created" | "subscribed" | string;

export interface IWorkspaceIssuesFilter extends IBaseIssueFilterStore {
  // fetch action
  fetchFilters: (workspaceSlug: string, viewId: string) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string | undefined,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters,
    viewId: string
  ) => Promise<void>;
  //helper action
  getIssueFilters: (viewId: string | undefined) => IIssueFilters | undefined;
  getAppliedFilters: (viewId: string) => Partial<Record<TIssueParams, string | boolean>> | undefined;
  getFilterParams: (
    options: IssuePaginationOptions,
    viewId: string,
    cursor: string | undefined,
    groupId: string | undefined,
    subGroupId: string | undefined
  ) => Partial<Record<TIssueParams, string | boolean>>;
}

export class WorkspaceIssuesFilter extends IssueFilterHelperStore implements IWorkspaceIssuesFilter {
  // observables
  filters: { [viewId: string]: IIssueFilters } = {};
  // root store
  rootIssueStore;
  // services
  issueFilterService;

  constructor(_rootStore: IIssueRootStore) {
    super();
    makeObservable(this, {
      // observables
      filters: observable,
      // computed
      issueFilters: computed,
      appliedFilters: computed,
      // fetch actions
      fetchFilters: action,
      updateFilters: action,
    });
    // root store
    this.rootIssueStore = _rootStore;
    // services
    this.issueFilterService = new WorkspaceService();
  }

  getIssueFilters = (viewId: string | undefined) => {
    if (!viewId) return undefined;

    const displayFilters = this.filters[viewId] || undefined;
    if (isEmpty(displayFilters)) return undefined;

    const _filters: IIssueFilters = this.computedIssueFilters(displayFilters);

    return _filters;
  };

  getAppliedFilters = (viewId: string | undefined) => {
    if (!viewId) return undefined;

    const userFilters = this.getIssueFilters(viewId);
    if (!userFilters) return undefined;

    const filteredParams = handleIssueQueryParamsByLayout(EIssueLayoutTypes.SPREADSHEET, "my_issues");
    if (!filteredParams) return undefined;

    const filteredRouteParams: Partial<Record<TIssueParams, string | boolean>> = this.computedFilteredParams(
      userFilters?.filters as IIssueFilterOptions,
      userFilters?.displayFilters as IIssueDisplayFilterOptions,
      filteredParams
    );

    return filteredRouteParams;
  };

  get issueFilters() {
    const viewId = this.rootIssueStore.globalViewId;
    return this.getIssueFilters(viewId);
  }

  get appliedFilters() {
    const viewId = this.rootIssueStore.globalViewId;
    return this.getAppliedFilters(viewId);
  }

  getFilterParams = computedFn(
    (
      options: IssuePaginationOptions,
      viewId: string,
      cursor: string | undefined,
      groupId: string | undefined,
      subGroupId: string | undefined
    ) => {
      const filterParams = this.getAppliedFilters(viewId);

      const paginationParams = this.getPaginationParams(filterParams, options, cursor, groupId, subGroupId);
      return paginationParams;
    }
  );

  fetchFilters = async (workspaceSlug: string, viewId: TWorkspaceFilters) => {
    try {
      let filters: IIssueFilterOptions;
      let displayFilters: IIssueDisplayFilterOptions;
      let displayProperties: IIssueDisplayProperties;
      let kanbanFilters: TIssueKanbanFilters = {
        group_by: [],
        sub_group_by: [],
      };

      const _filters = this.handleIssuesLocalFilters.get(EIssuesStoreType.GLOBAL, workspaceSlug, undefined, viewId);
      displayFilters = this.computedDisplayFilters(_filters?.display_filters, {
        layout: EIssueLayoutTypes.SPREADSHEET,
        order_by: "-created_at",
      });
      displayProperties = this.computedDisplayProperties(_filters?.display_properties);
      kanbanFilters = {
        group_by: _filters?.kanban_filters?.group_by || [],
        sub_group_by: _filters?.kanban_filters?.sub_group_by || [],
      };

      if (["all-issues", "assigned", "created", "subscribed"].includes(viewId)) {
        const currentUserId = this.rootIssueStore.currentUserId;
        filters = this.getComputedFiltersBasedOnViews(currentUserId, viewId as TStaticViewTypes);
      } else {
        const _filters = await this.issueFilterService.getViewDetails(workspaceSlug, viewId);
        filters = this.computedFilters(_filters?.filters);
        displayFilters = this.computedDisplayFilters(_filters?.display_filters, {
          layout: EIssueLayoutTypes.SPREADSHEET,
          order_by: "-created_at",
        });
        displayProperties = this.computedDisplayProperties(_filters?.display_properties);
      }

      // override existing order by if ordered by manual sort_order
      if (displayFilters.order_by === "sort_order") {
        displayFilters.order_by = "-created_at";
      }

      runInAction(() => {
        set(this.filters, [viewId, "filters"], filters);
        set(this.filters, [viewId, "displayFilters"], displayFilters);
        set(this.filters, [viewId, "displayProperties"], displayProperties);
        set(this.filters, [viewId, "kanbanFilters"], kanbanFilters);
      });
    } catch (error) {
      throw error;
    }
  };

  updateFilters = async (
    workspaceSlug: string,
    projectId: string | undefined,
    type: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters,
    viewId: string
  ) => {
    try {
      const issueFilters = this.getIssueFilters(viewId);

      if (!issueFilters || isEmpty(filters)) return;

      const _filters = {
        filters: issueFilters.filters as IIssueFilterOptions,
        displayFilters: issueFilters.displayFilters as IIssueDisplayFilterOptions,
        displayProperties: issueFilters.displayProperties as IIssueDisplayProperties,
        kanbanFilters: issueFilters.kanbanFilters as TIssueKanbanFilters,
      };

      switch (type) {
        case EIssueFilterType.FILTERS: {
          const updatedFilters = filters as IIssueFilterOptions;
          _filters.filters = { ..._filters.filters, ...updatedFilters };

          runInAction(() => {
            Object.keys(updatedFilters).forEach((_key) => {
              set(this.filters, [viewId, "filters", _key], updatedFilters[_key as keyof IIssueFilterOptions]);
            });
          });
          const appliedFilters = _filters.filters || {};
          const filteredFilters = pickBy(appliedFilters, (value) => value && isArray(value) && value.length > 0);
          this.rootIssueStore.workspaceIssues.fetchIssuesWithExistingPagination(
            workspaceSlug,
            viewId,
            isEmpty(filteredFilters) ? "init-loader" : "mutation"
          );
          break;
        }
        case EIssueFilterType.DISPLAY_FILTERS: {
          const updatedDisplayFilters = filters as IIssueDisplayFilterOptions;
          _filters.displayFilters = { ..._filters.displayFilters, ...updatedDisplayFilters };

          // set sub_group_by to null if group_by is set to null
          if (_filters.displayFilters.group_by === null) {
            _filters.displayFilters.sub_group_by = null;
            updatedDisplayFilters.sub_group_by = null;
          }
          // set sub_group_by to null if layout is switched to kanban group_by and sub_group_by are same
          if (
            _filters.displayFilters.layout === "kanban" &&
            _filters.displayFilters.group_by === _filters.displayFilters.sub_group_by
          ) {
            _filters.displayFilters.sub_group_by = null;
            updatedDisplayFilters.sub_group_by = null;
          }
          // set group_by to state if layout is switched to kanban and group_by is null
          if (_filters.displayFilters.layout === "kanban" && _filters.displayFilters.group_by === null) {
            _filters.displayFilters.group_by = "state";
            updatedDisplayFilters.group_by = "state";
          }

          runInAction(() => {
            Object.keys(updatedDisplayFilters).forEach((_key) => {
              set(
                this.filters,
                [viewId, "displayFilters", _key],
                updatedDisplayFilters[_key as keyof IIssueDisplayFilterOptions]
              );
            });
          });

          this.rootIssueStore.workspaceIssues.fetchIssuesWithExistingPagination(workspaceSlug, viewId, "mutation");

          if (["all-issues", "assigned", "created", "subscribed"].includes(viewId))
            this.handleIssuesLocalFilters.set(EIssuesStoreType.GLOBAL, type, workspaceSlug, undefined, viewId, {
              display_filters: _filters.displayFilters,
            });
          break;
        }
        case EIssueFilterType.DISPLAY_PROPERTIES: {
          const updatedDisplayProperties = filters as IIssueDisplayProperties;
          _filters.displayProperties = { ..._filters.displayProperties, ...updatedDisplayProperties };

          runInAction(() => {
            Object.keys(updatedDisplayProperties).forEach((_key) => {
              set(
                this.filters,
                [viewId, "displayProperties", _key],
                updatedDisplayProperties[_key as keyof IIssueDisplayProperties]
              );
            });
            if (["all-issues", "assigned", "created", "subscribed"].includes(viewId))
              this.handleIssuesLocalFilters.set(EIssuesStoreType.GLOBAL, type, workspaceSlug, undefined, viewId, {
                display_properties: _filters.displayProperties,
              });
          });
          break;
        }

        case EIssueFilterType.KANBAN_FILTERS: {
          const updatedKanbanFilters = filters as TIssueKanbanFilters;
          _filters.kanbanFilters = { ..._filters.kanbanFilters, ...updatedKanbanFilters };

          const currentUserId = this.rootIssueStore.currentUserId;
          if (currentUserId)
            this.handleIssuesLocalFilters.set(EIssuesStoreType.GLOBAL, type, workspaceSlug, undefined, viewId, {
              kanban_filters: _filters.kanbanFilters,
            });

          runInAction(() => {
            Object.keys(updatedKanbanFilters).forEach((_key) => {
              set(
                this.filters,
                [viewId, "kanbanFilters", _key],
                updatedKanbanFilters[_key as keyof TIssueKanbanFilters]
              );
            });
          });

          break;
        }
        default:
          break;
      }
    } catch (error) {
      if (viewId) this.fetchFilters(workspaceSlug, viewId);
      throw error;
    }
  };
}
