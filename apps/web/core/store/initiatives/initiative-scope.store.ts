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
import type { IInitiativeScopeDisplayFiltersOptions } from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
import { action, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
import { InitiativeEpicStore } from "./initiative-epics.store";
import { InitiativeEpicsFilterStore } from "./initiative-epics-filter.store";
import { InitiativeProjectsStore } from "./initiative-projects.store";
import type { RootStore } from "@/plane-web/store/root.store";

export interface IInitiativeScopeStore {
  epics: InitiativeEpicStore;
  projects: InitiativeProjectsStore;
  updateDisplayFilters: (initiativeId: string, displayFilters: Partial<IInitiativeScopeDisplayFiltersOptions>) => void;
  getDisplayFilters: (initiativeId: string) => IInitiativeScopeDisplayFiltersOptions | undefined;
}

const DEFAULT_DISPLAY_FILTERS: IInitiativeScopeDisplayFiltersOptions = {
  activeLayout: EIssueLayoutTypes.LIST,
  activeTab: "epics",
};

export class InitiativeScopeStore implements IInitiativeScopeStore {
  epics: InitiativeEpicStore;
  projects: InitiativeProjectsStore;
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

  /**Initialize filters */
  initDisplayFilters = (initiativeId: string) => {
    this.displayFiltersMap.set(initiativeId, DEFAULT_DISPLAY_FILTERS);
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

    this.displayFiltersMap.set(initiativeId, {
      ...(currentDisplayFilters ?? DEFAULT_DISPLAY_FILTERS),
      ...displayFilters,
    });
  };
}
