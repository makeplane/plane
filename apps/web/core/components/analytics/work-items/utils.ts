// plane package imports
import type { ChartYAxisMetric, IState } from "@plane/types";
import { ChartXAxisProperty } from "@plane/types";

interface ParamsProps {
  x_axis: ChartXAxisProperty;
  y_axis: ChartYAxisMetric;
  group_by?: ChartXAxisProperty;
}

export const generateBarColor = (
  value: string | null | undefined,
  params: ParamsProps,
  baseColors: string[],
  workspaceStates?: IState[]
): string => {
  if (!value) return baseColors[0];
  let color = baseColors[0];
  // Priority
  if (params.x_axis === ChartXAxisProperty.PRIORITY) {
    color =
      value === "urgent"
        ? "#ef4444"
        : value === "high"
          ? "#f97316"
          : value === "medium"
            ? "#eab308"
            : value === "low"
              ? "#22c55e"
              : "#ced4da";
  }

  // State
  if (params.x_axis === ChartXAxisProperty.STATES) {
    if (workspaceStates && workspaceStates.length > 0) {
      const state = workspaceStates.find((s) => s.id === value);
      if (state) {
        color = state.color;
      } else {
        const index = Math.abs(value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % baseColors.length;
        color = baseColors[index];
      }
    }
  }

  return color;
};
