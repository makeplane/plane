/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { isEmpty, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction, toJS } from "mobx";
import { computedFn } from "mobx-utils";
// plane constants
import { DEFAULT_PQL_FILTER_VALUE, EIssueFilterType } from "@plane/constants";
// types
import type {
  AdvancedFilterType,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IIssueFilters,
  IssuePaginationOptions,
  PQLFilterValue,
  TIssueGroupByOptions,
  TIssueParams,
  TWorkItemFilterExpression,
} from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
// utils
import { handleIssueQueryParamsByLayout } from "@plane/utils";
// lib
import { storage } from "@/lib/local-storage";
// store
import type { IBaseIssueFilterStore } from "../work-items/helpers/issue-filter-helper.store";
import { IssueFilterHelperStore } from "../work-items/helpers/issue-filter-helper.store";
import type { IIssueRootStore } from "../work-items/root.store";
import { DEFAULT_DISPLAY_PROPERTIES } from "../work-items/details/sub_issues_filter.store";
import type { RootStore } from "@/plane-web/store/root.store";

const EPIC_FILTERS_STORAGE_KEY = "initiative_epic_scope_filters";

export interface IInitiativeEpicsFilterStore extends IBaseIssueFilterStore {
  // observables
  currentInitiativeId: string | undefined;
  // helper actions
  setCurrentInitiativeId: (initiativeId: string | undefined) => void;
  getIssueFilters(initiativeId: string): IIssueFilters | undefined;
  getInitiativeEpicsFiltersById: (initiativeId: string) => IIssueFilters | undefined;
  getAppliedFilters: (initiativeId: string) => Partial<Record<TIssueParams, string | boolean>> | undefined;
  getFilterParams: (
    options: IssuePaginationOptions,
    initiativeId: string,
    cursor: string | undefined,
    groupId: string | undefined,
    subGroupId: string | undefined
  ) => Partial<Record<TIssueParams, string | boolean>>;
  updateEpicFilters: (
    workspaceSlug: string,
    filterType: EIssueFilterType,
    filters:
      | Partial<IIssueFilterOptions>
      | Partial<IIssueDisplayFilterOptions>
      | Partial<IIssueDisplayProperties>
      | TWorkItemFilterExpression
      | PQLFilterValue,
    initiativeId: string
  ) => void;
  resetFilters: (initiativeId: string) => void;
}

export class InitiativeEpicsFilterStore extends IssueFilterHelperStore implements IInitiativeEpicsFilterStore {
  // observables
  filters: { [initiativeId: string]: IIssueFilters } = {};
  currentInitiativeId: string | undefined = undefined;
  // root stores
  rootIssueStore: IIssueRootStore;
  rootStore: RootStore;

  constructor(_rootStore: IIssueRootStore, rootStore: RootStore) {
    super();
    makeObservable(this, {
      // observables
      filters: observable,
      currentInitiativeId: observable.ref,
      // computed
      issueFilters: computed,
      appliedFilters: computed,
      // actions
      setCurrentInitiativeId: action,
      updateEpicFilters: action,
      getInitiativeEpicsFiltersById: action,
      resetFilters: action,
    });
    // root stores
    this.rootIssueStore = _rootStore;
    this.rootStore = rootStore;
  }

  // actions
  /**
   * @description Set the current initiative ID being viewed
   * @param initiativeId - The initiative id
   */
  setCurrentInitiativeId = (initiativeId: string | undefined) => {
    this.currentInitiativeId = initiativeId;
  };

  // computed
  /**
   * @description This method is used to get the issue filters for the current initiative
   * @returns {IIssueFilters | undefined}
   */
  get issueFilters(): IIssueFilters | undefined {
    if (!this.currentInitiativeId) return undefined;
    return this.getIssueFilters(this.currentInitiativeId);
  }

  /**
   * @description This method is used to get the applied filters for the current initiative
   * @returns {Partial<Record<TIssueParams, string | boolean>> | undefined}
   */
  get appliedFilters(): Partial<Record<TIssueParams, string | boolean>> | undefined {
    if (!this.currentInitiativeId) return undefined;
    return this.getAppliedFilters(this.currentInitiativeId);
  }

  // helpers
  /**
   * @description This method is used to get the issue filters for an initiative
   * @param initiativeId - The initiative id
   * @returns {IIssueFilters | undefined}
   */
  getIssueFilters(initiativeId: string): IIssueFilters | undefined {
    const storedFilters = this.filters[initiativeId] || undefined;
    if (isEmpty(storedFilters)) return undefined;

    // Map epicGroupBy from initiative scope to TIssueGroupByOptions for list/kanban/gantt.
    // When "none", pass undefined so the store returns groupedIssueIds[ALL_ISSUES] for the list.
    const scopeDisplayFilters = this.rootStore.initiativeStore.scope.getDisplayFilters(initiativeId);
    const epicGroupBy = scopeDisplayFilters?.epicGroupBy;
    const group_by: TIssueGroupByOptions | undefined =
      epicGroupBy === "none" || epicGroupBy == null
        ? undefined
        : epicGroupBy === "state_groups"
          ? "state_detail.group"
          : (epicGroupBy as TIssueGroupByOptions);

    const filtersWithGroupBy: IIssueFilters = {
      ...storedFilters,
      displayFilters: {
        ...storedFilters.displayFilters,
        group_by,
        layout: scopeDisplayFilters?.activeLayout ?? EIssueLayoutTypes.KANBAN,
      },
    };

    return this.computedIssueFilters(filtersWithGroupBy);
  }

  getAppliedFilters(initiativeId: string): Partial<Record<TIssueParams, string | boolean>> | undefined {
    const userFilters = this.getIssueFilters(initiativeId);
    if (!userFilters) return undefined;

    const filteredParams = handleIssueQueryParamsByLayout(EIssueLayoutTypes.LIST, "issues");
    if (!filteredParams) return undefined;
    return this.computedFilteredParams(userFilters, filteredParams);
  }

