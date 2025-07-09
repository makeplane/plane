import { FC, useEffect } from "react";
import { observer } from "mobx-react";
// components
import type { IBlockUpdateData, IBlockUpdateDependencyData } from "@plane/types";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { ChartViewRoot } from "./chart/root";

type GanttChartRootProps = {
  border?: boolean;
  title: string;
  loaderTitle: string;
  blockIds: string[];
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blockToRender: (data: any) => React.ReactNode;
  sidebarToRender: (props: any) => React.ReactNode;
  quickAdd?: React.JSX.Element | undefined;
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>;
  enableBlockLeftResize?: boolean | ((blockId: string) => boolean);
  enableBlockRightResize?: boolean | ((blockId: string) => boolean);
  enableBlockMove?: boolean | ((blockId: string) => boolean);
  enableReorder?: boolean | ((blockId: string) => boolean);
  enableAddBlock?: boolean | ((blockId: string) => boolean);
  enableSelection?: boolean | ((blockId: string) => boolean);
  enableDependency?: boolean | ((blockId: string) => boolean);
  bottomSpacing?: boolean;
  showAllBlocks?: boolean;
  showToday?: boolean;
  isEpic?: boolean;
};

export const GanttChartRoot: FC<GanttChartRootProps> = observer((props) => {
  const {
    border = true,
    title,
    blockIds,
    loaderTitle = "blocks",
    blockUpdateHandler,
    sidebarToRender,
    blockToRender,
    loadMoreBlocks,
    canLoadMoreBlocks,
    enableBlockLeftResize = false,
    enableBlockRightResize = false,
    enableBlockMove = false,
    enableReorder = false,
    enableAddBlock = false,
    enableSelection = false,
    enableDependency = false,
    bottomSpacing = false,
    showAllBlocks = false,
    showToday = true,
    quickAdd,
    updateBlockDates,
    isEpic = false,
  } = props;

  const { setBlockIds } = useTimeLineChartStore();

  // update the timeline store with updated blockIds
  useEffect(() => {
    setBlockIds(blockIds);
  }, [blockIds]);

  return (
    <ChartViewRoot
      border={border}
      title={title}
      blockIds={blockIds}
      loadMoreBlocks={loadMoreBlocks}
      canLoadMoreBlocks={canLoadMoreBlocks}
      loaderTitle={loaderTitle}
      blockUpdateHandler={blockUpdateHandler}
      sidebarToRender={sidebarToRender}
      blockToRender={blockToRender}
      enableBlockLeftResize={enableBlockLeftResize}
      enableBlockRightResize={enableBlockRightResize}
      enableBlockMove={enableBlockMove}
      enableReorder={enableReorder}
      enableAddBlock={enableAddBlock}
      enableSelection={enableSelection}
      enableDependency={enableDependency}
      bottomSpacing={bottomSpacing}
      showAllBlocks={showAllBlocks}
      quickAdd={quickAdd}
      showToday={showToday}
      updateBlockDates={updateBlockDates}
      isEpic={isEpic}
    />
  );
});
