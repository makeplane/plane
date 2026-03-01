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
import type { ClientOptions, ExIssueProperty } from "@/types";

export class IssuePropertyService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async fetch(workspaceSlug: string, projectId: string, typeId: string): Promise<ExIssueProperty[]> {
    return this.get<ExIssueProperty[]>(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/issue-properties/`
    )
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async fetchById(
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    propertyId: string
  ): Promise<ExIssueProperty> {
    return this.get<ExIssueProperty>(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/issue-properties/${propertyId}/`
    )
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    data: Partial<ExIssueProperty>
  ): Promise<ExIssueProperty> {
    return this.post<ExIssueProperty>(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/issue-properties/`,
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
    typeId: string,
    propertyId: string,
    data: Partial<ExIssueProperty>
  ): Promise<ExIssueProperty> {
    return this.patch<ExIssueProperty>(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/issue-properties/${propertyId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async remove(workspaceSlug: string, projectId: string, typeId: string, propertyId: string): Promise<void> {
    return this.delete<void>(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/issue-properties/${propertyId}/`
    )
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }
}
