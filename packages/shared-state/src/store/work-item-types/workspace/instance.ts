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

import { action, computed, makeObservable } from "mobx";
// plane imports
import { WorkspaceWorkItemTypesService } from "@plane/services";
import type {
  BaseWorkItemTypeInstanceSchema,
  EUserWorkspaceRoles,
  TUserPermissions,
  WorkspaceWorkItemTypeInstanceSchema,
} from "@plane/types";
import { EUserPermissions } from "@plane/types";
// local imports
import type { BaseWorkItemTypeInstanceArgs } from "../instances/base-instance";
import { BaseWorkItemTypeInstance } from "../instances/base-instance";

const workspaceTypeService = new WorkspaceWorkItemTypesService();

export type WorkspaceWorkItemTypeInstanceArgs = BaseWorkItemTypeInstanceArgs & {
  getWorkspaceRoleByWorkspaceSlug: (workspaceSlug: string) => TUserPermissions | EUserWorkspaceRoles | undefined;
};

export class WorkspaceWorkItemTypeInstance
  extends BaseWorkItemTypeInstance
  implements WorkspaceWorkItemTypeInstanceSchema
{
  private instanceArgs: WorkspaceWorkItemTypeInstanceArgs;

  constructor(args: WorkspaceWorkItemTypeInstanceArgs) {
    super(args);
    this.instanceArgs = args;

    makeObservable(this, {
      // computed
      canEdit: computed,
      canDelete: computed,
      canEnableDisable: computed,
      canLinkProperties: computed,
      canUnlinkProperties: computed,
      canReorderProperties: computed,
      canSetAsDefault: computed,
      // actions
      updateType: action,
      linkProperties: action,
      reorderProperty: action,
      unlinkProperty: action,
    });
  }

  // permissions
  get canEdit(): boolean {
    const ws = this.workspaceSlug;
    return ws ? this.instanceArgs.getWorkspaceRoleByWorkspaceSlug(ws) === EUserPermissions.ADMIN : false;
  }

  get canDelete(): boolean {
    return this.canEdit;
  }

  get canEnableDisable(): boolean {
    return this.canEdit;
  }

  get canLinkProperties(): boolean {
    return this.canEdit;
  }

  get canUnlinkProperties(): boolean {
    return this.canEdit;
  }

  get canReorderProperties(): boolean {
    return this.canEdit;
  }

  get canSetAsDefault(): boolean {
    return this.canEdit && !this.is_default && this.is_active;
  }

  // actions
  updateType: BaseWorkItemTypeInstanceSchema["updateType"] = async (data, enableOptimisticUpdate) => {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) throw new Error("Workspace slug not available");
    return this.update(
      () => workspaceTypeService.update({ workspaceSlug, typeId: this.id, data }),
      data,
      enableOptimisticUpdate
    );
  };

  linkProperties: BaseWorkItemTypeInstanceSchema["linkProperties"] = async (propertyIds) => {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) throw new Error("Workspace slug not available");
    return this.link(() =>
      workspaceTypeService.linkProperty({ workspaceSlug, typeId: this.id, properties: propertyIds })
    );
  };

  reorderProperty: BaseWorkItemTypeInstanceSchema["reorderProperty"] = async (propertyId, newSortOrder) => {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) throw new Error("Workspace slug not available");
    return this.reorder(
      () => workspaceTypeService.reorderProperty({ workspaceSlug, typeId: this.id, propertyId, newSortOrder }),
      propertyId,
      newSortOrder
    );
  };

  unlinkProperty: BaseWorkItemTypeInstanceSchema["unlinkProperty"] = async (propertyId) => {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) throw new Error("Workspace slug not available");
    return this.unlink(
      () => workspaceTypeService.unlinkProperty({ workspaceSlug, typeId: this.id, propertyId }),
      propertyId
    );
  };
}
