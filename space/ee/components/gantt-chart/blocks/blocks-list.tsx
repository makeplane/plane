import { FC } from "react";
// hooks
// constants
import { HEADER_HEIGHT } from "../constants";
// types
import { ChartDataType, IGanttBlock } from "../types";
// components
import { GanttChartBlock } from "./block";

export type GanttChartBlocksProps = {
  itemsContainerWidth: number;
  blockIds: string[];
  getBlockById: (id: string, currentViewData?: ChartDataType | undefined) => IGanttBlock | undefined;
  blockToRender: (data: any) => React.ReactNode;
  ganttContainerRef: React.RefObject<HTMLDivElement>;
  showAllBlocks: boolean;
};

export const GanttChartBlocksList: FC<GanttChartBlocksProps> = (props) => {
  const { itemsContainerWidth, blockIds, blockToRender, getBlockById, ganttContainerRef, showAllBlocks } = props;

  return (
    <div
      className="h-full"
      style={{
        width: `${itemsContainerWidth}px`,
        transform: `translateY(${HEADER_HEIGHT}px)`,
      }}
    >
      {blockIds?.map((blockId) => (
        <GanttChartBlock
          key={blockId}
          blockId={blockId}
          getBlockById={getBlockById}
          showAllBlocks={showAllBlocks}
          blockToRender={blockToRender}
          ganttContainerRef={ganttContainerRef}
        />
      ))}
    </div>
  );
};
