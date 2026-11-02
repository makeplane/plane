/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Expand, Shrink } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// plane
import type { TGanttViews } from "@plane/types";
import { Row } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { VIEWS_LIST } from "@/components/gantt-chart/data";
// helpers
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { GANTT_BREADCRUMBS_HEIGHT } from "../constants";

type Props = {
  showDependencyToggle?: boolean;
  showAutoScheduleToggle?: boolean;
  blockIds: string[];
  fullScreenMode: boolean;
  handleChartView: (view: TGanttViews) => void;
  handleToday: () => void;
  loaderTitle: string;
  toggleFullScreenMode: () => void;
  showToday: boolean;
};

export const GanttChartHeader = observer(function GanttChartHeader(props: Props) {
  const { t } = useTranslation();
  const { blockIds, fullScreenMode, handleChartView, handleToday, loaderTitle, toggleFullScreenMode, showToday } =
    props;
  // chart hook
  const { currentView, showDependencies, toggleShowDependencies, autoSchedule, toggleAutoSchedule } =
    useTimeLineChartStore();

  return (
    <Row
      className="relative flex w-full flex-shrink-0 flex-nowrap items-center gap-2 overflow-x-auto bg-surface-1 py-2 whitespace-nowrap"
      style={{ height: `${GANTT_BREADCRUMBS_HEIGHT}px` }}
    >
      <div className="ml-auto flex-shrink-0">
        <div className="ml-auto text-11 font-medium text-tertiary">
          {blockIds ? `${blockIds.length} ${loaderTitle}` : t("common.loading")}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {VIEWS_LIST.map((chartView: any) => (
          <div
            key={chartView?.key}
            className={cn(
              "cursor-pointer rounded-md bg-layer-transparent p-1 px-2 text-11 hover:bg-layer-transparent-hover",
              {
                "bg-layer-transparent-selected": currentView === chartView?.key,
              }
            )}
            onClick={() => handleChartView(chartView?.key)}
          >
            {t(chartView?.i18n_title)}
          </div>
        ))}
      </div>

      {showToday && (
        <button
          type="button"
          className="flex-shrink-0 rounded-md bg-layer-transparent p-1 px-2 text-11 hover:bg-layer-transparent-hover"
          onClick={handleToday}
        >
          {t("common.today")}
        </button>
      )}

      {props.showDependencyToggle && (
        <button
          type="button"
          className={cn(
            "flex-shrink-0 rounded-md bg-layer-transparent p-1 px-2 text-11 hover:bg-layer-transparent-hover",
            {
              "bg-layer-transparent-selected": showDependencies,
            }
          )}
          aria-pressed={showDependencies}
          onClick={toggleShowDependencies}
        >
          Phụ thuộc
        </button>
      )}

      {props.showAutoScheduleToggle && (
        <button
          type="button"
          className={cn(
            "flex-shrink-0 rounded-md bg-layer-transparent p-1 px-2 text-11 hover:bg-layer-transparent-hover",
            {
              "bg-layer-transparent-selected": autoSchedule,
            }
          )}
          aria-pressed={autoSchedule}
          onClick={toggleAutoSchedule}
        >
          Tự lùi lịch
        </button>
      )}

      <button
        type="button"
        className="flex flex-shrink-0 items-center justify-center rounded-md border border-subtle bg-layer-transparent p-1 transition-all hover:bg-layer-transparent-hover"
        onClick={toggleFullScreenMode}
      >
        {fullScreenMode ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
      </button>
    </Row>
  );
});
