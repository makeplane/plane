import { Draggable } from "@hello-pangea/dnd";
import { observer } from "mobx-react";
import { IssuesSidebarBlock } from "./block";
import { IGanttBlock } from "components/gantt-chart/types";

interface Props {
  blockId: string;
  enableReorder: boolean;
  index: number;
  showAllBlocks: boolean;
  getBlockById: (blockId: string) => IGanttBlock;
}
export const IssueDraggableBlock = observer((props: Props) => {
  const { blockId, enableReorder, index, showAllBlocks, getBlockById } = props;
  const block = getBlockById(blockId);

  const isBlockVisibleOnSidebar = block.start_date && block.target_date;

  // hide the block if it doesn't have start and target dates and showAllBlocks is false
  if (!showAllBlocks && !isBlockVisibleOnSidebar) return null;

  return (
    <Draggable
      key={`sidebar-block-${blockId}`}
      draggableId={`sidebar-block-${blockId}`}
      index={index}
      isDragDisabled={!enableReorder}
    >
      {(provided, snapshot) => (
        <IssuesSidebarBlock block={block} enableReorder={enableReorder} provided={provided} snapshot={snapshot} />
      )}
    </Draggable>
  );
});
