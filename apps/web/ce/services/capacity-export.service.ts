/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * CE service for capacity detailed export job operations.
 */

import { API_BASE_URL } from "@plane/constants";
import type { ICapacityExportInitiateResponse, ICapacityExportJob, ICapacityExportPayload } from "@plane/types";
import { APIService } from "@/services/api.service";

export class CECapacityExportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * POST /api/workspaces/{slug}/capacity/exports/
   * Initiates a new capacity detailed export job. Returns 202 with job metadata.
   * Returns existing job metadata if a duplicate (same date range) is in progress.
   */
  async initiateDetailedExport(
    workspaceSlug: string,
    payload: ICapacityExportPayload
  ): Promise<ICapacityExportInitiateResponse> {
    return (
      this.post(`/api/workspaces/${workspaceSlug}/capacity/exports/`, payload) as Promise<{
        data: ICapacityExportInitiateResponse;
      }>
    )
      .then((res) => res?.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /**
   * GET /api/workspaces/{slug}/capacity/exports/
   * Fetches the list of past export jobs for the workspace.
   */
  async fetchExportHistory(workspaceSlug: string): Promise<ICapacityExportJob[]> {
    return (this.get(`/api/workspaces/${workspaceSlug}/capacity/exports/`) as Promise<{ data: ICapacityExportJob[] }>)
      .then((res) => res?.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }
}
