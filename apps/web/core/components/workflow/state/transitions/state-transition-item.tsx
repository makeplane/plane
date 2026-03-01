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
import { MoveRight } from "lucide-react";
import { TrashIcon, ApproverIcon, ChevronDownIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { AlertModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
// hooks
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

export const StateTransitionItem = observer(function StateTransitionItem(props: StateTransitionItemProps) {
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
    } catch (_error) {
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
      if (!isOpen) setIsOpen(true);
    } catch (_error) {
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
    } catch (_error) {
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
    <div className="border border-subtle py-1 px-3 rounded-md">
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
        open={isOpen}
        onOpenChange={(open) => {
          if (open !== isOpen) {
            handleToggle();
          }
        }}
        className="w-full"
      >
        <CollapsibleTrigger
          className={cn("flex w-full items-center justify-between", {
            "cursor-not-allowed": !areApproversAvailable,
          })}
        >
          <div className="flex w-full items-center">
            <div className="flex w-full items-center justify-start gap-1 py-1">
              <span className="text-11 font-medium text-tertiary">
                {t("workflows.workflow_states.state_changes.move_to")}
              </span>
              <MoveRight className="size-3.5 pl-1 text-tertiary" strokeWidth={2} />
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
                <div className="flex gap-1 text-placeholder items-center">
                  <ApproverIcon strokeWidth={2} className="flex-shrink-0 size-3.5 text-tertiary" />
                  <span className="text-11 font-medium">
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
                      <Button variant="secondary" className="text-11 px-2 py-0.5">
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
                  <TrashIcon
                    className="size-3 text-placeholder hover:text-danger-primary cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteModalOpen(true);
                    }}
                  />
                  <ChevronDownIcon
                    strokeWidth={2}
                    className={cn("transition-all size-4 text-placeholder hover:text-tertiary", {
                      "rotate-180 text-secondary": isOpen && areApproversAvailable,
                      "text-placeholder hover:text-placeholder": !areApproversAvailable,
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {areApproversAvailable && (
            <StateTransitionApprovers
              parentStateId={parentStateId}
              stateTransition={stateTransition}
              handleApproversUpdate={handleApproversUpdate}
            />
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});
