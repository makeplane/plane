/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type { TIdentityMapping, TResearchAuditEvent, TResearchIdentity, TWorkspaceResearchSetting } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class ResearchPlatformService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getHealth() {
    return this.get(researchEndpoints.health())
      .then((res) => res?.data as { module_enabled: boolean; limits: Record<string, number> })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getIdentity(workspaceSlug: string) {
    return this.get(researchEndpoints.identityMe(workspaceSlug))
      .then((res) => res?.data as TResearchIdentity)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getSettings(workspaceSlug: string) {
    return this.get(researchEndpoints.settings(workspaceSlug))
      .then((res) => res?.data as TWorkspaceResearchSetting)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateSettings(workspaceSlug: string, payload: Partial<TWorkspaceResearchSetting>) {
    return this.patch(researchEndpoints.settings(workspaceSlug), payload)
      .then((res) => res?.data as TWorkspaceResearchSetting)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getIdentityMappings(workspaceSlug: string, params: Record<string, string> = {}) {
    return this.get(researchEndpoints.identityMappings(workspaceSlug), { params })
      .then((res) => res?.data as { results: TIdentityMapping[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createIdentityMapping(
    workspaceSlug: string,
    payload: { user: string; subject: string; email_snapshot?: string; employee_id?: string }
  ) {
    return this.post(researchEndpoints.identityMappings(workspaceSlug), payload)
      .then((res) => res?.data as TIdentityMapping)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteIdentityMapping(workspaceSlug: string, mappingId: string) {
    return this.delete(researchEndpoints.identityMapping(workspaceSlug, mappingId))
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getAuditEvents(workspaceSlug: string, params: Record<string, string | number> = {}) {
    return this.get(researchEndpoints.auditEvents(workspaceSlug), { params })
      .then((res) => res?.data as { results: TResearchAuditEvent[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
