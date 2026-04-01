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

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type {
  TCreateWorkspaceWorkItemTypePayload,
  TDeleteWorkspaceWorkItemTypePayload,
  TFetchWorkspaceTypePropertiesPayload,
  TLinkPropertyToGlobalTypePayload,
  TPaginatedResponse,
  TUnlinkPropertyFromGlobalTypePayload,
  TUpdateWorkspaceWorkItemTypePayload,
  CustomProperty,
  CustomPropertyType,
  TWorkItemTypeResponse,
  TReorderPropertyToGlobalTypePayload,
  TUpdateWorkItemTypeHierarchyPayload,
} from "@plane/types";
// local imports
import { APIService } from "../api.service";

export class WorkspaceWorkItemTypesService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string): Promise<TWorkItemTypeResponse[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/work-item-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, typeId: string): Promise<TWorkItemTypeResponse[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/work-item-types/${typeId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(payload: TCreateWorkspaceWorkItemTypePayload): Promise<TWorkItemTypeResponse> {
    return this.post(`/api/workspaces/${payload.workspaceSlug}/work-item-types/`, payload.data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(payload: TUpdateWorkspaceWorkItemTypePayload): Promise<void> {
    return this.patch(`/api/workspaces/${payload.workspaceSlug}/work-item-types/${payload.typeId}/`, payload.data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listTypeProperties(
    payload: TFetchWorkspaceTypePropertiesPayload
  ): Promise<TPaginatedResponse<CustomProperty<CustomPropertyType>[]>> {
    return this.get(`/api/workspaces/${payload.workspaceSlug}/work-item-types/${payload.typeId}/work-item-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async enable(workspaceSlug: string): Promise<TWorkItemTypeResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/default-work-item-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(payload: TDeleteWorkspaceWorkItemTypePayload): Promise<void> {
    return this.delete(`/api/workspaces/${payload.workspaceSlug}/work-item-types/${payload.typeId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async linkProperty(payload: TLinkPropertyToGlobalTypePayload): Promise<Record<string, number>> {
    return this.post(
      `/api/workspaces/${payload.workspaceSlug}/work-item-types/${payload.typeId}/work-item-properties/`,
      { properties: payload.properties }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async reorderProperty(payload: TReorderPropertyToGlobalTypePayload): Promise<void> {
    return this.patch(
      `/api/workspaces/${payload.workspaceSlug}/work-item-types/${payload.typeId}/work-item-properties/${payload.propertyId}/`,
      { sort_order: payload.newSortOrder }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unlinkProperty(payload: TUnlinkPropertyFromGlobalTypePayload): Promise<void> {
    return this.delete(
      `/api/workspaces/${payload.workspaceSlug}/work-item-types/${payload.typeId}/work-item-properties/${payload.propertyId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateHierarchy(workspaceSlug: string, payload: TUpdateWorkItemTypeHierarchyPayload): Promise<void> {
    return this.patch(`/api/workspaces/${workspaceSlug}/work-item-types/hierarchy/`, payload)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
