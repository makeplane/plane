/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { useParams } from "react-router";
import type { TIssueGroupByOptions } from "@plane/types";
// hooks
import { useWorkflowStore } from "@/hooks/store/use-workflow";

export const useWorkFlowFDragNDrop = (
  groupBy: TIssueGroupByOptions | undefined,
  subGroupBy?: TIssueGroupByOptions
) => {
  const { projectId } = useParams<{ projectId: string }>();
  const workflowStore = useWorkflowStore();

  // Track which source stateId is currently blocked for this destination column
  const [workflowDisabledSource, setWorkflowDisabledSource] = useState<string | undefined>(undefined);
  const [isWorkflowDropDisabled, setIsWorkflowDropDisabled] = useState(false);

  /**
   * Called on onDragEnter / onDragStart for a Kanban column.
   * sourceGroupId = the column being dragged FROM (= fromStateId when groupBy=state)
   * destinationGroupId = this column (= toStateId when groupBy=state)
   */
  const handleWorkFlowState = (
    sourceGroupId: string,
    destinationGroupId: string,
    _sourceSubGroupId?: string,
    _destinationSubGroupId?: string
  ) => {
    if (!projectId || groupBy !== "state" || !workflowStore.isLive(projectId)) {
      setWorkflowDisabledSource(undefined);
      setIsWorkflowDropDisabled(false);
      return;
    }

    const allowed = workflowStore.isTransitionAllowed(projectId, sourceGroupId, destinationGroupId);
    setIsWorkflowDropDisabled(!allowed);
    setWorkflowDisabledSource(!allowed ? sourceGroupId : undefined);
  };

  /**
   * Returns true if work item creation should be disabled for the given column.
   * Disabled when: groupBy=state, workflow is live, and allow_issue_creation=false for that state.
   */
  const getIsWorkflowWorkItemCreationDisabled = (groupId: string, _subGroupId?: string): boolean => {
    if (!projectId || groupBy !== "state" || !workflowStore.isLive(projectId)) return false;
    const stateData = workflowStore.workflowByProject.get(projectId)?.states[groupId];
    return stateData?.allow_issue_creation === false;
  };

  return {
    workflowDisabledSource,
    isWorkflowDropDisabled,
    getIsWorkflowWorkItemCreationDisabled,
    handleWorkFlowState,
  };
};
