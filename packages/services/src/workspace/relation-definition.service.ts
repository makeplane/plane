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

import { API_BASE_URL } from "@plane/constants";
import type { IWorkItemRelationDefinition, TWorkItemRelationDefinitionPayload } from "@plane/types";
import { APIService } from "../api.service";

export class WorkItemRelationDefinitionService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async list(workspaceSlug: string, params?: Record<string, string>): Promise<IWorkItemRelationDefinition[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/work-item-relation-definitions/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: TWorkItemRelationDefinitionPayload): Promise<IWorkItemRelationDefinition> {
    return this.post(`/api/workspaces/${workspaceSlug}/work-item-relation-definitions/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    id: string,
    data: TWorkItemRelationDefinitionPayload
  ): Promise<IWorkItemRelationDefinition> {
    return this.patch(`/api/workspaces/${workspaceSlug}/work-item-relation-definitions/${id}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, id: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/work-item-relation-definitions/${id}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
