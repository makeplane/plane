/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TWorkflowFlowType = "transition" | "approval";

export type TWorkflowApprovalStatus = "pending" | "approved" | "rejected";

export interface IWorkflowStateConfig {
  id: string;
  workflow_id: string;
  state_id: string;
  state_detail?: {
    id: string;
    name: string;
    color: string;
    group: string;
  };
  allow_work_item_creation: boolean;
  sequence: number;
}

export interface IWorkflowFlow {
  id: string;
  workflow_id: string;
  source_state_id: string;
  source_state_detail?: {
    id: string;
    name: string;
    color: string;
    group: string;
  };
  flow_type: TWorkflowFlowType;
  target_state_id: string;
  target_state_detail?: {
    id: string;
    name: string;
    color: string;
    group: string;
  };
  reject_state_id?: string | null;
  reject_state_detail?: {
    id: string;
    name: string;
    color: string;
    group: string;
  } | null;
  allowed_roles: number[];
  allowed_members: string[];
  sequence: number;
}

export interface IWorkflow {
  id: string;
  project_id: string;
  workspace_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_enabled: boolean;
  is_paused: boolean;
  issue_type_id?: string | null;
  state_configs: IWorkflowStateConfig[];
  flows: IWorkflowFlow[];
  created_at: string;
  updated_at: string;
}

export interface IWorkflowHistory {
  id: string;
  workflow_id: string;
  action: string;
  changes: Record<string, unknown>;
  created_at: string;
  actor_detail?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface IWorkflowApproval {
  id: string;
  issue_id: string;
  flow_id: string;
  flow_detail?: IWorkflowFlow;
  status: TWorkflowApprovalStatus;
  source_state_id: string;
  source_state_detail?: {
    id: string;
    name: string;
    color: string;
    group: string;
  };
  approve_state_id: string;
  approve_state_detail?: {
    id: string;
    name: string;
    color: string;
    group: string;
  };
  reject_state_id?: string | null;
  reject_state_detail?: {
    id: string;
    name: string;
    color: string;
    group: string;
  } | null;
  requested_by?: string;
  requested_by_detail?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  resolved_by?: string | null;
  resolved_by_detail?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  } | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface IIssueWorkflowStatus {
  is_workflow_enabled: boolean;
  allowed_state_ids: string[] | null;
  pending_approval: IWorkflowApproval | null;
  blocker_message?: string | null;
}

export interface IProjectWorkflowStates {
  is_workflow_enabled: boolean;
  states: {
    id: string;
    name: string;
    color: string;
    group: string;
    sequence: number;
    default: boolean;
  }[];
  workflows: IWorkflow[];
}

export type TWorkflowBulkConfig = {
  state_configs: Partial<IWorkflowStateConfig>[];
  flows: Partial<IWorkflowFlow>[];
};
