/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type {
  TInviteCode,
  TOrgRole,
  TPiAggregate,
  TResearchUserProfile,
  TUserImportBatch,
  TUserImportBatchSummary,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TInviteCodePayload = {
  org_role?: TOrgRole | "";
  org_unit?: string | null;
  max_uses?: number;
  expires_in_days?: number;
  note?: string;
};

/**
 * System management surface: invite codes, roster imports, research profiles
 * and the main PI aggregate.
 */
export class ResearchAccountService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getInviteCodes(workspaceSlug: string) {
    return this.get(researchEndpoints.inviteCodes(workspaceSlug))
      .then((res) => res?.data as { results: TInviteCode[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createInviteCode(workspaceSlug: string, payload: TInviteCodePayload) {
    return this.post(researchEndpoints.inviteCodes(workspaceSlug), payload)
      .then((res) => res?.data as TInviteCode)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateInviteCode(workspaceSlug: string, codeId: string, payload: Partial<TInviteCodePayload>) {
    return this.patch(researchEndpoints.inviteCode(workspaceSlug, codeId), payload)
      .then((res) => res?.data as TInviteCode)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async toggleInviteCode(workspaceSlug: string, codeId: string, action: "enable" | "disable") {
    return this.post(researchEndpoints.inviteCodeAction(workspaceSlug, codeId, action), {})
      .then((res) => res?.data as TInviteCode)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteInviteCode(workspaceSlug: string, codeId: string) {
    return this.delete(researchEndpoints.inviteCode(workspaceSlug, codeId)).catch((err) => {
      throw err?.response?.data;
    });
  }

  async getUserImports(workspaceSlug: string) {
    return this.get(researchEndpoints.userImports(workspaceSlug))
      .then((res) => res?.data as { results: TUserImportBatchSummary[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getUserImport(workspaceSlug: string, batchId: string) {
    return this.get(researchEndpoints.userImport(workspaceSlug, batchId))
      .then((res) => res?.data as TUserImportBatch)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async importUsers(
    workspaceSlug: string,
    payload: { students: File; advisors?: File; dry_run?: boolean; reset_passwords?: boolean }
  ) {
    const formData = new FormData();
    formData.append("students", payload.students);
    if (payload.advisors) formData.append("advisors", payload.advisors);
    formData.append("dry_run", payload.dry_run ? "true" : "false");
    formData.append("reset_passwords", payload.reset_passwords ? "true" : "false");

    return this.post(researchEndpoints.userImports(workspaceSlug), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
      .then((res) => res?.data as TUserImportBatch)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  getUserImportReportUrl(workspaceSlug: string, batchId: string) {
    return researchEndpoints.userImportReport(workspaceSlug, batchId);
  }

  async getUserProfiles(workspaceSlug: string, params: Record<string, string> = {}) {
    return this.get(researchEndpoints.userProfiles(workspaceSlug), { params })
      .then((res) => res?.data as { results: TResearchUserProfile[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateUserProfile(workspaceSlug: string, payload: Partial<TResearchUserProfile> & { user: string }) {
    return this.patch(researchEndpoints.userProfiles(workspaceSlug), payload)
      .then((res) => res?.data as TResearchUserProfile)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getPiAggregate(workspaceSlug: string) {
    return this.get(researchEndpoints.piAggregate(workspaceSlug))
      .then((res) => res?.data as TPiAggregate)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
