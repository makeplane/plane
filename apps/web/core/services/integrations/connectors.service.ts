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

import type { TConnector, TConnectorFormData } from "@plane/types";
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";

export class ConnectorsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async listAll(workspaceSlug: string): Promise<TConnector[]> {
    return this.get(`/api/silo/workspaces/${workspaceSlug}/mcp-applications/`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listMostUsed(workspaceSlug: string): Promise<TConnector[]> {
    return this.get(`/api/silo/workspaces/${workspaceSlug}/mcp-applications/`, { params: { featured: true } })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, connector: TConnectorFormData): Promise<TConnector> {
    return this.post(`/api/silo/workspaces/${workspaceSlug}/mcp-applications/`, connector)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, id: string, connector: TConnectorFormData): Promise<TConnector> {
    return this.patch(`/api/silo/workspaces/${workspaceSlug}/mcp-applications/${id}/`, connector)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateCredentials(
    workspaceSlug: string,
    id: string,
    data: { headers: { name: string; value: string }[] }
  ): Promise<TConnector> {
    return this.patch(`/api/silo/workspaces/${workspaceSlug}/mcp-applications/${id}/credentials/`, data)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async connect(workspaceSlug: string, id: string, connector: TConnector): Promise<TConnector> {
    return this.post(`/api/silo/workspaces/${workspaceSlug}/mcp-applications/${id}/connect/`, connector)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async disconnect(workspaceSlug: string, id: string): Promise<string> {
    return this.post(`/api/silo/workspaces/${workspaceSlug}/mcp-applications/${id}/disconnect/`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async destroy(workspaceSlug: string, id: string): Promise<string> {
    return this.delete(`/api/silo/workspaces/${workspaceSlug}/mcp-applications/${id}/`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
