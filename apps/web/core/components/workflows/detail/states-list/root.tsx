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

import { observer } from "mobx-react";
import { useMemo, useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IWorkflow } from "@plane/types";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import { SelectWorkflowStatesModal } from "./select-states-modal";
import { WorkflowStateCardRoot } from "./state-card/root";
import { DependencyAlertModal } from "./delete-state/dependency-alert-modal";
import { TransferModal } from "./delete-state/transfer-modal";

type Props = {
  workspaceSlug: string;
  projectId: string;
  workflow: IWorkflow;
  canEdit: boolean;
};

export const WorkflowStatesListRoot = observer(function WorkflowStatesListRoot(props: Props) {
  // props
  const { workspaceSlug, projectId, workflow, canEdit } = props;
  // states
  const [isSelectStatesModalOpen, setSelectStatesModal] = useState(false);
  const [deleteTargetStateId, setDeleteTargetStateId] = useState<string | null>(null);
  // store hooks
  const { getProjectStateIds, getStateById } = useProjectState();

  // hooks
  const { t } = useTranslation();

  // handlers
  const handleAddStates = async (stateIds: string[]) => {
    if (!canEdit) return;
    await workflow
      .addStates(workspaceSlug, projectId, {
        state_ids: stateIds,
      })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("project_settings.workflows.add_states.success.title"),
          message: t("project_settings.workflows.add_states.success.message"),
        });
        return;
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("project_settings.workflows.add_states.error.title"),
          message: t("project_settings.workflows.add_states.error.message"),
        });
      });
  };

  // derived values
  const projectStateIds = getProjectStateIds(projectId);
  const isDefaultWorkflow = workflow.is_default;
  const deleteTargetDependencies = useMemo(
    () => (deleteTargetStateId ? workflow.getStateDependencies(deleteTargetStateId) : null),
    [deleteTargetStateId, workflow]
  );
  const hasDependencies = deleteTargetDependencies
    ? deleteTargetDependencies.transitionCount > 0 || deleteTargetDependencies.approvalCount > 0
    : false;
  const deleteTargetStateName = deleteTargetStateId ? (getStateById(deleteTargetStateId)?.name ?? "") : "";

  if (!projectStateIds) return null;

  const orderedWorkflowStateIds = projectStateIds.filter((stateId) => workflow.stateIds.includes(stateId));

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <p className="text-body-md-medium">{t("project_settings.workflows.detail.define")}</p>
          </div>
          {canEdit && !isDefaultWorkflow && (
            <Button variant="secondary" onClick={() => setSelectStatesModal(true)}>
              {t("project_settings.workflows.detail.add_states")}
            </Button>
          )}
        </div>
        {workflow.stateIds.length === 0 ? (
          <div className="mt-20">
            <EmptyStateCompact
              assetKey="state"
              title={t("settings_empty_state.workflows.states.title")}
              description={t("settings_empty_state.workflows.states.description")}
              align="start"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orderedWorkflowStateIds.map((stateId) => (
              <WorkflowStateCardRoot
                key={stateId}
                stateId={stateId}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                workflow={workflow}
                canEdit={canEdit}
                onRequestDelete={setDeleteTargetStateId}
              />
            ))}
          </div>
        )}
      </div>
      <SelectWorkflowStatesModal
        isOpen={isSelectStatesModalOpen}
        onClose={() => setSelectStatesModal(false)}
        handleSubmit={handleAddStates}
        existingStateIds={workflow.stateIds}
      />
      {deleteTargetStateId && hasDependencies && deleteTargetDependencies && (
        <DependencyAlertModal
          isOpen
          onClose={() => setDeleteTargetStateId(null)}
          stateName={deleteTargetStateName}
          transitionCount={deleteTargetDependencies.transitionCount}
          approvalCount={deleteTargetDependencies.approvalCount}
        />
      )}
      {deleteTargetStateId && !hasDependencies && (
        <TransferModal
          isOpen
          onClose={() => setDeleteTargetStateId(null)}
          stateName={deleteTargetStateName}
          stateId={deleteTargetStateId}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          workflow={workflow}
        />
      )}
    </>
  );
});
