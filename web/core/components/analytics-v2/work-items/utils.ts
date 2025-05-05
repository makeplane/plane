import { ChartXAxisProperty, ChartYAxisMetric } from "@plane/constants";
import { IState } from "@plane/types";

interface ParamsProps {
  x_axis: ChartXAxisProperty
  y_axis: ChartYAxisMetric
  group_by?: ChartXAxisProperty
}

export const generateBarColor = (
  value: string,
  params: ParamsProps,
  baseColors: string[],
  workspaceStates?: IState[],
): string => {

  let color = baseColors[0]
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
    const state = workspaceStates?.find((s) => s.id === value)
    if (state) {
      color = state.color
    }
  }

  // Label
  if (params.x_axis === ChartXAxisProperty.LABELS) {
    const label = workspaceStates?.find((l) => l.id === value)
    if (label) {
      color = label.color
    }
  }


  return color
};