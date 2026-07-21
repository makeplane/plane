/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export type TCrmSyncStatus = "success" | "partial" | "failed";

export type TCrmIntegration = {
  id?: string;
  workspace?: string;
  crm_api_url?: string;
  crm_project_id_custom_field?: string | null;
  crm_invoice_hours_field_id?: number | null;
  is_active?: boolean;
  last_synced_at?: string | null;
  last_sync_status?: TCrmSyncStatus | null;
  has_api_key?: boolean;
  created_at?: string;
  updated_at?: string;
};

/** Payload sent when creating/updating; `crm_api_key` is write-only. */
export type TCrmIntegrationPayload = Partial<TCrmIntegration> & {
  crm_api_key?: string;
};

export type TCrmSyncLog = {
  id: string;
  integration: string;
  sync_month: string;
  status: TCrmSyncStatus;
  projects_processed: number;
  projects_synced: number;
  projects_skipped: number;
  details: Record<string, unknown>[] | null;
  created_at: string;
};

export type TCrmConnectionTest = {
  success: boolean;
  projects_count?: number;
  error?: string;
};

export type TCrmField = {
  id: number;
  name: string;
  slug: string;
  type: string;
};

export class CrmIntegrationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async retrieve(workspaceSlug: string): Promise<TCrmIntegration> {
    return this.get(`/api/workspaces/${workspaceSlug}/crm-integration/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: TCrmIntegrationPayload): Promise<TCrmIntegration> {
    return this.post(`/api/workspaces/${workspaceSlug}/crm-integration/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, data: TCrmIntegrationPayload): Promise<TCrmIntegration> {
    return this.patch(`/api/workspaces/${workspaceSlug}/crm-integration/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/crm-integration/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async testConnection(
    workspaceSlug: string,
    data: { crm_api_url?: string; crm_api_key?: string }
  ): Promise<TCrmConnectionTest> {
    return this.post(`/api/workspaces/${workspaceSlug}/crm-integration/test/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchCrmFields(
    workspaceSlug: string,
    data: { crm_api_url?: string; crm_api_key?: string; entity?: string }
  ): Promise<{ success: boolean; fields: TCrmField[]; error?: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/crm-integration/crm-fields/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async syncNow(workspaceSlug: string): Promise<{ success: boolean; message: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/crm-integration/sync/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchLogs(workspaceSlug: string): Promise<TCrmSyncLog[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/crm-integration/logs/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** List active project custom fields, used to populate the project-id field selector. */
  async fetchProjectCustomFields(workspaceSlug: string): Promise<{ id: string; display_name: string }[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/custom-fields/active/`, {
      params: { entity_type: "project" },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
