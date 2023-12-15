// types
import { IStateResponse } from "types";

export const orderStateGroups = (unorderedStateGroups: IStateResponse | undefined): IStateResponse | undefined => {
  if (!unorderedStateGroups) return undefined;
  return Object.assign({ backlog: [], unstarted: [], started: [], completed: [], cancelled: [] }, unorderedStateGroups);
};
