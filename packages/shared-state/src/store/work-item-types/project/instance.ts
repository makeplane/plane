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
import { ProjectWorkItemTypesService } from "@plane/services";
import type {
  BaseWorkItemTypeInstanceSchema,
  EUserPermissions as EUserPermissionsType,
  ProjectWorkItemTypeInstanceSchema,
} from "@plane/types";
// local imports
import type { BaseWorkItemTypeInstanceArgs } from "../instances/base-instance";
import { BaseWorkItemTypeInstance } from "../instances/base-instance";

const projectTypeService = new ProjectWorkItemTypesService();

export type ProjectWorkItemTypeInstanceArgs = BaseWorkItemTypeInstanceArgs & {
  projectId: string;
  getProjectRoleByWorkspaceSlugAndProjectId: (
    workspaceSlug: string,
    projectId: string
  ) => EUserPermissionsType | undefined;
};

export class ProjectWorkItemTypeInstance extends BaseWorkItemTypeInstance implements ProjectWorkItemTypeInstanceSchema {
  private instanceArgs: ProjectWorkItemTypeInstanceArgs;

  constructor(args: ProjectWorkItemTypeInstanceArgs) {
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
      // actions
      updateType: action,
      linkProperties: action,
      reorderProperty: action,
      unlinkProperty: action,
    });
  }

  // permissions
  get canEdit(): boolean {
    return false;
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

  // actions
  updateType: BaseWorkItemTypeInstanceSchema["updateType"] = async (data) => {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) throw new Error("Workspace slug not available");
    return this.update(
      () =>
        projectTypeService.update({
          workspaceSlug,
          projectId: this.instanceArgs.projectId,
          typeId: this.id,
          data: data,
        }),
      data
    );
  };

  linkProperties: BaseWorkItemTypeInstanceSchema["linkProperties"] = async (propertyIds) => {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) throw new Error("Workspace slug not available");
    return this.link(() =>
      projectTypeService.linkProperty({
        workspaceSlug,
        projectId: this.instanceArgs.projectId,
        typeId: this.id,
        properties: propertyIds,
      })
    );
  };

  reorderProperty: BaseWorkItemTypeInstanceSchema["reorderProperty"] = async (propertyId, newSortOrder) => {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) throw new Error("Workspace slug not available");
    return this.reorder(
      () =>
        projectTypeService.reorderProperty({
          workspaceSlug,
          projectId: this.instanceArgs.projectId,
          typeId: this.id,
          propertyId,
          newSortOrder,
        }),
      propertyId,
      newSortOrder
    );
  };

  unlinkProperty: BaseWorkItemTypeInstanceSchema["unlinkProperty"] = async (propertyId) => {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) throw new Error("Workspace slug not available");
    return this.unlink(
      () =>
        projectTypeService.unlinkProperty({
          workspaceSlug,
          projectId: this.instanceArgs.projectId,
          typeId: this.id,
          propertyId,
        }),
      propertyId
    );
  };
}
