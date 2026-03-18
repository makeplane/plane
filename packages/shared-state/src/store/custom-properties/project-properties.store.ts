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
import { ProjectPropertiesService } from "@plane/services";
import type { CustomPropertyType, ProjectCustomPropertiesStoreSchema } from "@plane/types";
// local imports
import { asReadOnly } from "../work-item-types/instances/as-read-only";
import type { BaseCustomPropertiesStoreArgs } from "./base.store";
import { BaseCustomPropertiesStore } from "./base.store";

export class ProjectCustomPropertiesStore<T extends CustomPropertyType>
  extends BaseCustomPropertiesStore<T>
  implements ProjectCustomPropertiesStoreSchema<T>
{
  // services
  #projectPropertiesService: ProjectPropertiesService<T>;
  // observables
  projectPropertyIds: Map<string, string[]> = new Map();

  constructor(args: BaseCustomPropertiesStoreArgs<T>) {
    super(args);
    // services
    this.#projectPropertiesService = new ProjectPropertiesService<T>();

    makeObservable(this, {
      // observables
      projectPropertyIds: observable,
      // actions
      fetchProperties: action,
      createProperty: action,
      deleteProperty: action,
    });
  }

  getPropertiesByProjectId: ProjectCustomPropertiesStoreSchema<T>["getPropertiesByProjectId"] = computedFn(
    (projectId) => {
      const ids = this.projectPropertyIds.get(projectId) ?? [];
      return ids
        .map((id) => this.args.get(id))
        .filter((property) => property !== undefined)
        .map((instance) => asReadOnly(instance));
    }
  );

  fetchProperties: ProjectCustomPropertiesStoreSchema<T>["fetchProperties"] = async (...args) => {
    const projectId = args[1];
    const res = await this.list(this.#projectPropertiesService.list.bind(this.#projectPropertiesService, ...args));
    runInAction(() => {
      this.projectPropertyIds.set(projectId, res.map((p) => p.id).filter(Boolean));
    });
    return res;
  };

  createProperty: ProjectCustomPropertiesStoreSchema<T>["createProperty"] = async (payload) =>
    this.create(this.#projectPropertiesService.create.bind(this.#projectPropertiesService, payload));

  deleteProperty: ProjectCustomPropertiesStoreSchema<T>["deleteProperty"] = async (payload) =>
    this.destroy(
      this.#projectPropertiesService.destroy.bind(this.#projectPropertiesService, payload),
      payload.propertyId
    );
}
