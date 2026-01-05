import { observer } from "mobx-react";
// plane utils
import { cn } from "@plane/utils";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from "../../constants";
import type { IMonthBlock, IQuarterMonthBlock } from "../../views";
import { groupMonthsToQuarters } from "../../views";

export const QuarterChartView = observer(function QuarterChartView(_props: any) {
  const { currentViewData, renderView } = useTimeLineChartStore();
  const monthBlocks: IMonthBlock[] = renderView;

  const quarterBlocks: IQuarterMonthBlock[] = groupMonthsToQuarters(monthBlocks);

  return (
    <div className={`absolute top-0 left-0 min-h-full h-max w-max flex`}>
      {currentViewData &&
        quarterBlocks?.map((quarterBlock, rootIndex) => (
          <div
            key={`month-${quarterBlock.quarterNumber}-${quarterBlock.year}`}
            className="relative flex flex-col outline-[0.25px] outline-subtle-1"
          >
            {/** Header Div */}
            <div
              className="w-full sticky top-0 z-[5] bg-surface-1 flex-shrink-0 outline-[1px] outline-subtle-1"
              style={{
                height: `${HEADER_HEIGHT}px`,
              }}
            >
              {/** Main Quarter Title */}
              <div className="w-full inline-flex h-7 justify-between">
                <div
                  className="sticky flex items-center font-regular z-[1] my-1 whitespace-nowrap px-3 py-1 text-14 capitalize bg-surface-1 text-secondary"
                  style={{
                    left: `${SIDEBAR_WIDTH}px`,
                  }}
                >
                  {quarterBlock?.title}
                  {quarterBlock.today && (
                    <span className={cn("rounded-sm ml-2 font-medium  bg-accent-primary px-1 text-9 text-on-color")}>
                      Current
                    </span>
                  )}
                </div>
                <div className="sticky whitespace-nowrap px-3 py-2 text-11 capitalize text-placeholder">
                  {quarterBlock.shortTitle}
                </div>
              </div>
              {/** Months Sub title */}
              <div className="h-5 w-full flex">
                {quarterBlock?.children?.map((monthBlock, index) => (
                  <div
                    key={`sub-title-${rootIndex}-${index}`}
                    className={cn(
                      "flex flex-shrink-0 text-center capitalize justify-center outline-[0.25px] outline-subtle-1",
                      {
                        "bg-accent-primary/20": monthBlock.today,
                      }
                    )}
                    style={{ width: `${currentViewData?.data.dayWidth * monthBlock.days}px` }}
                  >
                    <div className="space-x-1 flex items-center justify-center text-11 font-medium h-full">
                      <span
                        className={cn({
                          "rounded-lg bg-accent-primary px-2 text-on-color": monthBlock.today,
                        })}
                      >
                        {monthBlock.monthData.shortTitle}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/** Month Columns */}
            <div className="h-full w-full flex-grow flex">
              {quarterBlock?.children?.map((monthBlock, index) => (
                <div
                  key={`column-${rootIndex}-${index}`}
                  className={cn("h-full overflow-hidden outline-[0.25px] outline-subtle", {
                    "bg-accent-primary/20": monthBlock.today,
                  })}
                  style={{ width: `${currentViewData?.data.dayWidth * monthBlock.days}px` }}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
});
