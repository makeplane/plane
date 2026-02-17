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
import type { ClientOptions, ExIssuePropertyOption } from "@/types";

export class IssuePropertyOptionService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async fetch(workspaceSlug: string, projectId: string, propertyId: string): Promise<ExIssuePropertyOption[]> {
    return this.get<ExIssuePropertyOption[]>(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${propertyId}/options/`
    )
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async fetchById(
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    optionId: string
  ): Promise<ExIssuePropertyOption> {
    return this.get<ExIssuePropertyOption>(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${propertyId}/options/${optionId}/`
    )
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    data: Partial<ExIssuePropertyOption>
  ): Promise<ExIssuePropertyOption> {
    return this.post<ExIssuePropertyOption>(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${propertyId}/options/`,
      data
    )
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    optionId: string,
    data: Partial<ExIssuePropertyOption>
  ): Promise<ExIssuePropertyOption> {
    return this.patch<ExIssuePropertyOption>(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${propertyId}/options/${optionId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async remove(workspaceSlug: string, projectId: string, propertyId: string, optionId: string): Promise<void> {
    return this.delete<void>(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-properties/${propertyId}/options/${optionId}/`
    )
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }
}
