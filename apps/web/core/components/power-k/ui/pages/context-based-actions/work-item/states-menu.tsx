"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Check } from "lucide-react";
// plane types
import { StateGroupIcon } from "@plane/propel/icons";
import type { TIssue } from "@plane/types";
import { Spinner } from "@plane/ui";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  handleClose: () => void;
  handleUpdateWorkItem: (data: Partial<TIssue>) => void;
  workItemDetails: TIssue;
};

export const PowerKProjectStatesMenu: React.FC<Props> = observer((props) => {
  const { handleClose, handleUpdateWorkItem, workItemDetails } = props;
  // store hooks
  const { getProjectStateIds, getStateById } = useProjectState();
  // derived values
  const projectStateIds = workItemDetails.project_id ? getProjectStateIds(workItemDetails.project_id) : undefined;
  const projectStates = projectStateIds ? projectStateIds.map((stateId) => getStateById(stateId)) : undefined;
  const filteredProjectStates = projectStates ? projectStates.filter((state) => !!state) : undefined;

  if (!filteredProjectStates) return <Spinner />;

  return (
    <>
      {filteredProjectStates.map((state) => (
        <Command.Item
          key={state.id}
          onSelect={() => {
            if (workItemDetails.state_id === state.id) return;
            handleUpdateWorkItem({
              state_id: state.id,
            });
            handleClose();
          }}
          className="focus:outline-none"
        >
          <div className="flex items-center space-x-3">
            <StateGroupIcon stateGroup={state.group} color={state.color} className="shrink-0 size-3.5" />
            <p>{state.name}</p>
          </div>
          <div className="flex-shrink-0">{state.id === workItemDetails.state_id && <Check className="size-3" />}</div>
        </Command.Item>
      ))}
    </>
  );
});
