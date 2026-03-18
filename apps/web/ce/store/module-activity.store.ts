/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { makeObservable, observable, action, runInAction } from "mobx";
import { set } from "lodash-es";
import type { IModuleActivity } from "@plane/types";
import { ModuleActivityService } from "@/plane-web/services/module-activity.service";

export interface IModuleActivityStore {
  activitiesMap: Record<string, IModuleActivity[]>;
  nextCursorMap: Record<string, string | null>;
  nextPageResultsMap: Record<string, boolean>;
  loader: boolean;
  fetchActivities: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    loadMore?: boolean
  ) => Promise<IModuleActivity[]>;
  refreshActivities: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<IModuleActivity[]>;
  getActivitiesByModuleId: (moduleId: string) => IModuleActivity[] | undefined;
  hasMore: (moduleId: string) => boolean;
}

export class ModuleActivityStore implements IModuleActivityStore {
  activitiesMap: Record<string, IModuleActivity[]> = {};
  nextCursorMap: Record<string, string | null> = {};
  nextPageResultsMap: Record<string, boolean> = {};
  loader: boolean = false;
  moduleActivityService: ModuleActivityService;

  constructor() {
    makeObservable(this, {
      activitiesMap: observable,
      nextCursorMap: observable,
      nextPageResultsMap: observable,
      loader: observable.ref,
      fetchActivities: action,
      refreshActivities: action,
    });
    this.moduleActivityService = new ModuleActivityService();
  }

  getActivitiesByModuleId = (moduleId: string) => this.activitiesMap[moduleId];

  hasMore = (moduleId: string) => !!this.nextPageResultsMap[moduleId];

  fetchActivities = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    loadMore: boolean = false
  ): Promise<IModuleActivity[]> => {
    runInAction(() => {
      this.loader = true;
    });
    const cursor = loadMore ? (this.nextCursorMap[moduleId] ?? undefined) : undefined;
    try {
      const response = await this.moduleActivityService.fetchActivities(workspaceSlug, projectId, moduleId, cursor);
      runInAction(() => {
        const existing = loadMore ? (this.activitiesMap[moduleId] ?? []) : [];
        set(this.activitiesMap, moduleId, [...existing, ...response.results]);
        set(this.nextCursorMap, moduleId, response.next_cursor ?? null);
        set(this.nextPageResultsMap, moduleId, response.next_page_results ?? false);
        this.loader = false;
      });
      return response.results;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
      });
      throw error;
    }
  };

  refreshActivities = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string
  ): Promise<IModuleActivity[]> => {
    runInAction(() => {
      delete this.activitiesMap[moduleId];
      delete this.nextCursorMap[moduleId];
      delete this.nextPageResultsMap[moduleId];
    });
    return this.fetchActivities(workspaceSlug, projectId, moduleId);
  };
}
