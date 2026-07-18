/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import type { TIssueGroupByOptions } from "@plane/types";
import { useProjectState } from "@/hooks/store/use-project-state";

/**
 * Workflow enforcement for board/list drag-and-drop. Only active when work items
 * are grouped (or sub-grouped) by state; a no-op for every other grouping axis.
 */
export const useWorkFlowFDragNDrop = (groupBy: TIssueGroupByOptions | undefined, subGroupBy?: TIssueGroupByOptions) => {
  const { projectId } = useParams();
  const { getIsTransitionAllowed } = useProjectState();

  const [dragSourceStateId, setDragSourceStateId] = useState<string | undefined>(undefined);
  const [dragDestinationStateId, setDragDestinationStateId] = useState<string | undefined>(undefined);

  const isGroupByState = groupBy === "state";
  const isSubGroupByState = subGroupBy === "state";
  const isWorkflowAxisActive = isGroupByState || isSubGroupByState;

  const handleWorkFlowState = useCallback(
    (sourceGroupId: string, destinationGroupId: string, sourceSubGroupId?: string, destinationSubGroupId?: string) => {
      if (!isWorkflowAxisActive) return;
      // Whichever axis is grouped by state carries the state ids.
      const sourceStateId = isGroupByState ? sourceGroupId : sourceSubGroupId;
      const destinationStateId = isGroupByState ? destinationGroupId : destinationSubGroupId;
      setDragSourceStateId(sourceStateId);
      setDragDestinationStateId(destinationStateId);
    },
    [isWorkflowAxisActive, isGroupByState]
  );

  const isWorkflowDropDisabled =
    isWorkflowAxisActive &&
    !!dragSourceStateId &&
    !!dragDestinationStateId &&
    !getIsTransitionAllowed(projectId?.toString(), dragSourceStateId, dragDestinationStateId);

  return {
    workflowDisabledSource: isWorkflowDropDisabled ? dragSourceStateId : undefined,
    isWorkflowDropDisabled,
    // Work item creation may target any state in phase 1.
    getIsWorkflowWorkItemCreationDisabled: (_groupId: string, _subGroupId?: string) => false,
    handleWorkFlowState,
  };
};
