import { IIssue } from "@/types/issue";
import { IGanttBlock } from "../types";
import { getDate } from "./date-time.helper";

export const getIssueBlocksStructure = (block: IIssue): IGanttBlock => ({
  data: block,
  id: block?.id,
  sort_order: block?.sort_order,
  start_date: getDate(block?.start_date),
  target_date: getDate(block?.target_date),
});
