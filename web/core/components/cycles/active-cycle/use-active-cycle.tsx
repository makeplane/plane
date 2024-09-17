import { useCycle } from "@/hooks/store";
import { ICycle, TCycleEstimateType, TCyclePlotType } from "@plane/types";
import useCyclesDetails from "./use-cycles-details";
import { useState } from "react";

const useActiveCycle = (workspaceSlug: string, projectId: string) => {
  const { getPlotTypeByCycleId, getEstimateTypeByCycleId, setPlotType, setEstimateType, currentProjectActiveCycleId } =
    useCycle();
  const { handleFiltersUpdate, cycle, cycleIssueDetails } = useCyclesDetails({
    workspaceSlug,
    projectId,
    cycleId: currentProjectActiveCycleId,
  });

  // derived values
  const plotType: TCyclePlotType = (cycle && getPlotTypeByCycleId(cycle.id)) || "burndown";
  const estimateType: TCycleEstimateType = (cycle && getEstimateTypeByCycleId(cycle.id)) || "issues";

  const handlePlotChange = async (value: TCyclePlotType) => {
    if (!workspaceSlug || !projectId || !cycle || !cycle.id) return;
    setPlotType(cycle.id, value);
  };

  const handleEstimateChange = async (value: TCycleEstimateType) => {
    if (!workspaceSlug || !projectId || !cycle || !cycle.id) return;
    setEstimateType(cycle.id, value);
  };

  return {
    plotType,
    estimateType,
    handlePlotChange,
    handleEstimateChange,
    cycle,
  };
};
export default useActiveCycle;
