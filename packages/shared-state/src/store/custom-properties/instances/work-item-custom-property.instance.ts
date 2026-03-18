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
import { WorkspacePropertiesService, WorkspacePropertyOptionsService } from "@plane/services";
import type {
  CustomProperty,
  CustomPropertyOption,
  CustomPropertyType,
  EUserWorkspaceRoles,
  TUserPermissions,
  TWorkItemPropertyResponse,
} from "@plane/types";
import { EUserPermissions } from "@plane/types";
// local imports
import type { BaseCustomPropertyInstanceArgs } from "./instance";
import { BaseCustomPropertyInstance } from "./instance";

const workspacePropertiesService = new WorkspacePropertiesService<CustomPropertyType>();
const workspacePropertyOptionsService = new WorkspacePropertyOptionsService();

export type WorkItemCustomPropertyInstanceArgs<T extends CustomPropertyType> = BaseCustomPropertyInstanceArgs<T> & {
  getWorkspaceRoleByWorkspaceSlug: (workspaceSlug: string) => TUserPermissions | EUserWorkspaceRoles | undefined;
};

export class WorkItemCustomPropertyInstance<T extends CustomPropertyType> extends BaseCustomPropertyInstance<T> {
  private instanceArgs: WorkItemCustomPropertyInstanceArgs<T>;

  constructor(args: WorkItemCustomPropertyInstanceArgs<T>) {
    super(args);
    this.instanceArgs = args;

    makeObservable(this, {
      // computed
      canEdit: computed,
      canDelete: computed,
      canEnableDisable: computed,
      // actions
      updateProperty: action,
      createPropertyOption: action,
      updatePropertyOption: action,
      deletePropertyOption: action,
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

  // actions
  updateProperty = async (data: Partial<CustomProperty<T>>): Promise<void> => {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) throw new Error("Workspace slug not available");
    await this.update(
      () =>
        workspacePropertiesService.update({ workspaceSlug, propertyId: this.id, data }) as Promise<
          TWorkItemPropertyResponse<T>
        >,
      data
    );
  };

  createPropertyOption = async (
    propertyOption: Partial<CustomPropertyOption>
  ): Promise<CustomPropertyOption | undefined> => {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) return undefined;
    return await this.createOption(() =>
      workspacePropertyOptionsService.create({
        workspaceSlug,
        customPropertyId: this.id,
        data: propertyOption,
      })
    );
  };

  updatePropertyOption = async (optionId: string, data: Partial<CustomPropertyOption>): Promise<void> => {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) return;
    await this.updateOption(() =>
      workspacePropertyOptionsService.update({
        workspaceSlug,
        customPropertyId: this.id,
        optionId,
        data,
      })
    );
  };

  deletePropertyOption = async (propertyOptionId: string): Promise<void> => {
    const workspaceSlug = this.workspaceSlug;
    if (!workspaceSlug) return;
    await this.removeOption(
      () =>
        workspacePropertyOptionsService.deleteOption({
          workspaceSlug,
          customPropertyId: this.id,
          issuePropertyOptionId: propertyOptionId,
        }),
      propertyOptionId
    );
  };
}
