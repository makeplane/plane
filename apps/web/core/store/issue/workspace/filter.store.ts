/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isEmpty, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TSupportedFilterTypeForUpdate } from "@plane/constants";
import { EIssueFilterType, WORKSPACE_KANBAN_GROUP_BY_OPTIONS } from "@plane/constants";
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
import { WorkspaceService } from "@/services/workspace.service";
// local imports
import type { IBaseIssueFilterStore, IIssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
import { IssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
import type { IIssueRootStore } from "../root.store";

type TWorkspaceFilters = TStaticViewTypes;

export type TBaseFilterStore = IBaseIssueFilterStore & IIssueFilterHelperStore;

export interface IWorkspaceIssuesFilter extends TBaseFilterStore {
  // fetch action
  fetchFilters: (workspaceSlug: string, viewId: string) => Promise<void>;
  updateFilterExpression: (workspaceSlug: string, viewId: string, filters: TWorkItemFilterExpression) => void;
  updateFilters: (
    workspaceSlug: string,
    projectId: string | undefined,
    filterType: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate,
    viewId: string
  ) => void;
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

  /**
   * Applies layout-specific defaults to display filters:
   * - Kanban: defaults group_by to "state_detail.group" if unset or incompatible
   * - Calendar: defaults calendar config if missing
   */
  private applyLayoutDefaults(displayFilters: IIssueDisplayFilterOptions): void {
    if (displayFilters.layout === "kanban") {
      if (
        !displayFilters.group_by ||
        !WORKSPACE_KANBAN_GROUP_BY_OPTIONS.includes(
          displayFilters.group_by as (typeof WORKSPACE_KANBAN_GROUP_BY_OPTIONS)[number]
        )
      ) {
        displayFilters.group_by = "state_detail.group";
      }
    }

    if (displayFilters.layout === "calendar" && !displayFilters.calendar) {
      displayFilters.calendar = { layout: "month", show_weekends: true };
    }
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

    // Use the current layout to get the correct filter params

    const currentLayout = (userFilters?.displayFilters?.layout ?? EIssueLayoutTypes.SPREADSHEET) as EIssueLayoutTypes;
    const filteredParams = handleIssueQueryParamsByLayout(currentLayout, "my_issues");
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

    this.applyLayoutDefaults(displayFilters);

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
  updateFilterExpression: IWorkspaceIssuesFilter["updateFilterExpression"] = (workspaceSlug, viewId, filters) => {
    try {
      runInAction(() => {
        set(this.filters, [viewId, "richFilters"], filters);
      });

      // Fire-and-forget: UI updates optimistically, fetch runs in background
      this.rootIssueStore.workspaceIssues
        .fetchIssuesWithExistingPagination(workspaceSlug, viewId, "mutation")
        .catch((error) => {
          console.error("error while fetching issues after rich filter update", error instanceof Error ? error.message : error);
        });
    } catch (error) {
      console.error("error while updating rich filters", error instanceof Error ? error.message : error);
      throw error;
    }
  };

  updateFilters: IWorkspaceIssuesFilter["updateFilters"] = (workspaceSlug, _projectId, type, filters, viewId) => {
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
          // Apply layout-specific defaults (kanban group_by, calendar config)
          const prevGroupBy = _filters.displayFilters.group_by;
          const prevCalendar = _filters.displayFilters.calendar;
          this.applyLayoutDefaults(_filters.displayFilters);
          // Sync any defaults that were applied back to updatedDisplayFilters for local storage persistence
          if (_filters.displayFilters.group_by !== prevGroupBy) {
            updatedDisplayFilters.group_by = _filters.displayFilters.group_by;
          }
          if (_filters.displayFilters.calendar !== prevCalendar) {
            updatedDisplayFilters.calendar = _filters.displayFilters.calendar;
          }
          // Nullify sub_group_by if it now matches the normalized group_by (kanban-specific)
          if (
            _filters.displayFilters.layout === "kanban" &&
            _filters.displayFilters.group_by === _filters.displayFilters.sub_group_by
          ) {
            _filters.displayFilters.sub_group_by = null;
            updatedDisplayFilters.sub_group_by = null;
          }

          // When layout changes, clear issue IDs BEFORE updating the layout
          // This ensures IssueLayoutHOC shows the loader immediately (due to issueCount being undefined)
          // instead of trying to render with data in the wrong format
          if (updatedDisplayFilters.layout) {
            this.rootIssueStore.workspaceIssues.clearIssueIds();
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

          // Fetch issues when display filters change
          // Fire-and-forget pattern: UI updates optimistically via MobX, fetches run in background
          // Calendar layout is skipped — it needs date-range parameters that only the component can provide
          if (updatedDisplayFilters.layout && updatedDisplayFilters.layout !== "calendar") {
            // Layout is changing to kanban or spreadsheet - fetch with correct canGroup
            const needsGrouping = _filters.displayFilters.layout === "kanban";
            this.rootIssueStore.workspaceIssues.fetchIssues(
              workspaceSlug,
              viewId,
              "init-loader",
              { canGroup: needsGrouping, perPageCount: needsGrouping ? 30 : 100 }
            ).catch((error) => {
              console.error("error while fetching issues after layout change", error instanceof Error ? error.message : error);
            });
          } else if (!updatedDisplayFilters.layout) {
            this.rootIssueStore.workspaceIssues
              .fetchIssuesWithExistingPagination(workspaceSlug, viewId, "mutation")
              .catch((error) => {
                console.error("error while fetching issues after display filter update", error instanceof Error ? error.message : error);
              });
          }

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
      if (viewId)
        this.fetchFilters(workspaceSlug, viewId).catch((err) => {
          console.error("error while re-fetching filters", err instanceof Error ? err.message : err);
        });
      throw error;
    }
  };
}
