// types
import { IState, StateResponse } from "types";

export const orderStateGroups = (unorderedStateGroups: StateResponse) =>
  Object.assign(
    { backlog: [], unstarted: [], started: [], completed: [], cancelled: [] },
    unorderedStateGroups
  );

export const getStatesList = (stateGroups: any): IState[] => {
  // order the unordered state groups first
  const orderedStateGroups = orderStateGroups(stateGroups);

  // extract states from the groups and return them
  return Object.keys(orderedStateGroups)
    .map((group) => [...orderedStateGroups[group].map((state: IState) => state)])
    .flat();
};
