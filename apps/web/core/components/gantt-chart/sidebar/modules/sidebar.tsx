"use client";

import { observer } from "mobx-react";
// ui
import type { IBlockUpdateData } from "@plane/types";
import { Loader } from "@plane/ui";
// components
// hooks
import { useTimeLineChart } from "@/hooks/use-timeline-chart";
//
import { ETimeLineTypeType } from "../../contexts";
import { GanttDnDHOC } from "../gantt-dnd-HOC";
import { handleOrderChange } from "../utils";
import { ModulesSidebarBlock } from "./block";
// types

type Props = {
  title: string;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blockIds: string[];
  enableReorder: boolean;
};

export const ModuleGanttSidebar: React.FC<Props> = observer((props) => {
  const { blockUpdateHandler, blockIds, enableReorder } = props;

  const { getBlockById } = useTimeLineChart(ETimeLineTypeType.MODULE);

  const handleOnDrop = (
    draggingBlockId: string | undefined,
    droppedBlockId: string | undefined,
    dropAtEndOfList: boolean
  ) => {
    handleOrderChange(draggingBlockId, droppedBlockId, dropAtEndOfList, blockIds, getBlockById, blockUpdateHandler);
  };

  return (
    <div className="h-full">
      {blockIds ? (
        blockIds.map((blockId, index) => (
          <GanttDnDHOC
            key={blockId}
            id={blockId}
            isLastChild={index === blockIds.length - 1}
            isDragEnabled={enableReorder}
            onDrop={handleOnDrop}
          >
            {(isDragging: boolean) => <ModulesSidebarBlock blockId={blockId} isDragging={isDragging} />}
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
});
