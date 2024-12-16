import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { ArrowRight } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail } from "@/hooks/store";
import { TSelectionHelper } from "@/hooks/use-multiple-select";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { BLOCK_HEIGHT, SIDEBAR_WIDTH } from "../constants";
import { ChartAddBlock } from "../helpers";
import { IBlockUpdateData, IGanttBlock } from "../types";

type Props = {
  blockId: string;
  showAllBlocks: boolean;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  handleScrollToBlock: (block: IGanttBlock) => void;
  enableAddBlock: boolean;
  selectionHelpers: TSelectionHelper;
  ganttContainerRef: React.RefObject<HTMLDivElement>;
};

export const BlockRow: React.FC<Props> = observer((props) => {
  const { blockId, showAllBlocks, blockUpdateHandler, handleScrollToBlock, enableAddBlock, selectionHelpers } = props;
  // states
  const [isHidden, setIsHidden] = useState(false);
  const [isBlockHiddenOnLeft, setIsBlockHiddenOnLeft] = useState(false);
  // store hooks
  const { getBlockById, updateActiveBlockId, isBlockActive } = useTimeLineChartStore();
  const { getIsIssuePeeked } = useIssueDetail();

  const block = getBlockById(blockId);

  useEffect(() => {
    const intersectionRoot = document.querySelector("#gantt-container") as HTMLDivElement;
    const timelineBlock = document.getElementById(`gantt-block-${block?.id}`);
    if (!timelineBlock || !intersectionRoot) return;

    setIsBlockHiddenOnLeft(
      !!block.position?.marginLeft &&
        !!block.position?.width &&
        intersectionRoot.scrollLeft > block.position.marginLeft + block.position.width
    );

    // Observe if the block is visible on the chart
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsHidden(!entry.isIntersecting);
          setIsBlockHiddenOnLeft(entry.boundingClientRect.right < (entry.rootBounds?.left ?? 0));
        });
      },
      {
        root: intersectionRoot,
        rootMargin: `0px 0px 0px -${SIDEBAR_WIDTH}px`,
      }
    );

    observer.observe(timelineBlock);

    return () => {
      observer.unobserve(timelineBlock);
    };
  }, [block]);

  // hide the block if it doesn't have start and target dates and showAllBlocks is false
  if (!block || !block.data || (!showAllBlocks && !(block.start_date && block.target_date))) return null;

  const isBlockVisibleOnChart = block.start_date || block.target_date;
  const isBlockSelected = selectionHelpers.getIsEntitySelected(block.id);
  const isBlockFocused = selectionHelpers.getIsEntityActive(block.id);
  const isBlockHoveredOn = isBlockActive(block.id);

  return (
    <div
      className="relative min-w-full w-max"
      onMouseEnter={() => updateActiveBlockId(blockId)}
      onMouseLeave={() => updateActiveBlockId(null)}
      style={{
        height: `${BLOCK_HEIGHT}px`,
      }}
    >
      <div
        className={cn("relative h-full", {
          "rounded-l border border-r-0 border-custom-primary-70": getIsIssuePeeked(block.data.id),
          "bg-custom-background-90": isBlockHoveredOn,
          "bg-custom-primary-100/5 hover:bg-custom-primary-100/10": isBlockSelected,
          "bg-custom-primary-100/10": isBlockSelected && isBlockHoveredOn,
          "border border-r-0 border-custom-border-400": isBlockFocused,
        })}
      >
        {isBlockVisibleOnChart
          ? isHidden && (
              <button
                type="button"
                className="sticky z-[5] grid h-8 w-8 translate-y-1.5 cursor-pointer place-items-center rounded border border-custom-border-300 bg-custom-background-80 text-custom-text-200 hover:text-custom-text-100"
                style={{
                  left: `${SIDEBAR_WIDTH + 4}px`,
                }}
                onClick={() => handleScrollToBlock(block)}
              >
                <ArrowRight
                  className={cn("h-3.5 w-3.5", {
                    "rotate-180": isBlockHiddenOnLeft,
                  })}
                />
              </button>
            )
          : enableAddBlock && <ChartAddBlock block={block} blockUpdateHandler={blockUpdateHandler} />}
      </div>
    </div>
  );
});
