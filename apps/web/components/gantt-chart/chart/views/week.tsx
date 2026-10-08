/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane utils
import { cn } from "@plane/utils";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from "../../constants";
import type { IWeekBlock } from "../../views";

export const WeekChartView = observer(function WeekChartView(_props: any) {
  const { currentViewData, renderView } = useTimeLineChartStore();
  const weekBlocks: IWeekBlock[] = renderView;

  return (
    <div className={`absolute top-0 left-0 flex h-max min-h-full w-max`}>
      {currentViewData &&
        weekBlocks?.map((block, rootIndex) => (
          <div
            key={`month-${block?.startDate.toString()}-${block?.endDate.toString()}`}
            className="relative flex flex-col outline-[0.25px] outline-subtle-1"
          >
            {/** Header Div */}
            <div
              className="sticky top-0 z-[5] w-full flex-shrink-0 bg-surface-1 outline-[1px] outline-subtle-1"
              style={{
                height: `${HEADER_HEIGHT}px`,
              }}
            >
              {/** Main Months Title */}
              <div className="inline-flex h-7 w-full justify-between">
                <div
                  className="sticky z-[1] m-1 flex items-center bg-surface-1 px-3 py-1 text-13 font-regular whitespace-nowrap text-secondary capitalize"
                  style={{
                    left: `${SIDEBAR_WIDTH}px`,
                  }}
                >
                  {block?.title}
                </div>
                <div className="sticky px-3 py-2 text-11 whitespace-nowrap text-placeholder capitalize">
                  {block?.weekData?.title}
                </div>
              </div>
              {/** Days Sub title */}
              <div className="flex h-5 w-full">
                {block?.children?.map((weekDay, index) => (
                  <div
                    key={`sub-title-${rootIndex}-${index}`}
                    className={cn(
                      "flex flex-shrink-0 justify-between p-1 text-center capitalize outline-[0.25px] outline-subtle-1",
                      {
                        "bg-accent-primary/20": weekDay.today,
                      }
                    )}
                    style={{ width: `${currentViewData?.data.dayWidth}px` }}
                  >
                    <div className="space-x-1 text-11 font-medium text-placeholder">{weekDay.dayData.abbreviation}</div>
                    <div className="space-x-1 text-11 font-medium">
                      <span
                        className={cn({
                          "rounded-sm bg-accent-primary px-1 text-on-color": weekDay.today,
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
            <div className="flex h-full w-full flex-grow bg-surface-1">
              {block?.children?.map((weekDay, index) => (
                <div
                  key={`column-${rootIndex}-${index}`}
                  className={cn("h-full overflow-hidden outline-[0.25px] outline-subtle", {
                    "bg-accent-primary/20": weekDay.today,
                  })}
                  style={{ width: `${currentViewData?.data.dayWidth}px` }}
                >
                  {["sat", "sun"].includes(weekDay?.dayData?.shortTitle) && (
                    <div className="h-full bg-surface-2 outline-[0.25px] outline-strong" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
});
