import type { ReactNode } from "react";
import { Popover } from "@headlessui/react";
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

/** State label badge — colored dot + name inside a rounded border. */
const StateBadge = ({ name, color }: { name: string; color: string }) => (
  <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-primary leading-none border border-subtle">
    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
    {name}
  </span>
);

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
  const {
    project: { getProjectMemberDetails },
  } = useMember();

  const workflowData = workflowStore.workflowByProject.get(projectId);
  const states = getProjectStates(projectId) ?? [];
  const targetState = states.find((s) => s.id === targetStateId);

  // Find all (sourceState → targetState) transitions
  const incomingTransitions: Array<{
    sourceStateId: string;
    sourceStateName: string;
    sourceStateColor: string;
    approvers: string[];
  }> = [];
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
    const names = approverIds.map(
      (id) => getProjectMemberDetails(id, projectId)?.member?.display_name ?? id.slice(0, 8)
    );
    if (names.length <= 2) return names.join(" & ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  };

  return (
    <Popover className="relative">
      <Popover.Button as="div">{children}</Popover.Button>

      <Popover.Panel className="absolute right-0 top-full z-[60] mt-1 w-56 rounded-lg border border-subtle bg-surface-1 p-2.5 shadow-xl">
        <p className="mb-2 text-[12px] font-semibold text-primary">
          {t("project_settings.workflows.indicator_popup_title")}
        </p>

        {incomingTransitions.length === 0 ? (
          <p className="text-[11px] text-tertiary">{t("project_settings.workflows.no_transitions_into_state")}</p>
        ) : (
          <div className="space-y-1.5">
            {incomingTransitions.map(({ sourceStateId, sourceStateName, sourceStateColor, approvers }) => (
              <div key={sourceStateId} className="rounded border border-subtle bg-layer-1 px-2 py-1.5">
                <div className="flex items-center gap-1 flex-wrap text-[11px] text-secondary leading-snug">
                  <span>{t("project_settings.workflows.indicator_popup_for")}</span>
                  <StateBadge name={sourceStateName} color={sourceStateColor} />
                </div>
                <div className="flex items-center gap-1 flex-wrap text-[11px] text-secondary leading-snug mt-1">
                  <span className="font-medium text-primary">{formatReviewerNames(approvers)}</span>
                  <span>{t("project_settings.workflows.indicator_popup_can_move")}</span>
                  {targetState && <StateBadge name={targetState.name} color={targetState.color} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </Popover.Panel>
    </Popover>
  );
});
