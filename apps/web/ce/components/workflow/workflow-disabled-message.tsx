/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { GitBranch } from "lucide-react";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflow } from "@/hooks/store/use-workflow";

type Props = {
  parentStateId: string;
  className?: string;
};

export const WorkFlowDisabledMessage = observer(function WorkFlowDisabledMessage(props: Props) {
  const { parentStateId, className = "" } = props;
  const { t } = useTranslation();
  const { projectId } = useParams();
  const workflowStore = useWorkflow();
  const projectState = useProjectState();

  if (!projectId || !workflowStore.isWorkflowEnabledForProject(projectId.toString())) return null;

  const state = projectState.getStateById(parentStateId);
  const workflows = workflowStore.getWorkflowsByProjectId(projectId.toString());
  const defaultWorkflow = workflows?.find((workflow) => workflow.is_default);
  const outgoingFlows = defaultWorkflow?.flows.filter((flow) => flow.source_state_id === parentStateId) ?? [];

  if (outgoingFlows.length === 0) return null;

  return (
    <div className={`flex items-center gap-1 text-11 text-tertiary ${className}`}>
      <GitBranch className="size-3" />
      <span>
        {outgoingFlows.length} {t("project_settings.workflows.transitions_configured")}
        {state ? ` · ${state.name}` : ""}
      </span>
    </div>
  );
});
