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

  return (
    <div
      // DO NOT REMOVE THE ID
      id="gantt-sidebar"
      className="min-h-full h-max w-1/4 flex-shrink-0 border-r-[0.5px] border-custom-border-200"
    >
      <div
        className="box-border flex-shrink-0 flex items-end justify-between gap-2 border-b-[0.5px] border-custom-border-200 pb-2 pl-8 pr-4 text-sm font-medium text-custom-text-300 sticky top-0 z-[1] bg-custom-background-100"
        style={{
          height: `${HEADER_HEIGHT}px`,
        }}
      >
        <h6>{title}</h6>
        <h6>Duration</h6>
      </div>

      <div className="min-h-full h-max">
        {sidebarToRender && sidebarToRender({ title, blockUpdateHandler, blocks, enableReorder })}
      </div>
    </div>
  );
};
