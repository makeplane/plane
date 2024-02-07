import { useRef } from "react";
// components
import { IBlockUpdateData, IGanttBlock } from "components/gantt-chart";
// constants
import { HEADER_HEIGHT } from "../constants";

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

  return (
    <div
      // DO NOT REMOVE THE ID
      id="gantt-sidebar"
      className="h-full w-1/4 flex-shrink-0"
    >
      <div
        className="box-border flex-shrink-0 flex items-end justify-between gap-2 border-[0.5px] border-l-0 border-t-0 border-custom-border-200 pb-2 pl-8 pr-4 text-sm font-medium text-custom-text-300 sticky top-0 z-[1] bg-custom-background-100"
        style={{
          height: `${HEADER_HEIGHT}px`,
        }}
      >
        <h6>{title}</h6>
        <h6>Duration</h6>
      </div>

      <div id="gantt-sidebar-scroll-container" className="max-h-full" ref={sidebarRef}>
        {sidebarToRender && sidebarToRender({ title, blockUpdateHandler, blocks, enableReorder })}
      </div>
    </div>
  );
};
