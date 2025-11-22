import { observer } from "mobx-react";
// plane types
import { StateGroupIcon } from "@plane/propel/icons";
import type { IState } from "@plane/types";
// components
import { PowerKModalCommandItem } from "@/components/power-k/ui/modal/command-item";

export type TPowerKProjectStatesMenuItemsProps = {
  handleSelect: (stateId: string) => void;
  projectId: string | undefined;
  selectedStateId: string | undefined;
  states: IState[];
  workspaceSlug: string;
};

export const PowerKProjectStatesMenuItems = observer(function PowerKProjectStatesMenuItems(
  props: TPowerKProjectStatesMenuItemsProps
) {
  const { handleSelect, selectedStateId, states } = props;

  return (
    <>
      {states.map((state) => (
        <PowerKModalCommandItem
          key={state.id}
          iconNode={<StateGroupIcon stateGroup={state.group} color={state.color} className="shrink-0 size-3.5" />}
          label={state.name}
          isSelected={state.id === selectedStateId}
          onSelect={() => handleSelect(state.id)}
        />
      ))}
    </>
  );
});
