"use client";

import { observer } from "mobx-react";
// plane imports
import { TCycleEstimateSystemAdvanced, TCycleEstimateType, TCyclePlotType, TProgressChartData } from "@plane/types";
import { Loader } from "@plane/ui";
import { calculateCycleProgress } from "@plane/utils";
// local components
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useCycle } from "@/hooks/store/use-cycle";
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

  const { plotType, estimatedType } = useCycle();
  const { cycle, cycleProgress, handlePlotChange, handleEstimateChange } = useCycleDetails({
    workspaceSlug: workspaceSlug.toString(),
    projectId: projectId.toString(),
    cycleId: cycleId.toString(),
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
              <span className="text-xs text-custom-text-300">{legend.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});
