/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TLooperSummary } from "@/components/issues/issue-detail/looper-collaboration/types";
import { APIService } from "@/services/api.service";

export class LooperCollaborationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getSummary(workspaceSlug: string, projectId: string, issueId: string): Promise<TLooperSummary> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/looper/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async dispatch(workspaceSlug: string, projectId: string, issueId: string, idempotencyKey: string) {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/${issueId}/looper/dispatch/`, {
      requested_mode: "auto",
      idempotency_key: idempotencyKey,
    })
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async ownerAction(
    workspaceSlug: string,
    projectId: string,
    dispatchId: string,
    action: "stop" | "release",
    reason = ""
  ) {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/looper/dispatch/${dispatchId}/${action}/`,
      reason ? { reason } : {}
    )
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async answerRoleRequest(workspaceSlug: string, projectId: string, roleRequestId: string, answer: string) {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/looper/role-requests/${roleRequestId}/answer/`,
      { answer }
    )
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
