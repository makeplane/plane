/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { useParams } from "next/navigation";
// plane imports
import type { TIssueGroupByOptions, TWorkflowDisabledContext } from "@plane/types";
// hooks
import { useUser } from "@/hooks/store/user";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useWorkflows } from "@/hooks/store/use-workflows";

export const useWorkFlowFDragNDrop = (groupBy: TIssueGroupByOptions | undefined, subGroupBy?: TIssueGroupByOptions) => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // states
  const [workflowDisabledContext, setWorkflowDisabledContext] = useState<TWorkflowDisabledContext | undefined>(
    undefined
  );
  // store hooks
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const {
    isWorkflowsEnabled,
    getAllowedTransitionStateIds,
    isApprovalPending,
    canCreateInStateAcrossTypes,
    getFirstCreationAllowedStateForType,
  } = useWorkflows();
  // derived values
  const isWorkflowEnabled = workspaceSlug && projectId ? isWorkflowsEnabled(workspaceSlug, projectId) : false;

  const checkStateTransition = (
    sourceStateId: string,
    destinationStateId: string,
    typeId: string | null | undefined,
    projectIdStr: string
  ) => {
    if (sourceStateId === destinationStateId) {
      setWorkflowDisabledContext(undefined);
      return;
    }

    if (isApprovalPending(workspaceSlug, projectIdStr, typeId, sourceStateId)) {
      setWorkflowDisabledContext({
        sourceStateId,
        destinationStateId,
      });
      return;
    }

    const allowedMap = getAllowedTransitionStateIds(
      workspaceSlug,
      projectIdStr,
      typeId,
      sourceStateId,
      currentUser?.id
    );

    if (!allowedMap[destinationStateId]) {
      setWorkflowDisabledContext({
        sourceStateId,
        destinationStateId,
      });
    } else {
      setWorkflowDisabledContext(undefined);
    }
  };

  /**
   * Checks the state workflow permissions and makes sure the grouped
   * state has permission to drop. Pass `issueId` so the hook can
   * resolve the dragged issue's `type_id` for type-aware transition
   * checks and approval blocking.
   */
  const handleWorkFlowState = (
    sourceGroupId: string,
    destinationGroupId: string,
    sourceSubGroupId?: string,
    destinationSubGroupId?: string,
    issueId?: string
  ) => {
    if (!isWorkflowEnabled || !projectId || !workspaceSlug) return;

    const issue = issueId ? getIssueById(issueId) : undefined;
    const typeId = issue?.type_id;

    if (groupBy === "state") {
      checkStateTransition(sourceGroupId, destinationGroupId, typeId, projectId);
      return;
    }

    if (subGroupBy === "state" && sourceSubGroupId && destinationSubGroupId) {
      checkStateTransition(sourceSubGroupId, destinationSubGroupId, typeId, projectId);
    }
  };

  const getIsWorkflowWorkItemCreationDisabled = (groupId: string, subGroupId?: string) => {
    if (!isWorkflowEnabled || !projectId) return false;
    // Check for groupBy
    if (groupBy === "state") {
      return !canCreateInStateAcrossTypes(projectId, groupId);
    }

    // Check for Sub groupBy
    if (subGroupBy === "state" && subGroupId) {
      return !canCreateInStateAcrossTypes(projectId, subGroupId);
    }

    // Check for groupBy type
    if (groupBy === "type") {
      return !getFirstCreationAllowedStateForType(projectId, groupId);
    }

    // Check for subGroupBy type
    if (subGroupBy === "type" && subGroupId) {
      return !getFirstCreationAllowedStateForType(projectId, subGroupId);
    }

    return false;
  };

  return {
    workflowDisabledContext,
    isWorkflowDropDisabled: Boolean(workflowDisabledContext),
    getIsWorkflowWorkItemCreationDisabled,
    handleWorkFlowState,
  };
};
