/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { IIssueProperty, IIssuePropertyOption } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

/**
 * CRUD for custom property definitions of a work item type and the options of an
 * OPTION property. Mirrors the internal (session) endpoints exposed by the API.
 */
export class IssuePropertyService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // ---- property definitions (scoped to a work item type) ----

  async list(workspaceSlug: string, projectId: string, typeId: string): Promise<IIssueProperty[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    propertyId: string
  ): Promise<IIssueProperty> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/properties/${propertyId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    data: Partial<IIssueProperty>
  ): Promise<IIssueProperty> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/properties/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    propertyId: string,
    data: Partial<IIssueProperty>
  ): Promise<IIssueProperty> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/properties/${propertyId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, projectId: string, typeId: string, propertyId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/properties/${propertyId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // ---- options (scoped to a property, path uses project + property id) ----

  async listOptions(workspaceSlug: string, projectId: string, propertyId: string): Promise<IIssuePropertyOption[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/properties/${propertyId}/options/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createOption(
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    data: Partial<IIssuePropertyOption>
  ): Promise<IIssuePropertyOption> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/properties/${propertyId}/options/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateOption(
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    optionId: string,
    data: Partial<IIssuePropertyOption>
  ): Promise<IIssuePropertyOption> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/properties/${propertyId}/options/${optionId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroyOption(workspaceSlug: string, projectId: string, propertyId: string, optionId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/properties/${propertyId}/options/${optionId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
