// Shared color utilities for dashboard chart renderers

export const DEFAULT_CHART_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];

/** Extract chart colors from widget config, falling back to defaults */
export const getChartColors = (config: Record<string, unknown>): string[] => {
  const preset = config?.color_scheme as { colors?: string[] } | undefined;
  return preset?.colors ?? DEFAULT_CHART_COLORS;
};