  getFilterParams = computedFn(
    (
      options: IssuePaginationOptions,
      initiativeId: string,
      cursor: string | undefined,
      groupId: string | undefined,
      subGroupId: string | undefined
    ) => {
      const filterParams = this.getAppliedFilters(initiativeId);
      return this.getPaginationParams(filterParams, options, cursor, groupId, subGroupId);
    }
  );

  /**
   * Get stored rich filters from localStorage
   */
  private getStoredFilters = (
    initiativeId: string
  ):
    | {
        richFilters?: TWorkItemFilterExpression;
        pqlFilters?: PQLFilterValue;
        lastUsedFilterType?: AdvancedFilterType;
      }
    | undefined => {
    const stored = storage.get(EPIC_FILTERS_STORAGE_KEY);
    if (!stored) return undefined;
    try {
      const parsed = JSON.parse(stored)?.[initiativeId];
      return {
        richFilters: parsed?.richFilters,
        pqlFilters: parsed?.pqlFilters,
        lastUsedFilterType: parsed?.lastUsedFilterType,
      };
    } catch {
      return undefined;
    }
  };

  /**
   * Save filters to localStorage
   */
  private saveFiltersToStorage = (
    initiativeId: string,
    filters: Partial<Pick<IIssueFilters, "richFilters" | "pqlFilters" | "lastUsedFilterType">>
  ): void => {
    const stored = storage.get(EPIC_FILTERS_STORAGE_KEY);
    let all: Record<string, { richFilters: TWorkItemFilterExpression }> = {};
    if (stored) {
      try {
        all = JSON.parse(stored);
      } catch {
        // ignore parse errors
      }
    }
    all[initiativeId] = {
      ...all[initiativeId],
      ...filters,
    };
    storage.set(EPIC_FILTERS_STORAGE_KEY, JSON.stringify(all));
  };

  /**
   * Initialize the initiative epics filters, restoring richFilters from localStorage if available
   * @param initiativeId - The initiative id
   */
  initializeFilters = (initiativeId: string) => {
    const storedFilters = this.getStoredFilters(initiativeId);
    set(this.filters, [initiativeId], {
      richFilters: storedFilters?.richFilters || {},
      pqlFilters: storedFilters?.pqlFilters || DEFAULT_PQL_FILTER_VALUE,
      lastUsedFilterType: storedFilters?.lastUsedFilterType,
      displayFilters: {},
      displayProperties: DEFAULT_DISPLAY_PROPERTIES,
      kanbanFilters: { group_by: [], sub_group_by: [] },
    } satisfies IIssueFilters);
  };

  /**
   * Return epics filters for an initiative
   * @param initiativeId
   * @returns filters map
   */
  getInitiativeEpicsFiltersById = (initiativeId: string) => {
    // initialize the filters if no exists before
    if (!this.filters?.[initiativeId]) {
      this.initializeFilters(initiativeId);
    }

    return this.filters?.[initiativeId];
  };

  /**
   * Update display filters, display properties, or rich filters
   * @param workspaceSlug - The workspace slug
   * @param filterType - The filter type
   * @param filters - The filters to update
   * @param initiativeId - The initiative id
   */
  updateEpicFilters: IInitiativeEpicsFilterStore["updateEpicFilters"] = (
    workspaceSlug,
    filterType,
    filters,
    initiativeId
  ) => {
    runInAction(() => {
      if (!this.filters[initiativeId]) {
        this.initializeFilters(initiativeId);
      }

      const currentFilters = this.filters[initiativeId];

      switch (filterType) {
        case EIssueFilterType.DISPLAY_FILTERS: {
          const updatedDisplayFilters = filters as Partial<IIssueDisplayFilterOptions>;
          set(this.filters, [initiativeId, "displayFilters"], {
            ...currentFilters?.displayFilters,
            ...updatedDisplayFilters,
          });
          break;
        }
        case EIssueFilterType.DISPLAY_PROPERTIES: {
          const updatedDisplayProperties = filters as Partial<IIssueDisplayProperties>;
          set(this.filters, [initiativeId, "displayProperties"], {
            ...currentFilters?.displayProperties,
            ...updatedDisplayProperties,
          });
          break;
        }
        case EIssueFilterType.RICH_FILTERS: {
          set(this.filters, [initiativeId, "richFilters"], filters);
          this.saveFiltersToStorage(initiativeId, { richFilters: filters as TWorkItemFilterExpression });
          this.rootStore.initiativeStore.scope.epics.fetchIssuesWithExistingPagination(workspaceSlug, initiativeId);
          break;
        }
        case EIssueFilterType.PQL_FILTERS: {
          set(this.filters, [initiativeId, "pqlFilters"], filters);
          this.saveFiltersToStorage(initiativeId, { pqlFilters: filters as PQLFilterValue });
          this.rootStore.initiativeStore.scope.epics.fetchIssuesWithExistingPagination(workspaceSlug, initiativeId);
          break;
        }
        case EIssueFilterType.KANBAN_FILTERS: {
          const updatedKanbanFilters = filters as Partial<IIssueFilters["kanbanFilters"]>;
          set(this.filters, [initiativeId, "kanbanFilters"], {
            ...currentFilters?.kanbanFilters,
            ...updatedKanbanFilters,
          });
          break;
        }
        default:
          break;
      }
    });
  };

  /**
   * @description This method is used to reset the filters
   * @param initiativeId
   */
  resetFilters = (initiativeId: string) => {
    this.saveFiltersToStorage(initiativeId, {});
    this.initializeFilters(initiativeId);
  };
}
