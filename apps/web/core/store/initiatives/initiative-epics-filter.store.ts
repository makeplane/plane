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
// plane constants
import { EIssueFilterType } from "@plane/constants";
// types
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IIssueFilters,
  TIssueParams,
  TWorkItemFilterExpression,
} from "@plane/types";
// lib
import { storage } from "@/lib/local-storage";
// store
import type { RootStore } from "../../../ee/store/root.store";
import type { IBaseIssueFilterStore } from "../work-items/helpers/issue-filter-helper.store";
import { IssueFilterHelperStore } from "../work-items/helpers/issue-filter-helper.store";
import type { IIssueRootStore } from "../work-items/root.store";
import { DEFAULT_DISPLAY_PROPERTIES } from "../work-items/details/sub_issues_filter.store";

const EPIC_FILTERS_STORAGE_KEY = "initiative_epic_scope_filters";

export interface IInitiativeEpicsFilterStore extends IBaseIssueFilterStore {
  // helper actions
  getIssueFilters(initiativeId: string): IIssueFilters | undefined;
  getInitiativeEpicsFiltersById: (initiativeId: string) => IIssueFilters | undefined;
  updateEpicFilters: (
    workspaceSlug: string,
    filterType: EIssueFilterType,
    filters:
      | Partial<IIssueFilterOptions>
      | Partial<IIssueDisplayFilterOptions>
      | Partial<IIssueDisplayProperties>
      | TWorkItemFilterExpression,
    initiativeId: string
  ) => void;
  resetFilters: (initiativeId: string) => void;
}

export class InitiativeEpicsFilterStore extends IssueFilterHelperStore implements IInitiativeEpicsFilterStore {
  // observables
  filters: { [initiativeId: string]: IIssueFilters } = {};
  // root stores
  rootIssueStore: IIssueRootStore;
  rootStore: RootStore;

  constructor(_rootStore: IIssueRootStore, rootStore: RootStore) {
    super();
    makeObservable(this, {
      // observables
      filters: observable,
      // computed
      issueFilters: computed,
      appliedFilters: computed,
      // actions
      updateEpicFilters: action,
      getInitiativeEpicsFiltersById: action,
      resetFilters: action,
    });
    // root stores
    this.rootIssueStore = _rootStore;
    this.rootStore = rootStore;
  }

  // computed
  /**
   * @description This method is used to get the issue filters for the current initiative
   * @returns {IIssueFilters | undefined}
   */
  get issueFilters(): IIssueFilters | undefined {
    // For initiative epics, we don't have a single current initiativeId in rootIssueStore
    // So this computed property may not be used, but we keep it for interface compliance
    return undefined;
  }

  /**
   * @description This method is used to get the applied filters for the current initiative
   * @returns {Partial<Record<TIssueParams, string | boolean>> | undefined}
   */
  get appliedFilters(): Partial<Record<TIssueParams, string | boolean>> | undefined {
    // For initiative epics, we don't have a single current initiativeId in rootIssueStore
    // So this computed property may not be used, but we keep it for interface compliance
    return undefined;
  }

  // helpers
  /**
   * @description This method is used to get the issue filters for an initiative
   * @param initiativeId - The initiative id
   * @returns {IIssueFilters | undefined}
   */
  getIssueFilters(initiativeId: string): IIssueFilters | undefined {
    const displayFilters = this.filters[initiativeId] || undefined;
    if (isEmpty(displayFilters)) return undefined;
    return this.computedIssueFilters(displayFilters);
  }

  /**
   * Get stored rich filters from localStorage
   */
  private getStoredRichFilters = (initiativeId: string): TWorkItemFilterExpression | undefined => {
    const stored = storage.get(EPIC_FILTERS_STORAGE_KEY);
    if (!stored) return undefined;
    try {
      const parsed = JSON.parse(stored);
      return parsed?.[initiativeId]?.richFilters ?? undefined;
    } catch {
      return undefined;
    }
  };

  /**
   * Save rich filters to localStorage
   */
  private saveRichFiltersToStorage = (initiativeId: string, richFilters: TWorkItemFilterExpression): void => {
    const stored = storage.get(EPIC_FILTERS_STORAGE_KEY);
    let all: Record<string, { richFilters: TWorkItemFilterExpression }> = {};
    if (stored) {
      try {
        all = JSON.parse(stored);
      } catch {
        // ignore parse errors
      }
    }
    all[initiativeId] = { richFilters };
    storage.set(EPIC_FILTERS_STORAGE_KEY, JSON.stringify(all));
  };

  /**
   * Initialize the initiative epics filters, restoring richFilters from localStorage if available
   * @param initiativeId - The initiative id
   */
  initializeFilters = (initiativeId: string) => {
    const storedRichFilters = this.getStoredRichFilters(initiativeId);
    set(this.filters, [initiativeId, "displayProperties"], DEFAULT_DISPLAY_PROPERTIES);
    set(this.filters, [initiativeId, "richFilters"], storedRichFilters ?? {});
    set(this.filters, [initiativeId, "displayFilters"], {});
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
  updateEpicFilters = (
    workspaceSlug: string,
    filterType: EIssueFilterType,
    filters:
      | Partial<IIssueFilterOptions>
      | Partial<IIssueDisplayFilterOptions>
      | Partial<IIssueDisplayProperties>
      | TWorkItemFilterExpression,
    initiativeId: string
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
        case EIssueFilterType.FILTERS: {
          set(this.filters, [initiativeId, "richFilters"], filters);
          this.saveRichFiltersToStorage(initiativeId, filters as TWorkItemFilterExpression);
          this.rootStore.initiativeStore.scope.epics.fetchInitiativeEpics(workspaceSlug, initiativeId);
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
    this.saveRichFiltersToStorage(initiativeId, {});
    this.initializeFilters(initiativeId);
  };
}
