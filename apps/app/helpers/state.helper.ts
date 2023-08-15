// types
import { IState, IStateResponse } from "types";

export const orderStateGroups = (
  unorderedStateGroups: IStateResponse | undefined
): IStateResponse | undefined => {
  if (!unorderedStateGroups) return undefined;

  return Object.assign(
    { backlog: [], unstarted: [], started: [], completed: [], cancelled: [] },
    unorderedStateGroups
  );
};

export const getStatesList = (stateGroups: IStateResponse | undefined): IState[] | undefined => {
  if (!stateGroups) return undefined;

  // order the unordered state groups first
  const orderedStateGroups = orderStateGroups(stateGroups);

  if (!orderedStateGroups) return undefined;

  // extract states from the groups and return them
  return Object.keys(orderedStateGroups)
    .map((group) => [...orderedStateGroups[group].map((state: IState) => state)])
    .flat();
};
