import { RefObject } from "react";
import { observer } from "mobx-react";
// helpers
import { cn } from "@/helpers/common.helper";
// components
import { ChartDataType, IGanttBlock } from "../";
// constants
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from "../constants";

type Props = {
  blockIds: string[];
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  ganttContainerRef: RefObject<HTMLDivElement>;
  sidebarToRender: (props: any) => React.ReactNode;
  title: string;
  getBlockById: (id: string, currentViewData?: ChartDataType | undefined) => IGanttBlock | undefined;
};

export const GanttChartSidebar: React.FC<Props> = observer((props) => {
  const { blockIds, sidebarToRender, getBlockById, loadMoreBlocks, canLoadMoreBlocks, ganttContainerRef, title } =
    props;

  return (
    <div
      // DO NOT REMOVE THE ID
      id="gantt-sidebar"
      className="sticky left-0 z-10 min-h-full h-max flex-shrink-0 border-r-[0.5px] border-custom-border-200 bg-custom-background-100"
      style={{
        width: `${SIDEBAR_WIDTH}px`,
      }}
    >
      <div
        className="group/list-header box-border flex-shrink-0 flex items-end justify-between gap-2 border-b-[0.5px] border-custom-border-200 pb-2 pl-2 pr-4 text-sm font-medium text-custom-text-300 sticky top-0 z-10 bg-custom-background-100"
        style={{
          height: `${HEADER_HEIGHT}px`,
        }}
      >
        <div className={cn("flex items-center gap-2 pl-2")}>
          <h6>{title}</h6>
        </div>
        <h6>Duration</h6>
      </div>

      <div className="min-h-full h-max bg-custom-background-100 overflow-hidden">
        {sidebarToRender &&
          sidebarToRender({
            title,
            blockIds,
            getBlockById,
            canLoadMoreBlocks,
            ganttContainerRef,
            loadMoreBlocks,
          })}
      </div>
    </div>
  );
});
