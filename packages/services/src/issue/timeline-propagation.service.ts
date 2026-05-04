/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { TTimelinePropagationRequest, TTimelinePropagationResponse } from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for the Phase 3 timeline-propagation endpoint. Single POST that
 * performs server-authoritative date-range propagation for a Work Item drag.
 *
 * On 4xx the Phase 3 endpoint returns `{ code, message }`; this service
 * rethrows that body as `TTimelinePropagationError` for the store layer to
 * inspect — matches the wire-error throw convention used by
 * `apps/web/core/services/issue/issue.service.ts::updateIssueDates`.
 *
 * @extends {APIService}
 */
export class TimelinePropagationService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * POST `/api/workspaces/<slug>/projects/<uuid>/timeline-propagation/` with
   * the move intent body. Resolves to `TTimelinePropagationResponse` on
   * success; throws `TTimelinePropagationError` (the response body) on 4xx.
   */
  async propagateMove(
    workspaceSlug: string,
    projectId: string,
    body: TTimelinePropagationRequest
  ): Promise<TTimelinePropagationResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/timeline-propagation/`, body)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
