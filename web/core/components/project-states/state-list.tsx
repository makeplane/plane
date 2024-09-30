"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { IState, TStateGroups } from "@plane/types";
// components
import { StateItem } from "@/components/project-states";

type TStateList = {
  workspaceSlug: string;
  projectId: string;
  groupKey: TStateGroups;
  groupedStates: Record<string, IState[]>;
  states: IState[];
  disabled?: boolean;
};

export const StateList: FC<TStateList> = observer((props) => {
  const { workspaceSlug, projectId, groupKey, groupedStates, states, disabled = false } = props;

  return (
    <>
      {states.map((state: IState) => (
        <StateItem
          key={state?.name}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          groupKey={groupKey}
          groupedStates={groupedStates}
          totalStates={states.length || 0}
          state={state}
          disabled={disabled}
        />
      ))}
    </>
  );
});
