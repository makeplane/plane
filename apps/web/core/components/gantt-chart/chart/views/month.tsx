import { FC } from "react";
import { observer } from "mobx-react";
// components
import { cn } from "@plane/utils";
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from "@/components/gantt-chart/constants";
// helpers
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// types
import { IMonthView } from "../../views";
import { getNumberOfDaysBetweenTwoDates } from "../../views/helpers";

export const MonthChartView: FC<any> = observer(() => {
  // chart hook
  const { currentViewData, renderView } = useTimeLineChartStore();
  const monthView: IMonthView = renderView;

  if (!monthView) return <></>;

  const { months, weeks } = monthView;

  const monthsStartDate = new Date(months[0].year, months[0].month, 1);
  const weeksStartDate = weeks[0].startDate;

  const marginLeftDays = getNumberOfDaysBetweenTwoDates(monthsStartDate, weeksStartDate);

  return (
    <div className={`absolute top-0 left-0 min-h-full h-max w-max flex`}>
      {currentViewData && (
        <div className="relative flex flex-col outline-[0.25px] outline outline-custom-border-200">
          {/** Header Div */}
          <div
            className="w-full sticky top-0 z-[5] bg-custom-background-100 flex-shrink-0"
            style={{
              height: `${HEADER_HEIGHT}px`,
            }}
          >
            {/** Main Month Title */}
            <div className="flex h-7" style={{ marginLeft: `${marginLeftDays * currentViewData.data.dayWidth}px` }}>
              {months?.map((monthBlock) => (
                <div
                  key={`month-${monthBlock?.month}-${monthBlock?.year}`}
                  className="flex outline-[0.5px] outline outline-custom-border-200"
                  style={{ width: `${monthBlock.days * currentViewData?.data.dayWidth}px` }}
                >
                  <div
                    className="sticky flex items-center font-normal z-[1] m-1 whitespace-nowrap px-3 py-1 text-base capitalize bg-custom-background-100 text-custom-text-200"
                    style={{
                      left: `${SIDEBAR_WIDTH}px`,
                    }}
                  >
                    {monthBlock?.title}
                    {monthBlock.today && (
                      <span className={cn("rounded ml-2 font-medium bg-custom-primary-100 px-1 text-2xs text-white")}>
                        Current
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/** Weeks Sub title */}
            <div className="h-5 w-full flex">
              {weeks?.map((weekBlock) => (
                <div
                  key={`sub-title-${weekBlock.startDate}-${weekBlock.endDate}`}
                  className={cn(
                    "flex flex-shrink-0 py-1 px-2 text-center capitalize justify-between outline-[0.25px] outline outline-custom-border-200",
                    {
                      "bg-custom-primary-100/20": weekBlock.today,
                    }
                  )}
                  style={{ width: `${currentViewData?.data.dayWidth * 7}px` }}
                >
                  <div className="space-x-1 text-xs font-medium text-custom-text-400">
                    <span
                      className={cn({
                        "rounded bg-custom-primary-100 px-1 text-white": weekBlock.today,
                      })}
                    >
                      {weekBlock.startDate.getDate()}-{weekBlock.endDate.getDate()}
                    </span>
                  </div>
                  <div className="space-x-1 text-xs font-medium">{weekBlock.weekData.shortTitle}</div>
                </div>
              ))}
            </div>
          </div>
          {/** Week Columns */}
          <div className="h-full w-full flex-grow flex">
            {weeks?.map((weekBlock) => (
              <div
                key={`column-${weekBlock.startDate}-${weekBlock.endDate}`}
                className={cn("h-full overflow-hidden outline-[0.25px] outline outline-custom-border-100", {
                  "bg-custom-primary-100/20": weekBlock.today,
                })}
                style={{ width: `${currentViewData?.data.dayWidth * 7}px` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
