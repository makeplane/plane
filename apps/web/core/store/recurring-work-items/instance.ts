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
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import type {
  IRecurringWorkItemActionCallbacks,
  TRecurringWorkItem,
  PermissionCheckArgs,
  PermissionActionForResource,
} from "@plane/types";

export type TRecurringWorkItemInstanceArgs = {
  updateActionCallback: IRecurringWorkItemActionCallbacks["update"];
  recurringWorkItemData: TRecurringWorkItem;
  can: (args: PermissionCheckArgs) => boolean;
  getWorkspaceSlugById: (workspaceId: string) => string | undefined;
  currentUserId: string | undefined;
};

export interface IRecurringWorkItemInstance extends TRecurringWorkItem {
  // computed
  asJSON: TRecurringWorkItem;
  canEdit: boolean;
  canConfigure: boolean;
  canDelete: boolean;
  // helper actions
  mutateInstance: (recurringWorkItemData: Partial<TRecurringWorkItem>) => void;
  // actions
  update: (recurringWorkItemData: Partial<TRecurringWorkItem>) => Promise<void>;
}

export class RecurringWorkItemInstance implements IRecurringWorkItemInstance {
  // properties
  id: TRecurringWorkItem["id"];
  workitem_blueprint: TRecurringWorkItem["workitem_blueprint"];
  enabled: TRecurringWorkItem["enabled"];
  start_at: TRecurringWorkItem["start_at"];
  end_at: TRecurringWorkItem["end_at"];
  interval_type: TRecurringWorkItem["interval_type"];
  interval_count: TRecurringWorkItem["interval_count"];
  workspace: TRecurringWorkItem["workspace"];
  project: TRecurringWorkItem["project"];
  created_at: TRecurringWorkItem["created_at"];
  updated_at: TRecurringWorkItem["updated_at"];
  created_by: TRecurringWorkItem["created_by"];
  updated_by: TRecurringWorkItem["updated_by"];

  // service
  protected updateActionCallback: TRecurringWorkItemInstanceArgs["updateActionCallback"];

  constructor(protected args: TRecurringWorkItemInstanceArgs) {
    const { updateActionCallback, recurringWorkItemData } = args;

    // properties
    this.id = recurringWorkItemData.id;
    this.workitem_blueprint = recurringWorkItemData.workitem_blueprint;
    this.enabled = recurringWorkItemData.enabled;
    this.start_at = recurringWorkItemData.start_at;
    this.end_at = recurringWorkItemData.end_at;
    this.interval_type = recurringWorkItemData.interval_type;
    this.interval_count = recurringWorkItemData.interval_count;
    this.workspace = recurringWorkItemData.workspace;
    this.project = recurringWorkItemData.project;
    this.created_at = recurringWorkItemData.created_at;
    this.updated_at = recurringWorkItemData.updated_at;
    this.created_by = recurringWorkItemData.created_by;
    this.updated_by = recurringWorkItemData.updated_by;

    // service
    this.updateActionCallback = updateActionCallback;

    makeObservable(this, {
      // observables
      id: observable,
      workitem_blueprint: observable,
      enabled: observable,
      start_at: observable,
      end_at: observable,
      interval_type: observable,
      interval_count: observable,
      workspace: observable,
      project: observable,
      created_at: observable,
      updated_at: observable,
      created_by: observable,
      updated_by: observable,
      // computed
      asJSON: computed,
      canEdit: computed,
      canConfigure: computed,
      canDelete: computed,
      // actions
      mutateInstance: action,
      update: action,
    });
  }

  // computed
  /**
   * @description Returns the template as JSON
   */
  get asJSON(): TRecurringWorkItem {
    return {
      id: this.id,
      workitem_blueprint: this.workitem_blueprint,
      enabled: this.enabled,
      start_at: this.start_at,
      end_at: this.end_at,
      interval_type: this.interval_type,
      interval_count: this.interval_count,
      workspace: this.workspace,
      project: this.project,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
      updated_by: this.updated_by,
    };
  }

  /**
   * @description Returns the workspace slug for the template instance
   */
  private get workspaceSlug() {
    return this.args.getWorkspaceSlugById(this.workspace);
  }

  private get permissionMeta() {
    return { resourceId: this.id };
  }

  private canPerformAction = action((action: PermissionActionForResource<"recurring_workitem">) => {
    if (!this.workspaceSlug) return false;

    return this.args.can({
      resource: "recurring_workitem",
      action,
      projectId: this.project,
      workspaceSlug: this.workspaceSlug,
      resourceMeta: this.permissionMeta,
    });
  });

  /**
   * @description Returns true if the current user can edit the recurring work item
   */
  get canEdit(): boolean {
    return this.canPerformAction("edit");
  }

  /**
   * @description Returns true if the current user can toggle the recurring work item enabled status
   */
  get canConfigure(): boolean {
    return this.canPerformAction("edit");
  }

  /**
   * @description Returns true if the current user can delete the recurring work item
   */
  get canDelete(): boolean {
    return this.canPerformAction("delete");
  }

  // helper actions
  /**
   * @description Update recurring work item instance
   * @param recurringWorkItemData Recurring work item data
   */
  mutateInstance = action((recurringWorkItemData: Partial<TRecurringWorkItem>): void => {
    if (!this.id) return;
    runInAction(() => {
      for (const key in recurringWorkItemData) {
        if (recurringWorkItemData.hasOwnProperty(key)) {
          const recurringWorkItemKey = key as keyof TRecurringWorkItem;
          set(this, recurringWorkItemKey, recurringWorkItemData[recurringWorkItemKey]);
        }
      }
    });
  });

  // actions
  /**
   * @description Updates the recurring work item on the server and updates the instance
   * @param recurringWorkItemData Recurring work item data
   */
  update = action(async (recurringWorkItemData: Partial<TRecurringWorkItem>): Promise<void> => {
    if (!this.id) return;
    try {
      const updatedRecurringWorkItem = await this.updateActionCallback(this.id, {
        // Include project and workspace to route update request to correct service
        project: this.project,
        workspace: this.workspace,
        ...recurringWorkItemData,
      });
      this.mutateInstance(updatedRecurringWorkItem);
    } catch (error) {
      console.error("RecurringWorkItemInstance.update -> error", error);
      throw error;
    }
  });
}
