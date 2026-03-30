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

import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { INITIATIVE_DEFAULT_DISPLAY_FILTERS } from "@plane/constants";
import type { TInitiativeDisplayFilters } from "@plane/types";
// Plane-web
import { InitiativeService } from "@/services/initiative.service";
import type { TExternalInitiativeFilterExpression } from "@/types/initiative";
import type { CoreRootStore } from "@/store/root.store";

/** When layout is kanban, group_by cannot be undefined (None). Normalize to "state". */
function normalizeInitiativeDisplayFilters(filters: TInitiativeDisplayFilters): TInitiativeDisplayFilters {
  if (filters.layout !== "kanban") return filters;
  if (filters.group_by != null && filters.group_by !== undefined) return filters;
  return { ...filters, group_by: "state" };
}

export interface IInitiativeFilterStore {
  displayFilters: Record<string, TInitiativeDisplayFilters>;
  filters: Record<string, TExternalInitiativeFilterExpression>;

  currentInitiativeDisplayFilters: TInitiativeDisplayFilters;

  getInitiativeDisplayFilters: (workspaceSlug: string) => TInitiativeDisplayFilters;
  getInitiativeFilters: (workspaceSlug: string) => TExternalInitiativeFilterExpression | undefined;

  initInitiativeFilters: (workspaceSlug: string) => Promise<void>;
  updateDisplayFilters: (workspaceSlug: string, displayFilters: Partial<TInitiativeDisplayFilters>) => void;
  updateFilters: (workspaceSlug: string, filters: TExternalInitiativeFilterExpression) => void;
  clearAllFilters: (workspaceSlug: string) => void;
}

export class InitiativeFilterStore implements IInitiativeFilterStore {
  displayFilters: Record<string, TInitiativeDisplayFilters> = {};
  filters: Record<string, TExternalInitiativeFilterExpression> = {};

  // root store
  rootStore: CoreRootStore;
  // service
  initiativeService: InitiativeService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      displayFilters: observable,
      filters: observable,
      // actions
      initInitiativeFilters: action,
      updateDisplayFilters: action,
      updateFilters: action,
      clearAllFilters: action,
    });
    // root store
    this.rootStore = _rootStore;
    // service
    this.initiativeService = new InitiativeService();
  }

  get currentInitiativeDisplayFilters() {
    const workspaceSlug = this.rootStore.router.workspaceSlug;

    if (!workspaceSlug) return INITIATIVE_DEFAULT_DISPLAY_FILTERS;

    return this.getInitiativeDisplayFilters(workspaceSlug);
  }

  getInitiativeDisplayFilters = computedFn((workspaceSlug: string) => {
    const filters = this.displayFilters[workspaceSlug] ?? INITIATIVE_DEFAULT_DISPLAY_FILTERS;
    return normalizeInitiativeDisplayFilters(filters);
  });

  getInitiativeFilters = computedFn((workspaceSlug: string) => this.filters[workspaceSlug]);

  initInitiativeFilters = async (workspaceSlug: string) => {
    const userProperties = await this.initiativeService.fetchInitiativeUserProperties(workspaceSlug);

    runInAction(() => {
      this.displayFilters[workspaceSlug] = userProperties?.display_filters || INITIATIVE_DEFAULT_DISPLAY_FILTERS;
      this.filters[workspaceSlug] = userProperties?.rich_filters || {};
    });
  };

  updateDisplayFilters = async (workspaceSlug: string, displayFilters: Partial<TInitiativeDisplayFilters>) => {
    runInAction(() => {
      Object.keys(displayFilters).forEach((key) => {
        set(this.displayFilters, [workspaceSlug, key], displayFilters[key as keyof TInitiativeDisplayFilters]);
      });
      const current = this.displayFilters[workspaceSlug] ?? INITIATIVE_DEFAULT_DISPLAY_FILTERS;
      this.displayFilters[workspaceSlug] = normalizeInitiativeDisplayFilters(current);
    });

    try {
      await this.initiativeService.updateInitiativeUserProperties(workspaceSlug, {
        display_filters: this.displayFilters[workspaceSlug],
      });
    } catch (error) {
      console.error("Failed to save initiative display filters to user properties:", error);
    }
  };

  updateFilters = async (workspaceSlug: string, filters: TExternalInitiativeFilterExpression) => {
    // Update the state
    runInAction(() => {
      set(this.filters, workspaceSlug, filters);
    });

    try {
      await this.initiativeService.updateInitiativeUserProperties(workspaceSlug, {
        rich_filters: filters,
      });
    } catch (error) {
      console.error("Failed to save initiative filters to user properties:", error);
    }

    this.rootStore.initiativeStore.fetchFilteredInitiatives(workspaceSlug, filters);
  };

  clearAllFilters = async (workspaceSlug: string) => {
    runInAction(() => {
      this.filters[workspaceSlug] = {};
    });

    try {
      await this.initiativeService.updateInitiativeUserProperties(workspaceSlug, {
        rich_filters: {},
      });
    } catch (error) {
      console.error("Failed to clear initiative filters in user properties:", error);
    }
  };
}
