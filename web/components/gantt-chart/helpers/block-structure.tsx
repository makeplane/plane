// types
import { TIssue } from "@plane/types";
import { IGanttBlock } from "components/gantt-chart";

export const renderIssueBlocksStructure = (blocks: TIssue[]): IGanttBlock[] =>
  blocks && blocks.length > 0
    ? blocks
        .filter((b) => new Date(b?.start_date ?? "") <= new Date(b?.target_date ?? ""))
        .map((block) => ({
          data: block,
          id: block.id,
          sort_order: block.sort_order,
          start_date: new Date(block.start_date ?? ""),
          target_date: new Date(block.target_date ?? ""),
        }))
    : [];
