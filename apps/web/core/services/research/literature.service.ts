/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type { TLiteratureCounters, TLiteratureEntry, TLiteratureThreshold } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TLiteratureListParams = {
  status?: string;
  year?: string;
  q?: string;
  owner?: string;
};

export type TLiteratureCreatePayload = {
  title: string;
  authors?: string;
  year?: number | null;
  venue?: string;
  doi?: string;
  url?: string;
  summary?: string;
  gap_notes?: string;
  relevance_score?: number | null;
  method_tags?: string[];
  system_tags?: string[];
  status?: string;
  visibility?: string;
};

export type TLiteratureImportResult = {
  created: string[];
  skipped: { doi: string; reason: string }[];
  failed: { doi: string; reason: string }[];
  counters: TLiteratureCounters;
};

export class ResearchLiteratureService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getEntries(workspaceSlug: string, projectId: string, params: TLiteratureListParams = {}) {
    return this.get(researchEndpoints.literature(workspaceSlug, projectId), { params })
      .then(
        (res) =>
          res?.data as {
            results: TLiteratureEntry[];
            count: number;
            threshold: { min_included: number; max_entries: number };
            counters: TLiteratureCounters;
          }
      )
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createEntry(workspaceSlug: string, projectId: string, payload: TLiteratureCreatePayload) {
    return this.post(researchEndpoints.literature(workspaceSlug, projectId), payload)
      .then((res) => res?.data as TLiteratureEntry)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getEntry(workspaceSlug: string, entryId: string) {
    return this.get(researchEndpoints.literatureEntry(workspaceSlug, entryId))
      .then((res) => res?.data as TLiteratureEntry)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateEntry(workspaceSlug: string, entryId: string, payload: Partial<TLiteratureCreatePayload>) {
    return this.patch(researchEndpoints.literatureEntry(workspaceSlug, entryId), payload)
      .then((res) => res?.data as TLiteratureEntry)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteEntry(workspaceSlug: string, entryId: string) {
    return this.delete(researchEndpoints.literatureEntry(workspaceSlug, entryId)).catch((err) => {
      throw err?.response?.data;
    });
  }

  async updateStatus(
    workspaceSlug: string,
    entryId: string,
    payload: { status: string; summary?: string; gap_notes?: string }
  ) {
    return this.post(researchEndpoints.literatureStatus(workspaceSlug, entryId), payload)
      .then((res) => res?.data as { entry: TLiteratureEntry; counters: TLiteratureCounters })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getThreshold(workspaceSlug: string, projectId: string) {
    return this.get(researchEndpoints.literatureThreshold(workspaceSlug, projectId))
      .then((res) => res?.data as TLiteratureThreshold)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async importEntries(workspaceSlug: string, projectId: string, payload: { format: string; content: string }) {
    return this.post(researchEndpoints.literatureImport(workspaceSlug, projectId), payload)
      .then((res) => res?.data as TLiteratureImportResult)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
