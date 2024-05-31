import { FC } from "react";
// components
import { ChartDataType, ChartViewRoot, IBlockUpdateData, IGanttBlock } from "@/components/gantt-chart";
// context
import { GanttStoreProvider } from "@/components/gantt-chart/contexts";

type GanttChartRootProps = {
  border?: boolean;
  title: string;
  loaderTitle: string;
  blockIds: string[];
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blockToRender: (data: any) => React.ReactNode;
  sidebarToRender: (props: any) => React.ReactNode;
  quickAdd?: React.JSX.Element | undefined;
  getBlockById: (id: string, currentViewData?: ChartDataType | undefined) => IGanttBlock;
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  enableBlockLeftResize?: boolean;
  enableBlockRightResize?: boolean;
  enableBlockMove?: boolean;
  enableReorder?: boolean;
  enableAddBlock?: boolean;
  enableSelection?: boolean;
  bottomSpacing?: boolean;
  showAllBlocks?: boolean;
};

export const GanttChartRoot: FC<GanttChartRootProps> = (props) => {
  const {
    border = true,
    title,
    blockIds,
    loaderTitle = "blocks",
    blockUpdateHandler,
    sidebarToRender,
    blockToRender,
    getBlockById,
    loadMoreBlocks,
    canLoadMoreBlocks,
    enableBlockLeftResize = false,
    enableBlockRightResize = false,
    enableBlockMove = false,
    enableReorder = false,
    enableAddBlock = false,
    enableSelection = false,
    bottomSpacing = false,
    showAllBlocks = false,
    quickAdd,
  } = props;

  return (
    <GanttStoreProvider>
      <ChartViewRoot
        border={border}
        title={title}
        blockIds={blockIds}
        getBlockById={getBlockById}
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
        bottomSpacing={bottomSpacing}
        showAllBlocks={showAllBlocks}
        quickAdd={quickAdd}
      />
    </GanttStoreProvider>
  );
};
