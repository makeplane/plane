/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isEmpty, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// base class
import { computedFn } from "mobx-utils";
import type { TSupportedFilterTypeForUpdate } from "@plane/constants";
import { EIssueFilterType } from "@plane/constants";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  TIssueKanbanFilters,
  IIssueFilters,
  TIssueParams,
  IssuePaginationOptions,
  TWorkItemFilterExpression,
  TSupportedFilterForUpdate,
} from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { handleIssueQueryParamsByLayout } from "@plane/utils";
import type { IBaseIssueFilterStore } from "../helpers/issue-filter-helper.store";
import { IssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
// helpers
// types
import type { IIssueRootStore } from "../root.store";
import { ProjectService } from "@/services/project";
// global board template
import { GlobalBoardSettings } from "@/lib/board-preferences/global-board";
// constants
// services

export interface IProjectIssuesFilter extends IBaseIssueFilterStore {
  // global board template
  globalBoard: GlobalBoardSettings;
  //helper actions
  getFilterParams: (
    options: IssuePaginationOptions,
    projectId: string,
    cursor: string | undefined,
    groupId: string | undefined,
    subGroupId: string | undefined
  ) => Partial<Record<TIssueParams, string | boolean>>;
  getIssueFilters(projectId: string): IIssueFilters | undefined;
  // action
  fetchFilters: (workspaceSlug: string, projectId: string) => Promise<void>;
  updateFilterExpression: (
    workspaceSlug: string,
    projectId: string,
    filters: TWorkItemFilterExpression
  ) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string,
    filterType: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate
  ) => Promise<void>;
}

export class ProjectIssuesFilter extends IssueFilterHelperStore implements IProjectIssuesFilter {
  // observables
  filters: { [projectId: string]: IIssueFilters } = {};
  // root store
  rootIssueStore: IIssueRootStore;
  // services
  projectService;
  // global board template
  globalBoard: GlobalBoardSettings;

  constructor(_rootStore: IIssueRootStore) {
    super();
    makeObservable(this, {
      // observables
      filters: observable,
      // computed
      issueFilters: computed,
      appliedFilters: computed,
      // actions
      fetchFilters: action,
      updateFilterExpression: action,
      updateFilters: action,
    });
    // root store
    this.rootIssueStore = _rootStore;
    // services
    this.projectService = new ProjectService();
    this.globalBoard = new GlobalBoardSettings(this);
  }

  get issueFilters() {
    const projectId = this.rootIssueStore.projectId;
    if (!projectId) return undefined;

    return this.getIssueFilters(projectId);
  }

  get appliedFilters() {
    const projectId = this.rootIssueStore.projectId;
    if (!projectId) return undefined;

    return this.getAppliedFilters(projectId);
  }

  getIssueFilters(projectId: string) {
    const displayFilters = this.filters[projectId] || undefined;
    if (isEmpty(displayFilters)) return undefined;

    return this.computedIssueFilters(displayFilters);
  }

  getAppliedFilters(projectId: string) {
    const userFilters = this.getIssueFilters(projectId);
    if (!userFilters) return undefined;

    const filteredParams = handleIssueQueryParamsByLayout(userFilters?.displayFilters?.layout, "issues");
    if (!filteredParams) return undefined;

    const filteredRouteParams: Partial<Record<TIssueParams, string | boolean>> = this.computedFilteredParams(
      userFilters?.richFilters,
      userFilters?.displayFilters,
      filteredParams
    );

    return filteredRouteParams;
  }

  getFilterParams = computedFn(
    (
      options: IssuePaginationOptions,
      projectId: string,
      cursor: string | undefined,
      groupId: string | undefined,
      subGroupId: string | undefined
    ) => {
      const filterParams = this.getAppliedFilters(projectId);
      const paginationParams = this.getPaginationParams(filterParams, options, cursor, groupId, subGroupId);
      return paginationParams;
    }
  );

