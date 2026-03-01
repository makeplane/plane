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
// plane web imports
import type { TWorkspaceMemberActivity } from "@/components/workspace/settings/members/sidebar/activity/helper";
// services
import { WorkspaceMembersActivityService } from "@/services/workspace-members-activity.service";
// store
import type { RootStore } from "@/plane-web/store/root.store";

const WORKSPACE_MEMBERS_ACTIVITY_SORT_ORDER_STORAGE_KEY = "workspace_members_activity_sort_order";

export interface IWorkspaceMembersActivityStore {
  // observables
  isActivitySidebarOpen: Map<string, boolean>;
  workspaceMembersActivityLoader: Map<string, TLoader>;
  workspaceMembersActivityMap: Map<string, TWorkspaceMemberActivity[]>;
  workspaceMembersActivitySortOrder: E_SORT_ORDER | undefined;
  // computed functions
  getWorkspaceMembersActivitySidebarOpen: (workspaceSlug: string) => boolean;
  getWorkspaceMembersActivityLoader: (workspaceSlug: string) => TLoader;
  getWorkspaceMembersActivity: (workspaceSlug: string) => TWorkspaceMemberActivity[] | undefined;
  getWorkspaceMembersActivitySortOrder: () => E_SORT_ORDER;
  // helper actions
  toggleWorkspaceMembersActivitySortOrder: () => void;
  toggleWorkspaceMembersActivitySidebar: (workspaceSlug: string, collapsed: boolean) => void;
  // actions
  fetchWorkspaceMembersActivity: (workspaceSlug: string) => Promise<void>;
}

export class WorkspaceMembersActivityStore implements IWorkspaceMembersActivityStore {
  // observables
  isActivitySidebarOpen: Map<string, boolean> = new Map();
  workspaceMembersActivityLoader: Map<string, TLoader> = new Map();
  workspaceMembersActivityMap: Map<string, TWorkspaceMemberActivity[]> = new Map();
  workspaceMembersActivitySortOrder: IWorkspaceMembersActivityStore["workspaceMembersActivitySortOrder"] = undefined;
  // services
  workspaceMembersActivityService: WorkspaceMembersActivityService;
  // store
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      // observable
      isActivitySidebarOpen: observable,
      workspaceMembersActivityLoader: observable,
      workspaceMembersActivityMap: observable,
      workspaceMembersActivitySortOrder: observable,
      // actions
      toggleWorkspaceMembersActivitySidebar: action,
      fetchWorkspaceMembersActivity: action,
    });
    this.rootStore = rootStore;
    this.workspaceMembersActivityService = new WorkspaceMembersActivityService();

    // autorun to get or set workspace members activity sort order to local storage
    autorun(() => {
      if (typeof localStorage === "undefined") return;
      if (this.workspaceMembersActivitySortOrder === undefined) {
        // Initialize sort order if not set
        const storedSortOrder =
          (localStorage.getItem(WORKSPACE_MEMBERS_ACTIVITY_SORT_ORDER_STORAGE_KEY) as E_SORT_ORDER | undefined) ??
          E_SORT_ORDER.ASC;
        this.workspaceMembersActivitySortOrder = storedSortOrder;
      } else {
        // Update local storage if sort order is set
        localStorage.setItem(WORKSPACE_MEMBERS_ACTIVITY_SORT_ORDER_STORAGE_KEY, this.workspaceMembersActivitySortOrder);
      }
    });
  }

  // computed functions
  /**
   * Get workspace members activity loader
   * @param workspaceSlug
   */
  getWorkspaceMembersActivityLoader = computedFn((workspaceSlug: string) =>
    this.workspaceMembersActivityLoader.get(workspaceSlug)
  );

  /**
   * Get workspace members activity sidebar open state
   * @param workspaceSlug
   */
  getWorkspaceMembersActivitySidebarOpen = computedFn(
    (workspaceSlug: string) => this.isActivitySidebarOpen.get(workspaceSlug) ?? false
  );

  /**
   * Get workspace members activity
   * @param workspaceSlug
   */
  getWorkspaceMembersActivity = computedFn((workspaceSlug: string) =>
    orderBy(
      this.workspaceMembersActivityMap.get(workspaceSlug) ?? [],
      "created_at",
      this.workspaceMembersActivitySortOrder
    )
  );

  /**
   * Get workspace members activity sort order
   */
  getWorkspaceMembersActivitySortOrder = computedFn(() => this.workspaceMembersActivitySortOrder ?? E_SORT_ORDER.ASC);

  // helper actions
  /**
   * Toggle the activity sidebar collapsed state
   * @param workspaceSlug
   * @param collapsed
   */
  toggleWorkspaceMembersActivitySidebar = action((workspaceSlug: string, collapsed: boolean) => {
    this.isActivitySidebarOpen.set(workspaceSlug, collapsed);
  });

  /**
   * Merge activities
   * @param currentActivities
   * @param newActivities
   */
  mergeActivities = (
    currentActivities: TWorkspaceMemberActivity[],
    newActivities: TWorkspaceMemberActivity[]
  ): TWorkspaceMemberActivity[] => {
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
   * Toggle workspace members activity sort order
   */
  toggleWorkspaceMembersActivitySortOrder = () => {
    this.workspaceMembersActivitySortOrder =
      this.workspaceMembersActivitySortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC;
  };

  // actions
  /**
   * Fetch workspace members activity
   * @param workspaceSlug
   */
  fetchWorkspaceMembersActivity = async (workspaceSlug: string) => {
    try {
      // Generate props
      let props = {};
      // Get the current workspace members activity
      const currentActivities = this.workspaceMembersActivityMap.get(workspaceSlug);
      // If there is a current workspace members activity, set the props to the last created_at date
      if (currentActivities && currentActivities.length > 0) {
        // set the loader
        this.workspaceMembersActivityLoader.set(workspaceSlug, "mutation");
        // Get the greatest date from current activities
        const maxCreatedAt = currentActivities.reduce(
          (max, activity) => (activity.created_at > max ? activity.created_at : max),
          currentActivities[0].created_at
        );
        if (maxCreatedAt) props = { created_at__gt: maxCreatedAt };
      } else {
        this.workspaceMembersActivityLoader.set(workspaceSlug, "init-loader");
      }
      // Fetch workspace members activity
      const activities = await this.workspaceMembersActivityService.getWorkspaceMembersActivity(workspaceSlug, props);
      runInAction(() => {
        const existingActivities = this.workspaceMembersActivityMap.get(workspaceSlug);
        if (!existingActivities) {
          this.workspaceMembersActivityMap.set(workspaceSlug, activities);
        } else {
          this.workspaceMembersActivityMap.set(workspaceSlug, this.mergeActivities(existingActivities, activities));
        }
      });
    } catch (error) {
      console.error("Error fetching workspace members activity", error);
      throw error;
    } finally {
      this.workspaceMembersActivityLoader.set(workspaceSlug, "loaded");
    }
  };
}
