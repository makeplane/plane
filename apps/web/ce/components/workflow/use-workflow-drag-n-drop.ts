/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { TIssueGroupByOptions } from "@plane/types";
import { useWorkflow } from "@/hooks/store/use-workflow";

export const useWorkFlowFDragNDrop = (groupBy: TIssueGroupByOptions | undefined, subGroupBy?: TIssueGroupByOptions) => {
  const { workspaceSlug, projectId } = useParams();
  const workflowStore = useWorkflow();
  const [workflowDisabledSource, setWorkflowDisabledSource] = useState<string | undefined>(undefined);
  const [isWorkflowDropDisabled, setIsWorkflowDropDisabled] = useState(false);
  const [dropErrorMessage, setDropErrorMessage] = useState<string | undefined>(undefined);

  const isStateGrouping = groupBy === "state" || subGroupBy === "state";

  useEffect(() => {
    if (!isStateGrouping || !workspaceSlug || !projectId) return;
    if (!workflowStore.fetchedMap[projectId.toString()]) {
      workflowStore.fetchProjectWorkflowStates(workspaceSlug.toString(), projectId.toString());
    }
  }, [isStateGrouping, workspaceSlug, projectId, workflowStore]);

  const handleWorkFlowState = useCallback(
    (
      sourceGroupId: string,
      destinationGroupId: string,
      _sourceSubGroupId?: string,
      _destinationSubGroupId?: string
    ) => {
      if (!isStateGrouping || !projectId) {
        setWorkflowDisabledSource(undefined);
        setIsWorkflowDropDisabled(false);
        setDropErrorMessage(undefined);
        return;
      }

      if (!workflowStore.isWorkflowEnabledForProject(projectId.toString())) {
        setWorkflowDisabledSource(undefined);
        setIsWorkflowDropDisabled(false);
        setDropErrorMessage(undefined);
        return;
      }

      const result = workflowStore.canTransitionToState(
        projectId.toString(),
        undefined,
        sourceGroupId,
        destinationGroupId
      );

      if (!result.allowed) {
        setWorkflowDisabledSource(sourceGroupId);
        setIsWorkflowDropDisabled(true);
        setDropErrorMessage(result.message);
        return;
      }

      setWorkflowDisabledSource(undefined);
      setIsWorkflowDropDisabled(false);
      setDropErrorMessage(undefined);
    },
    [isStateGrouping, projectId, workflowStore]
  );

  const getIsWorkflowWorkItemCreationDisabled = useCallback(
    (groupId: string, _subGroupId?: string) => {
      if (!projectId || !isStateGrouping) return false;
      return !workflowStore.isWorkItemCreationAllowed(projectId.toString(), groupId);
    },
    [isStateGrouping, projectId, workflowStore]
  );

  return useMemo(
    () => ({
      workflowDisabledSource,
      isWorkflowDropDisabled,
      dropErrorMessage,
      getIsWorkflowWorkItemCreationDisabled,
      handleWorkFlowState,
    }),
    [
      workflowDisabledSource,
      isWorkflowDropDisabled,
      dropErrorMessage,
      getIsWorkflowWorkItemCreationDisabled,
      handleWorkFlowState,
    ]
  );
};
