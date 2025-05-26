"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { IState } from "@plane/types";
// local imports
import { WorkflowStateItem } from "./workflow-state-item";

type TStateList = {
  workspaceSlug: string;
  projectId: string;
  states: IState[];
};

export const WorkflowStateList: FC<TStateList> = observer((props) => {
  const { workspaceSlug, projectId, states } = props;

  return (
    <>
      {states.map((state: IState) => (
        <WorkflowStateItem
          key={state?.name}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          totalStates={states.length || 0}
          state={state}
        />
      ))}
    </>
  );
});
