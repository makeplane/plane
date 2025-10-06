"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
// plane types
import { StateGroupIcon } from "@plane/propel/icons";
import type { TIssue } from "@plane/types";
import { Spinner } from "@plane/ui";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import { PowerKModalCommandItem } from "../../../modal/command-item";

type Props = {
  handleSelect: (stateId: string) => void;
  workItemDetails: TIssue;
};

export const PowerKProjectStatesMenu: React.FC<Props> = observer((props) => {
  const { handleSelect, workItemDetails } = props;
  // store hooks
  const { getProjectStateIds, getStateById } = useProjectState();
  // derived values
  const projectStateIds = workItemDetails.project_id ? getProjectStateIds(workItemDetails.project_id) : undefined;
  const projectStates = projectStateIds ? projectStateIds.map((stateId) => getStateById(stateId)) : undefined;
  const filteredProjectStates = projectStates ? projectStates.filter((state) => !!state) : undefined;

  if (!filteredProjectStates) return <Spinner />;

  return (
    <Command.Group>
      {filteredProjectStates.map((state) => (
        <PowerKModalCommandItem
          key={state.id}
          iconNode={<StateGroupIcon stateGroup={state.group} color={state.color} className="shrink-0 size-3.5" />}
          label={state.name}
          isSelected={state.id === workItemDetails.state_id}
          onSelect={() => handleSelect(state.id)}
        />
      ))}
    </Command.Group>
  );
});
