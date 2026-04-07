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
import type { CustomProperty, CustomPropertyType, TWorkItemTypePropertyRef } from "./work-item-properties";
import type { CustomPropertyTypeKey } from "./work-item-property-configurations";
import type {
  TCreateWorkspaceWorkItemTypePayload,
  TCreateProjectWorkItemTypePayload,
  TDeleteWorkspaceWorkItemTypePayload,
  TDeleteProjectWorkItemTypePayload,
  TImportGlobalPropertyPayload,
  TImportWorkItemTypesPayload,
  TWorkItemTypeResponse,
} from "./services";

export type TWorkItemTypesTab = "types" | "properties";

export enum EWorkItemTypeEntity {
  WORK_ITEM = "WORK_ITEM",
  EPIC = "EPIC",
}

// Work item type
export type TWorkItemType = {
  id: string;
  name: string;
  description: string | null;
  logo_props: TLogoProps;
  is_active: boolean;
  is_default: boolean;
  level: number;
  is_epic: boolean;
  is_global: boolean; // to check if the type is created at workspace level(global) or project level(local)
  properties: TWorkItemTypePropertyRef; // sort order for a property is specific to the type
  workspace: string;
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  updated_by: string | null;
};

export type TPublicWorkItemType = Pick<TWorkItemType, "id" | "name" | "logo_props">;

export type TUpdateWorkItemTypeHierarchyPayload = {
  level: number;
  type_ids: string[];
};

// Work item type instance
export interface BaseWorkItemTypeInstanceSchema extends TWorkItemTypeResponse {
  asJSON: TWorkItemTypeResponse;
  workspaceSlug: string | undefined;
  linkedPropertyIds: string[];
  // permissions
  canEdit: boolean;
  canDelete: boolean;
  canEnableDisable: boolean;
  canLinkProperties: boolean;
  canUnlinkProperties: boolean;
  canReorderProperties: boolean;
  canSetAsDefault: boolean;
  // actions
  mutateProperties: (data: Partial<TWorkItemTypeResponse>) => void;
  updateType: (data: Partial<TWorkItemType>, enableOptimisticUpdate?: boolean) => Promise<void>;
  linkProperties: (propertyIds: string[]) => Promise<void>;
  unlinkProperty: (propertyId: string) => Promise<void>;
  reorderProperty: (propertyId: string, newSortOrder: number) => Promise<void>;
}

export interface ProjectWorkItemTypeInstanceSchema {
  updateType: (data: Partial<TWorkItemType>, enableOptimisticUpdate?: boolean) => Promise<void>;
}

export interface WorkspaceWorkItemTypeInstanceSchema {
  updateType: (data: Partial<TWorkItemType>) => Promise<void>;
}

export type TResolvedWorkItemType = Omit<TWorkItemType, "properties"> & {
  properties: CustomProperty<CustomPropertyType>[];
  property_refs: TWorkItemTypePropertyRef;
};

export interface RootWorkItemTypesStoreSchema {
  allTypes: BaseWorkItemTypeInstanceSchema[];
  get: (typeId: string) => BaseWorkItemTypeInstanceSchema | undefined;
  addOrMutate: (typeId: string, instance: BaseWorkItemTypeInstanceSchema) => void;
  remove: (typeId: string) => void;
  // sub-stores
  workspaceWorkItemTypesStore: WorkspaceWorkItemTypesStoreSchema;
  projectWorkItemTypesStore: ProjectWorkItemTypesStoreSchema;
}

export type WorkspaceWorkItemTypesStoreSchema = {
  // loader
  getLoaderByWorkspaceSlug: (workspaceSlug: string) => TLoader | undefined;
  // helpers
  getWorkItemTypesByWorkspaceSlug: (workspaceSlug: string) => BaseWorkItemTypeInstanceSchema[];
  getActiveWorkItemTypesByWorkspaceSlugGroupedByLevel: (
    workspaceSlug: string
  ) => Map<number, BaseWorkItemTypeInstanceSchema[]>;
  getDefaultWorkItemTypeId: (workspaceSlug: string) => string | undefined;
  // actions
  fetchTypes: (workspaceSlug: string) => Promise<TWorkItemTypeResponse[]>;
  fetchType: (workspaceSlug: string, typeId: string) => Promise<void>;
  createType: (payload: TCreateWorkspaceWorkItemTypePayload) => Promise<TWorkItemTypeResponse | undefined>;
  deleteType: (payload: TDeleteWorkspaceWorkItemTypePayload) => Promise<void>;
  enableWorkItemTypes: (workspaceSlug: string) => Promise<TWorkItemTypeResponse | undefined>;
  setDefaultType: (workspaceSlug: string, typeId: string) => Promise<void>;
  updateHierarchy: (workspaceSlug: string, payload: TUpdateWorkItemTypeHierarchyPayload) => Promise<void>;
  // permissions
  canCreate: (workspaceSlug: string) => boolean;
  canView: (workspaceSlug: string) => boolean;
};

export type ProjectWorkItemTypesStoreSchema = {
  // loader
  getLoaderByProjectId: (workspaceSlug: string) => TLoader | undefined;
  // helpers
  getWorkItemTypesByProjectId: (projectId: string) => BaseWorkItemTypeInstanceSchema[];
  getDefaultWorkItemTypeId: (projectId: string) => string | undefined;
  enrichTypeIdsFromWorkspaceTypes: (types: TWorkItemTypeResponse[]) => void;
  // actions
  fetchTypes: (workspaceSlug: string, projectId: string) => Promise<TWorkItemTypeResponse[]>;
  createType: (payload: TCreateProjectWorkItemTypePayload) => Promise<TWorkItemTypeResponse | undefined>;
  deleteType: (payload: TDeleteProjectWorkItemTypePayload) => Promise<void>;
  importGlobalTypes: (payload: TImportWorkItemTypesPayload) => Promise<void>;
  importGlobalProperties: (payload: TImportGlobalPropertyPayload) => Promise<void>;
  removeImportedTypes: (payload: TImportWorkItemTypesPayload) => Promise<void>;
  // permissions
  canCreate: (workspaceSlug: string, projectId: string) => boolean;
  canView: (workspaceSlug: string, projectId: string) => boolean;
};

export type TIssuePropertySerializedValuePrimitive = string | number | boolean | null | undefined;
export type TIssuePropertySerializedValue =
  | TIssuePropertySerializedValuePrimitive
  | TIssuePropertySerializedValuePrimitive[];

export type TIssuePropertySerializedEntry = {
  property_id?: string;
  value?: TIssuePropertySerializedValue;
  [key: string]: TIssuePropertySerializedValue | undefined;
} | null;

export type TWorkItemPropertyDisplayEntry = {
  property: CustomProperty<CustomPropertyType>;
  propertyId: string;
  propertyTypeKey: CustomPropertyTypeKey;
  displayValues: string[];
};

export type TWorkItemPropertyDisplayContext = {
  entries: TIssuePropertySerializedEntry[];
  workItemType?: BaseWorkItemTypeInstanceSchema;
};
