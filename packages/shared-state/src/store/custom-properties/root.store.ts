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

import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type {
  BaseCustomPropertyInstanceSchema,
  RootCustomPropertiesStoreSchema,
  CustomPropertyType,
  PermissionCheckArgs,
} from "@plane/types";
// local imports
import { WorkItemCustomPropertyInstance } from "./instances/work-item-custom-property.instance";
import { ProjectCustomPropertiesStore } from "./project-properties.store";
import { WorkspaceCustomPropertiesStore } from "./workspace-properties.store";

type RootCustomPropertiesStoreArgs = {
  getWorkspaceSlugById: (id: string) => string | undefined;
  can: (args: PermissionCheckArgs) => boolean;
};

export class RootCustomPropertiesStore<T extends CustomPropertyType> implements RootCustomPropertiesStoreSchema<T> {
  // private data
  private data: Map<string, BaseCustomPropertyInstanceSchema<T>> = new Map();
  // sub-stores
  projectWorkItemTypePropertiesStore: ProjectCustomPropertiesStore<T>;
  workspaceCustomPropertiesStore: WorkspaceCustomPropertiesStore<T>;

  constructor(private args: RootCustomPropertiesStoreArgs) {
    makeObservable<RootCustomPropertiesStore<T>, "data">(this, {
      // observables
      data: observable,
      // computed
      allProperties: computed,
      // actions
      addOrMutate: action,
      remove: action,
    });
    // sub-stores
    this.projectWorkItemTypePropertiesStore = new ProjectCustomPropertiesStore<T>({
      get: this.get.bind(this),
      addOrMutate: this.addOrMutate.bind(this),
      remove: this.remove.bind(this),
    });
    this.workspaceCustomPropertiesStore = new WorkspaceCustomPropertiesStore<T>({
      get: this.get.bind(this),
      addOrMutate: this.addOrMutate.bind(this),
      remove: this.remove.bind(this),
      can: args.can,
    });
  }

  get allProperties() {
    return Array.from(this.data.values());
  }

  get: RootCustomPropertiesStoreSchema<T>["get"] = computedFn((id) => {
    return this.data.get(id);
  });

  getByIds: RootCustomPropertiesStoreSchema<T>["getByIds"] = computedFn((ids) =>
    ids.map((id) => this.data.get(id)).filter((property) => property !== undefined)
  );

  addOrMutate: RootCustomPropertiesStoreSchema<T>["addOrMutate"] = (property) => {
    const existingInstance = this.get(property.id);

    if (!existingInstance) {
      const newInstance = new WorkItemCustomPropertyInstance<T>({
        data: property,
        getWorkspaceSlugById: this.args.getWorkspaceSlugById,
        can: this.args.can,
      });
      this.data.set(property.id, newInstance);
      return newInstance;
    }

    existingInstance.mutateProperties(property);
    return existingInstance;
  };

  remove: RootCustomPropertiesStoreSchema<T>["remove"] = (id) => {
    runInAction(() => {
      this.data.delete(id);
    });
  };
}
