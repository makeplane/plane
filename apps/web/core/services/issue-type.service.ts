/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TIssueProperty,
  TIssuePropertyCreatePayload,
  TIssuePropertyOption,
  TIssuePropertyValuesPayload,
  TIssuePropertyValuesResponse,
  TWorkItemType,
  TWorkItemTypeCreatePayload,
} from "@plane/types";
import { APIService } from "@/services/api.service";

/**
 * CRUD for Work Item Types, their custom properties + options, and per-work-item
 * property values. Talks to the internal `plane.app` API.
 */
export class IssueTypeService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private base(workspaceSlug: string, projectId: string) {
    return `/api/workspaces/${workspaceSlug}/projects/${projectId}`;
  }

  // -- work item types -------------------------------------------------
  async list(workspaceSlug: string, projectId: string): Promise<TWorkItemType[]> {
    return this.get(`${this.base(workspaceSlug, projectId)}/issue-types/`)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async enable(workspaceSlug: string, projectId: string): Promise<{ message: string }> {
    return this.post(`${this.base(workspaceSlug, projectId)}/issue-types/enable/`)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, projectId: string, data: TWorkItemTypeCreatePayload): Promise<TWorkItemType> {
    return this.post(`${this.base(workspaceSlug, projectId)}/issue-types/`, data)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    data: Partial<TWorkItemType>
  ): Promise<TWorkItemType> {
    return this.patch(`${this.base(workspaceSlug, projectId)}/issue-types/${typeId}/`, data)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, projectId: string, typeId: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug, projectId)}/issue-types/${typeId}/`)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // -- properties ------------------------------------------------------
  async listProperties(workspaceSlug: string, projectId: string, typeId: string): Promise<TIssueProperty[]> {
    return this.get(`${this.base(workspaceSlug, projectId)}/issue-types/${typeId}/issue-properties/`)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createProperty(
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    data: TIssuePropertyCreatePayload
  ): Promise<TIssueProperty> {
    return this.post(`${this.base(workspaceSlug, projectId)}/issue-types/${typeId}/issue-properties/`, data)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProperty(
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    propertyId: string,
    data: Partial<TIssueProperty>
  ): Promise<TIssueProperty> {
    return this.patch(
      `${this.base(workspaceSlug, projectId)}/issue-types/${typeId}/issue-properties/${propertyId}/`,
      data
    )
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroyProperty(workspaceSlug: string, projectId: string, typeId: string, propertyId: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug, projectId)}/issue-types/${typeId}/issue-properties/${propertyId}/`)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // -- options ---------------------------------------------------------
  async createOption(
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    data: Partial<TIssuePropertyOption>
  ): Promise<TIssuePropertyOption> {
    return this.post(`${this.base(workspaceSlug, projectId)}/issue-properties/${propertyId}/options/`, data)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroyOption(workspaceSlug: string, projectId: string, propertyId: string, optionId: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug, projectId)}/issue-properties/${propertyId}/options/${optionId}/`)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // -- values ----------------------------------------------------------
  async getValues(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssuePropertyValuesResponse> {
    return this.get(`${this.base(workspaceSlug, projectId)}/issues/${issueId}/issue-property-values/`)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async setValues(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    values: TIssuePropertyValuesPayload
  ): Promise<TIssuePropertyValuesResponse> {
    return this.post(`${this.base(workspaceSlug, projectId)}/issues/${issueId}/issue-property-values/`, values)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const issueTypeService = new IssueTypeService();
