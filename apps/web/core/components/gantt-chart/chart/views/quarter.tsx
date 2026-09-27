/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { EStartOfTheWeek } from "@plane/types";
import { cn } from "@plane/utils";
import { months } from "@/components/gantt-chart/data";
import { useUserProfile } from "@/hooks/store/user";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from "../../constants";
import type { IMonthBlock, IQuarterMonthBlock } from "../../views";
import { groupMonthsToQuarters } from "../../views";

type QuarterWeekChunk = {
  key: string;
  startDate: Date;
  endDate: Date;
  days: number;
  isToday: boolean;
  label: string;
};

const getQuarterWeekChunks = (
  quarterBlock: IQuarterMonthBlock,
  startOfWeek: EStartOfTheWeek
): QuarterWeekChunk[] => {
  const firstMonth = quarterBlock.children[0];
  const lastMonth = quarterBlock.children[quarterBlock.children.length - 1];
  if (!firstMonth || !lastMonth) return [];

  const quarterStart = new Date(firstMonth.year, firstMonth.month, 1);
  const quarterEnd = new Date(lastMonth.year, lastMonth.month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const chunks: QuarterWeekChunk[] = [];
  const cursor = new Date(quarterStart);

  while (cursor <= quarterEnd) {
    const startDate = new Date(cursor);
    const dayOffset = (startDate.getDay() + 7 - startOfWeek) % 7;
    const daysUntilWeekEnd = 6 - dayOffset;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysUntilWeekEnd);
    if (endDate > quarterEnd) endDate.setTime(quarterEnd.getTime());

    const days = Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
    const startMonth = months[startDate.getMonth()].abbreviation;
    const endMonth = months[endDate.getMonth()].abbreviation;
    const dateRange =
      startDate.getMonth() === endDate.getMonth()
        ? `${startMonth} ${startDate.getDate()}–${endDate.getDate()}`
        : `${startMonth} ${startDate.getDate()}–${endMonth} ${endDate.getDate()}`;

    chunks.push({
      key: `${quarterBlock.year}-${quarterBlock.quarterNumber}-${startDate.toISOString()}`,
      startDate,
      endDate,
      days,
      isToday: today >= startDate && today <= endDate,
      label: dateRange,
    });

    cursor.setTime(endDate.getTime());
    cursor.setDate(cursor.getDate() + 1);
  }

  return chunks;
};

export const QuarterChartView = observer(function QuarterChartView() {
  const { currentViewData, renderView } = useTimeLineChartStore();
  const { data } = useUserProfile();
  const monthBlocks: IMonthBlock[] = renderView;
  const quarterBlocks: IQuarterMonthBlock[] = groupMonthsToQuarters(monthBlocks);
  const startOfWeek = data?.start_of_the_week ?? EStartOfTheWeek.SUNDAY;

  return (
    <div className="absolute top-0 left-0 flex h-max min-h-full w-max">
      {currentViewData &&
        quarterBlocks.map((quarterBlock) => {
          const weekChunks = getQuarterWeekChunks(quarterBlock, startOfWeek);

          return (
            <div
              key={`quarter-${quarterBlock.quarterNumber}-${quarterBlock.year}`}
              className="relative flex flex-col outline-[0.25px] outline-subtle-1"
            >
              <div
                className="sticky top-0 z-[5] w-full flex-shrink-0 bg-surface-1 outline-[1px] outline-subtle-1"
                style={{ height: `${HEADER_HEIGHT}px` }}
              >
                <div className="inline-flex h-7 w-full justify-between">
                  <div
                    className="sticky z-[1] my-1 flex items-center bg-surface-1 px-3 py-1 text-14 font-regular whitespace-nowrap text-secondary capitalize"
                    style={{ left: `${SIDEBAR_WIDTH}px` }}
                  >
                    {quarterBlock.title}
                    {quarterBlock.today && (
                      <span className="ml-2 rounded-sm bg-accent-primary px-1 text-9 font-medium text-on-color">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="sticky px-3 py-2 text-11 whitespace-nowrap text-placeholder capitalize">
                    {quarterBlock.shortTitle}
                  </div>
                </div>

                <div className="flex h-5 w-full">
                  {weekChunks.map((chunk) => (
                    <div
                      key={chunk.key}
                      className={cn(
                        "flex flex-shrink-0 items-center justify-center overflow-hidden px-1 text-center outline-[0.25px] outline-subtle-1",
                        {
                          "bg-accent-primary/20": chunk.isToday,
                        }
                      )}
                      style={{ width: `${currentViewData.data.dayWidth * chunk.days}px` }}
                      title={chunk.label}
                    >
                      <span
                        className={cn("truncate text-10 font-medium text-placeholder", {
                          "rounded-sm bg-accent-primary px-1 text-on-color": chunk.isToday,
                        })}
                      >
                        {chunk.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex h-full w-full flex-grow bg-surface-1">
                {weekChunks.map((chunk) => (
                  <div
                    key={`quarter-week-column-${chunk.key}`}
                    className={cn("h-full flex-shrink-0 overflow-hidden outline-[0.25px] outline-subtle", {
                      "bg-accent-primary/20": chunk.isToday,
                    })}
                    style={{ width: `${currentViewData.data.dayWidth * chunk.days}px` }}
                  />
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
});
