import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, ChevronUp, GitBranch, Users } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore, ToggleSwitch, CustomSearchSelect } from "@plane/ui";
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
  const [deleteTransitionId, setDeleteTransitionId] = useState<string | null>(null);

  const workflowStore = useWorkflowStore();
  const { getProjectStates } = useProjectState();

  const states = getProjectStates(projectId) ?? [];
  const currentState = states.find((s) => s.id === stateId);

  // Count unique reviewers across all transitions — must be before early return (rules of hooks)
  const totalUniqueReviewers = useMemo(() => {
    const reviewerSet = new Set<string>();
    Object.values(transitions).forEach((tr) => tr.approvers.forEach((a) => reviewerSet.add(a)));
    return reviewerSet.size;
  }, [transitions]);

  const handleToggleAllowCreation = async (value: boolean) => {
    try {
      await workflowStore.updateStateConfig(workspaceSlug, projectId, stateId, value);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("success") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error") });
    }
  };

  const handleDeleteTransition = async (transitionId: string) => {
    try {
      await workflowStore.removeTransition(workspaceSlug, projectId, stateId, transitionId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("success") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error") });
    } finally {
      setDeleteTransitionId(null);
    }
  };

  const handleAddTransition = async (targetStateId: string) => {
    if (!targetStateId) return;
    try {
      await workflowStore.addTransition(workspaceSlug, projectId, stateId, targetStateId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("success") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error") });
    }
  };

  if (!currentState) return null;

  const transitionList = Object.entries(transitions);

  // States that haven't been added as a transition yet (and aren't the source state)
  const availableTargetStates = states.filter(
    (s) => s.id !== stateId && !Object.values(transitions).some((t) => t.transition_state === s.id)
  );

  const stateOptions = availableTargetStates.map((target) => ({
    value: target.id,
    query: target.name,
    content: (
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: target.color }} />
        <span className="text-12">{target.name}</span>
      </div>
    ),
  }));

  return (
    <>
      <div className="rounded-lg border border-color-subtle bg-surface-1 overflow-hidden">
        {/* Card header */}
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left bg-layer-1"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("[data-no-collapse]")) return;
            setIsExpanded((prev) => !prev);
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: currentState.color }} />
            <span className="text-13 font-medium text-color-primary leading-tight">{currentState.name}</span>
            {/* Summary badges */}
            {transitionList.length > 0 && (
              <div className="flex items-center gap-1.5 ml-2 text-12 text-color-secondary">
                <GitBranch className="h-3.5 w-3.5" />
                <span>
                  {t("project_settings.workflows.n_permitted_state_changes", { count: transitionList.length })}
                </span>
                {totalUniqueReviewers > 0 && (
                  <>
                    <span className="mx-1">•</span>
                    <Users className="h-3.5 w-3.5" />
                    <span>{t("project_settings.workflows.n_listed_reviewers", { count: totalUniqueReviewers })}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Allow issue creation toggle — data-no-collapse prevents card expand/collapse */}
            <div className="flex items-center gap-2 text-12 text-color-secondary" data-no-collapse>
              <span>{t("project_settings.workflows.allow_issue_creation")}</span>
              <ToggleSwitch value={allowIssueCreation} onChange={(v) => void handleToggleAllowCreation(v)} size="sm" />
            </div>
            {/* Expand/collapse chevron */}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-color-secondary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-color-secondary" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-color-subtle px-4 pb-4 pt-4 space-y-4">
            {transitionList.length === 0 ? (
              <p className="text-12 text-color-tertiary py-1">{t("project_settings.workflows.no_transitions")}</p>
            ) : (
              <div className="space-y-3">
                {transitionList.map(([transitionId, transition]) => (
                  <TransitionRow
                    key={transitionId}
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    stateId={stateId}
                    transitionId={transitionId}
                    transitionStateId={transition.transition_state}
                    approvers={transition.approvers}
                    onDeleteTransition={() => setDeleteTransitionId(transitionId)}
                  />
                ))}
              </div>
            )}

            {/* Add transition dropdown */}
            {availableTargetStates.length > 0 && (
              <div className="pt-2">
                <CustomSearchSelect
                  value=""
                  onChange={(val: string) => void handleAddTransition(val)}
                  options={stateOptions}
                  customButton={
                    <div className="inline-flex items-center gap-1 rounded border border-color-subtle bg-surface-1 px-3 py-1.5 text-12 text-color-primary hover:bg-layer-2 transition-colors shadow-sm cursor-pointer">
                      {t("project_settings.workflows.add_transition")}
                    </div>
                  }
                  placement="bottom-start"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete transition confirmation modal */}
      <AlertModalCore
        isOpen={!!deleteTransitionId}
        isSubmitting={false}
        handleClose={() => setDeleteTransitionId(null)}
        handleSubmit={() => deleteTransitionId && void handleDeleteTransition(deleteTransitionId)}
        title={t("project_settings.workflows.delete_transition_title")}
        content={<>{t("project_settings.workflows.delete_transition_body")}</>}
      />
    </>
  );
});
