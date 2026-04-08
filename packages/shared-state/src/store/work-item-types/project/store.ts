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
import { ProjectPropertiesService, ProjectWorkItemTypesService } from "@plane/services";
import type { ProjectWorkItemTypesStoreSchema, TImportWorkItemTypesPayload } from "@plane/types";
import { EUserPermissions } from "@plane/types";
// local imports
import type { BaseWorkItemTypesStoreArgs } from "../base.store";
import { BaseWorkItemTypesStore } from "../base.store";
import { asReadOnly } from "../instances/as-read-only";
import { ProjectWorkItemTypeInstance } from "./instance";

const projectTypeService = new ProjectWorkItemTypesService();
const projectPropertyService = new ProjectPropertiesService();

type ProjectWorkItemTypesStoreArgs = Omit<BaseWorkItemTypesStoreArgs, "createInstance"> & {
  getProjectRoleByWorkspaceSlugAndProjectId: (workspaceSlug: string, projectId: string) => EUserPermissions | undefined;
};

export class ProjectWorkItemTypesStore extends BaseWorkItemTypesStore implements ProjectWorkItemTypesStoreSchema {
  // helpers
  #getProjectRoleByWorkspaceSlugAndProjectId: (
    workspaceSlug: string,
    projectId: string
  ) => EUserPermissions | undefined;

  constructor(args: ProjectWorkItemTypesStoreArgs) {
    super({
      createInstance: (payload, context) =>
        new ProjectWorkItemTypeInstance({
          data: payload,
          getWorkspaceSlugById: this.args.getWorkspaceSlugById,
          projectId: context?.projectId ?? "",
          getProjectRoleByWorkspaceSlugAndProjectId: args.getProjectRoleByWorkspaceSlugAndProjectId,
        }),
      ...args,
    });

    makeObservable<ProjectWorkItemTypesStore>(this, {
      // actions
      fetchTypes: action,
      createType: action,
      deleteType: action,
      importGlobalTypes: action,
      importGlobalProperties: action,
      removeImportedTypes: action,
      enrichTypeIdsFromWorkspaceTypes: action,
    });

    // helpers
    this.#getProjectRoleByWorkspaceSlugAndProjectId = args.getProjectRoleByWorkspaceSlugAndProjectId;
  }

  getLoaderByProjectId: ProjectWorkItemTypesStoreSchema["getLoaderByProjectId"] = computedFn((projectId) =>
    this.loaderMap.get(projectId)
  );

  getWorkItemTypesByProjectId: ProjectWorkItemTypesStoreSchema["getWorkItemTypesByProjectId"] = computedFn(
    (projectId) => {
      const ids = this.typeIdsMap.get(projectId) ?? [];
      return ids
        .map((id) => this.args.get(id))
        .filter((type) => type !== undefined)
        .map((instance) => asReadOnly(instance));
    }
  );

  getSortedWorkItemTypesByProjectId: ProjectWorkItemTypesStoreSchema["getSortedWorkItemTypesByProjectId"] = computedFn(
    (projectId) => {
      const types = this.getWorkItemTypesByProjectId(projectId);
      return [...types].sort((a, b) => {
        if (a.level !== b.level) return b.level - a.level;
        const aTime = a.created_at instanceof Date ? a.created_at.getTime() : new Date(a.created_at).getTime();
        const bTime = b.created_at instanceof Date ? b.created_at.getTime() : new Date(b.created_at).getTime();
        return bTime - aTime;
      });
    }
  );

  getDefaultWorkItemTypeId: ProjectWorkItemTypesStoreSchema["getDefaultWorkItemTypeId"] = computedFn((projectId) => {
    const types = this.getWorkItemTypesByProjectId(projectId);
    const defaultType = types.find((t) => t.is_default);
    if (defaultType) return defaultType.id;
    const activeType = types.find((t) => t.is_active);
    return activeType?.id;
  });

  /**
   * Populates typeIdsMap from workspace types' project_ids.
   * Called after workspace-level fetch to seed project type membership.
   */
  enrichTypeIdsFromWorkspaceTypes: ProjectWorkItemTypesStoreSchema["enrichTypeIdsFromWorkspaceTypes"] = (types) => {
    const projectTypeIds = new Map<string, string[]>();
    for (const type of types) {
      if (!type.project_ids) continue;
      for (const projectId of type.project_ids) {
        const ids = projectTypeIds.get(projectId) ?? [];
        ids.push(type.id);
        projectTypeIds.set(projectId, ids);
      }
    }
    runInAction(() => {
      for (const [projectId, ids] of projectTypeIds) {
        const existingIds = this.typeIdsMap.get(projectId) ?? [];
        const newIds = new Set([...existingIds, ...ids]);
        this.typeIdsMap.set(projectId, Array.from(newIds));
      }
    });
  };

  fetchTypes: ProjectWorkItemTypesStoreSchema["fetchTypes"] = async (...args) => {
    const projectId = args[1];
    runInAction(() => {
      const existingLoader = this.getLoaderByProjectId(projectId);
      this.loaderMap.set(projectId, existingLoader ? "mutation" : "init-loader");
    });
    const res = await this.list(projectTypeService.fetchAll.bind(projectTypeService, ...args), { projectId });
    runInAction(() => {
      this.loaderMap.set(projectId, "loaded");
    });
    return res;
  };

  createType: ProjectWorkItemTypesStoreSchema["createType"] = async (payload) => {
    const data = await this.create(projectTypeService.create.bind(projectTypeService, payload), {
      projectId: payload.projectId,
    });
    if (data?.id) {
      this.addTypeId(payload.projectId, data.id);
    }
    return data;
  };

  deleteType: ProjectWorkItemTypesStoreSchema["deleteType"] = async (payload) => {
    await this.destroy(projectTypeService.destroy.bind(projectTypeService, payload), payload.typeId);
    this.removeTypeId(payload.projectId, payload.typeId);
  };

  importGlobalTypes: ProjectWorkItemTypesStoreSchema["importGlobalTypes"] = async (payload) => {
    await projectTypeService.importGlobalTypes(payload);
    for (const typeId of payload.typeIds) {
      this.addTypeId(payload.projectId, typeId);
      // update the instance project_ids
      const instance = this.args.get(typeId);
      if (instance && !instance.project_ids?.includes(payload.projectId)) {
        instance.mutateProperties({
          project_ids: [...(instance.project_ids ?? []), payload.projectId],
        });
      }
    }
  };

  importGlobalProperties: ProjectWorkItemTypesStoreSchema["importGlobalProperties"] = async (payload) => {
    await projectPropertyService.importGlobalProperties(payload);
  };

  removeImportedTypes = async (payload: TImportWorkItemTypesPayload) => {
    await projectTypeService.removeImportedTypes(payload);
    for (const typeId of payload.typeIds) {
      this.removeTypeId(payload.projectId, typeId);
      // update the instance project_ids
      const instance = this.args.get(typeId);
      if (instance) {
        instance.mutateProperties({
          project_ids: (instance.project_ids ?? []).filter((pid) => pid !== payload.projectId),
        });
      }
    }
  };

  // permissions
  #roleByWorkspaceSlugAndProjectId = computedFn((workspaceSlug: string, projectId: string) => {
    return this.#getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
  });

  canCreate = computedFn(
    (workspaceSlug: string, projectId: string) =>
      this.#roleByWorkspaceSlugAndProjectId(workspaceSlug, projectId) === EUserPermissions.ADMIN
  );

  canView = computedFn(
    (workspaceSlug: string, projectId: string) =>
      this.#roleByWorkspaceSlugAndProjectId(workspaceSlug, projectId) === EUserPermissions.ADMIN
  );
}
