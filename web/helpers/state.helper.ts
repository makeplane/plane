// types
import { IState, IStateResponse } from "@plane/types";
import { STATE_GROUPS } from "@/constants/state";

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

export const getCurrentStateSequence = (groupSates: IState[], destinationData: any, edge: string | undefined) => {
  const currentSequence = 65535;
  if (!edge) return currentSequence;
  const currentStateIndex = groupSates.findIndex((state) => state.id === destinationData.id);

  if (destinationData.isFirstElement && destinationData.isLastElement) {
    if (edge === "top") {
      return groupSates[currentStateIndex].sequence - currentSequence;
    } else if (edge === "bottom") {
      return groupSates[currentStateIndex].sequence + currentSequence;
    }
  } else {
    if (destinationData.isFirstElement) {
      if (edge === "top") {
        return groupSates[currentStateIndex].sequence - currentSequence;
      } else if (edge === "bottom") {
        return (groupSates[currentStateIndex].sequence + groupSates[currentStateIndex + 1].sequence) / 2;
      }
    } else if (destinationData.isLastElement) {
      if (edge === "top") {
        return (groupSates[currentStateIndex].sequence + groupSates[currentStateIndex - 1].sequence) / 2;
      } else if (edge === "bottom") {
        return groupSates[currentStateIndex].sequence + currentSequence;
      }
    } else {
      if (edge === "top") {
        return (groupSates[currentStateIndex].sequence + groupSates[currentStateIndex - 1].sequence) / 2;
      } else if (edge === "bottom") {
        return (groupSates[currentStateIndex].sequence + groupSates[currentStateIndex + 1].sequence) / 2;
      }
    }
  }
};
