/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type { TExperimentAmendment, TExperimentAssetLink, TExperimentRecord, TExperimentVersion } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TExperimentListParams = { status?: string; source?: string };

export type TExperimentCreatePayload = {
  title: string;
  objective?: string;
  hypothesis?: string;
  molecular_system?: string;
  smiles?: string;
  system_composition?: string;
  method?: string;
  parameters?: Record<string, unknown>;
  environment?: Record<string, unknown>;
  result?: string;
  metrics?: Record<string, unknown>;
  conclusion?: string;
  failure_reason?: string;
  status_note?: string;
  source?: string;
  visibility?: string;
};

export type TAssetLinkPayload = {
  relation?: string;
  source_system?: string;
  external_asset_id: string;
  external_file_id?: string;
  external_run_id?: string;
  display_name: string;
  mime_type?: string;
  size_bytes?: number | null;
  external_url?: string;
};

export class ResearchExperimentService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getExperiments(workspaceSlug: string, projectId: string, params: TExperimentListParams = {}) {
    return this.get(researchEndpoints.experiments(workspaceSlug, projectId), { params })
      .then((res) => res?.data as { results: TExperimentRecord[]; count: number; counters: Record<string, number> })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createExperiment(workspaceSlug: string, projectId: string, payload: TExperimentCreatePayload) {
    return this.post(researchEndpoints.experiments(workspaceSlug, projectId), payload)
      .then((res) => res?.data as TExperimentRecord)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getExperiment(workspaceSlug: string, recordId: string) {
    return this.get(researchEndpoints.experiment(workspaceSlug, recordId))
      .then((res) => res?.data as TExperimentRecord)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateExperiment(workspaceSlug: string, recordId: string, payload: Partial<TExperimentCreatePayload>) {
    return this.patch(researchEndpoints.experiment(workspaceSlug, recordId), payload)
      .then((res) => res?.data as TExperimentRecord)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateExperimentStatus(
    workspaceSlug: string,
    recordId: string,
    payload: { status: string; failure_reason?: string; status_note?: string }
  ) {
    return this.post(researchEndpoints.experimentStatus(workspaceSlug, recordId), payload)
      .then((res) => res?.data as TExperimentRecord)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async submitExperiment(workspaceSlug: string, recordId: string) {
    return this.post(researchEndpoints.experimentSubmit(workspaceSlug, recordId), {})
      .then((res) => res?.data as TExperimentRecord)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async archiveExperiment(workspaceSlug: string, recordId: string) {
    return this.post(researchEndpoints.experimentArchive(workspaceSlug, recordId), {})
      .then((res) => res?.data as TExperimentRecord)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getVersions(workspaceSlug: string, recordId: string) {
    return this.get(researchEndpoints.experimentVersions(workspaceSlug, recordId))
      .then((res) => res?.data as { results: TExperimentVersion[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getAssets(workspaceSlug: string, recordId: string) {
    return this.get(researchEndpoints.experimentAssets(workspaceSlug, recordId))
      .then((res) => res?.data as { results: TExperimentAssetLink[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async linkAsset(workspaceSlug: string, recordId: string, payload: TAssetLinkPayload) {
    return this.post(researchEndpoints.experimentAssets(workspaceSlug, recordId), payload)
      .then((res) => res?.data as TExperimentAssetLink)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async unlinkAsset(workspaceSlug: string, linkId: string) {
    return this.delete(researchEndpoints.experimentAsset(workspaceSlug, linkId)).catch((err) => {
      throw err?.response?.data;
    });
  }

  async getAmendments(workspaceSlug: string, recordId: string) {
    return this.get(researchEndpoints.experimentAmendments(workspaceSlug, recordId))
      .then((res) => res?.data as { results: TExperimentAmendment[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createAmendment(
    workspaceSlug: string,
    recordId: string,
    payload: {
      reason: string;
      change_set: { field: string; old?: unknown; new?: unknown }[];
      evidence_asset?: string | null;
    }
  ) {
    return this.post(researchEndpoints.experimentAmendments(workspaceSlug, recordId), payload)
      .then((res) => res?.data as TExperimentAmendment)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async amendAction(workspaceSlug: string, amendmentId: string, action: string, comment = "") {
    return this.post(researchEndpoints.amendmentAction(workspaceSlug, amendmentId, action), { comment })
      .then((res) => res?.data as TExperimentAmendment)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
