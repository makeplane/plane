/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isEmpty, set } from "lodash-es";
import { runInAction } from "mobx";
// plane imports
import type { TSupportedFilterTypeForUpdate } from "@plane/constants";
import { EIssueFilterType } from "@plane/constants";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFiltersResponse,
  TIssueKanbanFilters,
  TSupportedFilterForUpdate,
  TWorkItemFilterExpression,
} from "@plane/types";
import { EIssueLayoutTypes, EIssuesStoreType } from "@plane/types";
// store
import type { IProjectIssuesFilter } from "@/store/issue/project";
import { ProjectIssuesFilter } from "@/store/issue/project";

export type IProjectEpicsFilter = IProjectIssuesFilter;

/**
 * Default display filters applied to the epics list when the user has no
 * locally persisted preferences yet: list layout, grouped by state.
 */
const EPIC_DEFAULT_DISPLAY_FILTERS: IIssueDisplayFilterOptions = {
  layout: EIssueLayoutTypes.LIST,
  group_by: "state",
  order_by: "sort_order",
  sub_issue: false,
};

/**
 * Filter store for the project-level epics list.
 *
 * Unlike the project work items filter store, there is NO server endpoint for
 * epic user properties in CE (no /epics-user-properties/ route). All filters
 * (rich filters, display filters, display properties, kanban toggles) are kept
 * fully client-side and persisted to localStorage through
 * `handleIssuesLocalFilters` under the `EIssuesStoreType.EPIC` key — distinct
 * from the project work items filters.
 *
 * NOTE: the base class annotates `fetchFilters` / `updateFilterExpression` /
 * `updateFilters` fields as MobX actions (non-writable) — so this subclass
 * overrides the protected `handleFetchFilters` / `handleUpdateFilterExpression`
 * / `handleUpdateFilters` prototype methods the base actions delegate to.
 */
export class ProjectEpicsFilter extends ProjectIssuesFilter implements IProjectEpicsFilter {
  /**
   * Persists a filter slice for the given project in localStorage under the
   * EPIC store key.
   */
  private saveEpicLocalFilters(
    workspaceSlug: string,
    projectId: string,
    filterType: EIssueFilterType,
    filters: Partial<IIssueFiltersResponse & { kanban_filters: TIssueKanbanFilters }>
  ) {
    const currentUserId = this.rootIssueStore.currentUserId;
    if (!currentUserId) return;
    this.handleIssuesLocalFilters.set(EIssuesStoreType.EPIC, filterType, workspaceSlug, projectId, currentUserId, filters);
  }

  /**
   * Hydrates the epic filters from localStorage (or local defaults) — no
   * server call is made.
   */
  protected override async handleFetchFilters(workspaceSlug: string, projectId: string): Promise<void> {
    const currentUserId = this.rootIssueStore.currentUserId;
    const localFilters = currentUserId
      ? (this.handleIssuesLocalFilters.get(EIssuesStoreType.EPIC, workspaceSlug, projectId, currentUserId) ?? {})
      : {};

    const richFilters: TWorkItemFilterExpression = localFilters?.rich_filters ?? {};
    const displayFilters = this.computedDisplayFilters(localFilters?.display_filters ?? {}, EPIC_DEFAULT_DISPLAY_FILTERS);
    const displayProperties = this.computedDisplayProperties(localFilters?.display_properties ?? {});
    const kanbanFilters: TIssueKanbanFilters = {
      group_by: localFilters?.kanban_filters?.group_by ?? [],
      sub_group_by: localFilters?.kanban_filters?.sub_group_by ?? [],
    };

    runInAction(() => {
      set(this.filters, [projectId, "richFilters"], richFilters);
      set(this.filters, [projectId, "displayFilters"], displayFilters);
      set(this.filters, [projectId, "displayProperties"], displayProperties);
      set(this.filters, [projectId, "kanbanFilters"], kanbanFilters);
    });
  }

  /**
   * Updates the rich filter expression in memory + localStorage and refetches
   * the epics list — no server persistence.
   */
  protected override async handleUpdateFilterExpression(
    workspaceSlug: string,
    projectId: string,
    filters: TWorkItemFilterExpression
  ): Promise<void> {
    runInAction(() => {
      set(this.filters, [projectId, "richFilters"], filters);
    });

    this.rootIssueStore.projectEpics.fetchIssuesWithExistingPagination(workspaceSlug, projectId, "mutation");
    this.saveEpicLocalFilters(workspaceSlug, projectId, EIssueFilterType.FILTERS, { rich_filters: filters });
  }

  /**
   * Updates display filters / display properties / kanban toggles in memory
   * and persists them to localStorage — no server persistence.
   */
  protected override async handleUpdateFilters(
    workspaceSlug: string,
    projectId: string,
    type: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate
  ): Promise<void> {
    if (isEmpty(this.filters) || isEmpty(this.filters[projectId])) return;

    const _filters = {
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
          this.rootIssueStore.projectEpics.clear(true); // clear epics for local store when some filters like layout changes
        }

        if (this.getShouldReFetchIssues(updatedDisplayFilters)) {
          this.rootIssueStore.projectEpics.fetchIssuesWithExistingPagination(workspaceSlug, projectId, "mutation");
        }

        this.saveEpicLocalFilters(workspaceSlug, projectId, type, {
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

        this.saveEpicLocalFilters(workspaceSlug, projectId, type, {
          display_properties: _filters.displayProperties,
        });
        break;
      }
      case EIssueFilterType.KANBAN_FILTERS: {
        const updatedKanbanFilters = filters as TIssueKanbanFilters;
        _filters.kanbanFilters = { ..._filters.kanbanFilters, ...updatedKanbanFilters };

        this.saveEpicLocalFilters(workspaceSlug, projectId, type, {
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
  }
}
