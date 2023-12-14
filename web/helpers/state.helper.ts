// types
import { STATE_GROUP_KEYS } from "constants/project";
import { IState, IStateResponse } from "types";

export const orderStateGroups = (unorderedStateGroups: IStateResponse | undefined): IStateResponse | undefined => {
  if (!unorderedStateGroups) return undefined;
  return Object.assign({ backlog: [], unstarted: [], started: [], completed: [], cancelled: [] }, unorderedStateGroups);
};

export const sortStates = (states: IState[]) => {
  if (!states || states.length === 0) return null;

  return states.sort((stateA, stateB) => {
    if (stateA.group === stateB.group) {
      return stateA.sequence - stateB.sequence;
    }
    return STATE_GROUP_KEYS.indexOf(stateA.group) - STATE_GROUP_KEYS.indexOf(stateB.group);
  });
};
