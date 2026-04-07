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

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import type { TCollection, TCollectionUpdatePayload } from "@plane/types";
import type { RootStore } from "@/plane-web/store/root.store";

export type TBaseCollectionServices = {
  update: (payload: TCollectionUpdatePayload) => Promise<TCollection>;
};

export type TCollectionInstance = BaseCollection;

export class BaseCollection {
  isSubmitting: boolean = false;
  id: string;
  name: string;
  owned_by_id: string;
  access: TCollection["access"];
  is_default: boolean;
  is_global: boolean;
  logo_props: TCollection["logo_props"];
  sort_order: number;
  workspace: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
  rootStore: RootStore;
  protected services: TBaseCollectionServices;

  constructor(store: RootStore, collection: TCollection, services: TBaseCollectionServices) {
    this.id = collection.id;
    this.name = collection.name;
    this.owned_by_id = collection.owned_by_id;
    this.access = collection.access;
    this.is_default = collection.is_default;
    this.is_global = collection.is_global;
    this.logo_props = collection.logo_props;
    this.sort_order = collection.sort_order;
    this.workspace = collection.workspace;
    this.created_at = collection.created_at;
    this.updated_at = collection.updated_at;
    this.created_by = collection.created_by;
    this.updated_by = collection.updated_by;
    this.rootStore = store;
    this.services = services;

    makeObservable(this, {
      isSubmitting: observable.ref,
      id: observable.ref,
      name: observable.ref,
      owned_by_id: observable.ref,
      access: observable.ref,
      is_default: observable.ref,
      is_global: observable.ref,
      logo_props: observable.ref,
      sort_order: observable.ref,
      workspace: observable.ref,
      created_at: observable.ref,
      updated_at: observable.ref,
      created_by: observable.ref,
      updated_by: observable.ref,
      asJSON: computed,
      isCurrentUserOwner: computed,
      updateCollection: action,
      updateAccess: action,
      mutateProperties: action,
    });
  }

  get asJSON(): TCollection {
    return {
      id: this.id,
      name: this.name,
      owned_by_id: this.owned_by_id,
      access: this.access,
      is_default: this.is_default,
      is_global: this.is_global,
      logo_props: this.logo_props,
      sort_order: this.sort_order,
      workspace: this.workspace,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
      updated_by: this.updated_by,
    };
  }

  get isCurrentUserOwner() {
    const currentUserId = this.rootStore.user.data?.id;
    return !!currentUserId && this.owned_by_id === currentUserId;
  }

  updateCollection = async (payload: TCollectionUpdatePayload) => {
    const currentCollection = this.asJSON;

    try {
      runInAction(() => {
        this.isSubmitting = true;
        Object.entries(payload).forEach(([key, value]) => {
          set(this, key, value);
        });
        this.updated_at = new Date();
      });

      const response = await this.services.update(payload);
      this.mutateProperties(response);
    } catch (error) {
      this.mutateProperties(currentCollection);
      throw error;
    } finally {
      runInAction(() => {
        this.isSubmitting = false;
      });
    }
  };

  updateAccess = async (access: TCollection["access"]) => {
    await this.updateCollection({ access });
  };

  mutateProperties = (data: Partial<TCollection>) => {
    Object.entries(data).forEach(([key, value]) => {
      set(this, key, value);
    });
  };
}
