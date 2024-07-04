"use client";

import { FC, Fragment, useState } from "react";
import { observer } from "mobx-react";
import { Pencil } from "lucide-react";
import { IState, TStateGroups } from "@plane/types";
import { StateGroupIcon } from "@plane/ui";
// components
import { StateUpdate, StateDelete, StateMarksAsDefault } from "@/components/project-states";

type TStateItem = {
  workspaceSlug: string;
  projectId: string;
  groupKey: TStateGroups;
  totalStates: number;
  state: IState;
};

export const StateItem: FC<TStateItem> = observer((props) => {
  const { workspaceSlug, projectId, totalStates, state } = props;
  // states
  const [updateState, setUpdateState] = useState(false);

  return (
    <>
      {updateState ? (
        <StateUpdate
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          state={state}
          handleClose={() => setUpdateState(false)}
        />
      ) : (
        <div className="border border-custom-border-100 rounded p-3 flex items-center gap-2 group">
          <div className="flex-shrink-0">
            <StateGroupIcon stateGroup={state.group} color={state.color} height="16px" width="16px" />
          </div>

          <div className="w-full text-sm px-2 min-h-5">
            <h6 className="text-sm font-medium">{state.name}</h6>
            <p className="text-xs text-custom-text-200">{state.description}</p>
          </div>

          <div className="hidden group-hover:flex items-center gap-2">
            <div className="flex-shrink-0 text-xs transition-all">
              <StateMarksAsDefault
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                stateId={state.id}
                isDefault={state.default ? true : false}
              />
            </div>

            <div className="flex items-center gap-1 transition-all">
              <button
                className="flex-shrink-0 w-5 h-5 rounded flex justify-center items-center overflow-hidden transition-colors hover:bg-custom-background-80 cursor-pointer text-custom-text-200 hover:text-custom-text-100"
                onClick={() => setUpdateState(true)}
              >
                <Pencil className="w-3 h-3" />
              </button>
              <StateDelete
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                totalStates={totalStates}
                state={state}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
});
