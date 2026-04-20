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

import { EIconSize } from "@plane/constants";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";
import { AccordionCloseIcon, PlusIcon, StateGroupIcon } from "@plane/propel/icons";
import { observer } from "mobx-react";
import { WorkflowStateCardActions } from "./actions";
import type { IWorkflow } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { StateFlowCardRoot } from "../flow-card/root";
import { Button } from "@plane/propel/button";
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  stateId: string;
  workspaceSlug: string;
  projectId: string;
  workflow: IWorkflow;
  canEdit: boolean;
  onRequestDelete: (stateId: string) => void;
};

export const WorkflowStateCardRoot = observer(function WorkflowStateCardRoot(props: Props) {
  const { stateId, workspaceSlug, projectId, workflow, canEdit, onRequestDelete } = props;

  // hooks
  const { getStateById } = useProjectState();
  const workflowState = workflow.getStateById(stateId);
  const state = getStateById(stateId);

  if (!workflowState || !state) return null;

  const handleToggleActive = () => {
    if (!canEdit) return;
    workflowState
      .update(workspaceSlug, projectId, workflow.id, { allow_issue_creation: !workflowState.allow_issue_creation })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Failed to update workflow state",
        });
      });
  };

  const handleDelete = () => {
    if (!canEdit) return;
    onRequestDelete(stateId);
  };

  const handleSetDefault = () => {
    workflowState.setAsDefault(workspaceSlug, projectId, workflow).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to update workflow default state",
      });
    });
  };

  const handleAddFlow = () => {
    if (!canEdit) return;
    const draftId = workflowState.addDraftTransition();
    workflow.openSidebar(workflowState.id, draftId, "flow_type");
  };

  const allTransitionIds = [...workflowState.persistedTransitionIds, ...workflowState.draftTransitionIds];
  const canAddFlow =
    workflowState.type === "transition" || (workflowState.type === "approval" && allTransitionIds.length === 0);

  return (
    <Collapsible className="rounded-lg border border-subtle">
      <CollapsibleTrigger className="w-full group justify-between p-3">
        <div className="flex items-center gap-2 w-full rounded-lg">
          <AccordionCloseIcon className="size-4 transition-all ease-out group-data-panel-open:rotate-90" />
          <div className="flex items-center gap-2">
            <StateGroupIcon stateGroup={state.group} color={state.color} size={EIconSize.LG} percentage={state.order} />
            <p className="text-body-sm-medium">{state.name}</p>
          </div>
        </div>
        <WorkflowStateCardActions
          handleDelete={handleDelete}
          handleToggle={handleToggleActive}
          handleSetDefault={handleSetDefault}
          workflowState={workflowState}
          permissions={{
            canAllowCreation: canEdit,
            canDelete: canEdit,
          }}
          isDefaultWorkflow={workflow.is_default}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-layer-1 p-3 flex flex-col items-start gap-2">
          {allTransitionIds.length === 0 ? (
            canEdit &&
            canAddFlow && (
              <Button variant="ghost" size="sm" onClick={handleAddFlow}>
                <PlusIcon />
                <span>Add flow</span>
              </Button>
            )
          ) : (
            <>
              {allTransitionIds.map((transitionId) => {
                const transition = workflowState.getTransitionById(transitionId);
                if (!transition) return null;
                const mode = transition.isDraft ? "create" : workflow.isEditing(transitionId) ? "edit" : "view";
                return (
                  <StateFlowCardRoot
                    key={transitionId}
                    workflow={workflow}
                    state={state}
                    workflowState={workflowState}
                    transition={transition}
                    mode={mode}
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                  />
                );
              })}
              {canEdit && canAddFlow && (
                <Button variant="ghost" size="sm" onClick={handleAddFlow}>
                  <PlusIcon />
                  <span>Add flow</span>
                </Button>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
