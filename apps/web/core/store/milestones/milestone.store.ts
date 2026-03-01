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

import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { MilestoneInstance } from "@plane/shared-state";
import type { TMilestone } from "@plane/types";
// services
import milestoneService from "@/services/milestone.service";
// stores
import type { RootStore } from "@/plane-web/store/root.store";
import type { IWorkItemMilestoneStore } from "./work-items.store";
import { WorkItemMilestoneStore } from "./work-items.store";

export interface IMilestoneStore {
  // observables
  milestonesMap: Map<string, Map<string, MilestoneInstance>>;
  milestoneLoader: boolean;

  // computed
  getProjectMilestoneIds: (projectId: string) => string[] | undefined;
  getMilestoneById: (projectId: string, milestoneId: string) => MilestoneInstance | undefined;
  isMilestonesEnabled: (workspaceSlug: string, projectId: string) => boolean;

  // milestone actions
  fetchMilestones: (workspaceSlug: string, projectId: string) => Promise<void>;
  createMilestone: (workspaceSlug: string, projectId: string, data: Partial<TMilestone>) => Promise<TMilestone>;
  updateWorkItems: (
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    workItemIds: string[]
  ) => Promise<void>;
  updateMilestone: (
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    data: Partial<TMilestone>
  ) => Promise<TMilestone>;
  deleteMilestone: (workspaceSlug: string, projectId: string, milestoneId: string) => Promise<void>;

  // work item actions
  fetchMilestoneWorkItems: (workspaceSlug: string, projectId: string, milestoneId: string) => Promise<string[]>;
  removeWorkItemFromMilestone: (
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    workItemId: string
  ) => Promise<void>;
  addWorkItemsToMilestone: (
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    workItemIds: string[]
  ) => Promise<void>;

  // helper methods
  updateMilestoneProgress: (projectId: string, milestoneId: string) => void;

  workItems: IWorkItemMilestoneStore;
}

export class MilestoneStore implements IMilestoneStore {
  // observables
  milestonesMap: Map<string, Map<string, MilestoneInstance>> = new Map();
  milestoneLoader: boolean = false;

  // root store
  rootStore: RootStore;

  // work items
  workItems: IWorkItemMilestoneStore;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      milestonesMap: observable,
      milestoneLoader: observable,

