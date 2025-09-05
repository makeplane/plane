import React, { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, MoveRight, Trash2 } from "lucide-react";
// plane imports
import { WORKFLOW_TRACKER_ELEMENTS, WORKFLOW_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ApproverIcon } from "@plane/propel/icons";
import { Collapsible, setToast, TOAST_TYPE, AlertModalCore, Button } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useProjectState } from "@/hooks/store/use-project-state";
//
import { StateTransitionApprovers } from "./state-transition-approvers";

export type StateTransitionItemProps = {
  workspaceSlug: string;
  projectId: string;
  disabled: boolean;
  parentStateId: string;
  transitionId: string;
};

export const StateTransitionItem = observer((props: StateTransitionItemProps) => {
  const { workspaceSlug, projectId, parentStateId, transitionId } = props;
  // states
  const [removingTransition, setRemovingTransition] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    changeStateTransition,
    removeStateTransition,
    getTransitionById,
    getAvailableStateTransitionIds,
    modifyStateTransitionMemberPermission,
  } = useProjectState();
  // derived state
  const stateTransition = getTransitionById(parentStateId, transitionId);
  const areApproversAvailable = stateTransition.approvers && stateTransition.approvers.length > 0;

  if (!stateTransition) return <></>;

  const availableStateTransitionIds = getAvailableStateTransitionIds(
    projectId,
    parentStateId,
    stateTransition.transition_state_id
  );

  const handleToggle = () => {
    if (!areApproversAvailable) return;
    setIsOpen((prevState) => !prevState);
  };

  const handleTransitionStateChange = async (val: string) => {
    try {
      await changeStateTransition(workspaceSlug, projectId, parentStateId, transitionId, val);
      captureSuccess({
        eventName: WORKFLOW_TRACKER_EVENTS.STATE_UPDATED,
        payload: {
          project_id: projectId,
          parent_state_id: parentStateId,
        },
      });
    } catch (error) {
      captureError({
        eventName: WORKFLOW_TRACKER_EVENTS.STATE_UPDATED,
        error: error as Error,
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workflows.toasts.modify_state_change_rule.error.title"),
        message: t("workflows.toasts.modify_state_change_rule.error.message"),
      });
    }
  };

  const handleApproversUpdate = async (memberIds: string[]) => {
    try {
      modifyStateTransitionMemberPermission(workspaceSlug, projectId, parentStateId, transitionId, memberIds);
      captureSuccess({
        eventName: WORKFLOW_TRACKER_EVENTS.APPROVERS_UPDATED,
        payload: {
          project_id: projectId,
          parent_state_id: parentStateId,
        },
      });
      if (!isOpen) setIsOpen(true);
    } catch (error) {
      captureError({
        eventName: WORKFLOW_TRACKER_EVENTS.APPROVERS_UPDATED,
        error: error as Error,
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workflows.toasts.modify_state_change_rule_movers.error.title"),
        message: t("workflows.toasts.modify_state_change_rule_movers.error.message"),
      });
    }
  };

  const removeTransitionState = async () => {
    try {
      setRemovingTransition(true);
      await removeStateTransition(workspaceSlug, projectId, parentStateId, transitionId);
      captureSuccess({
        eventName: WORKFLOW_TRACKER_EVENTS.TRANSITION_DELETED,
        payload: {
          project_id: projectId,
          parent_state_id: parentStateId,
        },
      });
    } catch (error) {
      captureError({
        eventName: WORKFLOW_TRACKER_EVENTS.TRANSITION_DELETED,
        error: error as Error,
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workflows.toasts.remove_state_change_rule.error.title"),
        message: t("workflows.toasts.remove_state_change_rule.error.message"),
      });
    } finally {
      setRemovingTransition(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="border border-custom-border-100 py-1 px-3 rounded-md">
      {/* Delete Transition Modal */}
      <AlertModalCore
        handleClose={() => setIsDeleteModalOpen(false)}
        handleSubmit={removeTransitionState}
        isSubmitting={removingTransition}
        isOpen={isDeleteModalOpen}
        title={t("workflows.confirmation_modals.delete_state_change.title")}
        content={t("workflows.confirmation_modals.delete_state_change.description")}
      />
      <Collapsible
        isOpen={isOpen}
        onToggle={handleToggle}
        className="w-full"
        buttonClassName={cn("flex w-full items-center justify-between", {
          "cursor-not-allowed": !areApproversAvailable,
        })}
        title={
          <div className="flex w-full items-center">
            <div className="flex w-full items-center justify-start gap-1 py-1">
              <span className="text-xs font-medium text-custom-text-300">
                {t("workflows.workflow_states.state_changes.move_to")}
              </span>
              <MoveRight className="size-3.5 pl-1 text-custom-text-300" strokeWidth={2} />
              <div onClick={(e) => e.stopPropagation()}>
                <StateDropdown
                  buttonVariant={"transparent-with-text"}
                  buttonClassName="h-6 font-medium"
                  projectId={projectId}
                  onChange={handleTransitionStateChange}
                  value={stateTransition.transition_state_id}
                  showDefaultState={false}
                  renderByDefault={false}
                  stateIds={availableStateTransitionIds}
                  filterAvailableStateIds={false}
                  dropdownArrowClassName="w-3.5 h-3.5"
                  dropdownArrow
                />
              </div>
              {areApproversAvailable && (
                <div className="flex gap-1 text-custom-text-400 items-center">
                  <ApproverIcon strokeWidth={2} className="flex-shrink-0 size-3.5 text-custom-text-300" />
                  <span className="text-xs font-medium">
                    <span className="hidden lg:block">
                      {t("workflows.workflow_states.movers_count", { count: stateTransition.approvers.length })}
                    </span>
                    <span className="block lg:hidden">{stateTransition.approvers.length}</span>
                  </span>
                </div>
              )}
            </div>
            <div className="flex line-clamp-1 w-full justify-end items-center">
              <div className="flex items-center gap-3">
                <div onClick={(e) => e.stopPropagation()}>
                  <MemberDropdown
                    projectId={projectId}
                    value={stateTransition?.approvers ?? []}
                    onChange={handleApproversUpdate}
                    button={
                      <Button variant="accent-primary" size="sm" className="text-xs px-2 py-0.5">
                        {t("workflows.workflow_states.state_changes.movers.add")}
                      </Button>
                    }
                    buttonVariant="background-with-text"
                    optionsClassName="z-10"
                    placement="bottom-end"
                    multiple
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Trash2
                    className="size-3 text-custom-text-400 hover:text-red-500 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteModalOpen(true);
                    }}
                    data-ph-element={WORKFLOW_TRACKER_ELEMENTS.DELETE_TRANSITION_BUTTON}
                  />
                  <ChevronDown
                    strokeWidth={2}
                    className={cn("transition-all size-4 text-custom-text-400 hover:text-custom-text-300", {
                      "rotate-180 text-custom-text-200": isOpen && areApproversAvailable,
                      "text-custom-text-400 hover:text-custom-text-400": !areApproversAvailable,
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        }
      >
        {areApproversAvailable && (
          <StateTransitionApprovers
            parentStateId={parentStateId}
            stateTransition={stateTransition}
            handleApproversUpdate={handleApproversUpdate}
          />
        )}
      </Collapsible>
    </div>
  );
});
