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
import type { TIssuePropertyValues } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class DraftIssuePropertyValuesService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssuePropertyValues> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/draft-issues/${issueId}/values/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: TIssuePropertyValues
  ): Promise<TIssuePropertyValues> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/draft-issues/${issueId}/values/`, {
      property_values: data,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string,
    data: string[]
  ): Promise<void> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/draft-issues/${issueId}/issue-properties/${propertyId}/values/`,
      {
        values: data,
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
