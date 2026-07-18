/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { ListIcon, WaypointsIcon } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EUserProjectRoles } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { StateTransitionList } from "./state-transition-list";
import { WorkflowGraph } from "./workflow-graph";

type TProjectWorkflowsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

type TWorkflowView = "graph" | "list";

export const ProjectWorkflowsRoot = observer(function ProjectWorkflowsRoot(props: TProjectWorkflowsRootProps) {
  const { workspaceSlug, projectId } = props;
  // hooks
  const { t } = useTranslation();
  const { fetchProjectStates, fetchStateTransitions, transitionsFetchedMap, getProjectStates, updateStateTransitions } =
    useProjectState();
  const { allowPermissions } = useUserPermissions();
  // states
  const [view, setView] = useState<TWorkflowView>("graph");
  // derived values
  const isEditable = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  useSWR(
    workspaceSlug && projectId ? `PROJECT_WORKFLOW_STATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectStates(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  useSWR(
    workspaceSlug && projectId ? `PROJECT_WORKFLOW_TRANSITIONS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchStateTransitions(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const projectStates = getProjectStates(projectId);
  const isLoading = !projectStates || !transitionsFetchedMap[projectId];

  const handleResetAll = async () => {
    if (!projectStates) return;
    try {
      await updateStateTransitions(workspaceSlug, projectId, {
        transitions: Object.fromEntries(projectStates.map((state) => [state.id, []])),
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workflows.status_workflow.reset_success_title"),
        message: t("workflows.status_workflow.reset_success_message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: t("workflows.status_workflow.update_error"),
      });
    }
  };

  if (isLoading)
    return (
      <Loader className="space-y-4">
        <Loader.Item height="200px" />
        <Loader.Item height="200px" />
      </Loader>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-md bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => setView("graph")}
            className={cn(
              "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-13 text-secondary transition-colors",
              view === "graph" && "shadow-sm bg-surface-1 font-medium text-primary"
            )}
          >
            <WaypointsIcon className="h-3.5 w-3.5" />
            {t("workflows.status_workflow.view.graph")}
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-13 text-secondary transition-colors",
              view === "list" && "shadow-sm bg-surface-1 font-medium text-primary"
            )}
          >
            <ListIcon className="h-3.5 w-3.5" />
            {t("workflows.status_workflow.view.list")}
          </button>
        </div>
        {isEditable && (
          <button
            type="button"
            onClick={handleResetAll}
            className="rounded-sm px-2.5 py-1 text-13 text-secondary transition-colors hover:bg-layer-transparent-hover hover:text-primary"
          >
            {t("workflows.status_workflow.reset_all")}
          </button>
        )}
      </div>
      {view === "graph" ? (
        <WorkflowGraph workspaceSlug={workspaceSlug} projectId={projectId} isEditable={isEditable} />
      ) : (
        <StateTransitionList workspaceSlug={workspaceSlug} projectId={projectId} isEditable={isEditable} />
      )}
    </div>
  );
});
