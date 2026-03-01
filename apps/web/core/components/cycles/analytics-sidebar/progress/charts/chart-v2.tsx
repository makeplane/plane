/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import type {
  TCycleEstimateSystemAdvanced,
  TCycleEstimateType,
  TCyclePlotType,
  TProgressChartData,
} from "@plane/types";
import { Loader } from "@plane/ui";
import { calculateCycleProgress } from "@plane/utils";
// local components
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useCycle } from "@/hooks/store/use-cycle";
import { ActiveCycleChart } from "@/components/cycles/active-cycles/v2/cycle-chart/chart";
import Selection from "@/components/cycles/active-cycles/v2/selection";
import { useActiveCycleDetails } from "@/components/cycles/active-cycles/v2/use-active-cycle-details";

type TProps = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
};

const chartLegends = [
  {
    color: "#26D950",
    label: "Pending",
  },
  {
    color: "#FF9500",
    label: "In-progress",
  },
  {
    color: "#3372FF",
    label: "Scope",
  },
  {
    color: "#6695FF",
    label: "Ideal done",
  },
];

export const SidebarChart = observer(function SidebarChart(props: TProps) {
  const { workspaceSlug, projectId, cycleId } = props;

  const { plotType, estimatedType } = useCycle();
  const { cycle, cycleProgress, handlePlotChange, handleEstimateChange } = useActiveCycleDetails({
    workspaceSlug,
    projectId,
    cycleId,
  });
  const { currentProjectEstimateType } = useProjectEstimates();
  const cycleEstimateType: TCycleEstimateType = (cycle.id && estimatedType[cycle.id]) || "issues";
  const projectEstimateType =
    cycleEstimateType === "issues" ? "issues" : (currentProjectEstimateType as TCycleEstimateSystemAdvanced);

  if (!cycle) return null;

  // derived values
  const computedPlotType: TCyclePlotType = (cycle.id && plotType[cycle.id]) || "burndown";

  const progressHeaderPercentage = calculateCycleProgress(cycle, cycleEstimateType);

  return (
    <>
      <div className="relative flex items-center justify-between gap-2 pt-4">
        <Selection
          plotType={computedPlotType}
          estimateType={cycleEstimateType}
          projectId={projectId}
          handlePlotChange={handlePlotChange}
          handleEstimateChange={handleEstimateChange}
          className="!px-0 mt-0"
          cycleId={cycle.id}
        />
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-1 text-11">
            <span className="text-tertiary">Done</span>
            <span className="font-semibold text-placeholder">{progressHeaderPercentage}%</span>
          </div>
        </div>
      </div>
      <div className="py-4">
        <div className="h-40 w-full">
          {cycleProgress ? (
            <ActiveCycleChart
              cycle={cycle}
              data={(cycleProgress as TProgressChartData) || []}
              isFullWidth
              plotType={computedPlotType}
              estimateType={projectEstimateType}
            />
          ) : (
            <Loader className="w-full h-full pb-2">
              <Loader.Item width="100%" height="100%" />
            </Loader>
          )}
        </div>
        <div className="flex items-center justify-between">
          {chartLegends.map((legend) => (
            <div key={legend.label} className="flex items-center gap-1">
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor: legend.color,
                }}
              />
              <span className="text-11 text-tertiary">{legend.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});
