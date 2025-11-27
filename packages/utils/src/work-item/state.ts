// plane imports
import type { TDraggableData } from "@plane/constants";
import { STATE_GROUPS } from "@plane/constants";
import type { IState, IStateResponse } from "@plane/types";

export const orderStateGroups = (unorderedStateGroups: IStateResponse | undefined): IStateResponse | undefined => {
  if (!unorderedStateGroups) return undefined;
  return Object.assign({ backlog: [], unstarted: [], started: [], completed: [], cancelled: [] }, unorderedStateGroups);
};

export const sortStates = (states: IState[]) => {
  if (!states || states.length === 0) return;

  return states.sort((stateA, stateB) => {
    if (stateA.group === stateB.group) {
      return stateA.sequence - stateB.sequence;
    }
    return Object.keys(STATE_GROUPS).indexOf(stateA.group) - Object.keys(STATE_GROUPS).indexOf(stateB.group);
  });
};

export const getCurrentStateSequence = (
  groupSates: IState[],
  destinationData: TDraggableData,
  edge: string | undefined
) => {
  const defaultSequence = 65535;
  if (!edge) return defaultSequence;

  const currentStateIndex = groupSates.findIndex((state) => state.id === destinationData.id);
  const currentStateSequence = groupSates[currentStateIndex]?.sequence || undefined;

  if (!currentStateSequence) return defaultSequence;

  if (edge === "top") {
    const prevStateSequence = groupSates[currentStateIndex - 1]?.sequence || undefined;

    if (prevStateSequence === undefined) {
      return currentStateSequence - defaultSequence;
    }
    return (currentStateSequence + prevStateSequence) / 2;
  } else if (edge === "bottom") {
    const nextStateSequence = groupSates[currentStateIndex + 1]?.sequence || undefined;

    if (nextStateSequence === undefined) {
      return currentStateSequence + defaultSequence;
    }
    return (currentStateSequence + nextStateSequence) / 2;
  }
};
