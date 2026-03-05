import { observer } from "mobx-react";
/* eslint-disable @typescript-eslint/no-unsafe-assignment */import { Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflowStore } from "@/hooks/store/use-workflow";

type Props = {
  workspaceSlug: string;
  projectId: string;
  stateId: string;
  transitionId: string;
  transitionStateId: string;
  approvers: string[];
  onDeleteTransition: (transitionId: string) => void;
};

export const TransitionRow = observer(function TransitionRow(props: Props) {
  const { workspaceSlug, projectId, stateId, transitionId, transitionStateId, approvers, onDeleteTransition } = props;
  const { t } = useTranslation();
  const workflowStore = useWorkflowStore();
  const { getProjectStates } = useProjectState();
  const { getProjectMemberDetails } = useMember();

  const states = getProjectStates(projectId);
  const targetState = states?.find((s) => s.id === transitionStateId);

  const handleRemoveApprover = async (approverId: string) => {
    await workflowStore.removeApprover(workspaceSlug, projectId, transitionId, stateId, approverId);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-color-subtle bg-layer-2 px-3 py-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Target state */}
        <span className="flex items-center gap-1.5 text-sm font-medium text-color-primary">
          {targetState ? (
            <>
              <span
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: targetState.color }}
              />
              {targetState.name}
            </>
          ) : (
            <span className="text-color-tertiary italic">Unknown state</span>
          )}
        </span>

        {/* Reviewers */}
        <span className="text-color-secondary text-xs">—</span>
        <div className="flex flex-wrap gap-1.5">
          {approvers.length === 0 ? (
            <span className="text-xs text-color-secondary">{t("project_settings.workflows.blocker_all_members")}</span>
          ) : (
            approvers.map((userId) => {
              const member = getProjectMemberDetails(userId, projectId);
              return (
                <span
                  key={userId}
                  className="flex items-center gap-1 rounded-full bg-surface-1 px-2 py-0.5 text-xs text-color-primary border border-color-subtle"
                >
                  {member?.member?.display_name ?? userId.slice(0, 8)}
                  <button
                    type="button"
                    onClick={() => void handleRemoveApprover(userId)}
                    className="text-color-tertiary hover:text-red-500 transition-colors"
                    aria-label="Remove approver"
                  >
                    ×
                  </button>
                </span>
              );
            })
          )}
          {/* Add reviewer button intentionally deferred — wire to member picker when available */}
        </div>
      </div>

      {/* Delete transition */}
      <button
        type="button"
        onClick={() => onDeleteTransition(transitionId)}
        className="flex-shrink-0 text-color-tertiary hover:text-red-500 transition-colors"
        aria-label="Delete transition"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
});
