import { isEmpty, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TSupportedFilterTypeForUpdate } from "@plane/constants";
import { EIssueFilterType } from "@plane/constants";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  TIssueKanbanFilters,
  IIssueFilters,
  TIssueParams,
  TStaticViewTypes,
  IssuePaginationOptions,
  TWorkItemFilterExpression,
  TSupportedFilterForUpdate,
} from "@plane/types";
import { EIssuesStoreType, EIssueLayoutTypes, STATIC_VIEW_TYPES } from "@plane/types";
import { handleIssueQueryParamsByLayout } from "@plane/utils";
// services
import { WorkspaceService } from "@/plane-web/services";
// local imports
import type { IBaseIssueFilterStore, IIssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
import { IssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
import type { IIssueRootStore } from "../root.store";

type TWorkspaceFilters = TStaticViewTypes;

export type TBaseFilterStore = IBaseIssueFilterStore & IIssueFilterHelperStore;

export interface IWorkspaceIssuesFilter extends TBaseFilterStore {
  // fetch action
  fetchFilters: (workspaceSlug: string, viewId: string) => Promise<void>;
  updateFilterExpression: (workspaceSlug: string, viewId: string, filters: TWorkItemFilterExpression) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string | undefined,
    filterType: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate,
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
      userFilters?.richFilters,
      userFilters?.displayFilters,
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
      let filterParams = this.getAppliedFilters(viewId);

      if (!filterParams) {
        filterParams = {};
      }

      if (STATIC_VIEW_TYPES.includes(viewId)) {
        const currentUserId = this.rootIssueStore.currentUserId;
        const paramForStaticView = this.getFilterConditionBasedOnViews(currentUserId, viewId);
        if (paramForStaticView) {
          filterParams = { ...filterParams, ...paramForStaticView };
        }
      }

      const paginationParams = this.getPaginationParams(filterParams, options, cursor, groupId, subGroupId);
      return paginationParams;
    }
  );

  fetchFilters = async (workspaceSlug: string, viewId: TWorkspaceFilters) => {
    let richFilters: TWorkItemFilterExpression;
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

    // Get the view details if the view is not a static view
    if (STATIC_VIEW_TYPES.includes(viewId) === false) {
      const _filters = await this.issueFilterService.getViewDetails(workspaceSlug, viewId);
      richFilters = _filters?.rich_filters;
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
      set(this.filters, [viewId, "richFilters"], richFilters);
      set(this.filters, [viewId, "displayFilters"], displayFilters);
      set(this.filters, [viewId, "displayProperties"], displayProperties);
      set(this.filters, [viewId, "kanbanFilters"], kanbanFilters);
    });
  };

  /**
   * NOTE: This method is designed as a fallback function for the work item filter store.
   * Only use this method directly when initializing filter instances.
   * For regular filter updates, use this method as a fallback function for the work item filter store methods instead.
   */
  updateFilterExpression: IWorkspaceIssuesFilter["updateFilterExpression"] = async (workspaceSlug, viewId, filters) => {
    try {
      runInAction(() => {
        set(this.filters, [viewId, "richFilters"], filters);
      });

      this.rootIssueStore.workspaceIssues.fetchIssuesWithExistingPagination(workspaceSlug, viewId, "mutation");
    } catch (error) {
      console.log("error while updating rich filters", error);
      throw error;
    }
  };

  updateFilters: IWorkspaceIssuesFilter["updateFilters"] = async (workspaceSlug, projectId, type, filters, viewId) => {
    try {
      const issueFilters = this.getIssueFilters(viewId);

      if (!issueFilters) return;

      const _filters = {
        richFilters: issueFilters.richFilters,
        displayFilters: issueFilters.displayFilters as IIssueDisplayFilterOptions,
        displayProperties: issueFilters.displayProperties as IIssueDisplayProperties,
        kanbanFilters: issueFilters.kanbanFilters as TIssueKanbanFilters,
      };

      switch (type) {
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
