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
  TCreateWorkItemPropertyOptionPayload,
  TDeleteWorkItemPropertyOptionPayload,
  TUpdateWorkItemPropertyOptionPayload,
  CustomPropertyOption,
  TWorkItemPropertyOptionsPayload,
} from "@plane/types";
// local imports
import { APIService } from "../api.service";

export class WorkspacePropertyOptionsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(workspaceSlug: string): Promise<TWorkItemPropertyOptionsPayload> {
    return this.get(`/api/workspaces/${workspaceSlug}/work-item-property-options/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create({
    workspaceSlug,
    customPropertyId,
    data,
  }: TCreateWorkItemPropertyOptionPayload): Promise<CustomPropertyOption> {
    return this.post(`/api/workspaces/${workspaceSlug}/work-item-properties/${customPropertyId}/options/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update({
    workspaceSlug,
    customPropertyId,
    optionId,
    data,
  }: TUpdateWorkItemPropertyOptionPayload): Promise<CustomPropertyOption> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/work-item-properties/${customPropertyId}/options/${optionId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteOption({
    workspaceSlug,
    customPropertyId,
    issuePropertyOptionId,
  }: TDeleteWorkItemPropertyOptionPayload): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/work-item-properties/${customPropertyId}/options/${issuePropertyOptionId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
