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
};

export const StateList: FC<TStateList> = observer((props) => {
  const { workspaceSlug, projectId, groupKey, groupedStates, states } = props;

  return (
    <>
      {states.map((state: IState, index) => (
        <StateItem
          key={state?.name}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          groupKey={groupKey}
          groupedStates={groupedStates}
          totalStates={states.length || 0}
          state={state}
          isFirstElement={index === 0 ? true : false}
          isLastElement={index === states.length - 1 ? true : false}
        />
      ))}
    </>
  );
});
