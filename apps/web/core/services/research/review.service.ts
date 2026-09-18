/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type {
  TReviewSummary,
  TStageReview,
  TStageReviewerAssignment,
  TStageReviewRevision,
  TToMeReview,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TReviewPayload = {
  recommendation: string;
  comment?: string;
  score?: number | null;
};

export type TReviewerAssignmentPayload = {
  reviewer: string;
  reviewer_role?: string;
  is_required?: boolean;
  assignment_kind?: string;
  valid_until?: string | null;
};

export type TToMeResponse = {
  results: TToMeReview[];
  count: number;
  required: TToMeReview[];
  optional: TToMeReview[];
};

export class ResearchReviewService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getReviewers(workspaceSlug: string, stageId: string) {
    return this.get(researchEndpoints.stageReviewers(workspaceSlug, stageId))
      .then((res) => res?.data as { results: TStageReviewerAssignment[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async assignReviewer(workspaceSlug: string, stageId: string, payload: TReviewerAssignmentPayload) {
    return this.post(researchEndpoints.stageReviewers(workspaceSlug, stageId), payload)
      .then((res) => res?.data as TStageReviewerAssignment)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async removeReviewer(workspaceSlug: string, assignmentId: string) {
    return this.delete(researchEndpoints.reviewer(workspaceSlug, assignmentId)).catch((err) => {
      throw err?.response?.data;
    });
  }

  async remindReviewer(workspaceSlug: string, assignmentId: string, message = "") {
    return this.post(researchEndpoints.reviewerRemind(workspaceSlug, assignmentId), { message })
      .then((res) => res?.data as { notified: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getStageReviews(workspaceSlug: string, stageId: string, includeSuperseded = false) {
    return this.get(researchEndpoints.stageReviews(workspaceSlug, stageId), {
      params: includeSuperseded ? { include_superseded: "true" } : {},
    })
      .then((res) => res?.data as { results: TStageReview[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async submitReview(workspaceSlug: string, stageId: string, payload: TReviewPayload) {
    return this.post(researchEndpoints.stageReviews(workspaceSlug, stageId), payload)
      .then((res) => res?.data as TStageReview)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getReviewSummary(workspaceSlug: string, stageId: string) {
    return this.get(researchEndpoints.stageReviewSummary(workspaceSlug, stageId))
      .then((res) => res?.data as TReviewSummary)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getReviews(workspaceSlug: string, scope = "to_me") {
    return this.get(researchEndpoints.reviews(workspaceSlug), { params: { scope } })
      .then((res) => res?.data as TToMeResponse | { results: TStageReview[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async reviseReview(workspaceSlug: string, reviewId: string, payload: TReviewPayload & { reason: string }) {
    return this.post(researchEndpoints.reviewRevise(workspaceSlug, reviewId), payload)
      .then((res) => res?.data as TStageReview)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getReviewRevisions(workspaceSlug: string, reviewId: string) {
    return this.get(researchEndpoints.reviewRevisions(workspaceSlug, reviewId))
      .then((res) => res?.data as { results: TStageReviewRevision[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
