import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from "@/components/gantt-chart/constants";
import { useGanttChart } from "@/components/gantt-chart/hooks/use-gantt-chart";
// helpers
import { cn } from "@/helpers/common.helper";
// types
import { IMonthBlock } from "../../views";
// constants

export const MonthChartView: FC<any> = observer(() => {
  // chart hook
  const { currentViewData, renderView } = useGanttChart();
  const monthBlocks: IMonthBlock[] = renderView;

  return (
    <div className="absolute top-0 left-0 min-h-full h-max w-max flex divide-x divide-custom-border-100/50">
      {monthBlocks?.map((block, rootIndex) => (
        <div key={`month-${block?.month}-${block?.year}`} className="relative flex flex-col">
          <div
            className="w-full sticky top-0 z-[5] bg-custom-background-100 flex-shrink-0"
            style={{
              height: `${HEADER_HEIGHT}px`,
            }}
          >
            <div className="h-1/2">
              <div
                className="sticky inline-flex whitespace-nowrap px-3 py-2 text-xs font-medium capitalize"
                style={{
                  left: `${SIDEBAR_WIDTH}px`,
                }}
              >
                {block?.title}
              </div>
            </div>
            <div className="h-1/2 w-full flex">
              {block?.children?.map((monthDay, index) => (
                <div
                  key={`sub-title-${rootIndex}-${index}`}
                  className="flex-shrink-0 border-b-[0.5px] border-custom-border-200 py-1 text-center capitalize"
                  style={{ width: `${currentViewData?.data.width}px` }}
                >
                  <div className="space-x-1 text-xs">
                    <span className="text-custom-text-200">{monthDay.dayData.shortTitle[0]}</span>{" "}
                    <span
                      className={cn({
                        "rounded-full bg-custom-primary-100 px-1 text-white": monthDay.today,
                      })}
                    >
                      {monthDay.day}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="h-full w-full flex-grow flex divide-x divide-custom-border-100/50">
            {block?.children?.map((monthDay, index) => (
              <div
                key={`column-${rootIndex}-${index}`}
                className="h-full overflow-hidden"
                style={{ width: `${currentViewData?.data.width}px` }}
              >
                {["sat", "sun"].includes(monthDay?.dayData?.shortTitle) && (
                  <div className="h-full bg-custom-background-90" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
