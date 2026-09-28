/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TWorkflowCreatePayload } from "@plane/types";
// components
import { WorkflowDetail, WorkflowList } from "@/components/project-workflows";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkflow } from "@/hooks/store/use-workflow";
// helpers
import { getWorkflowErrorMessage } from "@/utils/workflow-error";

type TProjectWorkflowRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectWorkflowRoot = observer(function ProjectWorkflowRoot(props: TProjectWorkflowRootProps) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  // hooks
  const { allowPermissions } = useUserPermissions();
  const { fetchProjectStates } = useProjectState();
  const workflowStore = useWorkflow();

  // §18.1 — every admin write is ADMIN-only.
  const isEditable = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  useSWR(
    workspaceSlug && projectId ? `PROJECT_STATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectStates(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  useSWR(
    workspaceSlug && projectId ? `PROJECT_WORKFLOWS_${workspaceSlug}_${projectId}` : null,
    async () => {
      await workflowStore.fetchProjectWorkflows(workspaceSlug, projectId);
      await workflowStore.fetchTypeAssignments(workspaceSlug, projectId);
      return true;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      onError: (error: unknown) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error"),
          message: getWorkflowErrorMessage(error, t("project_settings.workflows.errors.load_failed")),
        });
      },
    }
  );

  // The nested revision tree is only in the detail payload; load it on demand
  // rather than fetching every workflow up front.
  const handleSelect = async (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    try {
      await workflowStore.fetchWorkflowDetail(workspaceSlug, projectId, workflowId);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error"),
        message: getWorkflowErrorMessage(error, t("project_settings.workflows.errors.load_failed")),
      });
    }
  };

  const handleCreate = async (data: TWorkflowCreatePayload) =>
    workflowStore.createWorkflow(workspaceSlug, projectId, data);

  const handleUpdate = async (workflowId: string, data: TWorkflowCreatePayload) =>
    workflowStore.updateWorkflow(workspaceSlug, projectId, workflowId, data);

  const handleToggleActive = async (workflowId: string, nextValue: boolean) => {
    try {
      await workflowStore.updateWorkflow(workspaceSlug, projectId, workflowId, { is_active: nextValue });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("project_settings.workflows.list.toggle_success"),
        message: nextValue ? t("project_settings.workflows.list.enable") : t("project_settings.workflows.list.disable"),
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error"),
        message: getWorkflowErrorMessage(error, t("project_settings.workflows.list.toggle_error")),
      });
      throw error;
    }
  };

  const handleDelete = (workflowId: string) => workflowStore.deleteWorkflow(workspaceSlug, projectId, workflowId);

  const selectedWorkflow = selectedWorkflowId ? workflowStore.getWorkflowById(selectedWorkflowId) : undefined;
  const isLoading = !workflowStore.fetchedMap[projectId];

  return (
    <div className="flex h-full flex-col gap-6">
      <WorkflowList
        workflows={workflowStore.projectWorkflows}
        typeAssignments={workflowStore.getTypeAssignmentsByProjectId(projectId)}
        isLoading={isLoading}
        isEditable={isEditable}
        selectedWorkflowId={selectedWorkflowId}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        onSelect={(workflowId) => void handleSelect(workflowId)}
      />

      {selectedWorkflow && (
        <div className="rounded-md border border-subtle p-4">
          <WorkflowDetail
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            workflow={selectedWorkflow}
            typeAssignments={workflowStore.getTypeAssignmentsByProjectId(projectId)}
            isEditable={isEditable}
          />
        </div>
      )}
    </div>
  );
});
