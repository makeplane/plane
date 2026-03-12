/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { useParams } from "react-router";
import { observer } from "mobx-react";
import { CircleAlert } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflowStore } from "@/hooks/store/use-workflow";

export type TWorkflowDisabledOverlayProps = {
  messageContainerRef: React.RefObject<HTMLDivElement>;
  workflowDisabledSource: string;
  shouldOverlayBeVisible: boolean;
};

/** State label badge — colored dot + name inside a rounded border. */
const StateBadge = ({ name, color }: { name: string; color: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-subtle bg-surface-1 px-1.5 py-0.5 text-[11px] font-medium text-primary leading-none whitespace-nowrap">
    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
    {name}
  </span>
);

/**
 * Overlay shown inside GroupDragOverlay when a workflow transition is blocked.
 * Displays the source state, and the allowed transitions with reviewer info.
 */
export const WorkFlowDisabledOverlay = observer(function WorkFlowDisabledOverlay(props: TWorkflowDisabledOverlayProps) {
  const { messageContainerRef, workflowDisabledSource, shouldOverlayBeVisible } = props;
  const { projectId } = useParams<{ projectId: string }>();
  const { t } = useTranslation();
  const workflowStore = useWorkflowStore();
  const { getProjectStates } = useProjectState();
  const {
    project: { getProjectMemberDetails },
  } = useMember();

  // Scroll to bottom so the blocker card is visible
  useEffect(() => {
    if (shouldOverlayBeVisible && messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [shouldOverlayBeVisible, messageContainerRef]);

  if (!projectId) return null;

  const states = getProjectStates(projectId) ?? [];
  const sourceState = states.find((s) => s.id === workflowDisabledSource);
  const workflowData = workflowStore.workflowByProject.get(projectId);

  // Collect all allowed transitions FROM the source state
  const allowedTransitions: Array<{
    targetStateId: string;
    targetStateName: string;
    targetStateColor: string;
    approvers: string[];
  }> = [];

  if (workflowData?.states[workflowDisabledSource]) {
    const stateData = workflowData.states[workflowDisabledSource];
    for (const transition of Object.values(stateData.transitions)) {
      const targetState = states.find((s) => s.id === transition.transition_state);
      if (targetState) {
        allowedTransitions.push({
          targetStateId: targetState.id,
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
    <div className="flex flex-col items-center justify-center p-2 my-2 w-full">
      <div className="w-full max-w-[260px] rounded-lg border border-subtle bg-surface-1 p-2.5 shadow-sm">
        {/* Header */}
        <div className="flex items-start gap-1.5 mb-1.5">
          <CircleAlert className="h-3.5 w-3.5 flex-shrink-0 text-red-500 mt-px" />
          <p className="text-[12px] font-medium text-primary leading-tight">
            {t("project_settings.workflows.drag_blocked_title")}
          </p>
        </div>

        {/* Source state */}
        {sourceState && (
          <p className="text-[11px] text-secondary mb-2 ml-5 flex items-center gap-1 flex-wrap">
            {t("project_settings.workflows.indicator_popup_for")}{" "}
            <StateBadge name={sourceState.name} color={sourceState.color} />
          </p>
        )}

        {/* Allowed transitions — each in its own bordered section */}
        {allowedTransitions.length > 0 && (
          <div className="ml-5 space-y-1.5">
            {allowedTransitions.map(({ targetStateId, targetStateName, targetStateColor, approvers }) => (
              <div key={targetStateId} className="rounded-md border border-subtle bg-layer-1 px-2 py-1.5">
                <p className="text-[11px] text-secondary leading-tight mb-1">
                  <span className="font-medium text-primary">{formatReviewerNames(approvers)}</span>{" "}
                  {t("project_settings.workflows.indicator_popup_can_move")}
                </p>
                <StateBadge name={targetStateName} color={targetStateColor} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
