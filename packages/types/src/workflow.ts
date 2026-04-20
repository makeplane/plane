/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { TProjectBaseActivity } from "./activity";
import type { TLoader } from "./issues/base";

export interface IStateTransition {
  transition_state_id: string;
  approvers: string[];
}

export type TWorkflowDisabledContext = {
  sourceStateId: string;
  destinationStateId: string;
};

export interface IStateWorkFlow {
  [transitionId: string]: IStateTransition;
}

export type TStateTransitionMap = Record<string, IStateTransition>; // transitionId: IStateTransition

export interface IStateWorkFlowResponse {
  allow_issue_creation: boolean;
  transitions: TStateTransitionMap;
}

export type TWorkflowChangeHistoryFields =
  // workflow
  | "reset"
  | "workflow"
  | "workflow_type"
  | "workflow_name"
  | "workflow_state"
  | "workflow_default_state"
  | "workflow_description"
  | "workflow_is_active"
  | "workflow_work_item_type"
  | "is_workflow_enabled"
  | "allow_work_item_creation"
  // transition
  | "state_transition"
  | "state_approvers"
  // approval
  | "approved_state"
  | "rejected_state"
  | "state_approval_approver"
  // transfer
  | "workflow_state_transferred";

export type TWorkflowChangeHistoryVerbs = "added" | "removed" | "enabled" | "disabled" | "updated" | "created";

export type TWorkflowChangeHistoryKeys = `${TWorkflowChangeHistoryFields}_${TWorkflowChangeHistoryVerbs}`;

export type TWorkflowChangeHistory = TProjectBaseActivity<TWorkflowChangeHistoryFields, TWorkflowChangeHistoryVerbs> & {
  workflow_id: string;
  state_id?: string | null;
  transition_state_id?: string | null;
};

export type TWorkflowChangeHistorySortOrder = "asc" | "desc";

export type TWorkflowWorkItemTypeCheckResponse = {
  state_ids: string[];
};

export interface IWorkflowChangeHistoryStore {
  // observables
  sortOrder: TWorkflowChangeHistorySortOrder;
  loader: TLoader;
  activities: TWorkflowChangeHistory[];
  // computed
  sortedActivities: TWorkflowChangeHistory[];
  // actions
  toggleSortOrder: () => void;
  fetch: (workspaceSlug: string) => Promise<void>;
  reset: () => void;
}

export interface IStateTransitionTree {
  transition_state_ids: string[];
  approvers: string[];
}

// WORKFLOW STATE TRANSITIONS

// Config shape for a run_script rule — used by the script picker UI
export type TWorkflowScriptConfig = {
  script_id: string;
  execution_variables: Record<string, string>;
};

// Generic rule — handler_name determines the config shape.
// For "run_script": config is TWorkflowScriptConfig.
// Future handlers (change_property, trigger_email, trigger_webhook) add their own config shape.
export type TWorkflowRule = {
  handler_name: string;
  rule_type: string;
  config: TWorkflowScriptConfig | Record<string, unknown>;
};

export type TWorkflowStateTransition = {
  id: string;
  transition_state_id: string;
  rejection_state_id?: string;
  member_ids: string[];
  pre_rules?: TWorkflowRule[];
  post_rules?: TWorkflowRule[];
  isDraft?: boolean;
};

export type TUpdateStateTransitionPayload = Partial<
  Pick<
    TWorkflowStateTransition,
    "transition_state_id" | "rejection_state_id" | "member_ids" | "pre_rules" | "post_rules"
  >
>;

export type TAddStateTransitionPayload = Omit<TWorkflowStateTransition, "id" | "isDraft"> & {
  state_id: string;
};

export interface IWorkflowTransition extends TWorkflowStateTransition {
  isDraft: boolean;
  asJSON: TWorkflowStateTransition;
  isValid: boolean;
  hasUnsavedChanges: boolean;
  totalScriptCount: number;
  unsavedChangesPayload: TUpdateStateTransitionPayload;
  mutate: (data: Partial<TWorkflowStateTransition>) => void;
  update: (workspaceSlug: string, projectId: string, workflowId: string) => Promise<void>;
  revertToSnapshot: () => void;
}

// WORKFLOW STATES

export type TWorkflowSidebarStep = "flow_type" | "states" | "members" | "conditions";

export const WORKFLOW_SIDEBAR_STEPS: { id: TWorkflowSidebarStep; label: string }[] = [
  { id: "flow_type", label: "Flow" },
  { id: "states", label: "States" },
  { id: "members", label: "Members" },
  { id: "conditions", label: "Conditions" },
];

export interface IWorkflowSidebarHelper {
  // observable
  selectedTab: TWorkflowSidebarStep | null;
  // actions
  selectTab: (tab: TWorkflowSidebarStep) => void;
  closeTab: () => void;
}

export type TWorkflowStateType = "transition" | "approval";

export type TWorkflowState = {
  id: string;
  allow_issue_creation: boolean;
  is_default?: boolean;
  transitions?: TWorkflowStateTransition[];
  type: TWorkflowStateType;
};

export type TAddStatesToWorkflowPayload = {
  state_ids: string[];
};

export type TTransferAndDeleteStatePayload = {
  new_state_id: string;
};

export type TWorkflowStateDependencies = {
  transitionCount: number;
  approvalCount: number;
};

