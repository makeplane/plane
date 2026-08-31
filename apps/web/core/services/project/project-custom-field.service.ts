/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { IProjectCustomField, IProjectCustomFieldValue } from "@plane/types";
import { APIService } from "@/services/api.service";

export class ProjectCustomFieldService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getCustomFields(workspaceSlug: string, projectId: string): Promise<IProjectCustomField[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/custom-fields/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createCustomField(
    workspaceSlug: string,
    projectId: string,
    data: Partial<IProjectCustomField>
  ): Promise<IProjectCustomField> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/custom-fields/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateCustomField(
    workspaceSlug: string,
    projectId: string,
    fieldId: string,
    data: Partial<IProjectCustomField>
  ): Promise<IProjectCustomField> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/custom-fields/${fieldId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteCustomField(workspaceSlug: string, projectId: string, fieldId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/custom-fields/${fieldId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCustomFieldValues(workspaceSlug: string, projectId: string): Promise<IProjectCustomFieldValue[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/custom-field-values/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async setCustomFieldValue(
    workspaceSlug: string,
    projectId: string,
    fieldId: string,
    data: Partial<IProjectCustomFieldValue>
  ): Promise<IProjectCustomFieldValue> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/custom-field-values/${fieldId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
