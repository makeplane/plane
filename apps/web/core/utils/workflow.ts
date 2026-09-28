/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { IWorkflowFlow, IWorkflowRevision, IWorkflowState } from "@plane/types";

/**
 * §24.2 publish checklist, evaluated client-side.
 *
 * The server runs the same rules in `_validate_revision_for_publish` and
 * returns the failing entries as `WorkflowRevisionPublishInvalid.issues`,
 * but the admin views raise that error as a bare `WorkflowError`, which the
 * DRF handler does not translate — so a publish failure currently surfaces
 * as a 500 with a non-JSON body and the `issues` list never reaches the
 * client. Evaluating the checklist here is what makes §24.2 actionable in
 * the UI; the server stays the authority.
 */
export const validateRevisionForPublish = (revision: IWorkflowRevision): string[] => {
  const issues: string[] = [];
  const states = revision.states ?? [];
  const flows = revision.flows ?? [];

  if (states.length === 0) {
    issues.push("Revision has no included states.");
  }

  if (states.length > 0 && !states.some((state) => state.allow_new_work_items)) {
    issues.push("Revision has no state flagged allow_new_work_items.");
  }

  const includedStateIds = new Set(states.map((state) => state.state_id));
  for (const flow of flows) {
    if (!includedStateIds.has(flow.source_state_id)) {
      issues.push(
        `Flow ${flow.source_state_name} → ${flow.target_state_name} uses a source state not in this revision.`
      );
    }
    if (!includedStateIds.has(flow.target_state_id)) {
      issues.push(
        `Flow ${flow.source_state_name} → ${flow.target_state_name} uses a target state not in this revision.`
      );
    }
    if (flow.reject_state_id && !includedStateIds.has(flow.reject_state_id)) {
      issues.push(
        `Flow ${flow.source_state_name} → ${flow.target_state_name} uses a reject state not in this revision.`
      );
    }
    if (flow.flow_type === "transition" && flow.reject_state_id) {
      issues.push(`Transition ${flow.source_state_name} → ${flow.target_state_name} must not declare a reject state.`);
    }
    if (flow.flow_type === "approval" && !flow.reject_state_id) {
      issues.push(`Approval ${flow.source_state_name} → ${flow.target_state_name} must declare a reject state.`);
    }
  }

  // §7.5 — all active flows from one source state share a flow_type.
  const flowTypesBySource = new Map<string, Set<string>>();
  for (const flow of flows) {
    if (!flow.is_active) continue;
    const types = flowTypesBySource.get(flow.source_state_id) ?? new Set<string>();
    types.add(flow.flow_type);
    flowTypesBySource.set(flow.source_state_id, types);
  }
  for (const [sourceStateId, types] of flowTypesBySource) {
    if (types.size > 1) {
      const name = states.find((state) => state.state_id === sourceStateId)?.state_name ?? sourceStateId;
      issues.push(`Active flows from "${name}" must all be the same type.`);
    }
  }

  return issues;
};

/** §24.2 — true when the revision is safe to hand to `POST /publish/`. */
export const canPublishRevision = (revision: IWorkflowRevision | null): boolean =>
  revision !== null && validateRevisionForPublish(revision).length === 0;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** The draft revision, if the workflow has one open. */
export const getDraftRevision = (revisions: IWorkflowRevision[] | undefined): IWorkflowRevision | undefined =>
  revisions?.find((revision) => revision.status === "draft");

/** The highest published revision — the one new bindings resolve to. */
export const getPublishedRevision = (revisions: IWorkflowRevision[] | undefined): IWorkflowRevision | undefined =>
  revisions?.find((revision) => revision.status === "published");

/**
 * The revision the Settings editor mutates: the open draft, else the
 * published one (read-only), else nothing.
 */
export const getEditableRevision = (revisions: IWorkflowRevision[] | undefined): IWorkflowRevision | undefined =>
  getDraftRevision(revisions) ?? getPublishedRevision(revisions);

/**
 * `WorkflowState` PK → the `State` UUID the flow read API returns, so the
 * editor can translate the two id spaces (§7.5).
 */
export const buildWorkflowStateIdMap = (states: IWorkflowState[] | undefined): Map<string, string> =>
  new Map((states ?? []).map((state) => [state.id, state.state_id]));

export const getWorkflowStateIdsByStateId = (states: IWorkflowState[] | undefined): Map<string, IWorkflowState> =>
  new Map((states ?? []).map((state) => [state.state_id, state]));

/** Flows grouped by their `State` UUID source, ordered by the state's `sequence`. */
export const groupFlowsBySourceState = (
  revision: IWorkflowRevision | undefined
): { state: IWorkflowState; flows: IWorkflowFlow[] }[] => {
  if (!revision) return [];
  const flowsBySource = new Map<string, IWorkflowFlow[]>();
  for (const flow of revision.flows ?? []) {
    const existing = flowsBySource.get(flow.source_state_id) ?? [];
    existing.push(flow);
    flowsBySource.set(flow.source_state_id, existing);
  }

  return [...(revision.states ?? [])].map((state) => ({
    state,
    flows: (flowsBySource.get(state.state_id) ?? []).toSorted((a, b) => a.sequence - b.sequence),
  }));
};

/** §23.1 — the work item type ids a workflow is explicitly assigned. */
export const getAssignedIssueTypeIds = (
  assignments: { workflow: string; issue_type: string }[] | undefined,
  workflowId: string
): string[] => (assignments ?? []).filter((a) => a.workflow === workflowId).map((a) => a.issue_type);
