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

import type { CustomProperty, CustomPropertyType, TWorkItemPropertyPayload } from "./work-item-properties";
import type { CustomPropertyOption } from "./work-item-property-option";
import type { TWorkItemType } from "./work-item-types";

export type TWorkItemTypeResponse = TWorkItemType & {
  project_ids: string[] | undefined;
};

// --------- WORK ITEM TYPES ---------
// create
export type TCreateWorkspaceWorkItemTypePayload = {
  workspaceSlug: string;
  data: Partial<TWorkItemType>;
};
export type TCreateProjectWorkItemTypePayload = TCreateWorkspaceWorkItemTypePayload & {
  projectId: string;
};

// update
export type TUpdateWorkspaceWorkItemTypePayload = TCreateWorkspaceWorkItemTypePayload & {
  typeId: string;
};
export type TUpdateProjectWorkItemTypePayload = TUpdateWorkspaceWorkItemTypePayload & {
  projectId: string;
};

// delete
export type TDeleteWorkspaceWorkItemTypePayload = {
  workspaceSlug: string;
  typeId: string;
};
export type TDeleteProjectWorkItemTypePayload = TDeleteWorkspaceWorkItemTypePayload & {
  projectId: string;
};

// --------- WORK ITEM TYPE PROPERTIES ---------
// update
export type TUpdateWorkspaceTypePropertyPayload = {
  workspaceSlug: string;
  typeId: string;
  propertyId: string;
  data: Partial<CustomProperty<CustomPropertyType>>;
};
export type TUpdateProjectTypePropertyPayload = TUpdateWorkspaceTypePropertyPayload & {
  projectId: string;
};

export type TEnableLocalTypeCreationPayload = {
  workspaceSlug: string;
  projectIds: string[];
};

export type TLinkPropertyToGlobalTypePayload = {
  workspaceSlug: string;
  typeId: string;
  properties: string[]; // list of property IDs to link
};

export type TReorderPropertyToGlobalTypePayload = {
  workspaceSlug: string;
  typeId: string;
  propertyId: string;
  newSortOrder: number;
};

export type TUnlinkPropertyFromGlobalTypePayload = {
  workspaceSlug: string;
  typeId: string;
  propertyId: string;
};

export type TLinkPropertyToLocalTypePayload = TLinkPropertyToGlobalTypePayload & {
  projectId: string;
};

export type TReorderPropertyToLocalTypePayload = TReorderPropertyToGlobalTypePayload & {
  projectId: string;
};

export type TUnlinkPropertyFromLocalTypePayload = TUnlinkPropertyFromGlobalTypePayload & {
  projectId: string;
};

export type TFetchWorkspaceTypePropertiesPayload = {
  workspaceSlug: string;
  typeId: string;
};

// Global
export type TCreateGlobalPropertyPayload = {
  workspaceSlug: string;
  data: TWorkItemPropertyPayload;
};

export type TUpdateGlobalPropertyPayload = {
  workspaceSlug: string;
  propertyId: string;
  data: TWorkItemPropertyPayload;
};

export type TDeleteGlobalPropertyPayload = {
  workspaceSlug: string;
  propertyId: string;
};

// Local
export type TCreateLocalPropertyPayload = {
  workspaceSlug: string;
  projectId: string;
  typeId: string;
  data: TWorkItemPropertyPayload;
};

export type TUpdateLocalPropertyPayload = {
  workspaceSlug: string;
  projectId: string;
  typeId: string;
  propertyId: string;
  data: TWorkItemPropertyPayload;
};

export type TDeleteLocalPropertyPayload = {
  workspaceSlug: string;
  projectId: string;
  typeId: string;
  propertyId: string;
};

export type TImportGlobalPropertyPayload = {
  workspaceSlug: string;
  projectId: string;
  propertyIds: string[];
};

export type TImportWorkItemTypesPayload = {
  workspaceSlug: string;
  projectId: string;
  typeIds: string[];
};

// -------------------------- ISSUE PROPERTY OPTIONS --------------------------

export type TFetchWorkItemPropertyOptionsPayload = {
  workspaceSlug: string;
  projectId?: string;
};

export type TCreateWorkItemPropertyOptionPayload = {
  workspaceSlug: string;
  projectId?: string;
  customPropertyId: string;
  data: Partial<CustomPropertyOption>;
};

export type TUpdateWorkItemPropertyOptionPayload = {
  workspaceSlug: string;
  customPropertyId: string;
  optionId: string;
  data: Partial<CustomPropertyOption>;
};

export type TDeleteWorkItemPropertyOptionPayload = {
  workspaceSlug: string;
  projectId?: string;
  customPropertyId: string;
  issuePropertyOptionId: string;
};
