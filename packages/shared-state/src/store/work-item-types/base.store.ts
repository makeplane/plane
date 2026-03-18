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
// plane imports
import type { BaseWorkItemTypeInstanceSchema, TLoader, TWorkItemTypeResponse } from "@plane/types";
// local imports
import type { BaseWorkItemTypeInstance } from "./instances/base-instance";

export type TInstanceCreationContext = {
  projectId?: string;
};

export type BaseWorkItemTypesStoreArgs = {
  get: (typeId: string) => BaseWorkItemTypeInstanceSchema | undefined;
  createInstance: (payload: TWorkItemTypeResponse, context?: TInstanceCreationContext) => BaseWorkItemTypeInstance;
  addOrMutate: (typeId: string, instance: BaseWorkItemTypeInstance) => void;
  remove: (typeId: string) => void;
  getWorkspaceSlugById: (id: string) => string | undefined;
};

interface BaseWorkItemTypesStoreSchema {
  create: (
    callback: () => Promise<TWorkItemTypeResponse | undefined>,
    context?: TInstanceCreationContext
  ) => Promise<TWorkItemTypeResponse | undefined>;
  list: (
    callback: () => Promise<TWorkItemTypeResponse[]>,
    context?: TInstanceCreationContext
  ) => Promise<TWorkItemTypeResponse[]>;
  retrieve: (data: TWorkItemTypeResponse, context?: TInstanceCreationContext) => void;
  destroy: (callback: () => Promise<void>, typeId: string) => Promise<void>;
}

export abstract class BaseWorkItemTypesStore {
  // observables
  protected loaderMap: Map<string, TLoader> = new Map();
  protected typeIdsMap: Map<string, string[]> = new Map();

  constructor(protected args: BaseWorkItemTypesStoreArgs) {
    makeObservable<
      BaseWorkItemTypesStore,
      "loaderMap" | "typeIdsMap" | "create" | "list" | "retrieve" | "destroy" | "addTypeId" | "removeTypeId"
    >(this, {
      // observables
      loaderMap: observable,
      typeIdsMap: observable,
      // actions
      create: action,
      list: action,
      retrieve: action,
      destroy: action,
      addTypeId: action,
      removeTypeId: action,
    });
  }

  protected addTypeId = (key: string, typeId: string) => {
    runInAction(() => {
      const ids = this.typeIdsMap.get(key) ?? [];
      if (!ids.includes(typeId)) {
        this.typeIdsMap.set(key, [...ids, typeId]);
      }
    });
  };

  protected removeTypeId = (key: string, typeId: string) => {
    runInAction(() => {
      const ids = this.typeIdsMap.get(key) ?? [];
      this.typeIdsMap.set(
        key,
        ids.filter((id) => id !== typeId)
      );
    });
  };

  protected create: BaseWorkItemTypesStoreSchema["create"] = async (callback, context) => {
    try {
      const data = await callback();
      if (data?.id) {
        const instance = this.args.createInstance(data, context);
        this.args.addOrMutate(data.id, instance);
      }
      return data;
    } catch (error) {
      console.error("Failed to create work item type:", error);
      throw error;
    }
  };

  protected list: BaseWorkItemTypesStoreSchema["list"] = async (callback, context) => {
    try {
      const data = await callback();
      data.forEach((workItemType) => {
        const instance = this.args.createInstance(workItemType, context);
        this.args.addOrMutate(workItemType.id, instance);
      });
      return data;
    } catch (error) {
      console.error("Failed to list work item types:", error);
      throw error;
    }
  };

  protected retrieve: BaseWorkItemTypesStoreSchema["retrieve"] = async (data, context) => {
    try {
      if (data.id) {
        const instance = this.args.createInstance(data, context);
        this.args.addOrMutate(data.id, instance);
      }
      return data;
    } catch (error) {
      console.error(`Failed to :`, error);
      throw error;
    }
  };

  protected destroy: BaseWorkItemTypesStoreSchema["destroy"] = async (callback, typeId) => {
    try {
      await callback();
      this.args.remove(typeId);
    } catch (error) {
      console.error(`Failed to destroy work item type with id ${typeId}:`, error);
      throw error;
    }
  };
}
