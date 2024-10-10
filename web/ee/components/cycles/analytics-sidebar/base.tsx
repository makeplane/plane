"use client";

import { observer } from "mobx-react";
// helpers
import { TProgressChartData } from "@/helpers/cycle.helper";
// local components
import ActiveCycleChart from "../active-cycle/cycle-chart/chart";
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
  const { cycle, cycleProgress } = useCycleDetails({
    workspaceSlug: workspaceSlug.toString(),
    projectId: projectId.toString(),
    cycleId: cycleId.toString(),
  });
  if (!cycle) return null;
  return (
    <div>
      <div className="h-40 w-full">
        <ActiveCycleChart cycle={cycle} data={(cycleProgress as TProgressChartData) || []} isFullWidth />
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
  );
});
