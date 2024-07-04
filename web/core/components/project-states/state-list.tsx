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
  states: IState[];
};

export const StateList: FC<TStateList> = observer((props) => {
  const { workspaceSlug, projectId, groupKey, states } = props;

  return (
    <div className="space-y-2">
      {states.map((state: IState) => (
        <StateItem
          key={state?.name}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          groupKey={groupKey}
          totalStates={states.length || 0}
          state={state}
        />
      ))}
    </div>
  );
});
