"use client";

import { useEffect, useRef, useState } from "react";
import { addDays } from "date-fns";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// ui
import { Tooltip } from "@plane/ui";
// helpers
import { renderFormattedDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { IBlockUpdateData, IGanttBlock } from "../types";

type Props = {
  block: IGanttBlock;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
};

export const ChartAddBlock: React.FC<Props> = observer((props) => {
  const { block, blockUpdateHandler } = props;
  // states
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const [buttonXPosition, setButtonXPosition] = useState(0);
  const [buttonStartDate, setButtonStartDate] = useState<Date | null>(null);
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  // hooks
  const { isMobile } = usePlatformOS();
  // chart hook
  const { currentViewData, currentView } = useTimeLineChartStore();

  const handleButtonClick = () => {
    if (!currentViewData) return;

    const { startDate: chartStartDate, dayWidth } = currentViewData.data;
    const columnNumber = buttonXPosition / dayWidth;

    let numberOfDays = 1;

    if (currentView === "quarter") numberOfDays = 7;

    const startDate = addDays(chartStartDate, columnNumber);
    const endDate = addDays(startDate, numberOfDays);

    blockUpdateHandler(block.data, {
      start_date: renderFormattedPayloadDate(startDate) ?? undefined,
      target_date: renderFormattedPayloadDate(endDate) ?? undefined,
    });
  };

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!currentViewData) return;

      setButtonXPosition(e.offsetX);

      const { startDate: chartStartDate, dayWidth } = currentViewData.data;
      const columnNumber = buttonXPosition / dayWidth;

      const startDate = addDays(chartStartDate, columnNumber);
      setButtonStartDate(startDate);
    };

    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      container?.removeEventListener("mousemove", handleMouseMove);
    };
  }, [buttonXPosition, currentViewData]);

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setIsButtonVisible(true)}
      onMouseLeave={() => setIsButtonVisible(false)}
    >
      <div ref={containerRef} className="h-full w-full" />
      {isButtonVisible && (
        <Tooltip tooltipContent={buttonStartDate && renderFormattedDate(buttonStartDate)} isMobile={isMobile}>
          <button
            type="button"
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 bg-custom-background-80 p-1.5 rounded border border-custom-border-300 grid place-items-center text-custom-text-200 hover:text-custom-text-100"
            style={{
              marginLeft: `${buttonXPosition}px`,
            }}
            onClick={handleButtonClick}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      )}
    </div>
  );
});
