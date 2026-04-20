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
import { computedFn } from "mobx-utils";
import { RolesAndPermissionsService } from "@plane/services";
import type { PermissionNamespace, PermissionScheme, TLoader } from "@plane/types";

/**
 * Permission-scheme management store.
 *
 * Responsibilities:
 * - cache workspace/project permission scheme lists
 * - provide scheme lookup helpers by id/slug/namespace
 * - perform scheme CRUD and keep maps synchronized
 */
export interface IPermissionSchemeStore {
  loader: TLoader;
  getWorkspaceSchemeIdsByWorkspaceSlug: (workspaceSlug: string) => string[] | undefined;
  getProjectSchemeIdsByWorkspaceSlug: (workspaceSlug: string) => string[] | undefined;
  getSchemesByNamespace: (workspaceSlug: string, namespace: PermissionNamespace) => PermissionScheme[];
  getSchemeDetailsBySchemeId: (schemeId: string) => PermissionScheme | undefined;
  getSchemeDetailsBySchemeSlug: (args: {
    workspaceSlug: string;
    schemeSlug: string;
    namespace: PermissionNamespace;
  }) => PermissionScheme | undefined;
  getSchemeNamespaceBySchemeId: (schemeId: string) => PermissionNamespace | undefined;
  fetchAllWorkspaceSchemes: (workspaceSlug: string) => Promise<void>;
  createScheme: (args: {
    workspaceSlug: string;
    data: Partial<PermissionScheme> & { namespace: PermissionNamespace };
  }) => Promise<PermissionScheme>;
  updateScheme: (args: { workspaceSlug: string; schemeId: string; data: Partial<PermissionScheme> }) => Promise<void>;
  deleteScheme: (args: { workspaceSlug: string; schemeId: string }) => Promise<void>;
}

/**
 * Store for permission scheme definitions.
 */
export class PermissionSchemeStore implements IPermissionSchemeStore {
  loader: TLoader = undefined;
  private schemesMap: Map<string, PermissionScheme> = new Map();
  private workspaceSchemeIdsMap: Map<string, string[]> = new Map();
  private projectSchemeIdsMap: Map<string, string[]> = new Map();
  private schemeIdToNamespaceMap: Map<string, PermissionNamespace> = new Map();

  private service: RolesAndPermissionsService;

  /**
   * Returns the in-memory scheme-id map supported by this store for a namespace.
   */
  private getSchemeIdsMapByNamespace = computedFn((namespace: PermissionNamespace) => {
    if (namespace === "workspace") return this.workspaceSchemeIdsMap;
    if (namespace === "project") return this.projectSchemeIdsMap;
    return undefined;
  });

  constructor() {
    makeObservable<
      PermissionSchemeStore,
      "schemesMap" | "loader" | "workspaceSchemeIdsMap" | "projectSchemeIdsMap" | "schemeIdToNamespaceMap"
    >(this, {
      schemesMap: observable,
      loader: observable.ref,
      workspaceSchemeIdsMap: observable,
      projectSchemeIdsMap: observable,
      schemeIdToNamespaceMap: observable,
      fetchAllWorkspaceSchemes: action,
      createScheme: action,
      updateScheme: action,
      deleteScheme: action,
    });

    this.service = new RolesAndPermissionsService();
  }

  getWorkspaceSchemeIdsByWorkspaceSlug: IPermissionSchemeStore["getWorkspaceSchemeIdsByWorkspaceSlug"] = computedFn(
    (workspaceSlug) => this.workspaceSchemeIdsMap.get(workspaceSlug)
  );

  getProjectSchemeIdsByWorkspaceSlug: IPermissionSchemeStore["getProjectSchemeIdsByWorkspaceSlug"] = computedFn(
    (workspaceSlug) => this.projectSchemeIdsMap.get(workspaceSlug)
  );

  /**
   * Returns full PermissionScheme objects for the given namespace.
   */
  getSchemesByNamespace: IPermissionSchemeStore["getSchemesByNamespace"] = computedFn((workspaceSlug, namespace) => {
    const idsMap = this.getSchemeIdsMapByNamespace(namespace);
    if (!idsMap) return [];
    const ids = idsMap.get(workspaceSlug);
    if (!ids) return [];
    return ids.map((id) => this.schemesMap.get(id)).filter((s): s is PermissionScheme => !!s);
  });

  getSchemeDetailsBySchemeId: IPermissionSchemeStore["getSchemeDetailsBySchemeId"] = computedFn((schemeId) =>
    this.schemesMap.get(schemeId)
  );

  getSchemeDetailsBySchemeSlug: IPermissionSchemeStore["getSchemeDetailsBySchemeSlug"] = computedFn((args) => {
    const { workspaceSlug, schemeSlug, namespace } = args;
    const schemeIdsMap = this.getSchemeIdsMapByNamespace(namespace);
    if (!schemeIdsMap) return undefined;

    const schemeIds = schemeIdsMap.get(workspaceSlug);
    const schemeId = schemeIds?.find((id) => this.getSchemeDetailsBySchemeId(id)?.slug === schemeSlug);
    return this.getSchemeDetailsBySchemeId(schemeId!);
  });