  fetchFilters = async (workspaceSlug: string, projectId: string) => {
    const _filters = await this.projectService.getProjectUserProperties(workspaceSlug, projectId);

    // with the global board template on, the board shows the template, not the project row
    const { richFilters, displayFilters, displayProperties } = await this.globalBoard.resolveFetched(projectId, {
      richFilters: _filters?.rich_filters,
      displayFilters: this.computedDisplayFilters(_filters?.display_filters),
      displayProperties: this.computedDisplayProperties(_filters?.display_properties),
    });

    // fetching the kanban toggle helpers in the local storage
    const kanbanFilters = {
      group_by: [],
      sub_group_by: [],
    };
    const currentUserId = this.rootIssueStore.currentUserId;
    if (currentUserId) {
      const _kanbanFilters = this.handleIssuesLocalFilters.get(
        EIssuesStoreType.PROJECT,
        workspaceSlug,
        projectId,
        currentUserId
      );
      kanbanFilters.group_by = _kanbanFilters?.kanban_filters?.group_by || [];
      kanbanFilters.sub_group_by = _kanbanFilters?.kanban_filters?.sub_group_by || [];
    }

    runInAction(() => {
      set(this.filters, [projectId, "richFilters"], richFilters);
      set(this.filters, [projectId, "displayFilters"], displayFilters);
      set(this.filters, [projectId, "displayProperties"], displayProperties);
      set(this.filters, [projectId, "kanbanFilters"], kanbanFilters);
    });
  };

  /**
   * NOTE: This method is designed as a fallback function for the work item filter store.
   * Only use this method directly when initializing filter instances.
   * For regular filter updates, use this method as a fallback function for the work item filter store methods instead.
   */
  updateFilterExpression: IProjectIssuesFilter["updateFilterExpression"] = async (
    workspaceSlug,
    projectId,
    filters
  ) => {
    try {
      // a template change pushed into the filter instance is already applied
      if (this.globalBoard.isApplyingRemote) return;
      runInAction(() => {
        set(this.filters, [projectId, "richFilters"], filters);
      });

      this.rootIssueStore.projectIssues.fetchIssuesWithExistingPagination(workspaceSlug, projectId, "mutation");
      // with the global board template on, the change goes to the template
      if (this.globalBoard.isActive()) {
        await this.globalBoard.saveRichFilters(projectId, filters);
        return;
      }
      await this.projectService.updateProjectUserProperties(workspaceSlug, projectId, {
        rich_filters: filters,
      });
    } catch (error) {
      console.log("error while updating rich filters", error);
      throw error;
    }
  };

  updateFilters: IProjectIssuesFilter["updateFilters"] = async (workspaceSlug, projectId, type, filters) => {
    try {
      if (isEmpty(this.filters) || isEmpty(this.filters[projectId])) return;

      const _filters = {
        richFilters: this.filters[projectId].richFilters,
        displayFilters: this.filters[projectId].displayFilters as IIssueDisplayFilterOptions,
        displayProperties: this.filters[projectId].displayProperties as IIssueDisplayProperties,
        kanbanFilters: this.filters[projectId].kanbanFilters as TIssueKanbanFilters,
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
                [projectId, "displayFilters", _key],
                updatedDisplayFilters[_key as keyof IIssueDisplayFilterOptions]
              );
            });
          });

          if (this.getShouldClearIssues(updatedDisplayFilters)) {
            this.rootIssueStore.projectIssues.clear(true); // clear issues for local store when some filters like layout changes
          }

          if (this.getShouldReFetchIssues(updatedDisplayFilters)) {
            this.rootIssueStore.projectIssues.fetchIssuesWithExistingPagination(workspaceSlug, projectId, "mutation");
          }

          // with the global board template on, the change goes to the template
          if (this.globalBoard.isActive()) {
            await this.globalBoard.saveDisplayFilters(projectId, _filters.displayFilters);
            break;
          }
          await this.projectService.updateProjectUserProperties(workspaceSlug, projectId, {
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
                [projectId, "displayProperties", _key],
                updatedDisplayProperties[_key as keyof IIssueDisplayProperties]
              );
            });
          });

          // with the global board template on, the change goes to the template
          if (this.globalBoard.isActive()) {
            await this.globalBoard.saveDisplayProperties(projectId, _filters.displayProperties);
            break;
          }
          await this.projectService.updateProjectUserProperties(workspaceSlug, projectId, {
            display_properties: _filters.displayProperties,
          });
          break;
        }

        case EIssueFilterType.KANBAN_FILTERS: {
          const updatedKanbanFilters = filters as TIssueKanbanFilters;
          _filters.kanbanFilters = { ..._filters.kanbanFilters, ...updatedKanbanFilters };

          const currentUserId = this.rootIssueStore.currentUserId;
          if (currentUserId)
            this.handleIssuesLocalFilters.set(EIssuesStoreType.PROJECT, type, workspaceSlug, projectId, currentUserId, {
              kanban_filters: _filters.kanbanFilters,
            });

          runInAction(() => {
            Object.keys(updatedKanbanFilters).forEach((_key) => {
              set(
                this.filters,
                [projectId, "kanbanFilters", _key],
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
      this.fetchFilters(workspaceSlug, projectId);
      throw error;
    }
  };
}
