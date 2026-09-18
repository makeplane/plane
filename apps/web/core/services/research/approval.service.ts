/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type { TApprovalAction, TApprovalFlow, TApprovalFlowStep, TApprovalRequest } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TApprovalFlowPayload = {
  name: string;
  approval_type: string;
  org_unit?: string | null;
  is_active?: boolean;
  steps: Array<
    Pick<TApprovalFlowStep, "order" | "approver_mode" | "is_required"> & {
      approver_user?: string | null;
      approver_org_role?: string | null;
    }
  >;
};

export class ResearchApprovalService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getApprovalFlows(workspaceSlug: string, params: Record<string, string> = {}) {
    return this.get(researchEndpoints.approvalFlows(workspaceSlug), { params })
      .then((res) => res?.data as { results: TApprovalFlow[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createApprovalFlow(workspaceSlug: string, payload: TApprovalFlowPayload) {
    return this.post(researchEndpoints.approvalFlows(workspaceSlug), payload)
      .then((res) => res?.data as TApprovalFlow)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateApprovalFlow(workspaceSlug: string, flowId: string, payload: Partial<TApprovalFlowPayload>) {
    return this.patch(researchEndpoints.approvalFlow(workspaceSlug, flowId), payload)
      .then((res) => res?.data as TApprovalFlow)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getApprovalRequests(workspaceSlug: string, params: { scope?: string; approval_type?: string } = {}) {
    return this.get(researchEndpoints.approvalRequests(workspaceSlug), { params })
      .then((res) => res?.data as { results: TApprovalRequest[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createApprovalRequest(
    workspaceSlug: string,
    payload: {
      issue: string;
      flow?: string;
      approval_type?: string;
      org_unit?: string | null;
      research_project?: string | null;
      report?: string | null;
    }
  ) {
    return this.post(researchEndpoints.approvalRequests(workspaceSlug), payload)
      .then((res) => res?.data as TApprovalRequest)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getApprovalRequest(workspaceSlug: string, requestId: string) {
    return this.get(researchEndpoints.approvalRequest(workspaceSlug, requestId))
      .then((res) => res?.data as TApprovalRequest)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async approveRequest(workspaceSlug: string, requestId: string, comment = "") {
    return this.post(researchEndpoints.approvalRequestApprove(workspaceSlug, requestId), { comment })
      .then((res) => res?.data as TApprovalRequest)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async rejectRequest(workspaceSlug: string, requestId: string, comment: string) {
    return this.post(researchEndpoints.approvalRequestReject(workspaceSlug, requestId), { comment })
      .then((res) => res?.data as TApprovalRequest)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async withdrawRequest(workspaceSlug: string, requestId: string, comment = "") {
    return this.post(researchEndpoints.approvalRequestWithdraw(workspaceSlug, requestId), { comment })
      .then((res) => res?.data as TApprovalRequest)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getApprovalHistory(workspaceSlug: string, requestId: string) {
    return this.get(researchEndpoints.approvalRequestHistory(workspaceSlug, requestId))
      .then((res) => res?.data as { results: TApprovalAction[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
