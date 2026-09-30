/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
import { observer } from "mobx-react";
import type { TIssueGroupByOptions } from "@plane/types";
import { ChevronRightIcon } from "@plane/propel/icons";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflow } from "@/hooks/store/use-workflow";

type Props = {
  groupBy?: TIssueGroupByOptions;
  groupId: string | undefined;
};

export const WorkFlowGroupTree = observer(function WorkFlowGroupTree(props: Props) {
  const { groupBy, groupId } = props;
  const { projectId } = useParams();
  const workflowStore = useWorkflow();
  const projectState = useProjectState();

  if (groupBy !== "state" || !groupId || !projectId) return null;
  if (!workflowStore.isWorkflowEnabledForProject(projectId.toString())) return null;

  const workflows = workflowStore.getWorkflowsByProjectId(projectId.toString());
  const defaultWorkflow = workflows?.find((workflow) => workflow.is_default);
  const outgoingFlows = defaultWorkflow?.flows.filter((flow) => flow.source_state_id === groupId) ?? [];

  if (outgoingFlows.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1 px-2">
      {outgoingFlows.slice(0, 3).map((flow) => {
        const targetState = projectState.getStateById(flow.target_state_id);
        return (
          <span
            key={flow.id}
            className="inline-flex items-center gap-0.5 rounded-sm bg-layer-1 px-1 py-0.5 text-10 text-tertiary"
          >
            <ChevronRightIcon className="size-2.5" />
            <span className="truncate">{targetState?.name ?? flow.flow_type}</span>
          </span>
        );
      })}
      {outgoingFlows.length > 3 && <span className="text-10 text-placeholder">+{outgoingFlows.length - 3}</span>}
    </div>
  );
});
