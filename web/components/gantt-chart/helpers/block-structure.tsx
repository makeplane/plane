// types
import { IIssue } from "types";
import { IGanttBlock } from "components/gantt-chart";

export const renderIssueBlocksStructure = (blocks: IIssue[]): IGanttBlock[] =>
  blocks && blocks.length > 0
    ? blocks.map((block) => ({
        data: block,
        id: block.id,
        sort_order: block.sort_order,
        start_date: new Date(block.start_date ?? ""),
        target_date: new Date(block.target_date ?? ""),
      }))
    : [];
