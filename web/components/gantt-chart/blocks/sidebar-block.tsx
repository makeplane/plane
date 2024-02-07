import { useEffect, useRef } from "react";
// helpers
import { cn } from "helpers/common.helper";
// types
import { IGanttBlock, useChart } from "components/gantt-chart";
// constants
import { BLOCK_HEIGHT } from "../constants";

type Props = { block: IGanttBlock };

export const GanttChartSidebarBlock: React.FC<Props> = (props) => {
  const { block } = props;
  // refs
  const sidebarBlockRef = useRef<HTMLDivElement>(null);
  // chart hook
  const { activeBlock } = useChart();

  useEffect(() => {
    const sidebarBlock = sidebarBlockRef.current;
    if (!sidebarBlock) return;
  }, []);

  return (
    <div
      ref={sidebarBlockRef}
      className={cn(
        "absolute z-[4] w-80 flex items-center text-sm border-r-[0.5px] border-b-[0.5px] border-custom-border-200 box-border bg-custom-background-100",
        {
          "bg-custom-background-80": activeBlock?.id === block.id,
        }
      )}
      style={{
        height: `${BLOCK_HEIGHT}px`,
      }}
    >
      {block?.data?.name}
    </div>
  );
};
