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

/** State label badge — colored dot + name inside a rounded border. */
const StateBadge = ({ name, color }: { name: string; color: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded bg-surface-2 px-2 py-1 text-[12px] font-medium text-primary leading-none border border-subtle">
    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
    {name}
  </span>
);

export const WorkflowBlockerModal = observer(function WorkflowBlockerModal({ projectId }: Props) {
  const { t } = useTranslation();
  const workflowStore = useWorkflowStore();
  const { getProjectStates } = useProjectState();
  const {
    project: { getProjectMemberDetails },
  } = useMember();

  // Catch 403 WORKFLOW_TRANSITION_BLOCKED errors from issue state updates.
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason: unknown = event.reason;
      if (
        typeof reason !== "object" ||
        reason === null ||
        !("error" in reason) ||
        (reason as { error: unknown }).error !== "WORKFLOW_TRANSITION_BLOCKED" ||
        !("detail" in reason)
      )
        return;
      const err = reason as {
        error: string;
        detail: { from_state: string; to_state: string; allowed_reviewers?: string[] };
      };
      event.preventDefault(); // suppress console error
      workflowStore.openBlockerModal({
        fromState: err.detail.from_state,
        toState: err.detail.to_state,
        allowedReviewers: err.detail.allowed_reviewers ?? [],
      });
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, [workflowStore]);

  const modal = workflowStore.blockerModal;
  if (!modal?.isOpen) return null;

  const states = getProjectStates(projectId) ?? [];
  const fromState = states.find((s) => s.id === modal.fromState);
  const workflowData = workflowStore.workflowByProject.get(projectId);

  // Collect all allowed transitions FROM the source state (from the store)
  const allowedTransitions: Array<{
    targetStateName: string;
    targetStateColor: string;
    approvers: string[];
  }> = [];

  if (workflowData?.states[modal.fromState]) {
    const stateData = workflowData.states[modal.fromState];
    for (const transition of Object.values(stateData.transitions)) {
      const targetState = states.find((s) => s.id === transition.transition_state);
      if (targetState) {
        allowedTransitions.push({
          targetStateName: targetState.name,
          targetStateColor: targetState.color,
          approvers: transition.approvers,
        });
      }
    }
  }

  const formatReviewerNames = (approverIds: string[]): string => {
    if (approverIds.length === 0) return t("project_settings.workflows.indicator_all_members");
    const names = approverIds.map(
      (id) => getProjectMemberDetails(id, projectId)?.member?.display_name ?? id.slice(0, 8)
    );
    if (names.length <= 2) return names.join(" & ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  };

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
        className="relative w-full max-w-[320px] rounded-lg border border-subtle bg-surface-1 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={workflowStore.closeBlockerModal}
          className="absolute right-3 top-3 text-tertiary hover:text-primary transition-colors"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Icon + title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <ShieldX className="h-6 w-6 text-primary" strokeWidth={1.5} />

          <h3 className="text-[14px] font-semibold text-primary">{t("project_settings.workflows.blocker_title")}</h3>

          <div className="space-y-2 mt-1 text-[12px] text-secondary w-full">
            {/* Source state */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {t("project_settings.workflows.indicator_popup_for")}{" "}
              {fromState && <StateBadge name={fromState.name} color={fromState.color} />}
            </div>

            {/* Allowed transitions from the source state */}
            {allowedTransitions.length > 0 ? (
              <div className="space-y-1.5 mt-2">
                {allowedTransitions.map(({ targetStateName, targetStateColor, approvers }) => (
                  <div
                    key={targetStateName}
                    className="flex items-center gap-1.5 flex-wrap justify-center rounded border border-subtle px-2 py-1.5"
                  >
                    <span className="font-medium text-primary">{formatReviewerNames(approvers)}</span>{" "}
                    {t("project_settings.workflows.indicator_popup_can_move")}{" "}
                    <StateBadge name={targetStateName} color={targetStateColor} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-tertiary mt-2">{t("project_settings.workflows.no_transitions_into_state")}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" size="sm" onClick={workflowStore.closeBlockerModal} className="h-7 text-[12px]">
            {t("close")}
          </Button>
        </div>
      </div>
    </div>
  );
});