      // actions
      fetchMilestones: action,
      createMilestone: action,
      updateMilestone: action,
      deleteMilestone: action,
      fetchMilestoneWorkItems: action,
      removeWorkItemFromMilestone: action,
      addWorkItemsToMilestone: action,
    });

    this.rootStore = store;
    this.workItems = new WorkItemMilestoneStore(this, this.rootStore);
  }

  // computed
  getProjectMilestoneIds = computedFn((projectId: string): string[] | undefined => {
    const projectMap = this.milestonesMap.get(projectId);
    if (!projectMap) return undefined;

    return Array.from(projectMap.keys());
  });

  getMilestoneById = computedFn((projectId: string, milestoneId: string): MilestoneInstance | undefined => {
    const projectMap = this.milestonesMap.get(projectId);
    if (!projectMap) return undefined;

    return projectMap.get(milestoneId);
  });

  // actions
  fetchMilestones = async (workspaceSlug: string, projectId: string): Promise<void> => {
    try {
      this.milestoneLoader = true;

      const milestones = await milestoneService.list(workspaceSlug, projectId);

      runInAction(() => {
        // Get or create project map
        if (!this.milestonesMap.has(projectId)) {
          this.milestonesMap.set(projectId, new Map());
        }

        const projectMap = this.milestonesMap.get(projectId)!;

        // Create MilestoneInstance for each milestone (without work items)
        milestones.forEach((milestone) => {
          const instance = new MilestoneInstance(milestone);
          projectMap.set(milestone.id, instance);
        });

        this.milestoneLoader = false;
      });
    } catch (error) {
      runInAction(() => {
        this.milestoneLoader = false;
      });
      throw error;
    }
  };

  createMilestone = async (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TMilestone>
  ): Promise<TMilestone> => {
    const milestone = await milestoneService.create(workspaceSlug, projectId, data);

    runInAction(() => {
      // Get or create project map
      if (!this.milestonesMap.has(projectId)) {
        this.milestonesMap.set(projectId, new Map());
      }

      const projectMap = this.milestonesMap.get(projectId)!;

      // Create and store MilestoneInstance
      const instance = new MilestoneInstance(milestone);
      projectMap.set(milestone.id, instance);
    });

    return milestone;
  };

  updateMilestone = async (
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    data: Partial<TMilestone>
  ): Promise<TMilestone> => {
    try {
      const instance = this.getMilestoneById(projectId, milestoneId);
      if (!instance) throw new Error("Milestone not found");

      const updatedMilestone = await milestoneService.update(workspaceSlug, projectId, milestoneId, data);

      runInAction(() => {
        instance.update(updatedMilestone);
      });

      return updatedMilestone;
    } catch (error) {
      console.error("Failed to update milestone", error);
      throw error;
    }
  };

  deleteMilestone = async (workspaceSlug: string, projectId: string, milestoneId: string): Promise<void> => {
    await milestoneService.destroy(workspaceSlug, projectId, milestoneId);

    runInAction(() => {
      const projectMap = this.milestonesMap.get(projectId);
      if (projectMap) {
        projectMap.delete(milestoneId);
      }
    });
  };

  // Work item actions
  fetchMilestoneWorkItems = async (
    workspaceSlug: string,
    projectId: string,
    milestoneId: string
  ): Promise<string[]> => {
    const workItems = await milestoneService.getWorkItems(workspaceSlug, projectId, milestoneId);

    const instance = this.getMilestoneById(projectId, milestoneId);

    runInAction(() => {
      if (instance) {
        // Store issues in root issue store
        this.rootStore.issue.issues.addIssue(workItems);

        // Update instance work_item_ids
        instance.work_item_ids = workItems.map((item) => item.id);

        // Update progress
        this.updateMilestoneProgress(projectId, milestoneId);
      }
    });

    return workItems.map((item) => item.id);
  };

  updateWorkItems = async (
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    workItemIds: string[]
  ): Promise<void> => {
    try {
      const updatedWorkItems = await milestoneService.updateWorkItems(
        workspaceSlug,
        projectId,
        milestoneId,
        workItemIds
      );

      runInAction(() => {
        const instance = this.getMilestoneById(projectId, milestoneId);
        if (instance) {
          // Store updated issues in root issue store
          this.rootStore.issue.issues.addIssue(updatedWorkItems);

          // Update instance work_item_ids
          instance.work_item_ids = workItemIds;

          // Update progress
          this.updateMilestoneProgress(projectId, milestoneId);
        }
      });
    } catch (error) {
      console.error("Failed to update work items", error);
      throw error;
    }
  };

  removeWorkItemFromMilestone = async (
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    workItemId: string
  ): Promise<void> => {
    const instance = this.getMilestoneById(projectId, milestoneId);
    if (!instance) return;

    // Remove from instance
    const updatedWorkItemIds = instance.work_item_ids.filter((id) => id !== workItemId);

    // Update via service
    await this.updateWorkItems(workspaceSlug, projectId, milestoneId, updatedWorkItemIds);
  };

  addWorkItemsToMilestone = async (
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    workItemIds: string[]
  ): Promise<void> => {
    const instance = this.getMilestoneById(projectId, milestoneId);
    if (!instance) return;

    // Add to existing work items (filter out duplicates)
    const uniqueNewIds = workItemIds.filter((id) => !instance.work_item_ids.includes(id));
    const updatedWorkItemIds = [...instance.work_item_ids, ...uniqueNewIds];

    // Update via service
    await this.updateWorkItems(workspaceSlug, projectId, milestoneId, updatedWorkItemIds);
  };

  // Helper methods
  updateMilestoneProgress = (projectId: string, milestoneId: string): void => {
    const instance = this.getMilestoneById(projectId, milestoneId);
    if (!instance) return;

    // Get all work items from root issue store
    const workItems = instance.work_item_ids
      .map((id) => this.rootStore.issue.issues.getIssueById(id))
      .filter((workItem) => !!workItem);

    let completed = 0;
    let cancelled = 0;

    // Count completed and cancelled items
    workItems.forEach((workItem) => {
      const state = this.rootStore.state.getStateById(workItem.state_id);
      if (state?.group === "completed") completed += 1;
      else if (state?.group === "cancelled") cancelled += 1;
    });

    // Update instance progress
    instance.updateProgress({
      total_items: workItems.length,
      completed_items: completed,
      cancelled_items: cancelled,
    });
  };

  isMilestonesEnabled = computedFn((workspaceSlug: string, projectId: string) => {
    const isProjectFeatureEnabled = this.rootStore.projectDetails.isProjectFeatureEnabled(
      projectId,
      "is_milestone_enabled"
    );
    const isFeatureFlagEnabled = this.rootStore.featureFlags.getFeatureFlag(workspaceSlug, "MILESTONES", false);
    return isProjectFeatureEnabled && isFeatureFlagEnabled;
  });
}
