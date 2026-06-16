import { useState } from "react";
import type { TChangeState, TChangeType, IChangeTask, IChangeApproval } from "@/services/change-management.service";
import { Button } from "@plane/propel/button";
import { AlertTriangle, Clock } from "lucide-react";

// Closed task states set
const CLOSED_TASK_STATES = new Set(["closed_complete", "closed_incomplete", "closed_skipped"]);

type Props = {
  state: TChangeState;
  type: TChangeType;
  onTransition: (newState: TChangeState) => void;
  onCancel: () => void;
  isTransitioning: boolean;
  isUpdatingForm: boolean;
  transitionError: string | null;
  // Gating data
  tasks: IChangeTask[];
  approvals: IChangeApproval[];
  closeCode: string | null | undefined;
  closeNotes: string | null | undefined;
  onHold: boolean;
  // Visibility rules
  requestedBy?: string | null;
  currentUserId?: string;
  plannedStartDate?: string | null;
};

// Gating helpers
const allTasksClosed = (tasks: IChangeTask[]): boolean =>
  tasks.length > 0 && tasks.every((t) => CLOSED_TASK_STATES.has(t.state));

const openTaskCount = (tasks: IChangeTask[]): number =>
  tasks.filter((t) => !CLOSED_TASK_STATES.has(t.state)).length;

const allApprovalsApproved = (approvals: IChangeApproval[], level: string): boolean => {
  const levelApprovals = approvals.filter((a) => a.approval_level === level);
  return levelApprovals.length > 0 && levelApprovals.every((a) => a.status === "approved" || a.status === "voided");
};

const anyApprovalPending = (approvals: IChangeApproval[], level: string): boolean =>
  approvals.filter((a) => a.approval_level === level).some((a) => a.status === "pending");

// State-specific guidance text for beginners
const STATE_GUIDANCE: Record<string, { title: string; description: string }> = {
  // Normal flow
  "normal_new": {
    title: "New — Draft your change",
    description: "Fill in all required fields across Planning, Schedule, and header sections. Once complete, click 'Move to Assess' to start the review process.",
  },
  "normal_assess": {
    title: "Assess — Peer review in progress",
    description: "Your change is being reviewed by peers. All peer review approvals must be completed before you can move to the Authorize stage.",
  },
  "normal_authorize": {
    title: "Authorize — CAB approval required",
    description: "Your change needs Change Advisory Board (CAB) approval. All CAB approvals must be completed before the change can be scheduled.",
  },
  "normal_scheduled": {
    title: "Scheduled — Approved and waiting",
    description: "The change is approved and scheduled. Only the change requester or a workspace admin can click 'Begin Implementation' to start the work.",
  },
  "normal_implement": {
    title: "Implement — Work in progress",
    description: "The change is being implemented. Complete all implementation tasks, then move to Review for post-implementation verification.",
  },
  "normal_review": {
    title: "Review — Post-implementation check",
    description: "Verify the change was successful. Set a Close Code and add Close Notes in the Closure tab before closing.",
  },
  // Standard flow
  "standard_new": {
    title: "New — Draft your standard change",
    description: "Standard changes are pre-approved, low-risk changes. Fill in all required fields, then proceed directly to Scheduled (no peer review or CAB needed).",
  },
  "standard_scheduled": {
    title: "Scheduled — Ready for implementation",
    description: "Your standard change is scheduled. Only the change requester or a workspace admin can click 'Begin Implementation' to start.",
  },
  "standard_implement": {
    title: "Implement — Work in progress",
    description: "The change is being implemented. Complete all tasks, then move to Review.",
  },
  "standard_review": {
    title: "Review — Post-implementation check",
    description: "Verify the change was successful. Set a Close Code and add Close Notes in the Closure tab before closing.",
  },
};

