/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Wire-contract TypeScript types for the timeline-propagation endpoint.
 *
 * Mirrors Phase 3's serializers field-by-field (snake_case JSON shape — same
 * convention as TBaseIssue elsewhere in @plane/types). The endpoint is the
 * authoritative source for date-range propagation across Precedence
 * Dependencies; on failure, the response body is `{ code, message }` and the
 * service layer rethrows that body as `TTimelinePropagationError`.
 */

export type TTimelinePropagationErrorCode =
  | "DEPENDENCY_CYCLE"
  | "PROJECT_BOUNDARY_EXCEEDED"
  | "INCOMPLETE_SCHEDULE"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "SCHEDULE_CHANGED"
  | "PERMISSION_DENIED"
  | "INVALID_DATE_RANGE";

/**
 * PROP-18 — Dependency Schedule Propagation is move-only on the wire. Resize
 * is rejected at the Phase 3 serializer with DRF 400 (NOT this envelope).
 */
export type TTimelinePropagationOperation = "move";

export type TTimelinePropagationRequest = {
  work_item_id: string;
  /** YYYY-MM-DD (calendar-day per Phase 2 D-04). */
  original_start_date: string;
  /** YYYY-MM-DD (calendar-day per Phase 2 D-04). */
  original_target_date: string;
  /** ISO 8601 with microseconds (Phase 3 D-04). */
  expected_updated_at: string;
  requested_start_date: string;
  requested_target_date: string;
  operation: TTimelinePropagationOperation;
  client_preview_count?: number;
};

export type TTimelinePropagationWorkItem = {
  id: string;
  start_date: string;
  target_date: string;
  planned_duration_working_days?: number | null;
  /** ISO 8601 with microseconds (Phase 3 D-04 / D-05f single-now invariant). */
  updated_at: string;
};

export type TTimelinePropagationResponse = {
  requested_work_item_id: string;
  total_updated_count: number;
  client_preview_count: number | null;
  work_items: TTimelinePropagationWorkItem[];
};

export type TTimelinePropagationError = {
  code: TTimelinePropagationErrorCode;
  message: string;
};
