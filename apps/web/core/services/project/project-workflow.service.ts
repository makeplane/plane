/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  IIssueWorkflowStatus,
  IProjectWorkflowStates,
  IWorkflow,
  IWorkflowApproval,
  IWorkflowHistory,
  TWorkflowBulkConfig,
} from "@plane/types";
import { APIService } from "@/services/api.service";

export class ProjectWorkflowService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getProjectWorkflowStates(workspaceSlug: string, projectId: string): Promise<IProjectWorkflowStates> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-states/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkflows(workspaceSlug: string, projectId: string): Promise<IWorkflow[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createWorkflow(workspaceSlug: string, projectId: string, data: Partial<IWorkflow>): Promise<IWorkflow> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkflow(
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: Partial<IWorkflow>
  ): Promise<IWorkflow> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkflow(workspaceSlug: string, projectId: string, workflowId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async toggleWorkflowPause(workspaceSlug: string, projectId: string, workflowId: string): Promise<IWorkflow> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/toggle-pause/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async configureWorkflow(
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: TWorkflowBulkConfig
  ): Promise<IWorkflow> {
    return this.put(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/configure/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkflowHistory(workspaceSlug: string, projectId: string, workflowId: string): Promise<IWorkflowHistory[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/history/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async toggleWorkflowEnabled(
    workspaceSlug: string,
    projectId: string,
    enabled: boolean
  ): Promise<{ is_workflow_enabled: boolean }> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-enabled/`, {
      is_workflow_enabled: enabled,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueWorkflowStatus(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<IIssueWorkflowStatus> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/workflow-status/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async requestWorkflowTransition(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    stateId: string
  ): Promise<{ state_id?: string; needs_approval?: boolean; approval?: IWorkflowApproval; message?: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/workflow-transition/`, {
      state_id: stateId,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async resolveApproval(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    approvalId: string,
    action: "approve" | "reject"
  ): Promise<{ approval: IWorkflowApproval; state_id: string | null }> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/approvals/${approvalId}/${action}/`,
      {}
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