export const ActionBar = ({
  state, type, onTransition, onCancel,
  isTransitioning, isUpdatingForm, transitionError,
  tasks, approvals, closeCode, closeNotes, onHold,
  requestedBy, currentUserId, plannedStartDate,
}: Props) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(false);

  if (state === "closed" || state === "cancelled") {
    return (
      <div className="flex items-center gap-3 p-4 bg-layer-1 border-t border-subtle sticky bottom-0 w-full z-20">
        <span className="text-sm font-medium text-tertiary">
          This change is <strong className="text-primary capitalize">{state}</strong> — no further actions available.
        </span>
      </div>
    );
  }

  // "Begin Implementation" visibility:
  // Only the change requester or workspace admins can start implementation
  const isRequesterOrAdmin = currentUserId === requestedBy;
  // We allow it through since backend enforces workspace role anyway

  // Check if we're before planned start date
  const isBeforePlannedStart = plannedStartDate
    ? new Date() < new Date(plannedStartDate)
    : false;

  // Build the primary action button and blocked message
  let primaryLabel = "";
  let primaryState: TChangeState | null = null;
  let blockedReason: string | null = null;
  let showBeginImplementation = false;

  if (type === "normal") {
    switch (state) {
      case "new":
        primaryLabel = "Move to Assess";
        primaryState = "assess";
        break;
      case "assess":
        primaryLabel = "Move to Authorize";
        primaryState = "authorize";
        if (anyApprovalPending(approvals, "peer_review")) {
          blockedReason = "Peer review approvals must be completed before moving to Authorize.";
        }
        break;
      case "authorize":
        primaryLabel = "Move to Scheduled";
        primaryState = "scheduled";
        if (anyApprovalPending(approvals, "cab")) {
          blockedReason = "CAB approvals must be completed before scheduling.";
        }
        break;
      case "scheduled":
        primaryLabel = "Begin Implementation";
        primaryState = "implement";
        showBeginImplementation = true;
        break;
      case "implement":
        primaryLabel = "Move to Review";
        primaryState = "review";
        if (!allTasksClosed(tasks)) {
          const open = openTaskCount(tasks);
          blockedReason = `${open} of ${tasks.length} tasks are still open. Close all tasks before moving to Review.`;
        }
        break;
      case "review":
        primaryLabel = "Close Change";
        primaryState = "closed";
        if (onHold) {
          blockedReason = "Change is on hold. Remove the hold before closing.";
        } else if (!closeCode) {
          blockedReason = "A Close Code is required. Set it in the Closure tab.";
        } else if (!closeNotes) {
          blockedReason = "Close Notes are required. Add them in the Closure tab.";
        }
        break;
    }
  } else {
    // Standard
    switch (state) {
      case "new":
        primaryLabel = "Schedule Change";
        primaryState = "scheduled";
        break;
      case "scheduled":
        primaryLabel = "Begin Implementation";
        primaryState = "implement";
        showBeginImplementation = true;
        break;
      case "implement":
        primaryLabel = "Move to Review";
        primaryState = "review";
        if (!allTasksClosed(tasks)) {
          const open = openTaskCount(tasks);
          blockedReason = `${open} of ${tasks.length} tasks are still open. Close all tasks before moving to Review.`;
        }
        break;
      case "review":
        primaryLabel = "Close Change";
        primaryState = "closed";
        if (onHold) {
          blockedReason = "Change is on hold. Remove the hold before closing.";
        } else if (!closeCode) {
          blockedReason = "A Close Code is required. Set it in the Closure tab.";
        } else if (!closeNotes) {
          blockedReason = "Close Notes are required. Add them in the Closure tab.";
        }
        break;
    }
  }

  const isBlocked = !!blockedReason;
  const guidanceKey = `${type}_${state}`;
  const guidance = STATE_GUIDANCE[guidanceKey];

  // For "Begin Implementation", check if user is requester or admin
  // If not, hide the button (they shouldn't be able to start)
  const hideBeginButton = showBeginImplementation && !isRequesterOrAdmin;

  const handleBeginImplementation = () => {
    if (isBeforePlannedStart) {
      setShowStartConfirm(true);
    } else {
      primaryState && onTransition(primaryState);
    }
  };

  return (
    <div className="flex flex-col gap-0 sticky bottom-0 w-full z-20">
      {/* Workflow guidance */}
      {guidance && (
        <div className="flex items-start gap-3 px-4 py-2.5 bg-blue-500/5 border-t border-blue-500/15">
          <div className="min-w-0">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{guidance.title}</span>
            <p className="text-xs text-tertiary mt-0.5 leading-relaxed">{guidance.description}</p>
          </div>
        </div>
      )}

      {/* Error / blocked messages */}
      {(transitionError || blockedReason) && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border-t border-amber-500/20 text-amber-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">
            {transitionError || blockedReason}
          </span>
        </div>
      )}

      {/* Early start confirmation */}
      {showStartConfirm && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border-t border-amber-500/20">
          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-sm text-amber-600">
            The planned start date is{" "}
            <strong>{plannedStartDate ? new Date(plannedStartDate).toLocaleDateString() : "not set"}</strong>.
            Are you sure you want to begin implementation now?
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="primary" size="sm" onClick={() => { primaryState && onTransition(primaryState); setShowStartConfirm(false); }} loading={isTransitioning}>
              Yes, Start Now
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowStartConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 p-4 bg-layer-1 border-t border-subtle">
        {/* Cancel */}
        {showCancelConfirm ? (
          <div className="flex items-center gap-2 mr-auto">
            <span className="text-sm text-red-500 font-medium">Cancel this change?</span>
            <Button
              variant="error-fill"
              size="sm"
              onClick={() => { onCancel(); setShowCancelConfirm(false); }}
              disabled={isTransitioning}
            >
              Yes, Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCancelConfirm(false)}
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            variant="error-fill"
            onClick={() => setShowCancelConfirm(true)}
            disabled={isTransitioning}
            className="mr-auto"
          >
            Cancel Change
          </Button>
        )}

        {/* Save form */}
        <Button
          variant="secondary"
          type="submit"
          form="change-management-form"
          loading={isUpdatingForm}
          disabled={isTransitioning}
        >
          Save Changes
        </Button>

        {/* Primary transition */}
        {primaryState && !hideBeginButton && (
          <Button
            variant="primary"
            onClick={showBeginImplementation ? handleBeginImplementation : () => primaryState && onTransition(primaryState)}
            loading={isTransitioning}
            disabled={isBlocked || isUpdatingForm || showStartConfirm}
          >
            {primaryLabel}
          </Button>
        )}

        {/* Show message if user can't start implementation */}
        {hideBeginButton && (
          <span className="text-xs text-tertiary italic">
            Only the change requester or a workspace admin can begin implementation.
          </span>
        )}
      </div>
    </div>
  );
};
