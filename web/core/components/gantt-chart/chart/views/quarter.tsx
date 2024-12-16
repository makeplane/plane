import { FC } from "react";
import { observer } from "mobx-react";
// Plane
import { cn } from "@plane/editor";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from "../../constants";
import { groupMonthsToQuarters, IMonthBlock, IQuarterMonthBlock } from "../../views";

export const QuarterChartView: FC<any> = observer(() => {
  const { currentViewData, renderView } = useTimeLineChartStore();
  const monthBlocks: IMonthBlock[] = renderView;

  const quarterBlocks: IQuarterMonthBlock[] = groupMonthsToQuarters(monthBlocks);

  return (
    <div className={`absolute top-0 left-0 min-h-full h-max w-max flex`}>
      {currentViewData &&
        quarterBlocks?.map((quarterBlock, rootIndex) => (
          <div
            key={`month-${quarterBlock.quarterNumber}-${quarterBlock.year}`}
            className="relative flex flex-col outline-[0.25px] outline outline-custom-border-200"
          >
            {/** Header Div */}
            <div
              className="w-full sticky top-0 z-[5] bg-custom-background-100 flex-shrink-0 outline-[1px] outline outline-custom-border-200"
              style={{
                height: `${HEADER_HEIGHT}px`,
              }}
            >
              {/** Main Quarter Title */}
              <div className="w-full inline-flex h-7 justify-between">
                <div
                  className="sticky flex items-center font-normal z-[1] my-1 whitespace-nowrap px-3 py-1 text-base capitalize bg-custom-background-100 text-custom-text-200"
                  style={{
                    left: `${SIDEBAR_WIDTH}px`,
                  }}
                >
                  {quarterBlock?.title}
                  {quarterBlock.today && (
                    <span className={cn("rounded ml-2 font-medium  bg-custom-primary-100 px-1 text-2xs text-white")}>
                      Current
                    </span>
                  )}
                </div>
                <div className="sticky whitespace-nowrap px-3 py-2 text-xs capitalize text-custom-text-400">
                  {quarterBlock.shortTitle}
                </div>
              </div>
              {/** Months Sub title */}
              <div className="h-5 w-full flex">
                {quarterBlock?.children?.map((monthBlock, index) => (
                  <div
                    key={`sub-title-${rootIndex}-${index}`}
                    className={cn(
                      "flex flex-shrink-0 text-center capitalize justify-center outline-[0.25px] outline outline-custom-border-200",
                      {
                        "bg-custom-primary-100/20": monthBlock.today,
                      }
                    )}
                    style={{ width: `${currentViewData?.data.dayWidth * monthBlock.days}px` }}
                  >
                    <div className="space-x-1 flex items-center justify-center text-xs font-medium h-full">
                      <span
                        className={cn({
                          "rounded-lg bg-custom-primary-100 px-2 text-white": monthBlock.today,
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
                  className={cn("h-full overflow-hidden outline-[0.25px] outline outline-custom-border-100", {
                    "bg-custom-primary-100/20": monthBlock.today,
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
