/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type { TCodeArtifact, TCodeRepository, TCodeSummary } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TCodeRepositoryPayload = {
  repository_url: string;
  provider?: string;
  repository_slug?: string;
  default_branch?: string;
  visibility?: string;
  credential_ref?: string;
};

export type TCodeArtifactPayload = {
  ref_type: string;
  ref_value: string;
  commit_message?: string;
  author_name?: string;
  committed_at?: string | null;
  linked_experiment?: string | null;
  description?: string;
};

export class ResearchCodeService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getRepositories(workspaceSlug: string, projectId: string) {
    return this.get(researchEndpoints.codeRepositories(workspaceSlug, projectId))
      .then((res) => res?.data as { results: TCodeRepository[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createRepository(workspaceSlug: string, projectId: string, payload: TCodeRepositoryPayload) {
    return this.post(researchEndpoints.codeRepositories(workspaceSlug, projectId), payload)
      .then((res) => res?.data as TCodeRepository)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getRepository(workspaceSlug: string, repositoryId: string) {
    return this.get(researchEndpoints.codeRepository(workspaceSlug, repositoryId))
      .then((res) => res?.data as TCodeRepository & { artifacts: TCodeArtifact[] })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async syncRepository(workspaceSlug: string, repositoryId: string) {
    return this.post(researchEndpoints.codeRepositorySync(workspaceSlug, repositoryId), {})
      .then((res) => res?.data as TCodeRepository & { degraded: boolean; degraded_reason: string })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getArtifacts(workspaceSlug: string, repositoryId: string) {
    return this.get(researchEndpoints.codeArtifacts(workspaceSlug, repositoryId))
      .then((res) => res?.data as { results: TCodeArtifact[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createArtifact(workspaceSlug: string, repositoryId: string, payload: TCodeArtifactPayload) {
    return this.post(researchEndpoints.codeArtifacts(workspaceSlug, repositoryId), payload)
      .then((res) => res?.data as TCodeArtifact)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async presignSnapshot(
    workspaceSlug: string,
    repositoryId: string,
    payload: { file_name: string; content_type: string; size: number }
  ) {
    return this.post(researchEndpoints.codeSnapshots(workspaceSlug, repositoryId), { ...payload, mode: "presign" })
      .then((res) => res?.data as { upload_data: Record<string, unknown>; asset_id: string; max_bytes: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async registerSnapshot(
    workspaceSlug: string,
    repositoryId: string,
    payload: { asset_id: string; ref_value: string; description?: string }
  ) {
    return this.post(researchEndpoints.codeSnapshots(workspaceSlug, repositoryId), payload)
      .then((res) => res?.data as TCodeArtifact)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getSummary(workspaceSlug: string, projectId: string) {
    return this.get(researchEndpoints.codeSummary(workspaceSlug, projectId))
      .then((res) => res?.data as TCodeSummary)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
