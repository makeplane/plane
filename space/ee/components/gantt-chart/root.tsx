import { FC } from "react";
// context
import { GanttStoreProvider } from "./contexts";
// components
import { ChartDataType, ChartViewRoot, IGanttBlock } from ".";

type GanttChartRootProps = {
  border?: boolean;
  title: string;
  blockIds: string[];
  blockToRender: (data: any) => React.ReactNode;
  sidebarToRender: (props: any) => React.ReactNode;
  getBlockById: (id: string, currentViewData?: ChartDataType | undefined) => IGanttBlock | undefined;
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  bottomSpacing?: boolean;
  showAllBlocks?: boolean;
};

export const GanttChartRoot: FC<GanttChartRootProps> = (props) => {
  const {
    border = true,
    title,
    blockIds,
    sidebarToRender,
    blockToRender,
    getBlockById,
    loadMoreBlocks,
    canLoadMoreBlocks,
    bottomSpacing = false,
    showAllBlocks = false,
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
        sidebarToRender={sidebarToRender}
        blockToRender={blockToRender}
        bottomSpacing={bottomSpacing}
        showAllBlocks={showAllBlocks}
      />
    </GanttStoreProvider>
  );
};
