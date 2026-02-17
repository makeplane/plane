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
import type { ClientOptions, ExIssueType } from "@/types";

export class IssueTypeService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async fetch(workspaceSlug: string, projectId: string): Promise<ExIssueType[]> {
    return this.get<ExIssueType[]>(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`)
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async fetchById(workspaceSlug: string, projectId: string, typeId: string): Promise<ExIssueType> {
    return this.get<ExIssueType>(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/`)
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, projectId: string, data: Partial<ExIssueType>): Promise<ExIssueType> {
    return this.post<ExIssueType>(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`, data)
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    typeId: string,
    data: Partial<ExIssueType>
  ): Promise<ExIssueType> {
    return this.patch<ExIssueType>(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }

  async remove(workspaceSlug: string, projectId: string, typeId: string): Promise<void> {
    return this.delete<void>(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${typeId}/`)
      .then((response) => response?.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }
}
