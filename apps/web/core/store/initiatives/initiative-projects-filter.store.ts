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
import type { TProjectDisplayFilters } from "@plane/types";
import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import type { TExternalProjectFilterExpression } from "../../components/initiatives/scope/filters/types";
import type { InitiativeProjectsStore } from "./initiative-projects.store";

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
   * Initialize the initiative projects filters
   * @param initiativeId - The initiative id
   */
  initializeFilters = (initiativeId: string) => {
    set(this.initiativeProjectsFiltersMap, [initiativeId, "displayFilters"], {});
    set(this.initiativeProjectsFiltersMap, [initiativeId, "richFilters"], {});
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
    this.initializeFilters(initiativeId);
  };
}
