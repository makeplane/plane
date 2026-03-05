import type { ReactNode } from "react";
/* eslint-disable @typescript-eslint/no-unsafe-member-access */import { Popover } from "@headlessui/react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflowStore } from "@/hooks/store/use-workflow";

type Props = {
  projectId: string;
  /** The column/target state whose incoming transitions we display */
  targetStateId: string;
  children: ReactNode;
};

/**
 * Popup shown when hovering/clicking the workflow indicator icon on a Kanban column header.
 * Lists all source states that can transition INTO targetStateId, with their reviewers.
 */
export const WorkflowStateInfoPopup = observer(function WorkflowStateInfoPopup({
  projectId,
  targetStateId,
  children,
}: Props) {
  const { t } = useTranslation();
  const workflowStore = useWorkflowStore();
  const { getProjectStates } = useProjectState();
  const { getProjectMemberDetails } = useMember();

  const workflowData = workflowStore.workflowByProject.get(projectId);
  const states = getProjectStates(projectId) ?? [];
  const targetState = states.find((s) => s.id === targetStateId);

  // Find all (sourceState → targetState) transitions
  const incomingTransitions: Array<{ sourceStateId: string; sourceStateName: string; sourceStateColor: string; approvers: string[] }> = [];
  if (workflowData) {
    for (const [sourceStateId, stateData] of Object.entries(workflowData.states)) {
      for (const transition of Object.values(stateData.transitions)) {
        if (transition.transition_state === targetStateId) {
          const sourceState = states.find((s) => s.id === sourceStateId);
          if (sourceState) {
            incomingTransitions.push({
              sourceStateId,
              sourceStateName: sourceState.name,
              sourceStateColor: sourceState.color,
              approvers: transition.approvers,
            });
          }
        }
      }
    }
  }

  const formatReviewerNames = (approverIds: string[]): string => {
    if (approverIds.length === 0) return t("project_settings.workflows.indicator_all_members");
    const names = approverIds.map((id) => getProjectMemberDetails(id, projectId)?.member?.display_name ?? id.slice(0, 8));
    if (names.length <= 2) return names.join(` ${t("common.and")} `);
    return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  };

  return (
    <Popover className="relative">
      <Popover.Button as="div">{children}</Popover.Button>

      <Popover.Panel className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-color-subtle bg-surface-1 p-3 shadow-md">
        <p className="mb-2 text-xs font-semibold text-color-primary">
          {t("project_settings.workflows.indicator_popup_title")}
        </p>

        {incomingTransitions.length === 0 ? (
          <p className="text-xs text-color-tertiary">{t("project_settings.workflows.no_transitions_into_state")}</p>
        ) : (
          <ul className="space-y-2">
            {incomingTransitions.map(({ sourceStateId, sourceStateName, sourceStateColor, approvers }) => (
              <li key={sourceStateId} className="text-xs text-color-secondary">
                <span className="text-color-secondary">{t("project_settings.workflows.indicator_popup_for")}</span>
                {" "}
                <span className="inline-flex items-center gap-1 font-medium text-color-primary">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sourceStateColor }} />
                  {sourceStateName}
                </span>
                {" — "}
                <span className="font-medium text-color-primary">{formatReviewerNames(approvers)}</span>
                {" "}
                <span className="text-color-secondary">{t("project_settings.workflows.indicator_popup_can_move")}</span>
                {" "}
                <span className="inline-flex items-center gap-1 font-medium text-color-primary">
                  {targetState && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: targetState.color }} />}
                  {targetState?.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Popover.Panel>
    </Popover>
  );
});
