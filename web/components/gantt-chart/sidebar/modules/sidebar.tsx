import { MutableRefObject } from "react";
// ui
import { Loader } from "@plane/ui";
// components
import { IBlockUpdateData, IGanttBlock } from "@/components/gantt-chart";
import { GanttDnDHOC } from "../gantt-dnd-HOC";
import { handleOrderChange } from "../utils";
import { ModulesSidebarBlock } from "./block";
// types

type Props = {
  title: string;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blocks: IGanttBlock[] | null;
  enableReorder: boolean;
};

export const ModuleGanttSidebar: React.FC<Props> = (props) => {
  const { blockUpdateHandler, blocks, enableReorder } = props;

  const handleOnDrop = (
    draggingBlockId: string | undefined,
    droppedBlockId: string | undefined,
    dropAtEndOfList: boolean
  ) => {
    handleOrderChange(draggingBlockId, droppedBlockId, dropAtEndOfList, blocks, blockUpdateHandler);
  };

  return (
    <div className="h-full">
      {blocks ? (
        blocks.map((block, index) => (
          <GanttDnDHOC
            key={block.id}
            id={block.id}
            isLastChild={index === blocks.length - 1}
            isDragEnabled={enableReorder}
            onDrop={handleOnDrop}
          >
            {(isDragging: boolean, dragHandleRef: MutableRefObject<HTMLButtonElement | null>) => (
              <ModulesSidebarBlock
                block={block}
                enableReorder={enableReorder}
                isDragging={isDragging}
                dragHandleRef={dragHandleRef}
              />
            )}
          </GanttDnDHOC>
        ))
      ) : (
        <Loader className="space-y-3 pr-2">
          <Loader.Item height="34px" />
          <Loader.Item height="34px" />
          <Loader.Item height="34px" />
          <Loader.Item height="34px" />
        </Loader>
      )}
    </div>
  );
};
