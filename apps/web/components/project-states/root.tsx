/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { EUserPermissionsLevel } from "@plane/constants";
import { setToast } from "@plane/blocks/toast";
import type { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
import { EUserProjectRoles } from "@plane/types";
import { getOrderedStateGroupKeys } from "@plane/utils";
import { ProjectStateLoader, GroupList } from "@/components/project-states";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";

type TProjectState = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectStateRoot = observer(function ProjectStateRoot(props: TProjectState) {
  const { workspaceSlug, projectId } = props;
  // hooks
  const {
    groupedProjectStates,
    projectClosedState,
    fetchProjectStates,
    createState,
    moveStatePosition,
    updateState,
    deleteState,
    markStateAsDefault,
  } = useProjectState();
  const { allowPermissions } = useUserPermissions();
  const { getProjectById, updateProject } = useProject();
  // derived values
  const isEditable = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  // Fetching all project states
  useSWR(
    workspaceSlug && projectId ? `PROJECT_STATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectStates(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // State operations callbacks
  const stateOperationsCallbacks: TStateOperationsCallbacks = useMemo(
    () => ({
      createState: async (data: Partial<IState>) => createState(workspaceSlug, projectId, data),
      updateState: async (stateId: string, data: Partial<IState>) =>
        updateState(workspaceSlug, projectId, stateId, data),
      deleteState: async (stateId: string) => deleteState(workspaceSlug, projectId, stateId),
      moveStatePosition: async (stateId: string, data: Partial<IState>) =>
        moveStatePosition(workspaceSlug, projectId, stateId, data),
      markStateAsDefault: async (stateId: string) => markStateAsDefault(workspaceSlug, projectId, stateId),
    }),
    [workspaceSlug, projectId, createState, moveStatePosition, updateState, deleteState, markStateAsDefault]
  );

  // d2m-plane: reorder state groups (saved per project, applies to everyone)
  const currentGroupOrder = getProjectById(projectId)?.state_group_order;
  const handleGroupDrop = useCallback(
    (sourceGroupKey: TStateGroups, targetGroupKey: TStateGroups, edge: "top" | "bottom") => {
      if (sourceGroupKey === targetGroupKey) return;
      const nextOrder = getOrderedStateGroupKeys(currentGroupOrder).filter((key) => key !== sourceGroupKey);
      const targetIndex = nextOrder.indexOf(targetGroupKey);
      if (targetIndex === -1) return;
      nextOrder.splice(edge === "bottom" ? targetIndex + 1 : targetIndex, 0, sourceGroupKey);
      updateProject(workspaceSlug, projectId, { state_group_order: nextOrder }).catch(() => {
        setToast({
          type: "error",
          title: "Error!",
          message: "State group order could not be saved. Please try again.",
        });
      });
    },
    [currentGroupOrder, updateProject, workspaceSlug, projectId]
  );

  // Loader
  if (!groupedProjectStates) return <ProjectStateLoader />;

  return (
    <GroupList
      groupedStates={groupedProjectStates}
      stateOperationsCallbacks={stateOperationsCallbacks}
      isEditable={isEditable}
      handleGroupDrop={handleGroupDrop}
      closedState={projectClosedState}
    />
  );
});
