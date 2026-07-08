/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { IIssuePropertyValue } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

/**
 * Fetch and set the typed custom property values of a work item. Mirrors the
 * internal (session) value endpoints exposed by the API. The set endpoint takes
 * a ``values`` payload (an array for ``is_multi`` properties, a single value
 * otherwise) and replaces the current values of the property.
 */
export class IssuePropertyValueService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Returns every custom property value of a work item.
   */
  async fetchAll(workspaceSlug: string, projectId: string, issueId: string): Promise<IIssuePropertyValue[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/property-values/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Returns the value rows of a single property for a work item.
   */
  async fetchByProperty(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string
  ): Promise<IIssuePropertyValue[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/properties/${propertyId}/values/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Replaces the value(s) of a single property on a work item.
   */
  async setValues(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string,
    values: string[]
  ): Promise<IIssuePropertyValue[]> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/properties/${propertyId}/values/`,
      { values }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Removes every value of a single property on a work item.
   */
  async removeValues(workspaceSlug: string, projectId: string, issueId: string, propertyId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/properties/${propertyId}/values/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
