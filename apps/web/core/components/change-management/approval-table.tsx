import { useState } from "react";
import { createPortal } from "react-dom";
import type { IChangeApproval } from "@/services/change-management.service";
import { Button } from "@plane/propel/button";
import { format } from "date-fns";
import { Check, X, Clock, Ban } from "lucide-react";

type Props = {
  approvals: IChangeApproval[];
  onApprove: (id: string, note: string) => void;
  onReject: (id: string, note: string) => void;
  currentUserId?: string;
  isActioning: boolean;
};

// Approval/Reject confirmation modal with mandatory note
const ApprovalNoteModal = ({
  action,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  action: "approve" | "reject";
  onClose: () => void;
  onSubmit: (note: string) => void;
  isSubmitting: boolean;
}) => {
  const [note, setNote] = useState("");

  const isApprove = action === "approve";
  const title = isApprove ? "Approve Change" : "Reject Change";
  const placeholder = isApprove
    ? "Describe your review findings and confirm this change is approved to proceed..."
    : "State the reason for rejection and what must be addressed before resubmission...";
  const canSubmit = note.trim().length >= 10;

  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Opaque backdrop — blocks background content */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Solid modal panel */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-subtle bg-surface-1 shadow-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h3 className={`text-base font-semibold ${isApprove ? "text-green-600" : "text-red-600"}`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-tertiary transition-colors hover:bg-layer-1 hover:text-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">
              Note <span className="text-red-500">*</span>
              <span className="text-tertiary ml-1">(minimum 10 characters)</span>
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-subtle bg-transparent text-sm text-primary resize-none focus:outline-none focus:border-primary transition-colors placeholder:text-placeholder"
            />
            {note.trim().length > 0 && note.trim().length < 10 && (
              <p className="text-xs text-amber-500 mt-1">
                {10 - note.trim().length} more characters needed
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-subtle">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant={isApprove ? "primary" : "error-fill"}
            size="sm"
            onClick={() => onSubmit(note.trim())}
            loading={isSubmitting}
            disabled={!canSubmit}
          >
            {title}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const ApprovalTable = ({ approvals, onApprove, onReject, currentUserId, isActioning }: Props) => {
  const [modalState, setModalState] = useState<{
    action: "approve" | "reject";
    approvalId: string;
  } | null>(null);

  if (approvals.length === 0) {
    return (
      <div className="w-full py-8 text-center text-sm text-tertiary">
        No approvals required or requested yet.
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <Check className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <X className="w-4 h-4 text-red-500" />;
      case "voided":
        return <Ban className="w-4 h-4 text-gray-400" />;
      case "pending":
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      voided: "bg-gray-100 text-gray-400",
      pending: "bg-yellow-100 text-yellow-700",
    };
    return styles[status] || styles.pending;
  };

  return (
    <>
      <div className="w-full overflow-x-auto rounded-md border border-subtle">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-layer-1 text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Level</th>
              <th className="px-4 py-3 font-medium">Approver</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Decided At</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle bg-surface-1">
            {approvals.map((approval) => {
              const isMe = approval.approver === currentUserId;
              const canAction = isMe && approval.status === "pending";
              const isVoided = approval.status === "voided";

              return (
                <tr key={approval.id} className={isVoided ? "opacity-50" : ""}>
                  <td className="px-4 py-3 capitalize text-primary">{approval.approval_level.replace("_", " ")}</td>
                  <td className="px-4 py-3 font-medium text-primary">{approval.approver_display || approval.approver}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(approval.status)}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusBadge(approval.status)}`}>
                        {approval.status}
                      </span>
                    </div>
                    {isVoided && approval.comments && (
                      <p className="text-[11px] text-gray-400 mt-0.5 max-w-[200px] truncate" title={approval.comments}>
                        {approval.comments}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-tertiary">
                    {approval.decided_at ? format(new Date(approval.decided_at), "MMM d, yyyy h:mm a") : "—"}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] text-primary">
                    {!isVoided && approval.comments ? (
                      <span className="truncate block" title={approval.comments}>{approval.comments}</span>
                    ) : (
                      !isVoided && "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canAction ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setModalState({ action: "approve", approvalId: approval.id })}
                          loading={isActioning}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="error-fill"
                          size="sm"
                          onClick={() => setModalState({ action: "reject", approvalId: approval.id })}
                          loading={isActioning}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      !isVoided && "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Approval/Reject Note Modal — portalled to document.body */}
      {modalState && (
        <ApprovalNoteModal
          action={modalState.action}
          onClose={() => setModalState(null)}
          onSubmit={(note) => {
            if (modalState.action === "approve") {
              onApprove(modalState.approvalId, note);
            } else {
              onReject(modalState.approvalId, note);
            }
            setModalState(null);
          }}
          isSubmitting={isActioning}
        />
      )}
    </>
  );
};
