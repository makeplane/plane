/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflow } from "@/hooks/store/use-workflow";
// local imports
import type { TWorkItemStateDropdownBaseProps } from "./base";
import { WorkItemStateDropdownBase } from "./base";

type TWorkItemStateDropdownProps = Omit<
  TWorkItemStateDropdownBaseProps,
  "stateIds" | "getStateById" | "onDropdownOpen" | "isInitializing"
> & {
  stateIds?: string[];
};

export const StateDropdown = observer(function StateDropdown(props: TWorkItemStateDropdownProps) {
  const { projectId, stateIds: propsStateIds, issueId, filterAvailableStateIds } = props;
  const { workspaceSlug } = useParams();
  const [stateLoader, setStateLoader] = useState(false);
  const { fetchProjectStates, getProjectStateIds, getStateById } = useProjectState();
  const workflowStore = useWorkflow();
  // derived values
  const stateIds = propsStateIds ?? getProjectStateIds(projectId);

  // fetch states if not provided
  const onDropdownOpen = async () => {
    if (!workspaceSlug || !projectId) return;

    setStateLoader(true);
    try {
      if (stateIds === undefined || stateIds.length === 0) {
        await fetchProjectStates(workspaceSlug.toString(), projectId);
      }
      if (filterAvailableStateIds && workflowStore.isWorkflowEnabledForProject(projectId)) {
        if (!workflowStore.fetchedMap[projectId]) {
          await workflowStore.fetchProjectWorkflowStates(workspaceSlug.toString(), projectId);
        }
        if (issueId) {
          await workflowStore.fetchIssueWorkflowStatus(workspaceSlug.toString(), projectId, issueId);
        }
      }
    } finally {
      setStateLoader(false);
    }
  };

  return (
    <WorkItemStateDropdownBase
      {...props}
      getStateById={getStateById}
      isInitializing={stateLoader}
      stateIds={stateIds ?? []}
      onDropdownOpen={onDropdownOpen}
    />
  );
});
