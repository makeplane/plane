import { observer } from "mobx-react";
import { ShieldX } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflowStore } from "@/hooks/store/use-workflow";

type Props = {
  projectId: string;
  fromStateId: string;
  toStateId: string;
};

/**
 * Inline blocker card shown at the bottom of a Kanban column when a drag is blocked.
 * Appears client-side during dragOver — no API call made for blocked drags.
 */
export const WorkflowDragBlockerCard = observer(function WorkflowDragBlockerCard({
  projectId,
  fromStateId,
  toStateId,
}: Props) {
  const { t } = useTranslation();
  const workflowStore = useWorkflowStore();
  const { getProjectStates } = useProjectState();
  const {
    project: { getProjectMemberDetails },
  } = useMember();

  const states = getProjectStates(projectId) ?? [];
  const fromState = states.find((s) => s.id === fromStateId);
  const toState = states.find((s) => s.id === toStateId);
  const reviewers = workflowStore.getTransitionReviewers(projectId, fromStateId, toStateId);

  const reviewerDisplay =
    reviewers.length === 0
      ? t("project_settings.workflows.indicator_all_members")
      : reviewers
          .slice(0, 2)
          .map((id) => getProjectMemberDetails(id, projectId)?.member?.display_name ?? id.slice(0, 8))
          .join(", ") + (reviewers.length > 2 ? ` +${reviewers.length - 2}` : "");

  return (
    <div className="mx-2 mb-2 rounded-lg border border-custom-border-200 bg-surface-1 p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <ShieldX className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-primary">{t("project_settings.workflows.drag_blocked_title")}</p>
          <p className="text-xs text-secondary">
            {t("project_settings.workflows.indicator_popup_for")}{" "}
            {fromState && (
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: fromState.color }} />
                {fromState.name}
              </span>
            )}
          </p>
          <p className="text-xs text-secondary">
            <span className="font-medium text-primary">{reviewerDisplay}</span>{" "}
            {t("project_settings.workflows.indicator_popup_can_move")}{" "}
            {toState && (
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: toState.color }} />
                {toState.name}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
});
