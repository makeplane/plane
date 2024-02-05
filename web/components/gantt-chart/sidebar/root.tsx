import { useRef } from "react";
// components
import { IBlockUpdateData, IGanttBlock, useChart } from "components/gantt-chart";

type Props = {
  blocks: IGanttBlock[] | null;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  enableReorder: boolean;
  sidebarToRender: (props: any) => React.ReactNode;
  title: string;
};

export const GanttChartSidebar: React.FC<Props> = (props) => {
  const { blocks, blockUpdateHandler, enableReorder, sidebarToRender, title } = props;
  // refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  // chart hook
  const { updateScrollTop } = useChart();

  const onSidebarScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => updateScrollTop(e.currentTarget.scrollTop);

  return (
    <div
      // DO NOT REMOVE THE ID
      id="gantt-sidebar"
      className="flex h-full w-1/4 flex-col border-r border-custom-border-200"
    >
      <div className="box-border h-[60px] flex-shrink-0 flex items-end justify-between gap-2 border-b border-custom-border-200 pb-2 pl-10 pr-4 text-sm font-medium text-custom-text-300">
        <h6>{title}</h6>
        <h6>Duration</h6>
      </div>

      <div
        id="gantt-sidebar-scroll-container"
        className="max-h-full mt-[12px] pl-2.5 overflow-hidden overflow-y-auto"
        onScroll={onSidebarScroll}
        ref={sidebarRef}
      >
        {sidebarToRender && sidebarToRender({ title, blockUpdateHandler, blocks, enableReorder })}
      </div>
    </div>
  );
};
