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
// plane imports
import type {
  BaseCustomPropertyInstanceSchema,
  CustomProperty,
  CustomPropertyType,
  TWorkItemPropertyResponse,
} from "@plane/types";

export type BaseCustomPropertiesStoreArgs<T extends CustomPropertyType> = {
  get: (id: string) => BaseCustomPropertyInstanceSchema<T> | undefined;
  addOrMutate: (property: CustomProperty<T>) => BaseCustomPropertyInstanceSchema<T>;
  remove: (propertyId: string) => void;
};

interface BaseCustomPropertiesStoreSchema<T extends CustomPropertyType> {
  create: (
    callback: () => Promise<TWorkItemPropertyResponse<T> | undefined>
  ) => Promise<TWorkItemPropertyResponse<T> | undefined>;
  list: (callback: () => Promise<CustomProperty<T>[]>) => Promise<CustomProperty<T>[]>;
  destroy: (callback: () => Promise<void>, propertyId: string) => Promise<void>;
}

export abstract class BaseCustomPropertiesStore<T extends CustomPropertyType> {
  constructor(protected args: BaseCustomPropertiesStoreArgs<T>) {
    makeObservable<BaseCustomPropertiesStore<T>, "create" | "list" | "destroy">(this, {
      // actions
      create: action,
      list: action,
      destroy: action,
    });
  }

  protected create: BaseCustomPropertiesStoreSchema<T>["create"] = async (callback) => {
    try {
      const data = await callback();
      if (data) {
        runInAction(() => {
          const instance = this.args.addOrMutate(data);
          // Populate options if present in response
          if (data.options?.length && data.id) {
            instance.addOrUpdatePropertyOptions(data.options);
          }
        });
      }
      return data;
    } catch (error) {
      console.error("Failed to create custom property:", error);
      throw error;
    }
  };

  protected list: BaseCustomPropertiesStoreSchema<T>["list"] = async (callback) => {
    try {
      const data = await callback();
      runInAction(() => {
        data.forEach((property) => {
          this.args.addOrMutate(property);
        });
      });
      return data;
    } catch (error) {
      console.error("Failed to list custom properties:", error);
      throw error;
    }
  };

  protected destroy: BaseCustomPropertiesStoreSchema<T>["destroy"] = async (callback, propertyId) => {
    try {
      await callback();
      runInAction(() => {
        this.args.remove(propertyId);
      });
    } catch (error) {
      console.error(`Failed to destroy custom property with id ${propertyId}:`, error);
      throw error;
    }
  };
}
