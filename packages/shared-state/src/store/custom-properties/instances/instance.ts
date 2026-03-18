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

import { cloneDeep, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction, toJS } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type {
  BaseCustomPropertyInstanceSchema,
  CustomProperty,
  CustomPropertyOption,
  CustomPropertyType,
  CustomPropertyOptionsInstanceSchema,
  TWorkItemPropertyResponse,
} from "@plane/types";
// local imports
import { CustomPropertyOptionsInstance } from "./option.instance";

export type BaseCustomPropertyInstanceArgs<T extends CustomPropertyType> = {
  data: CustomProperty<T>;
  getWorkspaceSlugById: (id: string) => string | undefined;
};

export abstract class BaseCustomPropertyInstance<
  T extends CustomPropertyType,
> implements BaseCustomPropertyInstanceSchema<T> {
  id: CustomProperty<T>["id"];
  name: CustomProperty<T>["name"];
  display_name: CustomProperty<T>["display_name"];
  description: CustomProperty<T>["description"];
  project: CustomProperty<T>["project"];
  logo_props: CustomProperty<T>["logo_props"];
  sort_order: CustomProperty<T>["sort_order"];
  relation_type: CustomProperty<T>["relation_type"];
  is_required: CustomProperty<T>["is_required"];
  default_value: CustomProperty<T>["default_value"];
  is_active: CustomProperty<T>["is_active"];
  issue_type: CustomProperty<T>["issue_type"];
  is_multi: CustomProperty<T>["is_multi"];
  is_global: CustomProperty<T>["is_global"];
  created_at: CustomProperty<T>["created_at"];
  created_by: CustomProperty<T>["created_by"];
  updated_at: CustomProperty<T>["updated_at"];
  updated_by: CustomProperty<T>["updated_by"];
  property_type: CustomProperty<T>["property_type"];
  workspace: CustomProperty<T>["workspace"];
  settings: CustomProperty<T>["settings"];
  propertyOptions: CustomPropertyOptionsInstanceSchema[] = [];

  constructor(private args: BaseCustomPropertyInstanceArgs<T>) {
    const { data } = args;
    this.id = data.id;
    this.name = data.name;
    this.display_name = data.display_name;
    this.description = data.description;
    this.project = data.project;
    this.logo_props = data.logo_props;
    this.sort_order = data.sort_order;
    this.relation_type = data.relation_type;
    this.is_required = data.is_required;
    this.default_value = data.default_value;
    this.is_active = data.is_active;
    this.issue_type = data.issue_type;
    this.is_multi = data.is_multi;
    this.is_global = data.is_global;
    this.created_at = data.created_at;
    this.created_by = data.created_by;
    this.updated_at = data.updated_at;
    this.updated_by = data.updated_by;
    this.workspace = data.workspace;
    this.property_type = data.property_type;
    this.settings = data.settings;

    makeObservable<BaseCustomPropertyInstance<T>, "update" | "createOption" | "updateOption" | "removeOption">(this, {
      name: observable.ref,
      display_name: observable.ref,
      description: observable.ref,
      project: observable.ref,
      logo_props: observable.ref,
      sort_order: observable.ref,
      relation_type: observable.ref,
      is_required: observable.ref,
      default_value: observable,
      is_active: observable.ref,
      issue_type: observable.ref,
      is_multi: observable.ref,
      is_global: observable.ref,
      created_at: observable.ref,
      created_by: observable.ref,
      updated_at: observable.ref,
      updated_by: observable.ref,
      workspace: observable.ref,
      property_type: observable.ref,
      settings: observable.ref,
      propertyOptions: observable,
      // computed
      asJSON: computed,
      sortedActivePropertyOptions: computed,
      // actions
      mutateProperties: action,
      update: action,
      createOption: action,
      updateOption: action,
      removeOption: action,
      addOrUpdatePropertyOptions: action,
    });
  }

  get asJSON(): BaseCustomPropertyInstanceSchema<T>["asJSON"] {
    return toJS({
      id: this.id,
      name: this.name,
      display_name: this.display_name,
      description: this.description,
      project: this.project,
      logo_props: this.logo_props,
      sort_order: this.sort_order,
      relation_type: this.relation_type,
      is_required: this.is_required,
      default_value: this.default_value,
      is_active: this.is_active,
      issue_type: this.issue_type,
      is_multi: this.is_multi,
      is_global: this.is_global,
      created_at: this.created_at,
      created_by: this.created_by,
      updated_at: this.updated_at,
      updated_by: this.updated_by,
      workspace: this.workspace,
      property_type: this.property_type,
      settings: this.settings,
    });
  }

  get sortedActivePropertyOptions(): BaseCustomPropertyInstanceSchema<T>["sortedActivePropertyOptions"] {
    return this.propertyOptions
      .map((option) => option.asJSON)
      .filter((option) => option.is_active)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  get workspaceSlug(): BaseCustomPropertyInstanceSchema<T>["workspaceSlug"] {
    return this.args.getWorkspaceSlugById(this.workspace);
  }

  mutateProperties: BaseCustomPropertyInstanceSchema<T>["mutateProperties"] = (data) => {
    runInAction(() => {
      for (const key in data) {
        if (Object.hasOwn(data, key)) {
          const typedKey = key as keyof CustomProperty<T>;
          set(this, typedKey, data[typedKey]);
        }
      }
    });
  };

  getPropertyOptionById: BaseCustomPropertyInstanceSchema<T>["getPropertyOptionById"] = computedFn(
    (propertyOptionId) => this.propertyOptions.find((option) => option.id === propertyOptionId)?.asJSON
  );

  abstract updateProperty(data: Partial<CustomProperty<T>>): Promise<void>;
  abstract createPropertyOption(
    propertyOption: Partial<CustomPropertyOption>
  ): Promise<CustomPropertyOption | undefined>;
  abstract updatePropertyOption(optionId: string, data: Partial<CustomPropertyOption>): Promise<void>;
  abstract deletePropertyOption(propertyOptionId: string): Promise<void>;

  // abstract permissions
  abstract get canEdit(): boolean;
  abstract get canDelete(): boolean;
  abstract get canEnableDisable(): boolean;

  protected update = async (
    callback: () => Promise<TWorkItemPropertyResponse<T>>,
    data: Partial<CustomProperty<T>>
  ): Promise<void> => {
    const originalData = cloneDeep(this.asJSON);
    try {
      this.mutateProperties(data);
      const response = await callback();
      this.mutateProperties(response);
      // Populate options if present in response
      if (response.options?.length) {
        this.addOrUpdatePropertyOptions(response.options);
      }
    } catch (error) {
      this.mutateProperties(originalData);
      console.error("Failed to update custom property instance:", error);
      throw error;
    }
  };

  protected createOption = async (
    callback: () => Promise<CustomPropertyOption>
  ): Promise<CustomPropertyOption | undefined> => {
    const created = await callback();
    this.addOrUpdatePropertyOptions([created]);
    return created;
  };

  protected updateOption = async (callback: () => Promise<CustomPropertyOption>): Promise<void> => {
    const updated = await callback();
    this.addOrUpdatePropertyOptions([updated]);
  };

  protected removeOption = async (callback: () => Promise<void>, propertyOptionId: string): Promise<void> => {
    await callback();
    this.propertyOptions = this.propertyOptions.filter((option) => option.id !== propertyOptionId);
  };

  addOrUpdatePropertyOptions: BaseCustomPropertyInstanceSchema<T>["addOrUpdatePropertyOptions"] = (
    propertyOptionsData
  ) => {
    for (const option of propertyOptionsData) {
      if (!option.id) continue;
      const existing = this.propertyOptions.find((propertyOption) => propertyOption.id === option.id);
      if (existing) {
        existing.mutateProperties(option);
      } else {
        this.propertyOptions.push(new CustomPropertyOptionsInstance(option));
      }
    }
  };
}
