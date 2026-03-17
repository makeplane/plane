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

import { action, makeObservable } from "mobx";
import milestoneService from "@/services/milestone.service";
import type { IIssueStore } from "@/store/work-items/issue.store";
import type { RootStore } from "@/plane-web/store/root.store";
import type { IMilestoneStore } from "./milestone.store";

export interface IWorkItemMilestoneStore {
  updateWorkItemMilestone: (
    workspaceSlug: string,
    projectId: string,
    workItemId: string,
    oldMilestoneId: string | undefined,
    newMilestoneId: string | undefined
  ) => Promise<void>;
}

export class WorkItemMilestoneStore {
  // store
  milestoneStore: IMilestoneStore;
  workItemStore: IIssueStore;

  constructor(
    private _milestoneStore: IMilestoneStore,
    private _rootStore: RootStore
  ) {
    makeObservable(this, {
      updateWorkItemMilestone: action,
    });

    // store
    this.milestoneStore = _milestoneStore;
    this.workItemStore = _rootStore.issue.issues;
  }

  // actions
  updateWorkItemMilestone = async (
    workspaceSlug: string,
    projectId: string,
    workItemId: string,
    oldMilestoneId: string | undefined,
    newMilestoneId: string | undefined
  ): Promise<void> => {
    // Early return if no change
    if (oldMilestoneId === newMilestoneId) return;

    const oldMilestoneInstance = oldMilestoneId
      ? this.milestoneStore.getMilestoneById(projectId, oldMilestoneId)
      : undefined;

    const updatedMilestoneInstance = newMilestoneId
      ? this.milestoneStore.getMilestoneById(projectId, newMilestoneId)
      : undefined;

    // Optimistic update
    this.workItemStore.updateIssue(workItemId, { milestone_id: newMilestoneId });

    // Optimistically update milestone work item arrays
    if (updatedMilestoneInstance && !updatedMilestoneInstance.work_item_ids.includes(workItemId)) {
      updatedMilestoneInstance.work_item_ids = [...updatedMilestoneInstance.work_item_ids, workItemId];
      this.milestoneStore.updateMilestoneProgress(projectId, updatedMilestoneInstance.id);
    }

    if (oldMilestoneInstance) {
      oldMilestoneInstance.work_item_ids = oldMilestoneInstance.work_item_ids.filter((id) => id !== workItemId);
      this.milestoneStore.updateMilestoneProgress(projectId, oldMilestoneInstance.id);
    }

    try {
      // Make API call
      if (updatedMilestoneInstance) {
        await milestoneService.updateWorkItemMilestone(
          workspaceSlug,
          projectId,
          workItemId,
          updatedMilestoneInstance.id
        );
      } else {
        // remove from milestone if milestoneId is not provided
        await milestoneService.removeWorkItemFromMilestone(workspaceSlug, projectId, workItemId);
      }
    } catch (error) {
      // Revert on error
      this.workItemStore.updateWorkItemWithoutSideEffects(workItemId, { milestone_id: oldMilestoneId });

      if (updatedMilestoneInstance) {
        updatedMilestoneInstance.work_item_ids = updatedMilestoneInstance.work_item_ids.filter(
          (id) => id !== workItemId
        );
        this.milestoneStore.updateMilestoneProgress(projectId, updatedMilestoneInstance.id);
      }

      if (oldMilestoneInstance) {
        oldMilestoneInstance.work_item_ids = [...oldMilestoneInstance.work_item_ids, workItemId];
        this.milestoneStore.updateMilestoneProgress(projectId, oldMilestoneInstance.id);
      }

      throw error;
    }
  };
}
