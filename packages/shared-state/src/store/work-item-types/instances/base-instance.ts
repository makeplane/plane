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

import { cloneDeep, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction, toJS } from "mobx";
// plane imports
import type { BaseWorkItemTypeInstanceSchema, TWorkItemType, TWorkItemTypeResponse } from "@plane/types";

export type BaseWorkItemTypeInstanceArgs = {
  data: TWorkItemTypeResponse;
  getWorkspaceSlugById: (id: string) => string | undefined;
};

export abstract class BaseWorkItemTypeInstance implements BaseWorkItemTypeInstanceSchema {
  created_at: BaseWorkItemTypeInstanceSchema["created_at"];
  created_by: BaseWorkItemTypeInstanceSchema["created_by"];
  description: BaseWorkItemTypeInstanceSchema["description"];
  id: BaseWorkItemTypeInstanceSchema["id"];
  is_active: BaseWorkItemTypeInstanceSchema["is_active"];
  is_default: BaseWorkItemTypeInstanceSchema["is_default"];
  is_epic: BaseWorkItemTypeInstanceSchema["is_epic"];
  is_global: BaseWorkItemTypeInstanceSchema["is_global"];
  level: BaseWorkItemTypeInstanceSchema["level"];
  logo_props: BaseWorkItemTypeInstanceSchema["logo_props"];
  name: BaseWorkItemTypeInstanceSchema["name"];
  project_ids: BaseWorkItemTypeInstanceSchema["project_ids"];
  properties: BaseWorkItemTypeInstanceSchema["properties"];
  updated_at: BaseWorkItemTypeInstanceSchema["updated_at"];
  updated_by: BaseWorkItemTypeInstanceSchema["updated_by"];
  workspace: BaseWorkItemTypeInstanceSchema["workspace"];

  constructor(private args: BaseWorkItemTypeInstanceArgs) {
    const { data } = args;
    this.created_at = data.created_at;
    this.created_by = data.created_by;
    this.description = data.description;
    this.id = data.id;
    this.is_active = data.is_active;
    this.is_default = data.is_default;
    this.is_epic = data.is_epic;
    this.is_global = data.is_global;
    this.level = data.level;
    this.logo_props = data.logo_props;
    this.name = data.name;
    this.project_ids = data.project_ids;
    this.properties = data.properties;
    this.updated_at = data.updated_at;
    this.updated_by = data.updated_by;
    this.workspace = data.workspace;

    makeObservable<BaseWorkItemTypeInstance, "update" | "link" | "reorder" | "unlink">(this, {
      created_at: observable.ref,
      created_by: observable.ref,
      description: observable.ref,
      id: observable.ref,
      is_active: observable.ref,
      is_default: observable.ref,
      is_epic: observable.ref,
      is_global: observable.ref,
      level: observable.ref,
      logo_props: observable,
      name: observable.ref,
      project_ids: observable,
      properties: observable,
      updated_at: observable.ref,
      updated_by: observable.ref,
      workspace: observable.ref,
      // computed
      asJSON: computed,
      linkedPropertyIds: computed,
      // actions
      mutateProperties: action,
      update: action,
      link: action,
      reorder: action,
      unlink: action,
    });
  }

  get asJSON() {
    return toJS({
      created_at: this.created_at,
      created_by: this.created_by,
      description: this.description,
      id: this.id,
      is_active: this.is_active,
      is_default: this.is_default,
      is_epic: this.is_epic,
      is_global: this.is_global,
      level: this.level,
      logo_props: this.logo_props,
      name: this.name,
      project_ids: this.project_ids,
      properties: this.properties,
      updated_at: this.updated_at,
      updated_by: this.updated_by,
      workspace: this.workspace,
    });
  }

  get workspaceSlug(): BaseWorkItemTypeInstanceSchema["workspaceSlug"] {
    return this.args.getWorkspaceSlugById(this.workspace);
  }

  get linkedPropertyIds(): string[] {
    return Object.keys(this.properties ?? {}).filter(Boolean);
  }

  abstract updateType(data: Partial<TWorkItemType>): Promise<void>;
  abstract linkProperties(propertyIds: string[]): Promise<void>;
  abstract reorderProperty(propertyId: string, newSortOrder: number): Promise<void>;
  abstract unlinkProperty(propertyId: string): Promise<void>;

  // abstract permissions
  abstract get canEdit(): boolean;
  abstract get canDelete(): boolean;
  abstract get canEnableDisable(): boolean;
  abstract get canLinkProperties(): boolean;
  abstract get canUnlinkProperties(): boolean;
  abstract get canReorderProperties(): boolean;
  abstract get canSetAsDefault(): boolean;

  mutateProperties: BaseWorkItemTypeInstanceSchema["mutateProperties"] = (data) => {
    runInAction(() => {
      for (const key in data) {
        if (Object.hasOwn(data, key)) {
          const typedKey = key as keyof TWorkItemTypeResponse;
          set(this, typedKey, data[typedKey]);
        }
      }
    });
  };

  protected update = async (
    callback: () => Promise<void>,
    data: Partial<TWorkItemType>,
    enableOptimisticUpdate: boolean = true
  ): Promise<void> => {
    const originalData = cloneDeep(this.asJSON);
    try {
      if (enableOptimisticUpdate) {
        this.mutateProperties(data);
      }
      await callback();
      if (!enableOptimisticUpdate) {
        this.mutateProperties(data);
      }
    } catch (error) {
      if (enableOptimisticUpdate) {
        this.mutateProperties(originalData);
      }
      console.error("Failed to update work item type instance:", error);
      throw error;
    }
  };

  protected link = async (callback: () => Promise<Record<string, number>>): Promise<void> => {
    const response = await callback();
    const updatedProperties = { ...(this.properties ?? {}), ...response };
    this.mutateProperties({ properties: updatedProperties });
  };

  protected reorder = async (
    callback: () => Promise<void>,
    propertyId: string,
    newSortOrder: number
  ): Promise<void> => {
    const updatedProperties = { ...(this.properties ?? {}), [propertyId]: newSortOrder };
    this.update(() => callback(), { properties: updatedProperties });
  };

  protected unlink = async (callback: () => Promise<void>, propertyId: string): Promise<void> => {
    await callback();
    const { [propertyId]: _, ...updatedProperties } = this.properties ?? {};
    this.mutateProperties({ properties: updatedProperties });
  };
}
