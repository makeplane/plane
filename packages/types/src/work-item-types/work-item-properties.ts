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
import type { TLogoProps } from "../common";
import type { TLoader } from "../issues/base";
import type {
  TCreateGlobalPropertyPayload,
  TCreateLocalPropertyPayload,
  TDeleteGlobalPropertyPayload,
  TDeleteLocalPropertyPayload,
} from "./services";
import type { TWorkItemPropertySettingsMap } from "./work-item-property-configurations";
import type { CustomPropertyOptionsInstanceSchema, CustomPropertyOption } from "./work-item-property-option";

export const CustomPropertyType = {
  TEXT: "TEXT",
  DECIMAL: "DECIMAL",
  OPTION: "OPTION",
  BOOLEAN: "BOOLEAN",
  DATETIME: "DATETIME",
  RELATION: "RELATION",
  URL: "URL",
  FORMULA: "FORMULA",
} as const;
export type CustomPropertyType = (typeof CustomPropertyType)[keyof typeof CustomPropertyType];

export const CustomPropertyRelationType = {
  ISSUE: "ISSUE",
  USER: "USER",
  RELEASE: "RELEASE",
} as const;
export type CustomPropertyRelationType = (typeof CustomPropertyRelationType)[keyof typeof CustomPropertyRelationType];

// Base work item property
export type CustomProperty<T extends CustomPropertyType> = {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  logo_props: TLogoProps | null;
  sort_order: number;
  relation_type: CustomPropertyRelationType | null;
  is_required: boolean;
  default_value: string[] | null;
  is_active: boolean;
  is_global: boolean;
  issue_type: string | null;
  is_multi: boolean;
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  updated_by: string | null;
  formula?: string;
  property_type: T;
  project: string | null;
  settings: TWorkItemPropertySettingsMap[T] | null;
  workspace: string;
};

// Work item property payload
export type TWorkItemPropertyPayload = Partial<CustomProperty<CustomPropertyType>> & {
  options?: Partial<CustomPropertyOption>[];
  formula?: string;
};

// Work item property response
export type TWorkItemPropertyResponse<T extends CustomPropertyType> = CustomProperty<T> & {
  options: CustomPropertyOption[];
};

// Work item property filter key
export type TCustomPropertyFilterKey = `customproperty_${string}`;

export type TWorkItemTypePropertyRef = {
  [propertyId: string]: number; // sort order of the property for the specific type
};

// Property Instance
export interface BaseCustomPropertyInstanceSchema<T extends CustomPropertyType> extends CustomProperty<T> {
  propertyOptions: CustomPropertyOptionsInstanceSchema[];
  // computed
  asJSON: CustomProperty<T>;
  sortedActivePropertyOptions: CustomPropertyOption[];
  workspaceSlug: string | undefined;
  // permissions
  canEdit: boolean;
  canDelete: boolean;
  canEnableDisable: boolean;
  // computed function
  mutateProperties: (data: Partial<CustomProperty<T>>) => void;
  getPropertyOptionById: (propertyOptionId: string) => CustomPropertyOption | undefined;
  // helper actions
  addOrUpdatePropertyOptions: (propertyOptionsData: CustomPropertyOption[]) => void;
  // actions
  updateProperty: (propertyData: Partial<CustomProperty<T>>) => Promise<void>;
  createPropertyOption: (propertyOption: Partial<CustomPropertyOption>) => Promise<CustomPropertyOption | undefined>;
  updatePropertyOption: (optionId: string, data: Partial<CustomPropertyOption>) => Promise<void>;
  deletePropertyOption: (propertyOptionId: string) => Promise<void>;
}

export interface RootCustomPropertiesStoreSchema<T extends CustomPropertyType> {
  allProperties: BaseCustomPropertyInstanceSchema<T>[];
  get: (id: string) => BaseCustomPropertyInstanceSchema<T> | undefined;
  getByIds: (ids: string[]) => BaseCustomPropertyInstanceSchema<T>[];
  addOrMutate: (data: CustomProperty<T>) => BaseCustomPropertyInstanceSchema<T>;
  remove: (id: string) => void;
  // sub-stores
  workspaceCustomPropertiesStore: WorkspaceCustomPropertiesStoreSchema<T>;
}

export interface WorkspaceCustomPropertiesStoreSchema<T extends CustomPropertyType> {
  // loader
  getLoaderByWorkspaceSlug: (workspaceSlug: string) => TLoader | undefined;
  // helpers
  getPropertiesByWorkspaceSlug: (workspaceSlug: string) => BaseCustomPropertyInstanceSchema<T>[];
  // actions
  fetchPropertiesAndOptions: (workspaceSlug: string) => Promise<void>;
  createProperty: (payload: TCreateGlobalPropertyPayload) => Promise<TWorkItemPropertyResponse<T> | undefined>;
  deleteProperty: (payload: TDeleteGlobalPropertyPayload) => Promise<void>;
  // permissions
  canCreate: (workspaceSlug: string) => boolean;
  canView: (workspaceSlug: string) => boolean;
}

export interface ProjectCustomPropertiesStoreSchema<T extends CustomPropertyType> {
  // helpers
  getPropertiesByProjectId: (projectId: string) => BaseCustomPropertyInstanceSchema<T>[];
  // actions
  fetchProperties: (workspaceSlug: string, projectId: string) => Promise<CustomProperty<T>[]>;
  createProperty: (payload: TCreateLocalPropertyPayload) => Promise<TWorkItemPropertyResponse<T> | undefined>;
  deleteProperty: (payload: TDeleteLocalPropertyPayload) => Promise<void>;
}

// Formula validate API response
export type TFormulaValidateResponse = {
  validated_formula: {
    valid: boolean;
    result_type: string | null;
    error: string | null;
    referenced_fields: string[];
  } | null;
  executed_formula: {
    success: boolean;
    result_type: string | null;
    value: string | null;
    error: string | null;
  } | null;
};
