/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { AreaChart } from "@plane/blocks/charts/area-chart";
import type { TChartData, TModuleCompletionChartDistribution } from "@plane/types";
import { filterWorkingDayKeys, renderFormattedDateWithoutYear } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  distribution: TModuleCompletionChartDistribution;
  totalIssues: number;
  className?: string;
  plotTitle?: string;
  /** d2m-plane: when set, the chart skips the project's non-working days and holidays. */
  projectId?: string;
};

const ProgressChart = observer(function ProgressChart({
  distribution,
  totalIssues,
  className = "",
  plotTitle = "work items",
  projectId,
}: Props) {
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = projectId ? getProjectById(projectId) : undefined;
  const allDates = Object.keys(distribution ?? {});
  // d2m-plane: only plot working days so the ideal line does not drop over weekends/holidays
  const dates = project ? filterWorkingDayKeys(allDates, project) : allDates;
  const lastIndex = Math.max(dates.length - 1, 1);
  const chartData: TChartData<string, string>[] = dates.map((key, index) => ({
    name: renderFormattedDateWithoutYear(key),
    current: distribution[key] ?? 0,
    ideal: totalIssues * (1 - index / lastIndex),
  }));

  return (
    <div className={`flex w-full items-center justify-center ${className}`}>
      <AreaChart
        data={chartData}
        areas={[
          {
            key: "current",
            label: `Current ${plotTitle}`,
            strokeColor: "#3F76FF",
            fill: "#3F76FF33",
            fillOpacity: 1,
            showDot: true,
            smoothCurves: true,
            strokeOpacity: 1,
            stackId: "bar-one",
          },
          {
            key: "ideal",
            label: `Ideal ${plotTitle}`,
            strokeColor: "#A9BBD0",
            fill: "#A9BBD0",
            fillOpacity: 0,
            showDot: true,
            smoothCurves: true,
            strokeOpacity: 1,
            stackId: "bar-two",
            style: {
              strokeDasharray: "6, 3",
              strokeWidth: 1,
            },
          },
        ]}
        xAxis={{ key: "name", label: "Date" }}
        yAxis={{ key: "current", label: "Completion" }}
        margin={{ bottom: 30 }}
        className="h-[370px] w-full"
        legend={{
          align: "center",
          verticalAlign: "bottom",
          layout: "horizontal",
          wrapperStyles: {
            marginTop: 20,
          },
        }}
      />
    </div>
  );
});

export default ProgressChart;
