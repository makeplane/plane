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
// plane imports
import { WorkspacePropertiesService, WorkspacePropertyOptionsService } from "@plane/services";
import type {
  CustomProperty,
  CustomPropertyType,
  EUserWorkspaceRoles,
  TLoader,
  TUserPermissions,
  WorkspaceCustomPropertiesStoreSchema,
} from "@plane/types";
import { EUserPermissions } from "@plane/types";
// local imports
import type { BaseCustomPropertiesStoreArgs } from "./base.store";
import { BaseCustomPropertiesStore } from "./base.store";

type WorkspaceCustomPropertiesStoreConstructorArgs<T extends CustomPropertyType> = BaseCustomPropertiesStoreArgs<T> & {
  getWorkspaceRoleByWorkspaceSlug: (workspaceSlug: string) => TUserPermissions | EUserWorkspaceRoles | undefined;
};

export class WorkspaceCustomPropertiesStore<T extends CustomPropertyType>
  extends BaseCustomPropertiesStore<T>
  implements WorkspaceCustomPropertiesStoreSchema<T>
{
  // services
  #workspacePropertiesService: WorkspacePropertiesService<T>;
  #workspacePropertyOptionsService: WorkspacePropertyOptionsService;
  // helpers
  #getWorkspaceRoleByWorkspaceSlug: (workspaceSlug: string) => TUserPermissions | EUserWorkspaceRoles | undefined;
  // observables
  loaderMap: Map<string, TLoader> = new Map();
  workspacePropertyIds: Map<string, string[]> = new Map();

  constructor(args: WorkspaceCustomPropertiesStoreConstructorArgs<T>) {
    super(args);
    // services
    this.#workspacePropertiesService = new WorkspacePropertiesService<T>();
    this.#workspacePropertyOptionsService = new WorkspacePropertyOptionsService();
    // helpers
    this.#getWorkspaceRoleByWorkspaceSlug = args.getWorkspaceRoleByWorkspaceSlug;

    makeObservable(this, {
      // observables
      loaderMap: observable,
      workspacePropertyIds: observable,
      // actions
      fetchPropertiesAndOptions: action,
      createProperty: action,
      deleteProperty: action,
    });
  }

  getLoaderByWorkspaceSlug: WorkspaceCustomPropertiesStoreSchema<T>["getLoaderByWorkspaceSlug"] = computedFn(
    (workspaceSlug) => this.loaderMap.get(workspaceSlug)
  );

  getPropertiesByWorkspaceSlug: WorkspaceCustomPropertiesStoreSchema<T>["getPropertiesByWorkspaceSlug"] = computedFn(
    (workspaceSlug) => {
      const ids = this.workspacePropertyIds.get(workspaceSlug) ?? [];
      return ids.map((id) => this.args.get(id)).filter((property) => property !== undefined);
    }
  );

  fetchPropertiesAndOptions: WorkspaceCustomPropertiesStoreSchema<T>["fetchPropertiesAndOptions"] = async (
    workspaceSlug
  ) => {
    runInAction(() => {
      const existingLoader = this.getLoaderByWorkspaceSlug(workspaceSlug);
      this.loaderMap.set(workspaceSlug, existingLoader ? "mutation" : "init-loader");
    });
    try {
      const [properties, options] = await Promise.all([
        this.#workspacePropertiesService.list(workspaceSlug),
        this.#workspacePropertyOptionsService.fetchAll(workspaceSlug),
      ]);
      runInAction(() => {
        // Create/update property instances
        for (const property of properties) {
          const instance = this.args.addOrMutate(property);
          // Enrich each property instance with its options
          if (options[property.id]) {
            instance.addOrUpdatePropertyOptions(options[property.id]);
          }
        }
        this.workspacePropertyIds.set(workspaceSlug, properties.map((p: CustomProperty<T>) => p.id).filter(Boolean));
        this.loaderMap.set(workspaceSlug, "loaded");
      });
    } catch (error) {
      runInAction(() => {
        this.loaderMap.set(workspaceSlug, "loaded");
      });
      console.error("Failed to fetch workspace custom properties and options:", error);
      throw error;
    }
  };

  createProperty: WorkspaceCustomPropertiesStoreSchema<T>["createProperty"] = async (payload) => {
    const data = await this.create(
      this.#workspacePropertiesService.create.bind(this.#workspacePropertiesService, payload)
    );
    if (data?.id) {
      runInAction(() => {
        const ids = this.workspacePropertyIds.get(payload.workspaceSlug) ?? [];
        if (!ids.includes(data.id)) {
          this.workspacePropertyIds.set(payload.workspaceSlug, [...ids, data.id]);
        }
      });
    }
    return data;
  };

  deleteProperty: WorkspaceCustomPropertiesStoreSchema<T>["deleteProperty"] = async (payload) => {
    await this.destroy(
      this.#workspacePropertiesService.destroy.bind(this.#workspacePropertiesService, payload),
      payload.propertyId
    );
    runInAction(() => {
      const ids = this.workspacePropertyIds.get(payload.workspaceSlug) ?? [];
      this.workspacePropertyIds.set(
        payload.workspaceSlug,
        ids.filter((id) => id !== payload.propertyId)
      );
    });
  };

  // permissions
  #roleByWorkspaceSlug = computedFn((workspaceSlug: string) => this.#getWorkspaceRoleByWorkspaceSlug(workspaceSlug));

  canCreate = computedFn(
    (workspaceSlug: string) => this.#roleByWorkspaceSlug(workspaceSlug) === EUserPermissions.ADMIN
  );

  canView = computedFn((workspaceSlug: string) => this.#roleByWorkspaceSlug(workspaceSlug) === EUserPermissions.ADMIN);
}
