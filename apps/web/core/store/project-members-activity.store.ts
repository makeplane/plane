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

import { concat, orderBy, uniq } from "lodash-es";
import { action, autorun, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { E_SORT_ORDER } from "@plane/constants";
import type { TLoader } from "@plane/types";
import type { TProjectMemberActivity } from "@/components/projects/settings/members/sidebar/activity/helper";
// services
import { ProjectMembersActivityService } from "@/services/project-members-activity.service";
// store
import type { RootStore } from "@/plane-web/store/root.store";

const PROJECT_MEMBERS_ACTIVITY_SORT_ORDER_STORAGE_KEY = "project_members_activity_sort_order";

export interface IProjectMembersActivityStore {
  // observables
  isProjectActivitySidebarOpen: Map<string, boolean>;
  projectMembersActivityLoader: Map<string, TLoader>;
  projectMembersActivityMap: Map<string, TProjectMemberActivity[]>;
  projectMembersActivitySortOrder: E_SORT_ORDER | undefined;
  // computed functions
  getProjectMembersActivitySidebarOpen: (projectId: string) => boolean;
  getProjectMembersActivityLoader: (projectId: string) => TLoader;
  getProjectMembersActivity: (projectId: string) => TProjectMemberActivity[] | undefined;
  getProjectMembersActivitySortOrder: () => E_SORT_ORDER;
  // helper actions
  toggleProjectMembersActivitySortOrder: () => void;
  toggleProjectMembersActivitySidebar: (projectId: string, collapse: boolean) => void;
  // actions
  fetchProjectMembersActivity: (workspaceSlug: string, projectId: string) => Promise<void>;
}

export class ProjectMembersActivityStore implements IProjectMembersActivityStore {
  // observables
  isProjectActivitySidebarOpen: Map<string, boolean> = new Map();
  projectMembersActivityLoader: Map<string, TLoader> = new Map();
  projectMembersActivityMap: Map<string, TProjectMemberActivity[]> = new Map();
  projectMembersActivitySortOrder: IProjectMembersActivityStore["projectMembersActivitySortOrder"] = undefined;
  // services
  projectMembersActivityService: ProjectMembersActivityService;
  // store
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      // observable
      isProjectActivitySidebarOpen: observable,
      projectMembersActivityLoader: observable,
      projectMembersActivityMap: observable,
      projectMembersActivitySortOrder: observable,
      // actions
      toggleProjectMembersActivitySidebar: action,
      fetchProjectMembersActivity: action,
    });
    this.rootStore = rootStore;
    this.projectMembersActivityService = new ProjectMembersActivityService();

    // autorun to get or set project members activity sort order to local storage
    autorun(() => {
      if (typeof localStorage === "undefined") return;
      if (this.projectMembersActivitySortOrder === undefined) {
        // Initialize sort order if not set
        const storedSortOrder =
          (localStorage.getItem(PROJECT_MEMBERS_ACTIVITY_SORT_ORDER_STORAGE_KEY) as E_SORT_ORDER | undefined) ??
          E_SORT_ORDER.ASC;
        this.projectMembersActivitySortOrder = storedSortOrder;
      } else {
        // Update local storage if sort order is set
        localStorage.setItem(PROJECT_MEMBERS_ACTIVITY_SORT_ORDER_STORAGE_KEY, this.projectMembersActivitySortOrder);
      }
    });
  }

  // computed functions
  /**
   * Get project members activity loader
   * @param projectId
   */
  getProjectMembersActivityLoader = computedFn((projectId: string) => this.projectMembersActivityLoader.get(projectId));

  /**
   * Get project members activity sidebar open state
   * @param projectId
   */
  getProjectMembersActivitySidebarOpen = computedFn(
    (projectId: string) => this.isProjectActivitySidebarOpen.get(projectId) ?? false
  );

  /**
   * Get project members activity
   * @param projectId
   */
  getProjectMembersActivity = computedFn((projectId: string) =>
    orderBy(this.projectMembersActivityMap.get(projectId) ?? [], "created_at", this.projectMembersActivitySortOrder)
  );

  /**
   * Get project members activity sort order
   */
  getProjectMembersActivitySortOrder = computedFn(() => this.projectMembersActivitySortOrder ?? E_SORT_ORDER.ASC);

  // helper actions
  /**
   * Toggle the project members activity sidebar state
   * @param projectId
   * @param collapse
   */
  toggleProjectMembersActivitySidebar = action((projectId: string, collapse: boolean) => {
    this.isProjectActivitySidebarOpen.set(projectId, collapse);
  });

  /**
   * Merge activities
   * @param currentActivities
   * @param newActivities
   */
  mergeActivities = (
    currentActivities: TProjectMemberActivity[],
    newActivities: TProjectMemberActivity[]
  ): TProjectMemberActivity[] => {
    // Create a map for lookups of new activities
    const newActivitiesMap = new Map(newActivities.map((activity) => [activity.id, activity]));

    // Update existing activities if they exist in new activities
    const updatedActivities = currentActivities.map((activity) => {
      const matchingNewActivity = newActivitiesMap.get(activity.id);
      return matchingNewActivity
        ? {
            ...activity,
            created_at: matchingNewActivity.created_at,
          }
        : activity;
    });

    // Find activities that don't exist in current activities
    const existingIdsSet = new Set(currentActivities.map((activity) => activity.id));
    const activitiesToAdd = newActivities.filter((activity) => !existingIdsSet.has(activity.id));

    // Combine and deduplicate
    return uniq(concat(updatedActivities, activitiesToAdd));
  };

  /**
   * Toggle project members activity sort order
   */
  toggleProjectMembersActivitySortOrder = () => {
    this.projectMembersActivitySortOrder =
      this.projectMembersActivitySortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC;
  };

  // actions
  /**
   * Fetch project members activity
   * @param workspaceSlug
   * @param projectId
   */
  fetchProjectMembersActivity = async (workspaceSlug: string, projectId: string) => {
    try {
      // Generate props
      let props = {};
      // Get the current project members activity
      const currentActivities = this.projectMembersActivityMap.get(projectId);
      // If there is a current project members activity, set the props to the last created_at date
      if (currentActivities && currentActivities.length > 0) {
        // set the loader
        this.projectMembersActivityLoader.set(projectId, "mutation");
        // Get the greatest date from current activities
        const maxCreatedAt = currentActivities.reduce(
          (max, activity) => (activity.created_at > max ? activity.created_at : max),
          currentActivities[0].created_at
        );
        if (maxCreatedAt) props = { created_at__gt: maxCreatedAt };
      } else {
        this.projectMembersActivityLoader.set(projectId, "init-loader");
      }
      // Fetch project members activity
      const activities = await this.projectMembersActivityService.getProjectMembersActivity(
        workspaceSlug,
        projectId,
        props
      );
      runInAction(() => {
        const existingActivities = this.projectMembersActivityMap.get(projectId);
        if (!existingActivities) {
          this.projectMembersActivityMap.set(projectId, activities);
        } else {
          this.projectMembersActivityMap.set(projectId, this.mergeActivities(existingActivities, activities));
        }
      });
    } catch (error) {
      console.error("Error fetching project members activity", error);
      throw error;
    } finally {
      this.projectMembersActivityLoader.set(projectId, "loaded");
    }
  };
}
