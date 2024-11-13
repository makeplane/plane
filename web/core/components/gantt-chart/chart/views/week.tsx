import { FC } from "react";
import { observer } from "mobx-react";
// Plane
import { cn } from "@plane/editor";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from "../../constants";
import { IWeekBlock } from "../../views";

export const WeekChartView: FC<any> = observer(() => {
  const { currentViewData, renderView } = useTimeLineChartStore();
  const weekBlocks: IWeekBlock[] = renderView;

  return (
    <div className={`absolute top-0 left-0 min-h-full h-max w-max flex`}>
      {currentViewData &&
        weekBlocks?.map((block, rootIndex) => (
          <div
            key={`month-${block?.startDate}-${block?.endDate}`}
            className="relative flex flex-col outline-[0.25px] outline outline-custom-border-200"
          >
            {/** Header Div */}
            <div
              className="w-full sticky top-0 z-[5] bg-custom-background-100 flex-shrink-0 outline-[1px] outline outline-custom-border-200"
              style={{
                height: `${HEADER_HEIGHT}px`,
              }}
            >
              {/** Main Months Title */}
              <div className="w-full inline-flex h-7 justify-between">
                <div
                  className="sticky flex items-center font-normal z-[1] m-1 whitespace-nowrap px-3 py-1 text-sm capitalize bg-custom-background-100 text-custom-text-200"
                  style={{
                    left: `${SIDEBAR_WIDTH}px`,
                  }}
                >
                  {block?.title}
                </div>
                <div className="sticky whitespace-nowrap px-3 py-2 text-xs capitalize text-custom-text-400">
                  {block?.weekData?.title}
                </div>
              </div>
              {/** Days Sub title */}
              <div className="h-5 w-full flex">
                {block?.children?.map((weekDay, index) => (
                  <div
                    key={`sub-title-${rootIndex}-${index}`}
                    className={cn(
                      "flex flex-shrink-0 p-1 text-center capitalize justify-between outline-[0.25px] outline outline-custom-border-200",
                      {
                        "bg-custom-primary-100/20": weekDay.today,
                      }
                    )}
                    style={{ width: `${currentViewData?.data.dayWidth}px` }}
                  >
                    <div className="space-x-1 text-xs font-medium text-custom-text-400">
                      {weekDay.dayData.abbreviation}
                    </div>
                    <div className="space-x-1 text-xs font-medium">
                      <span
                        className={cn({
                          "rounded bg-custom-primary-100 px-1 text-white": weekDay.today,
                        })}
                      >
                        {weekDay.date.getDate()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/** Day Columns */}
            <div className="h-full w-full flex-grow flex bg-custom-background-100">
              {block?.children?.map((weekDay, index) => (
                <div
                  key={`column-${rootIndex}-${index}`}
                  className={cn("h-full overflow-hidden outline-[0.25px] outline outline-custom-border-100", {
                    "bg-custom-primary-100/20": weekDay.today,
                  })}
                  style={{ width: `${currentViewData?.data.dayWidth}px` }}
                >
                  {["sat", "sun"].includes(weekDay?.dayData?.shortTitle) && (
                    <div className="h-full bg-custom-background-90 outline-[0.25px] outline outline-custom-border-300" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
});
