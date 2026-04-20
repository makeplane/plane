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

import { useCallback, useMemo, useState } from "react";
import {
  MembersPropertyIcon,
  StateGroupIcon,
  StatePropertyIcon,
  WorkflowIcon,
  TrashIcon,
  EditIcon,
} from "@plane/propel/icons";
import type { IState, IWorkflow, IWorkflowState, IWorkflowTransition } from "@plane/types";
import { StateFlowPropertyButton } from "./property-button";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useMember } from "@/hooks/store/use-member";
import { EIconSize } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { Menu } from "@plane/propel/menu";
import { observer } from "mobx-react";
import { setPromiseToast, setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Avatar, AvatarGroup } from "@plane/propel/avatar";
import {
  canSaveTransition,
  getFlowProgress,
  isStateSelectionComplete,
  shouldShowProgress,
  getFileURL,
} from "@plane/utils";
import { PropertyDisplay } from "./property-display";
import { ScriptButton } from "./script-button";

type Props = {
  workflow: IWorkflow;
  state: IState;
  transition: IWorkflowTransition;
  workflowState: IWorkflowState;
  mode: "view" | "edit" | "create";
  workspaceSlug: string;
  projectId: string;
};

export const StateFlowCardRoot = observer(function StateFlowCardRoot(props: Props) {
  // props
  const { workflow, state, transition, workflowState, mode, workspaceSlug, projectId } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  // hooks
  const { getStateById } = useProjectState();
  const { getUserDetails } = useMember();
  // derived values
  const stateType = workflowState.type;
  const canEditWorkflow = workflow.permissions.canEdit;
  const isInteractive = mode !== "view";
  const activeTab = useMemo(
    () =>
      workflow.activeSidebarTransitionId === transition.id ? (workflowState.sidebarHelper.selectedTab ?? null) : null,
    [workflow.activeSidebarTransitionId, transition.id, workflowState.sidebarHelper.selectedTab]
  );

  // Opens the sidebar for the selected configuration tab of this transition.
  const handleOpenSidebar = useCallback(
    (tab: "flow_type" | "states" | "members" | "conditions") => {
      if (!canEditWorkflow) return;
      workflow.openSidebar(state.id, transition.id, tab);
    },
    [canEditWorkflow, workflow, state.id, transition.id]
  );

  const showMoveTo = !!stateType;
  const hasTransitionState = !!transition.transition_state_id;
  const hasRejectionState = !!transition.rejection_state_id;
  const hasMembers = (transition.member_ids?.length ?? 0) > 0;
  const hasStateSelection = isStateSelectionComplete(stateType, hasTransitionState, hasRejectionState);
  const showMembers = hasStateSelection;

  const progress = useMemo(
    () => getFlowProgress(stateType, hasStateSelection, hasMembers),
    [stateType, hasStateSelection, hasMembers]
  );
  const showProgress = shouldShowProgress(mode, progress);

  const isValid = transition.isValid ?? false;
  const canSave = useMemo(
    () => canSaveTransition(mode, isValid, transition.hasUnsavedChanges),
    [mode, isValid, transition.hasUnsavedChanges]
  );

  // Persists transition changes (create draft -> save, or update existing transition).
  const handleSave = useCallback(async () => {
    if (!transition || !workflowState) return;
    if (!canEditWorkflow) return;
    setIsSubmitting(true);
    if (transition.isDraft) {
      try {
        await workflowState.addTransition(
          workspaceSlug,
          projectId,
          workflow.id,
          {
            transition_state_id: transition.transition_state_id,
            rejection_state_id: transition.rejection_state_id,
            member_ids: transition.member_ids,
            pre_rules: transition.pre_rules ?? [],
            post_rules: transition.post_rules ?? [],
          },
          transition.id
        );
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "Flow added successfully",
        });
      } catch {
        setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: "Failed to add flow" });
      }
    } else {
      const toastPromise = (async () => {
        await transition.update(workspaceSlug, projectId, workflow.id);
        workflow.stopEditing(transition.id);
        workflow.closeSidebar();
      })();
      setPromiseToast(toastPromise, {
        loading: "Saving",
        success: { title: "Success", message: () => "Flow updated" },
        error: { title: "Error", message: () => "Failed to update flow" },
      });
    }
    setIsSubmitting(false);
  }, [canEditWorkflow, projectId, transition, workflow, workflowState, workspaceSlug]);

  // Reverts local edits for an existing transition and exits edit mode.
  const handleDiscard = useCallback(() => {
    if (!transition) return;
    if (!canEditWorkflow) return;
    transition.revertToSnapshot();
    workflow.stopEditing(transition.id);
    workflow.closeSidebar();
  }, [canEditWorkflow, transition, workflow]);

  // Cancels creation mode by removing the draft transition.
  const handleCancel = useCallback(() => {
    if (!workflowState) return;
    if (!canEditWorkflow) return;
    workflowState.removeDraftTransition(transition.id);
    if (workflow.activeSidebarTransitionId === transition.id) {
      workflow.closeSidebar();
    }
  }, [canEditWorkflow, transition.id, workflow, workflowState]);

  // Deletes the transition (draft/local delete or persisted/API delete).
  const handleDelete = useCallback(() => {
    if (!transition || !workflowState) return;
    if (!canEditWorkflow) return;
    if (transition.isDraft) {
      handleCancel();
      return;
    }
    const toastPromise = workflowState.deleteTransition(workspaceSlug, projectId, workflow.id, transition.id);
    setPromiseToast(toastPromise, {
      loading: "Deleting...",
      success: { title: "Success", message: () => "Flow deleted" },
      error: { title: "Error", message: () => "Failed to delete flow" },
    });
    if (workflow.activeSidebarTransitionId === transition.id) {
      workflow.closeSidebar();
    }
  }, [canEditWorkflow, handleCancel, projectId, transition, workflow, workflowState, workspaceSlug]);

  // Switches the current transition card into edit mode.
  const handleEdit = useCallback(() => {
    if (!canEditWorkflow) return;
    workflow.startEditing(transition.id);
    workflow.openSidebar(state.id, transition.id, "flow_type");
  }, [canEditWorkflow, state.id, transition.id, workflow]);

  if (!state || !workflowState || !transition) return null;

  // Read-only property block used in view mode.

  // Renders the flow type property ("via") for interactive/view states.
  const renderVia = () =>
    isInteractive ? (
      <StateFlowPropertyButton
        icon={<WorkflowIcon className="size-4" />}
        label="via"
        placeholder="Select flow"
        onClick={() => handleOpenSidebar("flow_type")}
        isActiveTab={activeTab === "flow_type"}
        value={<span className="text-body-sm-regular capitalize">{stateType}</span>}
      />
    ) : (
      <PropertyDisplay label="via" icon={<WorkflowIcon className="size-4" />}>
        <span className="text-body-sm-regular capitalize">{stateType}</span>
      </PropertyDisplay>
    );

  // Renders destination state selection for transition/approval flows.
  const renderMoveTo = () => {
    const targetState = getStateById(transition.transition_state_id);
    const stateIcon = (s: ReturnType<typeof getStateById> | null) =>
      s ? (
        <StateGroupIcon stateGroup={s.group} color={s.color} size={EIconSize.LG} percentage={s.order} />
      ) : (
        <StatePropertyIcon className="size-4" />
      );
    if (stateType === "transition") {
      return isInteractive ? (
        <StateFlowPropertyButton
          icon={stateIcon(targetState)}
          label="move to"
          placeholder="Select state"
          onClick={() => handleOpenSidebar("states")}
          isActiveTab={activeTab === "states"}
          value={targetState ? <p className="text-body-sm-regular">{targetState.name}</p> : null}
        />
      ) : (
        <PropertyDisplay label="move to" icon={stateIcon(targetState)}>
          <p className="text-body-sm-regular">{targetState?.name ?? "—"}</p>
        </PropertyDisplay>
      );
    }
    const approveState = getStateById(transition.transition_state_id);
    const rejectState = transition.rejection_state_id ? getStateById(transition.rejection_state_id) : null;
    if (isInteractive) {
      return (
        <div className="flex flex-col gap-1">
          <StateFlowPropertyButton
            icon={stateIcon(approveState)}
            label="on approve, move to"
            placeholder="Select state"
            onClick={() => handleOpenSidebar("states")}
            isActiveTab={activeTab === "states"}
            value={approveState ? <p className="text-body-sm-regular">{approveState.name}</p> : null}
          />
          <StateFlowPropertyButton
            icon={stateIcon(rejectState)}
            label="on reject, move to"
            placeholder="Select state"
            onClick={() => handleOpenSidebar("states")}
            isActiveTab={activeTab === "states"}
            value={rejectState ? <p className="text-body-sm-regular">{rejectState.name}</p> : null}
          />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1">
        <PropertyDisplay label="on approve, move to" icon={stateIcon(approveState)}>
          <p className="text-body-sm-regular">{approveState?.name ?? "—"}</p>
        </PropertyDisplay>
        <PropertyDisplay label="on reject, move to" icon={stateIcon(rejectState)}>
          <p className="text-body-sm-regular">{rejectState?.name ?? "—"}</p>
        </PropertyDisplay>
      </div>
    );
  };

  // Renders approver/member selection with avatar preview.
  const renderMembers = () => {
    const avatars =
      transition.member_ids.length === 0 ? null : (
        <AvatarGroup max={3} size="sm" showTooltip={false}>
          {transition.member_ids.map((memberId) => {
            const member = getUserDetails(memberId);
            return member ? (
              <Avatar
                key={memberId}
                size="sm"
                name={member.display_name}
                src={getFileURL(member.avatar_url)}
                showTooltip={false}
              />
            ) : null;
          })}
        </AvatarGroup>
      );
    const valueContent =
      transition.member_ids.length > 0 ? avatars : <span className="text-body-sm-regular text-placeholder">All</span>;
    return isInteractive ? (
      <StateFlowPropertyButton
        icon={<MembersPropertyIcon className="size-4" />}
        label="by"
        placeholder="All"
        onClick={() => handleOpenSidebar("members")}
        isActiveTab={activeTab === "members"}
        value={avatars}
      />
    ) : (
      <PropertyDisplay label="by" icon={<MembersPropertyIcon className="size-4" />}>
        {valueContent}
      </PropertyDisplay>
    );
  };

  return (
    <div className="w-full p-3 bg-layer-2 rounded-lg flex flex-col gap-2 group relative transition-all duration-300">
      <div className=" items-start grid grid-cols-4 gap-2 relative">
        <div>{renderVia()}</div>
        <div>{showMoveTo && renderMoveTo()}</div>
        <div>{showMembers && renderMembers()}</div>

        {showMembers && (
          <ScriptButton
            workspaceSlug={workspaceSlug}
            transition={transition}
            isInteractive={isInteractive}
            activeTab={activeTab}
            handleOpenSidebar={handleOpenSidebar}
          />
        )}
        {mode === "view" && canEditWorkflow && (
          <div className="ml-auto absolute right-0 top-0">
            <Menu ellipsis>
              <Menu.MenuItem className="flex items-center gap-2" onClick={handleEdit}>
                <EditIcon className="size-3" />
                <span>Edit</span>
              </Menu.MenuItem>
              <Menu.MenuItem className="flex items-center gap-2 text-danger-primary" onClick={handleDelete}>
                <TrashIcon className="size-3" />
                <span>Delete</span>
              </Menu.MenuItem>
            </Menu>
          </div>
        )}
      </div>
      {showProgress && (
        <div className="w-full h-1 bg-layer-1 rounded-full overflow-hidden">
          <div className="h-full bg-accent-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {(mode === "edit" || mode === "create") && (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={mode === "create" ? handleCancel : handleDiscard}>
            {mode === "create" ? "Cancel" : "Discard"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSave()}
            disabled={!canSave}
            loading={isSubmitting}
          >
            Save
          </Button>
        </div>
      )}
    </div>
  );
});
