/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { cn } from "@plane/utils";
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from "@/components/gantt-chart/constants";
// helpers
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// types
import type { IMonthView } from "../../views";
import { getNumberOfDaysBetweenTwoDates } from "../../views/helpers";

export const MonthChartView = observer(function MonthChartView(_props: any) {
  // chart hook
  const { currentViewData, renderView } = useTimeLineChartStore();
  const monthView: IMonthView = renderView;

  if (!monthView) return <></>;

  const { months, weeks } = monthView;

  const monthsStartDate = new Date(months[0].year, months[0].month, 1);
  const weeksStartDate = weeks[0].startDate;

  const marginLeftDays = getNumberOfDaysBetweenTwoDates(monthsStartDate, weeksStartDate);

  return (
    <div className="absolute top-0 left-0 flex h-max min-h-full w-max">
      {currentViewData && (
        <div className="relative flex flex-col outline-[0.25px] outline-subtle-1">
          {/** Header Div */}
          <div
            className="sticky top-0 z-[5] w-full flex-shrink-0 bg-surface-1"
            style={{
              height: `${HEADER_HEIGHT}px`,
            }}
          >
            {/** Main Month Title */}
            <div className="flex h-7" style={{ marginLeft: `${marginLeftDays * currentViewData.data.dayWidth}px` }}>
              {months?.map((monthBlock) => (
                <div
                  key={`month-${monthBlock?.month}-${monthBlock?.year}`}
                  className="flex outline-[0.5px] outline-subtle-1"
                  style={{ width: `${monthBlock.days * currentViewData?.data.dayWidth}px` }}
                >
                  <div
                    className="sticky z-[1] m-1 flex items-center bg-surface-1 px-3 py-1 text-14 font-regular whitespace-nowrap text-secondary capitalize"
                    style={{
                      left: `${SIDEBAR_WIDTH}px`,
                    }}
                  >
                    {monthBlock?.title}
                    {monthBlock.today && (
                      <span className={cn("ml-2 rounded-sm bg-accent-primary px-1 text-9 font-medium text-on-color")}>
                        Current
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/** Weeks Sub title */}
            <div className="flex h-5 w-full">
              {weeks?.map((weekBlock) => (
                <div
                  key={`sub-title-${weekBlock.startDate.toString()}-${weekBlock.endDate.toString()}`}
                  className={cn(
                    "flex flex-shrink-0 justify-between px-2 py-1 text-center capitalize outline-[0.25px] outline-subtle-1",
                    {
                      "bg-accent-primary/20": weekBlock.today,
                    }
                  )}
                  style={{ width: `${currentViewData?.data.dayWidth * 7}px` }}
                >
                  <div className="space-x-1 text-11 font-medium text-placeholder">
                    <span
                      className={cn({
                        "rounded-sm bg-accent-primary px-1 text-on-color": weekBlock.today,
                      })}
                    >
                      {weekBlock.startDate.getDate()}-{weekBlock.endDate.getDate()}
                    </span>
                  </div>
                  <div className="space-x-1 text-11 font-medium">{weekBlock.weekData.shortTitle}</div>
                </div>
              ))}
            </div>
          </div>
          {/** Week Columns */}
          <div className="flex h-full w-full flex-grow">
            {weeks?.map((weekBlock) => (
              <div
                key={`column-${weekBlock.startDate.toString()}-${weekBlock.endDate.toString()}`}
                className={cn("h-full overflow-hidden outline-[0.25px] outline-subtle", {
                  "bg-accent-primary/20": weekBlock.today,
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
