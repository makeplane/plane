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

import type { InitiativeService } from "@/services/initiative.service";
import { storage } from "@/lib/local-storage";
import type { IInitiativeScopeDisplayFiltersOptions } from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
import { action, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
import { InitiativeEpicStore } from "./initiative-epics.store";
import type { IInitiativeEpicStore } from "./initiative-epics.store";
import { InitiativeEpicsFilterStore } from "./initiative-epics-filter.store";
import { InitiativeProjectsStore } from "./initiative-projects.store";
import type { IInitiativeProjectsStore } from "./initiative-projects.store";
import type { RootStore } from "@/plane-web/store/root.store";

const DISPLAY_FILTERS_STORAGE_KEY = "initiative_scope_display_filters";

export interface IInitiativeScopeStore {
  epics: IInitiativeEpicStore;
  projects: IInitiativeProjectsStore;
  updateDisplayFilters: (initiativeId: string, displayFilters: Partial<IInitiativeScopeDisplayFiltersOptions>) => void;
  getDisplayFilters: (initiativeId: string) => IInitiativeScopeDisplayFiltersOptions | undefined;
}

const DEFAULT_DISPLAY_FILTERS: IInitiativeScopeDisplayFiltersOptions = {
  activeLayout: EIssueLayoutTypes.LIST,
  activeTab: "epics",
};

export class InitiativeScopeStore implements IInitiativeScopeStore {
  epics: IInitiativeEpicStore;
  projects: IInitiativeProjectsStore;
  rootStore: RootStore;
  displayFiltersMap: Map<string, IInitiativeScopeDisplayFiltersOptions> = new Map();

  constructor(_rootStore: RootStore, initiativeService: InitiativeService) {
    makeObservable(this, {
      displayFiltersMap: observable,
      updateDisplayFilters: action,
    });
    this.rootStore = _rootStore;
    this.epics = new InitiativeEpicStore(
      this.rootStore.issue,
      new InitiativeEpicsFilterStore(this.rootStore.issue, this.rootStore)
    );
    this.projects = new InitiativeProjectsStore(_rootStore, initiativeService);
  }

  /**
   * Get stored display filters from localStorage
   */
  private getStoredDisplayFilters = (initiativeId: string): IInitiativeScopeDisplayFiltersOptions | undefined => {
    const stored = storage.get(DISPLAY_FILTERS_STORAGE_KEY);
    if (!stored) return undefined;
    try {
      const parsed = JSON.parse(stored);
      return parsed?.[initiativeId] ?? undefined;
    } catch {
      return undefined;
    }
  };

  /**
   * Save display filters to localStorage
   */
  private saveDisplayFiltersToStorage = (
    initiativeId: string,
    filters: IInitiativeScopeDisplayFiltersOptions
  ): void => {
    const stored = storage.get(DISPLAY_FILTERS_STORAGE_KEY);
    let all: Record<string, IInitiativeScopeDisplayFiltersOptions> = {};
    if (stored) {
      try {
        all = JSON.parse(stored);
      } catch {
        // ignore parse errors
      }
    }
    all[initiativeId] = filters;
    storage.set(DISPLAY_FILTERS_STORAGE_KEY, JSON.stringify(all));
  };

  /**
   * When layout is Kanban, group by cannot be "none". Normalize to state_groups (epics) or states (projects).
   */
  private normalizeKanbanGroupBy(
    filters: IInitiativeScopeDisplayFiltersOptions
  ): IInitiativeScopeDisplayFiltersOptions {
    if (filters.activeLayout !== EIssueLayoutTypes.KANBAN) return filters;
    return {
      ...filters,
      epicGroupBy: filters.epicGroupBy === "none" || filters.epicGroupBy == null ? "state_groups" : filters.epicGroupBy,
      projectGroupBy:
        filters.projectGroupBy === "none" || filters.projectGroupBy == null ? "states" : filters.projectGroupBy,
    };
  }

  /**Initialize filters, restoring from localStorage if available */
  initDisplayFilters = (initiativeId: string) => {
    const stored = this.getStoredDisplayFilters(initiativeId);
    const filters = this.normalizeKanbanGroupBy(stored ?? DEFAULT_DISPLAY_FILTERS);
    this.displayFiltersMap.set(initiativeId, filters);
    this.saveDisplayFiltersToStorage(initiativeId, filters);
  };

  /**
   * Get display filters
   * @param initiativeId - The initiative id
   * @returns The display filters
   */
  getDisplayFilters = computedFn((initiativeId: string): IInitiativeScopeDisplayFiltersOptions | undefined => {
    if (!this.displayFiltersMap.has(initiativeId)) {
      this.initDisplayFilters(initiativeId);
    }
    return this.displayFiltersMap.get(initiativeId);
  });

  /**
   * Update display filters
   * @param initiativeId - The initiative id
   * @param displayFilters - The display filters
   */
  updateDisplayFilters = (initiativeId: string, displayFilters: Partial<IInitiativeScopeDisplayFiltersOptions>) => {
    const currentDisplayFilters = this.getDisplayFilters(initiativeId);

    let updatedFilters: IInitiativeScopeDisplayFiltersOptions = {
      ...(currentDisplayFilters ?? DEFAULT_DISPLAY_FILTERS),
      ...displayFilters,
    };
    updatedFilters = this.normalizeKanbanGroupBy(updatedFilters);
    this.displayFiltersMap.set(initiativeId, updatedFilters);
    this.saveDisplayFiltersToStorage(initiativeId, updatedFilters);
  };
}