export type TUpdateWorkflowStatePayload = {
  allow_issue_creation?: boolean;
  is_default?: boolean;
  type?: TWorkflowStateType;
};
export interface IWorkflowState extends TWorkflowState {
  transitionsMap: Map<string, IWorkflowTransition>;
  transitionIds: string[];
  persistedTransitionIds: string[];
  draftTransitionIds: string[];
  getTransitionById: (id: string) => IWorkflowTransition | undefined;
  getOccupiedStateIds: (excludeTransitionId?: string) => string[];
  addDraftTransition: () => string;
  removeDraftTransition: (draftId: string) => void;
  clearAllDraftTransitions: () => void;
  setAsDefault: (workspaceSlug: string, projectId: string, workflow: IWorkflow) => Promise<void>;
  addTransition: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: Omit<TWorkflowStateTransition, "id" | "isDraft">,
    draftId?: string
  ) => Promise<IWorkflowTransition>;
  deleteTransition: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    transitionId: string
  ) => Promise<void>;
  clearTransitions: () => void;
  asJSON: TWorkflowState;
  mutate: (data: Partial<TWorkflowState>) => void;
  update: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: TUpdateWorkflowStatePayload
  ) => Promise<void>;
  sidebarHelper: IWorkflowSidebarHelper;
}

// WORKFLOWS

export type TWorkflow = {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  work_item_type_ids: string[];
  states: TWorkflowState[];
  missing_states?: boolean;
  created_by: string;
  created_at: string;
};

export type TWorkflowResponse = {
  results: TWorkflow[];
  total_results: number;
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  count: number;
  total_pages: number;
};

export type TWorkflowCreatePayload = Pick<TWorkflow, "name" | "description" | "work_item_type_ids">;

export type TWorkflowUpdatePayload = Partial<TWorkflowCreatePayload> & {
  is_active?: boolean;
};

export interface IWorkflow extends TWorkflow {
  activeSidebarTransitionId: string | null;
  activeSidebarStateId: string | null;
  editingTransitionIds: string[];
  changeHistory: IWorkflowChangeHistoryStore;
  asJSON: TWorkflow;
  stateIds: string[];
  getStateById: (stateId: string) => IWorkflowState | undefined;
  isSidebarOpen: boolean;
  openSidebar: (stateId: string, transitionId: string, tab: TWorkflowSidebarStep) => void;
  closeSidebar: () => void;
  clearDraftTransitions: () => void;
  switchMode: (stateId: string, newType: TWorkflowStateType, workspaceSlug: string, projectId: string) => Promise<void>;
  startEditing: (transitionId: string) => void;
  stopEditing: (transitionId: string) => void;
  isEditing: (transitionId: string) => boolean;
  mutate: (data: Partial<TWorkflow>) => void;
  hydrateStates: (states: TWorkflowState[]) => void;
  removeStates: (stateIds: string[]) => void;
  update: (workspaceSlug: string, projectId: string, data: TWorkflowUpdatePayload) => Promise<void>;
  addStates: (workspaceSlug: string, projectId: string, data: TAddStatesToWorkflowPayload) => Promise<void>;
  deleteState: (workspaceSlug: string, projectId: string, stateId: string) => Promise<void>;
  getStateDependencies: (stateId: string) => TWorkflowStateDependencies;
  transferAndDeleteState: (
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    newStateId: string
  ) => Promise<void>;
}

// SERVICES
export interface IWorkflowService {
  fetchAll: (workspaceSlug: string) => Promise<TWorkflowResponse>;
  fetchProjectWorkflows: (workspaceSlug: string, projectId: string) => Promise<TWorkflow[]>;
  createDefault: (workspaceSlug: string, projectId: string) => Promise<TWorkflow>;
  create: (workspaceSlug: string, projectId: string, data: TWorkflowCreatePayload) => Promise<TWorkflow>;
  update: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: TWorkflowUpdatePayload
  ) => Promise<TWorkflow>;
  destroy: (workspaceSlug: string, projectId: string, workflowId: string) => Promise<void>;
  addStates: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: TAddStatesToWorkflowPayload
  ) => Promise<TWorkflowState[]>;
  updateState: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    stateId: string,
    data: TUpdateWorkflowStatePayload
  ) => Promise<void>;
  markDefaultState: (workspaceSlug: string, projectId: string, workflowId: string, stateId: string) => Promise<void>;
  deleteState: (workspaceSlug: string, projectId: string, workflowId: string, stateId: string) => Promise<void>;
  addStateTransition: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: TAddStateTransitionPayload
  ) => Promise<TWorkflowStateTransition>;
  updateStateTransition: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    transitionId: string,
    data: TUpdateStateTransitionPayload
  ) => Promise<void>;
  deleteStateTransition: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    transitionId: string
  ) => Promise<void>;
  transferAndDeleteState: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    stateId: string,
    data: TTransferAndDeleteStatePayload
  ) => Promise<void>;

  fetchWorkflowChangeHistory: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    params: { created_at__gt: string } | object
  ) => Promise<TWorkflowChangeHistory[]>;
  fetchWorkflowWorkItemTypeCheck: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string
  ) => Promise<TWorkflowWorkItemTypeCheckResponse>;
}

// FILTERS
export type TWorkflowStatusFilter = "active" | "inactive";
export type TWorkflowSortBy = "name" | "created_at" | "updated_at";
export type TWorkflowSortOrder = "asc" | "desc";

export interface IWorkflowFilterStore {
  searchQuery: string;
  statuses: TWorkflowStatusFilter[];
  workItemTypeIds: string[];
  sortBy: TWorkflowSortBy;
  sortOrder: TWorkflowSortOrder;
  isFiltersChanged: boolean;
  isSortChanged: boolean;
  setSearchQuery: (value: string) => void;
  setStatuses: (statuses: TWorkflowStatusFilter[]) => void;
  setWorkItemTypeIds: (ids: string[]) => void;
  setSortBy: (value: TWorkflowSortBy) => void;
  setSortOrder: (value: TWorkflowSortOrder) => void;
  reset: () => void;
}
