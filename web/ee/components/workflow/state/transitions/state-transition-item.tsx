import React, { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, MoveRight, Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Collapsible, setToast, TOAST_TYPE, ApproverIcon, AlertModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { StateDropdown } from "@/components/dropdowns";
// hooks
import { useProjectState } from "@/hooks/store";
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
  const { changeStateTransition, removeStateTransition, getTransitionById, getAvailableStateTransitionIds } =
    useProjectState();
  // derived state
  const stateTransition = getTransitionById(parentStateId, transitionId);

  if (!stateTransition) return <></>;

  const availableStateTransitionIds = getAvailableStateTransitionIds(
    projectId,
    parentStateId,
    stateTransition.transition_state_id
  );

  const handleTransitionStateChange = async (val: string) => {
    try {
      await changeStateTransition(workspaceSlug, projectId, parentStateId, transitionId, val);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workflows.toasts.modify_state_change_rule.error.title"),
        message: t("workflows.toasts.modify_state_change_rule.error.message"),
      });
    }
  };

  const removeTransitionState = async () => {
    try {
      setRemovingTransition(true);
      await removeStateTransition(workspaceSlug, projectId, parentStateId, transitionId);
    } catch {
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
        onToggle={() => setIsOpen((prevState) => !prevState)}
        className="w-full"
        buttonClassName="flex w-full items-center justify-between"
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
              {stateTransition.approvers && stateTransition.approvers.length > 0 && (
                <div className="flex gap-1 text-custom-text-400 items-center">
                  <ApproverIcon strokeWidth={0.1} className="size-3.5 text-custom-text-300" />
                  <span className="text-xs font-medium">
                    {t("workflows.workflow_states.movers_count", { count: stateTransition.approvers.length })}
                  </span>
                </div>
              )}
            </div>
            <div className="flex line-clamp-1 w-full justify-end items-center">
              <div className="flex items-center gap-1.5">
                <Trash2
                  className="size-3 text-custom-text-400 hover:text-red-500 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteModalOpen(true);
                  }}
                />
                <ChevronDown
                  strokeWidth={2}
                  className={cn("transition-all size-4 text-custom-text-400 hover:text-custom-text-300", {
                    "rotate-180 text-custom-text-200": isOpen,
                  })}
                />
              </div>
            </div>
          </div>
        }
      >
        <StateTransitionApprovers
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          parentStateId={parentStateId}
          transitionId={transitionId}
          stateTransition={stateTransition}
        />
      </Collapsible>
    </div>
  );
});
