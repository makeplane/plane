import { EGanttBlockType } from "./gantt";

export type TGanttBlockGroup = {
  type: EGanttBlockType;
  blockIds: string[];
  count?: number;
};
