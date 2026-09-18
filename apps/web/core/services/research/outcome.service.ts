/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type { TResearchOutcome } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TOutcomePayload = {
  title: string;
  output_type?: string;
  venue?: string;
  doi?: string;
  external_url?: string;
  authors?: string[];
  status?: string;
  published_at?: string | null;
  file_asset?: string | null;
  visibility?: string;
};

export class ResearchOutcomeService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getOutcomes(workspaceSlug: string, projectId: string) {
    return this.get(researchEndpoints.outcomes(workspaceSlug, projectId))
      .then((res) => res?.data as { results: TResearchOutcome[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createOutcome(workspaceSlug: string, projectId: string, payload: TOutcomePayload) {
    return this.post(researchEndpoints.outcomes(workspaceSlug, projectId), payload)
      .then((res) => res?.data as TResearchOutcome)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateOutcome(workspaceSlug: string, outcomeId: string, payload: Partial<TOutcomePayload>) {
    return this.patch(researchEndpoints.outcome(workspaceSlug, outcomeId), payload)
      .then((res) => res?.data as TResearchOutcome)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteOutcome(workspaceSlug: string, outcomeId: string) {
    return this.delete(researchEndpoints.outcome(workspaceSlug, outcomeId)).catch((err) => {
      throw err?.response?.data;
    });
  }

  async linkOutcome(workspaceSlug: string, outcomeId: string, payload: { target_type: string; target_id: string }) {
    return this.post(researchEndpoints.outcomeLinks(workspaceSlug, outcomeId), payload)
      .then((res) => res?.data as TResearchOutcome)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  exportChainUrl(workspaceSlug: string, projectId: string) {
    return researchEndpoints.chainExport(workspaceSlug, projectId);
  }
}
