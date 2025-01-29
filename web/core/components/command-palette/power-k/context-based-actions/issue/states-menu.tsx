"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Check } from "lucide-react";
// plane types
import { TIssue } from "@plane/types";
// plane ui
import { Spinner, StateGroupIcon } from "@plane/ui";
// hooks
import { useProjectState } from "@/hooks/store";

type Props = {
  handleClose: () => void;
  handleUpdateIssue: (data: Partial<TIssue>) => void;
  issue: TIssue;
};

export const PowerKProjectStatesMenu: React.FC<Props> = observer((props) => {
  const { handleClose, handleUpdateIssue, issue } = props;
  // store hooks
  const { projectStates } = useProjectState();

  return (
    <>
      {projectStates ? (
        projectStates.length > 0 ? (
          projectStates.map((state) => (
            <Command.Item
              key={state.id}
              onSelect={() => {
                handleUpdateIssue({
                  state_id: state.id,
                });
                handleClose();
              }}
              className="focus:outline-none"
            >
              <div className="flex items-center space-x-3">
                <StateGroupIcon stateGroup={state.group} color={state.color} height="14px" width="14px" />
                <p>{state.name}</p>
              </div>
              <div className="flex-shrink-0">{state.id === issue.state_id && <Check className="size-3" />}</div>
            </Command.Item>
          ))
        ) : (
          <div className="text-center">No states found</div>
        )
      ) : (
        <Spinner />
      )}
    </>
  );
});
