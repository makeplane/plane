export enum CYCLE_ACTION {
  START = "START",
  STOP = "STOP",
}

export const ESTIMATE_TYPE: {
  [key: string]: string;
} = {
  issues: "work items",
  points: "points",
  time: "time",
};
