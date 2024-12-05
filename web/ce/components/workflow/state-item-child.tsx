import { SetStateAction } from "react";
import { observer } from "mobx-react";
// Plane
import { IState } from "@plane/types";
// components
import { StateItemTitle } from "@/components/project-states/state-item-title";
//
import { AddStateTransition } from "./add-state-transition";

export type StateItemChildProps = {
  workspaceSlug: string;
  projectId: string;
  stateCount: number;
  disabled: boolean;
  state: IState;
  setUpdateStateModal: (value: SetStateAction<boolean>) => void;
};

export const StateItemChild = observer((props: StateItemChildProps) => {
  const { workspaceSlug, projectId, stateCount, setUpdateStateModal, disabled, state } = props;

  return (
    <div className="flex flex-col w-full items-center justify-between">
      <StateItemTitle
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        setUpdateStateModal={setUpdateStateModal}
        stateCount={stateCount}
        disabled={disabled}
        state={state}
      />
      <AddStateTransition workspaceSlug={workspaceSlug} projectId={projectId} parentStateId={state.id} />
    </div>
  );
});
