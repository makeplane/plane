import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ToggleSwitch } from "@plane/ui";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflowStore } from "@/hooks/store/use-workflow";
// local
import { TransitionRow } from "./transition-row";

type Props = {
  workspaceSlug: string;
  projectId: string;
  stateId: string;
  allowIssueCreation: boolean;
  transitions: Record<string, { transition_state: string; approvers: string[] }>;
};

export const WorkflowStateCard = observer(function WorkflowStateCard(props: Props) {
  const { workspaceSlug, projectId, stateId, allowIssueCreation, transitions } = props;
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingTransition, setIsAddingTransition] = useState(false);

  const workflowStore = useWorkflowStore();
  const { getProjectStates } = useProjectState();

  const states = getProjectStates(projectId) ?? [];
  const currentState = states.find((s) => s.id === stateId);

  const handleToggleAllowCreation = async (value: boolean) => {
    try {
      await workflowStore.updateStateConfig(workspaceSlug, projectId, stateId, value);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("common.saved") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error") });
    }
  };

  const handleDeleteTransition = async (transitionId: string) => {
    if (!confirm(t("project_settings.workflows.delete_transition_title"))) return;
    try {
      await workflowStore.removeTransition(workspaceSlug, projectId, stateId, transitionId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("common.deleted") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error") });
    }
  };

  const handleAddTransition = async (targetStateId: string) => {
    try {
      await workflowStore.addTransition(workspaceSlug, projectId, stateId, targetStateId);
      setIsAddingTransition(false);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("common.saved") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error") });
    }
  };

  if (!currentState) return null;

  const transitionList = Object.entries(transitions);
  // States that haven't been added as a transition yet (and aren't the source state)
  const availableTargetStates = states.filter(
    (s) =>
      s.id !== stateId &&
      !Object.values(transitions).some((t) => t.transition_state === s.id)
  );

  return (
    <div className="rounded-lg border border-color-subtle bg-surface-1">
      {/* Card header */}
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="h-4 w-4 text-color-secondary" /> : <ChevronRight className="h-4 w-4 text-color-secondary" />}
          <span
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: currentState.color }}
          />
          <span className="text-sm font-medium text-color-primary">{currentState.name}</span>
        </div>

        {/* Allow issue creation toggle */}
        <div
          className="flex items-center gap-2 text-xs text-color-secondary"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{t("project_settings.workflows.allow_issue_creation")}</span>
          <ToggleSwitch
            value={allowIssueCreation}
            onChange={() => void handleToggleAllowCreation(allowIssueCreation)}
            size="sm"
          />
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-color-subtle px-4 pb-4 pt-3 space-y-2">
          {transitionList.length === 0 ? (
            <p className="text-xs text-color-tertiary py-1">{t("project_settings.workflows.no_transitions")}</p>
          ) : (
            transitionList.map(([transitionId, transition]) => (
              <TransitionRow
                key={transitionId}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                stateId={stateId}
                transitionId={transitionId}
                transitionStateId={transition.transition_state}
                approvers={transition.approvers}
                onDeleteTransition={handleDeleteTransition}
              />
            ))
          )}

          {/* Add transition */}
          {isAddingTransition ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {availableTargetStates.map((targetState) => (
                <button
                  key={targetState.id}
                  type="button"
                  onClick={() => void handleAddTransition(targetState.id)}
                  className="flex items-center gap-1.5 rounded-full border border-color-subtle bg-layer-2 px-3 py-1 text-xs hover:bg-layer-3 transition-colors"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: targetState.color }} />
                  {targetState.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsAddingTransition(false)}
                className="text-xs text-color-tertiary hover:text-color-secondary px-2"
              >
                {t("common.cancel")}
              </button>
            </div>
          ) : (
            availableTargetStates.length > 0 && (
              <Button
                variant="link-neutral"
                size="sm"
                className="h-auto py-1 px-0 text-xs"
                onClick={() => setIsAddingTransition(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t("project_settings.workflows.add_transition")}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
});
