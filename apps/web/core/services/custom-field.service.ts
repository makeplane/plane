/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  ECustomFieldEntityType,
  TCustomField,
  TCustomFieldValuePayload,
  TCustomFieldWithValue,
} from "@plane/types";
import { APIService } from "@/services/api.service";

export class CustomFieldService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, entityType?: ECustomFieldEntityType): Promise<TCustomField[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/custom-fields/`,
      entityType ? { params: { entity_type: entityType } } : {}
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listActive(workspaceSlug: string, entityType: ECustomFieldEntityType): Promise<TCustomField[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/custom-fields/active/`, {
      params: { entity_type: entityType },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: Partial<TCustomField>): Promise<TCustomField> {
    return this.post(`/api/workspaces/${workspaceSlug}/custom-fields/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, fieldId: string, data: Partial<TCustomField>): Promise<TCustomField> {
    return this.patch(`/api/workspaces/${workspaceSlug}/custom-fields/${fieldId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, fieldId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/custom-fields/${fieldId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchProjectValues(workspaceSlug: string, projectId: string): Promise<TCustomFieldWithValue[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/custom-field-values/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectValues(
    workspaceSlug: string,
    projectId: string,
    values: TCustomFieldValuePayload[]
  ): Promise<TCustomFieldWithValue[]> {
    return this.put(`/api/workspaces/${workspaceSlug}/projects/${projectId}/custom-field-values/`, { values })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchIssueValues(workspaceSlug: string, projectId: string, issueId: string): Promise<TCustomFieldWithValue[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/custom-field-values/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateIssueValues(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    values: TCustomFieldValuePayload[]
  ): Promise<TCustomFieldWithValue[]> {
    return this.put(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/custom-field-values/`, {
      values,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
