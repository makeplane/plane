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

import type { AxiosInstance } from "axios";
import axios from "axios";

export interface CursorSettings {
  repository: string;
  ref: string;
  hasApiKey: boolean;
}

export interface CursorSettingsPayload {
  apiKey?: string;
  repository: string;
  ref?: string;
}

export interface CursorRepository {
  owner: string;
  name: string;
  repository: string;
}

export interface CursorProjectMapping {
  id: string;
  project_id: string;
  entity_id: string;
  entity_data: { repository: string; ref?: string };
}

interface SiloResponse<T> {
  status: number;
  message: string;
  data: T;
}

export class CursorIntegrationService {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  async getSettings(workspaceId: string): Promise<CursorSettings> {
    return this.axiosInstance
      .get<SiloResponse<CursorSettings>>(`/api/agents/cursor/settings/${workspaceId}/`)
      .then((res) => res.data.data)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });
  }

  async saveSettings(workspaceId: string, data: CursorSettingsPayload): Promise<{ message: string }> {
    return this.axiosInstance
      .post<SiloResponse<{ message: string }>>(`/api/agents/cursor/settings/${workspaceId}/`, data)
      .then((res) => res.data.data)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });
  }

  async getRepositories(workspaceId: string): Promise<CursorRepository[]> {
    return this.axiosInstance
      .get<SiloResponse<CursorRepository[]>>(`/api/agents/cursor/repositories/${workspaceId}/`)
      .then((res) => res.data.data)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });
  }

  async getProjectMappings(workspaceId: string): Promise<CursorProjectMapping[]> {
    return this.axiosInstance
      .get<SiloResponse<CursorProjectMapping[]>>(`/api/agents/cursor/project-mappings/${workspaceId}/`)
      .then((res) => res.data.data)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });
  }

  async createProjectMapping(
    workspaceId: string,
    data: { projectId: string; repository: string; ref?: string }
  ): Promise<CursorProjectMapping> {
    return this.axiosInstance
      .post<SiloResponse<CursorProjectMapping>>(`/api/agents/cursor/project-mappings/${workspaceId}/`, data)
      .then((res) => res.data.data)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });
  }

  async deleteProjectMapping(workspaceId: string, entityConnectionId: string): Promise<void> {
    return this.axiosInstance
      .delete(`/api/agents/cursor/project-mappings/${workspaceId}/${entityConnectionId}/`)
      .then(() => undefined)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });
  }
}
