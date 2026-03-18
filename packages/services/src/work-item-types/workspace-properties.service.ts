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
  TCreateGlobalPropertyPayload,
  TDeleteGlobalPropertyPayload,
  TUpdateGlobalPropertyPayload,
  CustomProperty,
  TWorkItemPropertyResponse,
  CustomPropertyType,
} from "@plane/types";
// local imports
import { APIService } from "../api.service";

export class WorkspacePropertiesService<T extends CustomPropertyType> extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string): Promise<CustomProperty<T>[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/work-item-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(payload: TCreateGlobalPropertyPayload): Promise<TWorkItemPropertyResponse<T>> {
    return this.post(`/api/workspaces/${payload.workspaceSlug}/work-item-properties/`, payload.data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(payload: TUpdateGlobalPropertyPayload): Promise<TWorkItemPropertyResponse<T>> {
    return this.patch(
      `/api/workspaces/${payload.workspaceSlug}/work-item-properties/${payload.propertyId}/`,
      payload.data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(payload: TDeleteGlobalPropertyPayload): Promise<void> {
    return this.delete(`/api/workspaces/${payload.workspaceSlug}/work-item-properties/${payload.propertyId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
