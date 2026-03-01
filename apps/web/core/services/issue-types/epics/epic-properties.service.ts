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
  EIssuePropertyType,
  IIssuePropertiesService,
  TCreateIssuePropertyPayload,
  TDeleteIssuePropertyPayload,
  TFetchIssuePropertiesPayload,
  TIssueProperty,
  TIssuePropertyResponse,
  TUpdateIssuePropertyPayload,
} from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class EpicPropertiesService extends APIService implements IIssuePropertiesService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll({
    workspaceSlug,
    projectId,
  }: TFetchIssuePropertiesPayload): Promise<TIssueProperty<EIssuePropertyType>[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create({ workspaceSlug, projectId, data }: TCreateIssuePropertyPayload): Promise<TIssuePropertyResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-properties/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update({
    workspaceSlug,
    projectId,
    customPropertyId,
    data,
  }: TUpdateIssuePropertyPayload): Promise<TIssuePropertyResponse> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-properties/${customPropertyId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProperty({ workspaceSlug, projectId, customPropertyId }: TDeleteIssuePropertyPayload): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epic-properties/${customPropertyId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const epicPropertyService = new EpicPropertiesService();
