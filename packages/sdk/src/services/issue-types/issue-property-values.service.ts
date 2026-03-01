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

import { APIService } from "@/services/api.service";
// types
import type { AxiosError } from "axios";
import type { ClientOptions, ExIssuePropertyValue } from "@/types";

export class IssuePropertyValueService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async fetch(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string
  ): Promise<ExIssuePropertyValue> {
    return this.get<ExIssuePropertyValue>(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-properties/${propertyId}/values/`
    )
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string,
    data: { values: ExIssuePropertyValue }
  ): Promise<ExIssuePropertyValue> {
    return this.post<ExIssuePropertyValue>(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-properties/${propertyId}/values/`,
      data
    )
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }
}
