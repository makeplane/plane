"use client";

import { observer } from "mobx-react";
// helpers
import { TCycleEstimateType, TCyclePlotType } from "@plane/types";
import { Loader } from "@plane/ui";
import { TProgressChartData } from "@/helpers/cycle.helper";
// local components
import { useCycle } from "@/hooks/store";
import ActiveCycleChart from "../active-cycle/cycle-chart/chart";
import Selection from "../active-cycle/selection";
import useCycleDetails from "../active-cycle/use-cycle-details";

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

export const SidebarChart = observer((props: TProps) => {
  const { workspaceSlug, projectId, cycleId } = props;

  const { getEstimateTypeByCycleId, plotType, estimatedType } = useCycle();
  const { cycle, cycleProgress, handlePlotChange, handleEstimateChange } = useCycleDetails({
    workspaceSlug: workspaceSlug.toString(),
    projectId: projectId.toString(),
    cycleId: cycleId.toString(),
  });

  if (!cycle) return null;

  // derived values
  const computedPlotType: TCyclePlotType = (cycle.id && plotType[cycle.id]) || "burndown";
  const computedEstimateType: TCycleEstimateType = (cycle.id && estimatedType[cycle.id]) || "issues";
  const totalEstimatePoints = cycle?.total_estimate_points || 0;
  const totalIssues = cycle?.total_issues || 0;
  const estimateType = getEstimateTypeByCycleId(cycleId);
  const completedIssues = cycle?.completed_issues || 0;
  const completedEstimatePoints = cycle?.completed_estimate_points || 0;

  const progressHeaderPercentage = cycle
    ? estimateType === "points"
      ? completedEstimatePoints != 0 && totalEstimatePoints != 0
        ? Math.round((completedEstimatePoints / totalEstimatePoints) * 100)
        : 0
      : completedIssues != 0 && completedIssues != 0
        ? Math.round((completedIssues / totalIssues) * 100)
        : 0
    : 0;

  return (
    <>
      <div className="relative flex items-center justify-between gap-2 pt-4">
        <Selection
          plotType={computedPlotType}
          estimateType={computedEstimateType}
          projectId={projectId}
          handlePlotChange={handlePlotChange}
          handleEstimateChange={handleEstimateChange}
          className="!px-0 mt-0"
          cycleId={cycle.id}
        />
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-custom-text-300">Done</span>
            <span className="font-semibold text-custom-text-400">{progressHeaderPercentage}%</span>
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
              <span className="text-xs text-custom-text-300">{legend.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});
