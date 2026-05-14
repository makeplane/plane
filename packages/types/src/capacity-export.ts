/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Types for capacity detailed export job feature.
 */

export type TCapacityExportStatus = "queued" | "processing" | "ready" | "failed" | "expired";

export interface ICapacityExportJob {
  id: string;
  status: TCapacityExportStatus;
  date_from: string;
  date_to: string;
  member_ids: string[];
  member_count: number;
  row_count: number;
  file_url: string | null;
  file_size: number;
  expires_at: string | null;
  created_at: string;
  completed_at: string | null;
  error_message: string;
  is_expired: boolean;
  cross_workspace: boolean;
}

export interface ICapacityExportPayload {
  date_from: string;
  date_to: string;
  member_ids?: string[] | null;
  cross_workspace: boolean;
}

export interface ICapacityExportInitiateResponse {
  job_id: string;
  duplicate: boolean;
  message: string;
  status: TCapacityExportStatus;
}
