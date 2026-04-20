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
import { observer } from "mobx-react";
import { useNavigate } from "react-router";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast, setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IWorkflow } from "@plane/types";
import { WorkflowChangeHistoryDrawer } from "@/components/workflows/change-history/drawer";
import { useWorkflows } from "@/hooks/store/use-workflows";
import { CreateUpdateWorkflowModal } from "../create-update-workflow-modal";
import { WorkflowCardFooter } from "./footer";
import { WorkflowActions } from "./quick-actions";

type Props = {
  workflow: IWorkflow;
  workspaceSlug: string;
  projectId: string;
};

export const WorkFlowCard = observer(function WorkflowCard(props: Props) {
  // props
  const { workflow, workspaceSlug, projectId } = props;
  //states
  const [isUpdateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [isChangeHistoryOpen, setChangeHistoryOpen] = useState<boolean>(false);
  // hooks
  const { t } = useTranslation();
  const { deleteWorkflow } = useWorkflows();
  const navigate = useNavigate();
  const { canEdit, canDelete } = workflow.permissions;
  const hasNoStates = workflow.stateIds.length === 0;
  const hasNoWorkItemTypes = !workflow.is_default && workflow.work_item_type_ids.length === 0;
  const isActivationDisabled = !workflow.is_active && (hasNoStates || hasNoWorkItemTypes);
  const activationTooltipContent = hasNoStates
    ? hasNoWorkItemTypes
      ? t("project_settings.workflows.toggle.no_states_or_work_item_types_tooltip")
      : t("project_settings.workflows.toggle.no_states_tooltip")
    : hasNoWorkItemTypes
      ? t("project_settings.workflows.toggle.no_work_item_types_tooltip")
      : undefined;

  // handlers
  const handleToggle = (isEnabled: boolean) => {
    if (!canEdit) return;
    workflow
      .update(workspaceSlug, projectId, { is_active: isEnabled })
      .then(() => {
        return;
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("project_settings.workflows.update.error.title"),
          message: t("project_settings.workflows.update.error.message"),
        });
      });
  };

  const handleDelete = () => {
    if (!canDelete) return;
    const toastPromise = deleteWorkflow(workspaceSlug, projectId, workflow.id);
    setPromiseToast(toastPromise, {
      loading: t("project_settings.workflows.delete.loading"),
      success: {
        title: t("project_settings.workflows.delete.success.title"),
        message: () => t("project_settings.workflows.delete.success.message"),
      },
      error: {
        title: t("project_settings.workflows.delete.error.title"),
        message: () => t("project_settings.workflows.delete.error.message"),
      },
    });
  };

  return (
    <>
      <div
        className="border border-subtle rounded-lg cursor-pointer"
        onClick={() => {
          void navigate(`/${workspaceSlug}/settings/projects/${projectId}/workflows/${workflow.id}`);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            void navigate(`/${workspaceSlug}/settings/projects/${projectId}/workflows/${workflow.id}`);
          }
        }}
      >
        <div className="py-3 px-4">
          <div className="flex justify-between gap-3 items-center">
            <div className="flex flex-col gap-1 truncate">
              <p className="text-body-sm-medium">{workflow.name}</p>
              <p className="text-caption-md-regular text-tertiary truncate">{workflow.description}</p>
            </div>
            <WorkflowActions
              isEnabled={workflow.is_active}
              isActivationDisabled={isActivationDisabled}
              activationTooltipContent={activationTooltipContent}
              hasMissingStates={workflow.missing_states ?? false}
              isDefault={workflow.is_default}
              onToggle={handleToggle}
              handleEdit={() => setUpdateModalOpen(true)}
              handleViewChangeHistory={() => setChangeHistoryOpen(true)}
              handleDelete={handleDelete}
              permissions={{
                canEdit: canEdit,
                canDelete: canDelete,
              }}
            />
          </div>
        </div>
        {(workflow.is_default || workflow.work_item_type_ids.length > 0) && (
          <WorkflowCardFooter isDefault={workflow.is_default} workItemTypeIds={workflow.work_item_type_ids} />
        )}
      </div>
      {/* Update modal */}
      {isUpdateModalOpen && (
        <CreateUpdateWorkflowModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          isOpen={isUpdateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          workflow={workflow}
          canCreate={false}
        />
      )}

      <WorkflowChangeHistoryDrawer
        isOpen={isChangeHistoryOpen}
        workspaceSlug={workspaceSlug}
        workflow={workflow}
        onClose={() => setChangeHistoryOpen(false)}
      />
    </>
  );
});
