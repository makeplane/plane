import { observer } from "mobx-react";
import type { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
// components
import { StateItem } from "@/components/project-states";

type TStateList = {
  groupKey: TStateGroups;
  groupedStates: Record<string, IState[]>;
  states: IState[];
  stateOperationsCallbacks: TStateOperationsCallbacks;
  shouldTrackEvents: boolean;
  disabled?: boolean;
  stateItemClassName?: string;
};

export const StateList = observer(function StateList(props: TStateList) {
  const {
    groupKey,
    groupedStates,
    states,
    stateOperationsCallbacks,
    shouldTrackEvents,
    disabled = false,
    stateItemClassName,
  } = props;

  return (
    <>
      {states.map((state: IState) => (
        <StateItem
          key={state?.name}
          groupKey={groupKey}
          groupedStates={groupedStates}
          totalStates={states.length || 0}
          state={state}
          disabled={disabled}
          stateOperationsCallbacks={stateOperationsCallbacks}
          shouldTrackEvents={shouldTrackEvents}
          stateItemClassName={stateItemClassName}
        />
      ))}
    </>
  );
});
