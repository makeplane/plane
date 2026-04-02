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

import { action, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { WorkspaceWorkItemTypesService } from "@plane/services";
import type {
  BaseWorkItemTypeInstanceSchema,
  EUserWorkspaceRoles,
  TUserPermissions,
  TWorkItemTypeResponse,
  WorkspaceWorkItemTypesStoreSchema,
} from "@plane/types";
import { EUserPermissions } from "@plane/types";
import { setDefaultWorkItemType } from "@plane/utils";
// local imports
import type { BaseWorkItemTypesStoreArgs } from "../base.store";
import { BaseWorkItemTypesStore } from "../base.store";
import { WorkspaceWorkItemTypeInstance } from "./instance";

const workspaceTypeService = new WorkspaceWorkItemTypesService();

type WorkspaceWorkItemTypesStoreArgs = Omit<BaseWorkItemTypesStoreArgs, "createInstance"> & {
  getWorkspaceRoleByWorkspaceSlug: (workspaceSlug: string) => TUserPermissions | EUserWorkspaceRoles | undefined;
  enrichProjectTypeIds: (types: TWorkItemTypeResponse[]) => void;
};

export class WorkspaceWorkItemTypesStore extends BaseWorkItemTypesStore implements WorkspaceWorkItemTypesStoreSchema {
  // helpers
  #getWorkspaceRoleByWorkspaceSlug: (workspaceSlug: string) => TUserPermissions | EUserWorkspaceRoles | undefined;
  #enrichProjectTypeIds: (types: TWorkItemTypeResponse[]) => void;
  #getWorkItemTypeById: (typeId: string) => BaseWorkItemTypeInstanceSchema | undefined;

  constructor(args: WorkspaceWorkItemTypesStoreArgs) {
    super({
      ...args,
      createInstance: (payload) =>
        new WorkspaceWorkItemTypeInstance({
          data: payload,
          getWorkspaceSlugById: args.getWorkspaceSlugById,
          getWorkspaceRoleByWorkspaceSlug: args.getWorkspaceRoleByWorkspaceSlug,
        }),
    });

    makeObservable(this, {
      // actions
      fetchTypes: action,
      fetchType: action,
      createType: action,
      deleteType: action,
      enableWorkItemTypes: action,
      setDefaultType: action,
      updateHierarchy: action,
    });

    // helpers
    this.#getWorkspaceRoleByWorkspaceSlug = args.getWorkspaceRoleByWorkspaceSlug;
    this.#enrichProjectTypeIds = args.enrichProjectTypeIds;
    this.#getWorkItemTypeById = args.get;
  }

  getLoaderByWorkspaceSlug: WorkspaceWorkItemTypesStoreSchema["getLoaderByWorkspaceSlug"] = computedFn(
    (workspaceSlug) => this.loaderMap.get(workspaceSlug)
  );

  getWorkItemTypesByWorkspaceSlug: WorkspaceWorkItemTypesStoreSchema["getWorkItemTypesByWorkspaceSlug"] = computedFn(
    (workspaceSlug) => {
      const ids = this.typeIdsMap.get(workspaceSlug) ?? [];
      return ids.map((id) => this.args.get(id)).filter((type) => type !== undefined);
    }
  );

  getWorkItemTypesByWorkspaceSlugGroupedByLevel: WorkspaceWorkItemTypesStoreSchema["getWorkItemTypesByWorkspaceSlugGroupedByLevel"] =
    computedFn((workspaceSlug) => {
      const types = this.getWorkItemTypesByWorkspaceSlug(workspaceSlug);
      const grouped = types.reduce((acc, type) => {
        acc.set(type.level, [...(acc.get(type.level) ?? []), type]);
        return acc;
      }, new Map<number, BaseWorkItemTypeInstanceSchema[]>());

      if (grouped.size === 0) return grouped;

      const maxLevel = Math.max(...grouped.keys());
      // Build result in descending order from maxLevel to 0, filling missing levels with empty arrays
      const result = new Map<number, BaseWorkItemTypeInstanceSchema[]>();
      for (let level = maxLevel; level >= 0; level--) {
        result.set(level, grouped.get(level) ?? []);
      }
      return result;
    });

  getDefaultWorkItemTypeId: WorkspaceWorkItemTypesStoreSchema["getDefaultWorkItemTypeId"] = computedFn(
    (workspaceSlug) => {
      const types = this.getWorkItemTypesByWorkspaceSlug(workspaceSlug);
      const defaultType = types.find((t) => t.is_default);
      if (defaultType) return defaultType.id;
      const activeType = types.find((t) => t.is_active);
      return activeType?.id;
    }
  );

  fetchTypes: WorkspaceWorkItemTypesStoreSchema["fetchTypes"] = async (workspaceSlug) => {
    runInAction(() => {
      const existingLoader = this.getLoaderByWorkspaceSlug(workspaceSlug);
      this.loaderMap.set(workspaceSlug, existingLoader ? "mutation" : "init-loader");
    });
    const res = await this.list(workspaceTypeService.list.bind(workspaceTypeService, workspaceSlug));
    runInAction(() => {
      this.typeIdsMap.set(
        workspaceSlug,
        res.map((t) => t.id)
      );
      this.#enrichProjectTypeIds(res);
      this.loaderMap.set(workspaceSlug, "loaded");
    });
    return res;
  };

  fetchType: WorkspaceWorkItemTypesStoreSchema["fetchType"] = async (workspaceSlug, typeId) => {
    const data = await this.retrieve(workspaceTypeService.retrieve.bind(workspaceTypeService, workspaceSlug, typeId));
    runInAction(() => {
      this.addTypeId(workspaceSlug, data.id);
      this.#enrichProjectTypeIds([data]);
    });
  };

  createType: WorkspaceWorkItemTypesStoreSchema["createType"] = async (payload) => {
    const data = await this.create(workspaceTypeService.create.bind(workspaceTypeService, payload));
    if (data?.id) {
      this.addTypeId(payload.workspaceSlug, data.id);
    }
    return data;
  };

  deleteType: WorkspaceWorkItemTypesStoreSchema["deleteType"] = async (payload) => {
    await this.destroy(workspaceTypeService.destroy.bind(workspaceTypeService, payload), payload.typeId);
    this.removeTypeId(payload.workspaceSlug, payload.typeId);
  };

  enableWorkItemTypes: WorkspaceWorkItemTypesStoreSchema["enableWorkItemTypes"] = async (workspaceSlug) => {
    const response = await workspaceTypeService.enable(workspaceSlug);
    if (response?.id) {
      runInAction(() => {
        const instance = this.args.createInstance(response);
        this.args.addOrMutate(response.id, instance);
        this.addTypeId(workspaceSlug, response.id);
        this.#enrichProjectTypeIds([response]);
      });
    }
    return response;
  };

  setDefaultType: WorkspaceWorkItemTypesStoreSchema["setDefaultType"] = async (workspaceSlug, typeId) => {
    await setDefaultWorkItemType(typeId, {
      getCurrentDefault: () => {
        const defaultId = this.getDefaultWorkItemTypeId(workspaceSlug);
        return defaultId ? this.args.get(defaultId) : undefined;
      },
      getById: (id) => this.args.get(id),
      isDefault: (type) => !!type.is_default,
      localUpdate: (type, isDefault) => type.mutateProperties({ is_default: isDefault }),
      syncUpdate: () => workspaceTypeService.markDefault(workspaceSlug, typeId),
    });

    // The backend imports the new default to all projects.
    // Re-fetch the type to get updated project_ids and enrich the project store.
    await this.fetchType(workspaceSlug, typeId);
  };

  updateHierarchy: WorkspaceWorkItemTypesStoreSchema["updateHierarchy"] = async (workspaceSlug, payload) => {
    try {
      await workspaceTypeService.updateHierarchy(workspaceSlug, payload);
      const allTypesAtLevel = this.getWorkItemTypesByWorkspaceSlugGroupedByLevel(workspaceSlug).get(payload.level);
      const addedTypes = payload.type_ids.filter((typeId) => !allTypesAtLevel?.some((t) => t.id === typeId));
      const removedTypes = allTypesAtLevel?.filter((t) => !payload.type_ids.includes(t.id));
      runInAction(() => {
        addedTypes.forEach((typeId) => {
          this.#getWorkItemTypeById(typeId)?.mutateProperties({
            level: payload.level,
          });
        });
        removedTypes?.forEach((type) => {
          type.mutateProperties({
            level: 0,
          });
        });
      });
    } catch (error) {
      console.error("Failed to update hierarchy:", error);
      throw error;
    }
  };

  // permissions
  #roleByWorkspaceSlug = computedFn((workspaceSlug: string) => {
    return this.#getWorkspaceRoleByWorkspaceSlug(workspaceSlug);
  });

  canCreate = computedFn(
    (workspaceSlug: string) => this.#roleByWorkspaceSlug(workspaceSlug) === EUserPermissions.ADMIN
  );

  canView = computedFn((workspaceSlug: string) => this.#roleByWorkspaceSlug(workspaceSlug) === EUserPermissions.ADMIN);
}
