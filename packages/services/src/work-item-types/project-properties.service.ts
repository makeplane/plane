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
  TCreateLocalPropertyPayload,
  TDeleteLocalPropertyPayload,
  TImportGlobalPropertyPayload,
  TUpdateLocalPropertyPayload,
  CustomProperty,
  TWorkItemPropertyResponse,
  CustomPropertyType,
} from "@plane/types";
// local imports
import { APIService } from "../api.service";

export class ProjectPropertiesService<T extends CustomPropertyType> extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, projectId: string): Promise<CustomProperty<T>[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(payload: TCreateLocalPropertyPayload): Promise<TWorkItemPropertyResponse<T>> {
    return this.post(
      `/api/workspaces/${payload.workspaceSlug}/projects/${payload.projectId}/issue-types/${payload.typeId}/issue-properties/`,
      payload.data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(payload: TUpdateLocalPropertyPayload): Promise<TWorkItemPropertyResponse<T>> {
    return this.patch(
      `/api/workspaces/${payload.workspaceSlug}/projects/${payload.projectId}/issue-types/${payload.typeId}/issue-properties/${payload.propertyId}/`,
      payload.data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(payload: TDeleteLocalPropertyPayload): Promise<void> {
    return this.delete(
      `/api/workspaces/${payload.workspaceSlug}/projects/${payload.projectId}/issue-types/${payload.typeId}/issue-properties/${payload.propertyId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async importGlobalProperties(payload: TImportGlobalPropertyPayload): Promise<void> {
    const routeKey = payload.propertyIds[0] ?? "00000000-0000-0000-0000-000000000000";

    return this.post(
      `/api/workspaces/${payload.workspaceSlug}/projects/${payload.projectId}/import-work-item-properties/${routeKey}/`,
      {
        properties: payload.propertyIds.map((propertyId) => ({ id: propertyId })),
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
