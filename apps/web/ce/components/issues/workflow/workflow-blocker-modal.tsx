import { useEffect } from "react";
import { observer } from "mobx-react";
import { ShieldX, X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflowStore } from "@/hooks/store/use-workflow";

type Props = {
  projectId: string;
};

/**
 * Modal for non-Kanban layout blocked transitions.
 * Mount once in project layout; WorkflowStore owns open state + payload.
 * Listens to `unhandledrejection` to catch WORKFLOW_TRANSITION_BLOCKED API errors.
 */
export const WorkflowBlockerModal = observer(function WorkflowBlockerModal({ projectId }: Props) {
  const { t } = useTranslation();
  const workflowStore = useWorkflowStore();
  const { getProjectStates } = useProjectState();
  const { getProjectMemberDetails } = useMember();

  // Catch 403 WORKFLOW_TRANSITION_BLOCKED errors from issue state updates.
  // Since issueUpdate rethrows errors and callers (like handleState in all-properties.tsx)
  // don't catch them, they become unhandled promise rejections.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const handler = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      if (err?.error === "WORKFLOW_TRANSITION_BLOCKED" && err?.detail) {
        event.preventDefault(); // suppress console error
        workflowStore.openBlockerModal({
          fromState: err.detail.from_state,
          toState: err.detail.to_state,
          allowedReviewers: err.detail.allowed_reviewers ?? [],
        });
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, [workflowStore]);

  const modal = workflowStore.blockerModal;
  if (!modal?.isOpen) return null;

  const states = getProjectStates(projectId) ?? [];
  const fromState = states.find((s) => s.id === modal.fromState);
  const toState = states.find((s) => s.id === modal.toState);

  const formatReviewer = (id: string) =>
    getProjectMemberDetails(id, projectId)?.member?.display_name ?? id.slice(0, 8);

  const reviewerDisplay =
    modal.allowedReviewers.length === 0
      ? t("project_settings.workflows.blocker_all_members")
      : modal.allowedReviewers.slice(0, 3).map(formatReviewer).join(", ") +
        (modal.allowedReviewers.length > 3 ? ` +${modal.allowedReviewers.length - 3}` : "");

  return (
    /* Backdrop */
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={workflowStore.closeBlockerModal}
    >
      {/* Modal card */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
      <div
        className="relative w-full max-w-sm rounded-xl border border-color-subtle bg-surface-1 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={workflowStore.closeBlockerModal}
          className="absolute right-4 top-4 text-color-tertiary hover:text-color-primary transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon + title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-5 w-5 text-red-500" />
          </div>

          <h3 className="text-base font-semibold text-color-primary">
            {t("project_settings.workflows.blocker_title")}
          </h3>

          <div className="space-y-1 text-sm text-color-secondary">
            <p>
              {t("project_settings.workflows.indicator_popup_for")}{" "}
              {fromState && (
                <span className="inline-flex items-center gap-1 font-medium text-color-primary">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: fromState.color }} />
                  {fromState.name}
                </span>
              )}
            </p>

            <p>
              <span className="font-medium text-color-primary">{reviewerDisplay}</span>{" "}
              {t("project_settings.workflows.indicator_popup_can_move")}{" "}
              {toState && (
                <span className="inline-flex items-center gap-1 font-medium text-color-primary">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: toState.color }} />
                  {toState.name}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-center">
          <Button variant="neutral-primary" size="sm" onClick={workflowStore.closeBlockerModal}>
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
});
