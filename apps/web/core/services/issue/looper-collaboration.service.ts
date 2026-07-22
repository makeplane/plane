/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TLooperConnection,
  TLooperConnectionResponse,
  TLooperRoleMessageResponse,
  TLooperSummary,
} from "@/components/issues/issue-detail/looper-collaboration/types";
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

  async createConnection(workspaceSlug: string, projectId: string): Promise<TLooperConnection> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/looper/connections/`, {})
      .then((response) => (response.data as TLooperConnectionResponse).connection)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getConnection(workspaceSlug: string, projectId: string, connectionId: string): Promise<TLooperConnection> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/looper/connections/${connectionId}/`)
      .then((response) => (response.data as TLooperConnectionResponse).connection)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async cancelConnection(workspaceSlug: string, projectId: string, connectionId: string) {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/looper/connections/${connectionId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Posts one natural-language reply into a role decision thread. Looper decides on its side
   * whether the thread converged, so there is no separate "final answer" call.
   */
  async replyToRoleRequest(
    workspaceSlug: string,
    projectId: string,
    roleRequestId: string,
    message: string,
    clientMessageId: string
  ): Promise<TLooperRoleMessageResponse> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/looper/role-requests/${roleRequestId}/messages/`,
      { message, client_message_id: clientMessageId }
    )
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
