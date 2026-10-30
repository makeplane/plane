/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
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
  const { t, currentLocale } = useTranslation();

  const { currentViewData, renderView } = useTimeLineChartStore();
  const monthBlocks: IMonthBlock[] = renderView;

  const quarterBlocks: IQuarterMonthBlock[] = groupMonthsToQuarters(monthBlocks);

  return (
    <div className={`absolute top-0 left-0 flex h-max min-h-full w-max`}>
      {currentViewData &&
        quarterBlocks?.map((quarterBlock) => (
          <div
            key={`month-${quarterBlock.quarterNumber}-${quarterBlock.year}`}
            className="relative flex flex-col outline-[0.25px] outline-subtle-1"
          >
            {/** Header Div */}
            <div
              className="sticky top-0 z-[5] w-full flex-shrink-0 bg-surface-1 outline-[1px] outline-subtle-1"
              style={{
                height: `${HEADER_HEIGHT}px`,
              }}
            >
              {/** Main Quarter Title */}
              <div className="inline-flex h-7 w-full justify-between">
                <div
                  className="sticky z-[1] my-1 flex items-center bg-surface-1 px-3 py-1 text-14 font-regular whitespace-nowrap text-secondary capitalize"
                  style={{
                    left: `${SIDEBAR_WIDTH}px`,
                  }}
                >
                  {t("web_ui.quarter_year", { quarter: quarterBlock.quarterNumber + 1, year: quarterBlock.year })}
                  {quarterBlock.today && (
                    <span className={cn("ml-2 rounded-sm bg-accent-primary px-1 text-9 font-medium text-on-color")}>
                      {t("current")}{" "}
                    </span>
                  )}
                </div>
                <div className="sticky px-3 py-2 text-11 whitespace-nowrap text-placeholder capitalize">
                  {quarterBlock.shortTitle}
                </div>
              </div>
              {/** Months Sub title */}
              <div className="flex h-5 w-full">
                {quarterBlock?.children?.map((monthBlock) => (
                  <div
                    key={`sub-title-${monthBlock.year}-${monthBlock.month}`}
                    className={cn(
                      "flex flex-shrink-0 justify-center text-center capitalize outline-[0.25px] outline-subtle-1",
                      {
                        "bg-accent-primary/20": monthBlock.today,
                      }
                    )}
                    style={{ width: `${currentViewData?.data.dayWidth * monthBlock.days}px` }}
                  >
                    <div className="flex h-full items-center justify-center space-x-1 text-11 font-medium">
                      <span
                        className={cn({
                          "rounded-lg bg-accent-primary px-2 text-on-color": monthBlock.today,
                        })}
                      >
                        {new Intl.DateTimeFormat(currentLocale, { month: "short" }).format(
                          new Date(monthBlock.year, monthBlock.month, 1)
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/** Month Columns */}
            <div className="flex h-full w-full flex-grow">
              {quarterBlock?.children?.map((monthBlock) => (
                <div
                  key={`column-${monthBlock.year}-${monthBlock.month}`}
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
