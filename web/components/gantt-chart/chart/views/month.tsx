import { FC } from "react";
// hooks
import { useChart } from "components/gantt-chart";
// helpers
import { cn } from "helpers/common.helper";
// types
import { IMonthBlock } from "../../views";

export const MonthChartView: FC<any> = () => {
  // chart hook
  const { currentViewData, renderView } = useChart();

  const monthBlocks: IMonthBlock[] = renderView;

  return (
    <>
      <div className="absolute h-full flex flex-grow divide-x divide-custom-border-100/50">
        {monthBlocks?.map((block, rootIndex) => (
          <div key={`month-${block?.month}-${block?.year}`} className="relative flex flex-col">
            <div className="h-[60px] w-full">
              <div className="relative h-[30px]">
                <div className="sticky left-0 inline-flex whitespace-nowrap px-3 py-2 text-xs font-medium capitalize">
                  {block?.title}
                </div>
              </div>

              <div className="flex h-[30px] w-full">
                {block?.children?.map((monthDay, _idx) => (
                  <div
                    key={`sub-title-${rootIndex}-${_idx}`}
                    className="flex-shrink-0 border-b border-custom-border-200 py-1 text-center capitalize"
                    style={{ width: `${currentViewData?.data.width}px` }}
                  >
                    <div className="space-x-1 text-xs">
                      <span className="text-custom-text-200">{monthDay.dayData.shortTitle[0]}</span>{" "}
                      <span className={monthDay.today ? "rounded-full bg-custom-primary-100 px-1 text-white" : ""}>
                        {monthDay.day}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex h-full w-full divide-x divide-custom-border-100/50">
              {block?.children?.map((monthDay, index) => (
                <div
                  key={`column-${rootIndex}-${index}`}
                  className="relative flex h-full flex-col overflow-hidden whitespace-nowrap"
                  style={{ width: `${currentViewData?.data.width}px` }}
                >
                  <div
                    className={cn("relative flex h-full w-full flex-1 justify-center", {
                      "bg-custom-background-90": ["sat", "sun"].includes(monthDay?.dayData?.shortTitle),
                    })}
                  >
                    {/* highlight today */}
                    {/* {monthDay?.today && (
                          <div className="absolute top-0 bottom-0 w-[1px] bg-red-500" />
                        )} */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
