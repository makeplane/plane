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
import { ChevronRightIcon } from "@plane/propel/icons";
import type { IWorkflow, IWorkflowState, IWorkflowTransition } from "@plane/types";
import { ApprovalStateSelection } from "./approval-selection";
import { TransitionStateSelection } from "./transition-selection";
import { useState } from "react";
import { observer } from "mobx-react";

type Props = {
  workflow: IWorkflow;
  state: IWorkflowState;
  transition: IWorkflowTransition;
  onNext: () => void;
};

export const StatesTabContent = observer(function StatesTabContent(props: Props) {
  const { workflow, state, transition, onNext } = props;
  const isStateInWorkflow = (stateId: string | undefined) => !!stateId && workflow.stateIds.includes(stateId);

  const [selectedTransitionStateId, setSelectedTransitionStateId] = useState<string | undefined>(
    isStateInWorkflow(transition.transition_state_id) ? transition.transition_state_id : undefined
  );
  const [selectedRejectionStateId, setSelectedRejectionStateId] = useState<string | undefined>(
    isStateInWorkflow(transition.rejection_state_id) ? transition.rejection_state_id : undefined
  );

  // Applies staged state selections to transition, then advances sidebar step.
  const handleNext = () => {
    transition.mutate({
      transition_state_id: selectedTransitionStateId ?? "",
      rejection_state_id: state.type === "approval" ? selectedRejectionStateId : undefined,
    });
    onNext();
  };

  const canProceed =
    state.type === "approval" ? !!selectedTransitionStateId && !!selectedRejectionStateId : !!selectedTransitionStateId;

  const occupedStateIds = state.getOccupiedStateIds(transition.id);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-h6-medium">States</p>
      {state.type === "approval" ? (
        <ApprovalStateSelection
          availableStateIds={workflow.stateIds}
          selectedApproveStateId={selectedTransitionStateId}
          selectedRejectStateId={selectedRejectionStateId}
          onApproveChange={(stateId) => setSelectedTransitionStateId(stateId)}
          onRejectChange={(stateId) => setSelectedRejectionStateId(stateId)}
          currentStateId={state.id}
        />
      ) : (
        <TransitionStateSelection
          availableStateIds={workflow.stateIds}
          selectedStateId={selectedTransitionStateId}
          onChange={(stateId) => setSelectedTransitionStateId(stateId)}
          currentStateId={state.id}
          occupiedStateIds={occupedStateIds}
        />
      )}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleNext}
          appendIcon={<ChevronRightIcon className="size-4" />}
          disabled={!canProceed}
        >
          Next
        </Button>
      </div>
    </div>
  );
});