  getSchemeNamespaceBySchemeId: IPermissionSchemeStore["getSchemeNamespaceBySchemeId"] = computedFn((schemeId) =>
    this.schemeIdToNamespaceMap.get(schemeId)
  );

  /**
   * Applies an in-memory patch on a cached scheme.
   * Used by optimistic update/revert flows.
   */
  private mutateScheme = computedFn((args: { schemeId: string; data: Partial<PermissionScheme> }) => {
    const { schemeId, data } = args;
    const schemeDetails = this.getSchemeDetailsBySchemeId(schemeId);
    if (!schemeDetails) return;

    runInAction(() => {
      this.schemesMap.set(schemeId, {
        ...schemeDetails,
        ...data,
      });
    });
  });

  fetchAllWorkspaceSchemes: IPermissionSchemeStore["fetchAllWorkspaceSchemes"] = async (workspaceSlug) => {
    try {
      this.loader = "init-loader";

      const [workspaceSchemes, projectSchemes] = await Promise.all([
        this.service.listPermissionSchemes(workspaceSlug, "workspace"),
        this.service.listPermissionSchemes(workspaceSlug, "project"),
      ]);

      runInAction(() => {
        const workspaceSchemeIds: string[] = [];
        workspaceSchemes.forEach((scheme) => {
          this.schemesMap.set(scheme.id, scheme);
          this.schemeIdToNamespaceMap.set(scheme.id, "workspace");
          if (!workspaceSchemeIds.includes(scheme.id)) {
            workspaceSchemeIds.push(scheme.id);
          }
        });

        const projectSchemeIds: string[] = [];
        projectSchemes.forEach((scheme) => {
          this.schemesMap.set(scheme.id, scheme);
          this.schemeIdToNamespaceMap.set(scheme.id, "project");
          if (!projectSchemeIds.includes(scheme.id)) {
            projectSchemeIds.push(scheme.id);
          }
        });

        this.workspaceSchemeIdsMap.set(workspaceSlug, workspaceSchemeIds);
        this.projectSchemeIdsMap.set(workspaceSlug, projectSchemeIds);
      });
    } catch (error) {
      console.error("Failed to fetch all workspace permission schemes:", error);
      throw error;
    } finally {
      this.loader = "loaded";
    }
  };

  createScheme: IPermissionSchemeStore["createScheme"] = async (args) => {
    const { workspaceSlug, data } = args;
    const namespace = data.namespace;
    try {
      const response = await this.service.createPermissionScheme(workspaceSlug, data);
      runInAction(() => {
        this.schemesMap.set(response.id, response);
        this.schemeIdToNamespaceMap.set(response.id, namespace);

        const existingSchemeIdsMap = this.getSchemeIdsMapByNamespace(namespace);
        if (!existingSchemeIdsMap) return;

        const existingWorkspaceSchemeIds = existingSchemeIdsMap.get(workspaceSlug) || [];
        existingSchemeIdsMap.set(workspaceSlug, [...existingWorkspaceSchemeIds, response.id]);
      });
      return response;
    } catch (error) {
      console.error("Failed to create permission scheme:", error);
      throw error;
    }
  };

  updateScheme: IPermissionSchemeStore["updateScheme"] = async (args) => {
    const { workspaceSlug, schemeId, data } = args;
    const schemeDetails = this.getSchemeDetailsBySchemeId(schemeId);

    try {
      if (!schemeDetails) {
        throw new Error(`Permission scheme with ID ${schemeId} not found in workspace ${workspaceSlug}`);
      }

      // Optimistic local patch to keep settings UI responsive.
      this.mutateScheme({ schemeId, data });
      await this.service.updatePermissionScheme(workspaceSlug, schemeId, data);
    } catch (error) {
      if (schemeDetails) {
        // Revert optimistic patch if the API call fails.
        this.mutateScheme({ schemeId, data: schemeDetails });
      }
      console.error("Failed to update permission scheme:", error);
      throw error;
    }
  };

  deleteScheme: IPermissionSchemeStore["deleteScheme"] = async (args) => {
    const { workspaceSlug, schemeId } = args;

    try {
      await this.service.destroyPermissionScheme(workspaceSlug, schemeId);
      runInAction(() => {
        const namespace = this.schemeIdToNamespaceMap.get(schemeId);
        this.schemesMap.delete(schemeId);

        if (!namespace) return;

        const existingSchemeIdsMap = this.getSchemeIdsMapByNamespace(namespace);
        if (!existingSchemeIdsMap) return;

        const existingWorkspaceSchemeIds = existingSchemeIdsMap.get(workspaceSlug) || [];
        existingSchemeIdsMap.set(
          workspaceSlug,
          existingWorkspaceSchemeIds.filter((id) => id !== schemeId)
        );
      });
    } catch (error) {
      console.error("Failed to delete permission scheme:", error);
      throw error;
    }
  };
}
