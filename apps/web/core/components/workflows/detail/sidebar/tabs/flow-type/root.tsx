/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Button } from "@plane/propel/button";
import type { IWorkflow, IWorkflowState, TWorkflowStateType } from "@plane/types";
import { useEffect, useState } from "react";
import { ChevronRightIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { observer } from "mobx-react";
import { FlowTypeChangeWarningModal } from "./warning-modal";
import { useWorkflows } from "@/hooks/store/use-workflows";

const FLOW_TYPE_OPTIONS: { label: string; value: TWorkflowStateType; description: string }[] = [
  {
    label: "Transition",
    value: "transition",
    description: "Define the path through which your work process, ensuring every work item follows the right steps.",
  },
  {
    label: "Approval",
    value: "approval",
    description: "Establish mandatory review points to ensure quality and compliance before work progresses.",
  },
];

type Props = {
  onNext: () => void;
  state: IWorkflowState;
  workflow: IWorkflow;
  projectId: string;
  workspaceSlug: string;
};

export const FlowTypeTabContent = observer(function FlowTypeTabContent(props: Props) {
  const { onNext, state, workflow, projectId, workspaceSlug } = props;
  const { isApprovalsEnabled } = useWorkflows();
  const approvalsEnabled = isApprovalsEnabled(workspaceSlug, projectId);
  const flowTypeOptions = approvalsEnabled
    ? FLOW_TYPE_OPTIONS
    : FLOW_TYPE_OPTIONS.filter((option) => option.value !== "approval");
  // states
  const [flowType, setFlowType] = useState<TWorkflowStateType>(state.type);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlowChangeWarningModalOpen, setFlowChangeWarningModal] = useState(false);

  useEffect(() => {
    if (!approvalsEnabled && state.type === "approval") {
      setFlowType("transition");
      return;
    }
    setFlowType(state.type);
  }, [approvalsEnabled, state.type]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (flowType !== state.type) {
        await workflow.switchMode(state.id, flowType, workspaceSlug, projectId);
      }
      onNext();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to update flow type. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (flowType === state.type) onNext();
    else setFlowChangeWarningModal(true);
  };

  const canProceed = !!flowType;
  return (
    <>
      <div className="flex flex-col gap-5">
        <p className="text-h6-medium">Flow</p>
        <div className="flex flex-col gap-2">
          {flowTypeOptions.map((option) => (
            <div
              key={option.value}
              className="flex items-start gap-1.5 px-3 py-2 border border-subtle rounded-lg cursor-pointer"
              onClick={() => setFlowType(option.value)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setFlowType(option.value);
                }
              }}
              role="button"
            >
              <input type="radio" name="flow-type" className="mt-1" checked={flowType === option.value} />
              <div className="flex flex-col gap-1">
                <p className="text-body-sm-regular">{option.label}</p>
                <p className="text-body-xs-regular text-tertiary">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleNext}
            appendIcon={<ChevronRightIcon className="size-4" />}
            disabled={!canProceed || isSubmitting}
          >
            Next
          </Button>
        </div>
      </div>
      <FlowTypeChangeWarningModal
        isOpen={isFlowChangeWarningModalOpen}
        onClose={() => setFlowChangeWarningModal(false)}
        newFlowType={flowType}
        onSubmit={() => void handleSubmit()}
        isSubmitting={isSubmitting}
      />
    </>
  );
});
