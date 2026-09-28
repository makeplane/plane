/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
// helpers
import { cn } from "../utils";
import { Button } from "../button";
import { TextArea } from "../form-fields";

/**
 * §23.3 — the Work Item approval surface: an `Approval pending` badge next to
 * the item header, the destinations the decision moves it to, and the
 * Approve / Reject controls.
 *
 * Eligibility is the server's call. The caller passes `canDecide` straight
 * from the API's `approval.can_decide` and only resolves `approverNames` for
 * an eligible approver, so a non-approver sees that an approval is pending
 * without the membership data behind it.
 *
 * Purely presentational: the caller owns fetching, the idempotency key, the
 * toasts and the state refresh that follows a decision.
 */
export interface WorkflowApprovalBarLabels {
  pending: string;
  waitingFor: string;
  approvers: string;
  addComment: string;
  commentPlaceholder: string;
  approve: string;
  reject: string;
  /** Localized "Approve → {state}" preview. */
  approveTo: (stateName: string) => string;
  /** Localized "Reject → {state}" preview. */
  rejectTo: (stateName: string) => string;
}

export interface WorkflowApprovalBarProps {
  sourceStateName: string | null;
  targetStateName: string | null;
  rejectStateName: string | null;
  /** Resolved display names. Empty for a non-eligible viewer (§23.3). */
  approverNames: string[];
  canDecide: boolean;
  /** Read-only surface (archived item) — the badge stays, the controls freeze. */
  disabled?: boolean;
  isDeciding?: boolean;
  comment: string;
  onCommentChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  labels: WorkflowApprovalBarLabels;
  className?: string;
}

export const WorkflowApprovalBar = ({
  sourceStateName,
  targetStateName,
  rejectStateName,
  approverNames,
  canDecide,
  disabled = false,
  isDeciding = false,
  comment,
  onCommentChange,
  onApprove,
  onReject,
  labels,
  className,
}: WorkflowApprovalBarProps) => {
  const [isCommentOpen, setIsCommentOpen] = React.useState(false);
  const isFrozen = disabled || isDeciding;

  return (
    <div className={cn("flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 px-3 py-2", className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="rounded-sm bg-warning-subtle px-2 py-1 text-11 font-medium text-warning-primary">
          {labels.pending}
        </span>
        {sourceStateName && targetStateName && (
          <span className="text-13 text-secondary">
            {sourceStateName} → {targetStateName}
          </span>
        )}
        {canDecide && approverNames.length > 0 && (
          <span className="text-12 text-tertiary">{`${labels.approvers}: ${approverNames.join(", ")}`}</span>
        )}
        {!canDecide && <span className="text-12 text-tertiary">{labels.waitingFor}</span>}
      </div>

      {canDecide && (
        <div className="flex flex-col gap-2">
          {isCommentOpen && (
            <TextArea
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder={labels.commentPlaceholder}
              rows={2}
              disabled={isFrozen}
              aria-label={labels.commentPlaceholder}
            />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="neutral-primary"
              size="sm"
              onClick={() => setIsCommentOpen((open) => !open)}
              disabled={isFrozen}
            >
              {labels.addComment}
            </Button>
            {rejectStateName && <span className="text-12 text-tertiary">{labels.rejectTo(rejectStateName)}</span>}
            {targetStateName && <span className="text-12 text-tertiary">{labels.approveTo(targetStateName)}</span>}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline-danger" size="sm" loading={isDeciding} onClick={onReject} disabled={isFrozen}>
                {labels.reject}
              </Button>
              <Button variant="primary" size="sm" loading={isDeciding} onClick={onApprove} disabled={isFrozen}>
                {labels.approve}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
