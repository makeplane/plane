// types
import { TIssue } from "@plane/types";
import { IGanttBlock } from "components/gantt-chart";

export const renderIssueBlocksStructure = (blocks: TIssue[]): IGanttBlock[] =>
  blocks &&
  blocks.map((block) => ({
    data: block,
    id: block.id,
    sort_order: block.sort_order,
    start_date: block.start_date ? new Date(block.start_date) : null,
    target_date: block.target_date ? new Date(block.target_date) : null,
  }));
