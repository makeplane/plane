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
import type { TProjectDisplayFilters } from "@plane/types";
import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import type { TExternalProjectFilterExpression } from "@plane/types";
import type { InitiativeProjectsStore } from "./initiative-projects.store";

const PROJECT_FILTERS_STORAGE_KEY = "initiative_project_scope_filters";

export type TInitiativeProjectFilters = {
  displayFilters?: TProjectDisplayFilters;
  richFilters?: TExternalProjectFilterExpression;
};

export interface IInitiativeProjectsFilterStore {
  initiativeProjectsFiltersMap: Record<string, TInitiativeProjectFilters>;
  getInitiativeProjectsFiltersById: (initiativeId: string) => TInitiativeProjectFilters | undefined;
  updateProjectFilters: (
    workspaceSlug: string,
    initiativeId: string,
    richFilters: TExternalProjectFilterExpression
  ) => void;
  resetFilters: (initiativeId: string) => void;
  // store
  initiativeProjectsStore: InitiativeProjectsStore;
  initiativeService: InitiativeService;
}

export class InitiativeProjectsFilterStore implements IInitiativeProjectsFilterStore {
  initiativeProjectsFiltersMap: Record<string, TInitiativeProjectFilters> = {};
  initiativeProjectsStore: InitiativeProjectsStore;
  initiativeService: InitiativeService;

  constructor(initiativeProjectsStore: InitiativeProjectsStore, initiativeService: InitiativeService) {
    makeObservable(this, {
      initiativeProjectsFiltersMap: observable,
      updateProjectFilters: action,
      getInitiativeProjectsFiltersById: action,
      resetFilters: action,
    });

    this.initiativeProjectsStore = initiativeProjectsStore;
    this.initiativeService = initiativeService;
  }

  /**
   * Get stored rich filters from localStorage
   */
  private getStoredRichFilters = (initiativeId: string): TExternalProjectFilterExpression | undefined => {
    const stored = storage.get(PROJECT_FILTERS_STORAGE_KEY);
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
  private saveRichFiltersToStorage = (initiativeId: string, richFilters: TExternalProjectFilterExpression): void => {
    const stored = storage.get(PROJECT_FILTERS_STORAGE_KEY);
    let all: Record<string, { richFilters: TExternalProjectFilterExpression }> = {};
    if (stored) {
      try {
        all = JSON.parse(stored);
      } catch {
        // ignore parse errors
      }
    }
    all[initiativeId] = { richFilters };
    storage.set(PROJECT_FILTERS_STORAGE_KEY, JSON.stringify(all));
  };

  /**
   * Initialize the initiative projects filters, restoring richFilters from localStorage if available
   * @param initiativeId - The initiative id
   */
  initializeFilters = (initiativeId: string) => {
    const storedRichFilters = this.getStoredRichFilters(initiativeId);
    set(this.initiativeProjectsFiltersMap, [initiativeId, "displayFilters"], {});
    set(this.initiativeProjectsFiltersMap, [initiativeId, "richFilters"], storedRichFilters ?? {});
  };

  /**
   * Return projects filters for an initiative
   * @param initiativeId
   * @returns filters map
   */
  getInitiativeProjectsFiltersById = (initiativeId: string) => {
    // initialize the filters if no exists before
    if (!this.initiativeProjectsFiltersMap?.[initiativeId]) {
      this.initializeFilters(initiativeId);
    }

    return this.initiativeProjectsFiltersMap?.[initiativeId];
  };

  /**
   * Update the initiative projects rich filters
   * @param initiativeId - The initiative id
   * @param richFilters - The rich filters expression
   */
  updateProjectFilters = (
    workspaceSlug: string,
    initiativeId: string,
    richFilters: TExternalProjectFilterExpression
  ) => {
    runInAction(() => {
      if (!this.initiativeProjectsFiltersMap[initiativeId]) {
        this.initializeFilters(initiativeId);
      }
      set(this.initiativeProjectsFiltersMap, [initiativeId, "richFilters"], richFilters);
    });

    this.saveRichFiltersToStorage(initiativeId, richFilters);

    this.initiativeProjectsStore.fetchInitiativeProjects(
      this.initiativeProjectsStore.rootStore.router.workspaceSlug ?? "",
      initiativeId
    );
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
