/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
// helpers
import { cn } from "../utils";

/**
 * §23.2 — the deterministic list/table shape the spec prescribes instead of
 * a node-graph editor (§4 forbids one).
 *
 *   ● Submitted
 *     Allow new work items   [✓]
 *     └─ Transition → Manager Approval
 *        By: All
 *
 * Purely presentational: the caller owns fetching, persistence and toasts.
 */
export interface TWorkflowStateNode {
  /** `WorkflowState` PK — the id the flow write API expects. */
  id: string;
  /** `plane.db.State` UUID — the id the flow read API returns. */
  state_id: string;
  name: string;
  /** `plane.db.State.group` — used to colour the dot. */
  group?: string;
  allow_new_work_items?: boolean;
}

export interface TWorkflowFlowNode {
  id: string;
  flow_type: "transition" | "approval";
  target_state_name: string;
  reject_state_id?: string | null;
  is_active: boolean;
  /** Actor type labels, already localized by the caller. Empty when unreadable. */
  actors: string[];
}

export interface WorkflowStateListProps {
  states: TWorkflowStateNode[];
  flowsBySourceStateId: Record<string, TWorkflowFlowNode[]>;
  labels: {
    allowNewWorkItems: string;
    by: string;
    transition: string;
    approval: string;
    enabled: string;
    disabled: string;
    noActors: string;
    noActorsTooltip: string;
    toggleAllowNewWorkItems?: (stateId: string, nextValue: boolean) => void;
    toggleFlowActive?: (flowId: string, nextValue: boolean) => void;
  };
  isEditable?: boolean;
  className?: string;
}

// Tailwind classes keyed by `plane.db.State.group` so the dot matches the
// state colour used elsewhere in the product.
const GROUP_DOT_STYLES: Record<string, string> = {
  backlog: "bg-custom-backlog-100",
  unstarted: "bg-custom-unstarted-100",
  started: "bg-custom-started-100",
  completed: "bg-custom-completed-100",
  cancelled: "bg-custom-cancelled-100",
};

export const WorkflowStateList = ({
  states,
  flowsBySourceStateId,
  labels,
  isEditable = false,
  className,
}: WorkflowStateListProps) => (
  <ul className={cn("flex flex-col divide-y divide-subtle", className)}>
    {states.map((state) => {
      const flows = flowsBySourceStateId[state.state_id] ?? [];
      return (
        <li key={state.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
          {/* state header */}
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn("size-2 shrink-0 rounded-full", GROUP_DOT_STYLES[state.group ?? ""] ?? "bg-subtle-300")}
            />
            <span className="truncate text-14 font-medium text-primary">{state.name}</span>
          </div>

          {/* allow_new_work_items */}
          <div className="flex items-center gap-2 pl-4">
            <span className="text-13 text-tertiary">{labels.allowNewWorkItems}</span>
            <input
              type="checkbox"
              aria-label={`${labels.allowNewWorkItems} — ${state.name}`}
              className="accent-subtle-300 size-3.5 cursor-pointer"
              checked={Boolean(state.allow_new_work_items)}
              disabled={!isEditable}
              onChange={(event) => labels.toggleAllowNewWorkItems?.(state.id, event.target.checked)}
            />
          </div>

          {/* outgoing flows */}
          {flows.length === 0 ? null : (
            <ul className="flex flex-col gap-2 pl-4">
              {flows.map((flow) => (
                <li key={flow.id} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span aria-hidden="true" className="text-13 text-tertiary">
                      └─
                    </span>
                    <span className="text-13 text-secondary">
                      {flow.flow_type === "approval" ? labels.approval : labels.transition} → {flow.target_state_name}
                    </span>
                    {!flow.is_active && <span className="text-11 text-tertiary">({labels.disabled})</span>}
                    <label className="flex items-center gap-1.5 text-11 text-tertiary">
                      <input
                        type="checkbox"
                        aria-label={`${labels.enabled} — ${flow.target_state_name}`}
                        className="accent-subtle-300 size-3 cursor-pointer"
                        checked={flow.is_active}
                        disabled={!isEditable}
                        onChange={(event) => labels.toggleFlowActive?.(flow.id, event.target.checked)}
                      />
                      {labels.enabled}
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5 pl-6">
                    <span className="text-12 text-tertiary">{labels.by}:</span>
                    {flow.actors.length === 0 ? (
                      <span title={labels.noActorsTooltip} className="text-12 text-danger-primary">
                        {labels.noActors}
                      </span>
                    ) : (
                      <span className="text-12 text-secondary">{flow.actors.join(", ")}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    })}
  </ul>
);
