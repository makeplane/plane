import { FC } from "react";
// components
import { ChartViewRoot, IBlockUpdateData, IGanttBlock } from "components/gantt-chart";
// context
import { ChartContextProvider } from "./contexts";

type GanttChartRootProps = {
  border?: boolean;
  title: string;
  loaderTitle: string;
  blocks: IGanttBlock[] | null;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blockToRender: (data: any) => React.ReactNode;
  sidebarToRender: (props: any) => React.ReactNode;
  quickAdd?: React.JSX.Element | undefined;
  enableBlockLeftResize?: boolean;
  enableBlockRightResize?: boolean;
  enableBlockMove?: boolean;
  enableReorder?: boolean;
  enableAddBlock?: boolean;
  bottomSpacing?: boolean;
  showAllBlocks?: boolean;
};

export const GanttChartRoot: FC<GanttChartRootProps> = (props) => {
  const {
    border = true,
    title,
    blocks,
    loaderTitle = "blocks",
    blockUpdateHandler,
    sidebarToRender,
    blockToRender,
    enableBlockLeftResize = false,
    enableBlockRightResize = false,
    enableBlockMove = false,
    enableReorder = false,
    enableAddBlock = false,
    bottomSpacing = false,
    showAllBlocks = false,
    quickAdd,
  } = props;

  return (
    <ChartContextProvider>
      <ChartViewRoot
        border={border}
        title={title}
        blocks={blocks}
        loaderTitle={loaderTitle}
        blockUpdateHandler={blockUpdateHandler}
        sidebarToRender={sidebarToRender}
        blockToRender={blockToRender}
        enableBlockLeftResize={enableBlockLeftResize}
        enableBlockRightResize={enableBlockRightResize}
        enableBlockMove={enableBlockMove}
        enableReorder={enableReorder}
        enableAddBlock={enableAddBlock}
        bottomSpacing={bottomSpacing}
        showAllBlocks={showAllBlocks}
        quickAdd={quickAdd}
      />
    </ChartContextProvider>
  );
};
