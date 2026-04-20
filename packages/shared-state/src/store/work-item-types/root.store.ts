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
import type { BaseWorkItemTypeInstanceSchema, PermissionCheckArgs, RootWorkItemTypesStoreSchema } from "@plane/types";
// local imports
import { ProjectWorkItemTypesStore } from "./project/store";
import { WorkspaceWorkItemTypesStore } from "./workspace/store";

type RootWorkItemTypesStoreArgs = {
  getWorkspaceSlugById: (id: string) => string | undefined;
  can: (args: PermissionCheckArgs) => boolean;
};

export class RootWorkItemTypesStore implements RootWorkItemTypesStoreSchema {
  // private data
  private data: Map<string, BaseWorkItemTypeInstanceSchema> = new Map();
  // sub-stores
  workspaceWorkItemTypesStore: WorkspaceWorkItemTypesStore;
  projectWorkItemTypesStore: ProjectWorkItemTypesStore;

  constructor(private args: RootWorkItemTypesStoreArgs) {
    makeObservable<RootWorkItemTypesStore, "data">(this, {
      // observables
      data: observable,
      // computed
      allTypes: computed,
      // actions
      addOrMutate: action,
      remove: action,
    });
    // sub-stores
    this.projectWorkItemTypesStore = new ProjectWorkItemTypesStore({
      get: this.get.bind(this),
      addOrMutate: this.addOrMutate.bind(this),
      remove: this.remove.bind(this),
      getWorkspaceSlugById: this.args.getWorkspaceSlugById,
      can: this.args.can,
    });
    this.workspaceWorkItemTypesStore = new WorkspaceWorkItemTypesStore({
      get: this.get.bind(this),
      addOrMutate: this.addOrMutate.bind(this),
      remove: this.remove.bind(this),
      getWorkspaceSlugById: this.args.getWorkspaceSlugById,
      can: this.args.can,
      enrichProjectTypeIds: this.projectWorkItemTypesStore.enrichTypeIdsFromWorkspaceTypes.bind(
        this.projectWorkItemTypesStore
      ),
    });
  }

  get allTypes() {
    return Array.from(this.data.values());
  }

  get: RootWorkItemTypesStoreSchema["get"] = computedFn((typeId) => {
    return this.data.get(typeId);
  });

  addOrMutate: RootWorkItemTypesStoreSchema["addOrMutate"] = (typeId, instance) => {
    const existingInstance = this.get(typeId);
    if (existingInstance) {
      existingInstance.mutateProperties(instance.asJSON);
    } else {
      runInAction(() => {
        this.data.set(typeId, instance);
      });
    }
  };

  remove: RootWorkItemTypesStoreSchema["remove"] = (typeId) => {
    runInAction(() => {
      this.data.delete(typeId);
    });
  };
}
