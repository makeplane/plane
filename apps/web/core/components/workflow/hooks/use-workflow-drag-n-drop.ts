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
import type { TIssueGroupByOptions } from "@plane/types";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

export const useWorkFlowFDragNDrop = (groupBy: TIssueGroupByOptions | undefined, subGroupBy?: TIssueGroupByOptions) => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // states
  const [workflowDisabledSource, setWorkflowDisabledSource] = useState<string | undefined>(undefined);
  // store hooks
  const { getIsWorkflowEnabled, getAvailableProjectStateIdMap, getIsWorkItemCreationAllowedForState } =
    useProjectState();
  // derived values
  const isWorkflowEnabled = getIsWorkflowEnabled(workspaceSlug.toString(), projectId?.toString());

  /**
   * checks the state workflow permissions and makes sure the grouped state has permission to drop
   * @param sourceGroupId
   * @param destinationGroupId
   * @param sourceSubGroupId
   * @param destinationSubGroupId
   * @returns
   */
  const handleWorkFlowState = (
    sourceGroupId: string,
    destinationGroupId: string,
    sourceSubGroupId?: string,
    destinationSubGroupId?: string
  ) => {
    // check feature flag
    if (!isWorkflowEnabled) return;
    // Check for groupBy
    if (groupBy === "state") {
      if (sourceGroupId === destinationGroupId) {
        setWorkflowDisabledSource(undefined);
        return;
      }
      const availableProjectStateIdMap = getAvailableProjectStateIdMap(projectId?.toString(), sourceGroupId);
      if (!availableProjectStateIdMap[destinationGroupId]) setWorkflowDisabledSource(sourceGroupId);
      else setWorkflowDisabledSource(undefined);
      return;
    }

    // Check for Sub groupBy
    if (subGroupBy === "state" && sourceSubGroupId && destinationSubGroupId) {
      if (sourceSubGroupId === destinationSubGroupId) {
        setWorkflowDisabledSource(undefined);
        return;
      }
      const availableProjectStateIdMap = getAvailableProjectStateIdMap(projectId?.toString(), sourceSubGroupId);
      if (!availableProjectStateIdMap[destinationSubGroupId]) setWorkflowDisabledSource(sourceSubGroupId);
      else setWorkflowDisabledSource(undefined);
    }
  };

  const getIsWorkflowWorkItemCreationDisabled = (groupId: string, subGroupId?: string) => {
    // check feature flag
    if (!isWorkflowEnabled) return false;
    // Check for groupBy
    if (groupBy === "state") {
      return !getIsWorkItemCreationAllowedForState(groupId);
    }

    // Check for Sub groupBy
    if (subGroupBy === "state" && subGroupId) {
      return !getIsWorkItemCreationAllowedForState(subGroupId);
    }

    return false;
  };

  return {
    workflowDisabledSource,
    isWorkflowDropDisabled: !!workflowDisabledSource,
    getIsWorkflowWorkItemCreationDisabled,
    handleWorkFlowState,
  };
};
