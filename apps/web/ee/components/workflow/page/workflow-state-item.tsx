"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { IState } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { StateItemChild } from "../state";

type TStateItem = {
  workspaceSlug: string;
  projectId: string;
  totalStates: number;
  state: IState;
};

export const WorkflowStateItem: FC<TStateItem> = observer((props) => {
  const { workspaceSlug, projectId, totalStates, state } = props;

  return (
    <div className={cn("relative border border-custom-border-100 rounded group")}>
      <StateItemChild workspaceSlug={workspaceSlug} projectId={projectId} stateCount={totalStates} state={state} />
    </div>
  );
});
