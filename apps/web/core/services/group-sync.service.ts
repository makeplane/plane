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

import { API_BASE_URL } from "@plane/constants";
import type { GroupSyncConfig, GroupMap } from "@plane/types";
import { APIService } from "@/services/api.service";

export class GroupSyncService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchGroupSyncConfigByWorkspaceSlug(workspaceSlug: string): Promise<GroupSyncConfig> {
    return this.get(`/auth/sso/workspaces/${workspaceSlug}/group-sync/config/`)
      .then((response) => response?.data as GroupSyncConfig)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async updateGroupSyncConfigByWorkspaceSlug(
    workspaceSlug: string,
    payload: Partial<GroupSyncConfig>
  ): Promise<GroupSyncConfig> {
    return this.patch(`/auth/sso/workspaces/${workspaceSlug}/group-sync/config/`, payload)
      .then((response) => response?.data as GroupSyncConfig)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async fetchGroupMappingsByWorkspaceSlug(workspaceSlug: string): Promise<GroupMap[]> {
    return this.get(`/auth/sso/workspaces/${workspaceSlug}/group-sync/mappings/`)
      .then((response) => response?.data as GroupMap[])
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async createGroupMappingByWorkspaceSlug(workspaceSlug: string, payload: Partial<GroupMap>): Promise<GroupMap> {
    return this.post(`/auth/sso/workspaces/${workspaceSlug}/group-sync/mappings/`, payload)
      .then((response) => response?.data as GroupMap)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async updateGroupMappingByWorkspaceSlug(
    workspaceSlug: string,
    mappingId: string,
    payload: Partial<GroupMap>
  ): Promise<GroupMap> {
    return this.patch(`/auth/sso/workspaces/${workspaceSlug}/group-sync/mappings/${mappingId}/`, payload)
      .then((response) => response?.data as GroupMap)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }

  async deleteGroupMappingByWorkspaceSlug(workspaceSlug: string, mappingId: string): Promise<GroupMap> {
    return this.delete(`/auth/sso/workspaces/${workspaceSlug}/group-sync/mappings/${mappingId}/`)
      .then((response) => response?.data as GroupMap)
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }
}
