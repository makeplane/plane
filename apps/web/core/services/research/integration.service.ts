/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type { TExternalReference, TIntegrationCallLog, TIntegrationConnection } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TIntegrationConnectionPayload = {
  system: string;
  display_name?: string;
  base_url?: string;
  auth_mode?: string;
  credential_ref?: string;
  timeout_seconds?: number;
  cache_ttl_seconds?: number;
  degraded_mode?: string;
  is_enabled?: boolean;
};

export type TIntegrationSearchResult = {
  items: Array<Record<string, unknown>>;
  count: number;
  degraded: boolean;
  degraded_reason?: string;
  source_system: string;
  source_url?: string;
  synced_at: string | null;
  request_id: string;
  filtered_out?: number;
};

export type TExternalReferencePayload = {
  system: string;
  external_type: string;
  external_id: string;
  title: string;
  summary?: string;
  source_url: string;
  acl_hint: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  external_parent_id?: string;
};

export class ResearchIntegrationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getConnections(workspaceSlug: string) {
    return this.get(researchEndpoints.integrations(workspaceSlug))
      .then((res) => res?.data as { results: TIntegrationConnection[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateConnections(workspaceSlug: string, items: TIntegrationConnectionPayload[]) {
    return this.patch(researchEndpoints.integrations(workspaceSlug), { items })
      .then((res) => res?.data as { results: TIntegrationConnection[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getHealth(workspaceSlug: string) {
    return this.get(researchEndpoints.integrationHealth(workspaceSlug))
      .then((res) => res?.data as { results: Array<Record<string, unknown>>; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async search(workspaceSlug: string, system: string, query: string) {
    return this.get(researchEndpoints.integrationSearch(workspaceSlug), { params: { system, q: query } })
      .then((res) => res?.data as TIntegrationSearchResult)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async searchSystem(endpoint: string, query: string) {
    return this.get(`${endpoint}?q=${encodeURIComponent(query)}`)
      .then((res) => res?.data as TIntegrationSearchResult)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getCallLogs(workspaceSlug: string) {
    return this.get(researchEndpoints.integrationCallLogs(workspaceSlug))
      .then((res) => res?.data as { results: TIntegrationCallLog[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getReferences(workspaceSlug: string) {
    return this.get(researchEndpoints.externalReferences(workspaceSlug))
      .then((res) => res?.data as { results: TExternalReference[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createReference(workspaceSlug: string, payload: TExternalReferencePayload) {
    return this.post(researchEndpoints.externalReferences(workspaceSlug), payload)
      .then((res) => res?.data as TExternalReference)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteReference(workspaceSlug: string, referenceId: string) {
    return this.delete(researchEndpoints.externalReference(workspaceSlug, referenceId)).catch((err) => {
      throw err?.response?.data;
    });
  }

  async linkReference(workspaceSlug: string, referenceId: string, targetType: string, targetId: string) {
    return this.post(researchEndpoints.externalReferenceLinks(workspaceSlug, referenceId), {
      target_type: targetType,
      target_id: targetId,
    })
      .then((res) => res?.data as TExternalReference)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
