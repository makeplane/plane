/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Widget adapter: maps backend chart data to propel chart components.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { LineChart } from "@plane/propel/charts/line-chart";
import { PieChart } from "@plane/propel/charts/pie-chart";
import { AreaChart } from "@plane/propel/charts/area-chart";
import { ANALYTICS_COLOR_PRESETS } from "@plane/constants";
import type { IDashboardWidget } from "@plane/types";
import { useCustomDashboard } from "@/plane-web/hooks/store/use-custom-dashboard";

// Default color palette fallback
const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];

/** Resolve colors from widget config or fallback */
const getColors = (config: Record<string, unknown>): string[] => {
  const presetId = (config?.color_preset as string) || "modern";
  return ANALYTICS_COLOR_PRESETS[presetId]?.colors ?? DEFAULT_COLORS;
};

interface WidgetAdapterProps {
  widget: IDashboardWidget;
  _workspaceSlug?: string;
  _dashboardId?: string;
}

export const WidgetAdapter = observer(({ widget, _workspaceSlug, _dashboardId }: WidgetAdapterProps) => {
  const dashboardStore = useCustomDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- data is MobX observable and stable
  const data = dashboardStore.widgetChartData[widget.id] || [];

  const colors = useMemo(() => getColors(widget.config), [widget.config]);

  const metricKeys = useMemo(() => {
    if (!data || data.length === 0 || !data[0]) return ["count"];
    return Object.keys(data[0]).filter((k) => k !== "name");
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-color-tertiary text-xs">
        No data available for these filters.
      </div>
    );
  }

  const isGrouped = widget.chart_model === "GROUPED" && metricKeys.length > 1;

  switch (widget.chart_type) {
    case "NUMBER":
      return (
        <div className="flex items-center justify-center h-full">
          <span className="text-4xl font-bold text-color-primary">{data[0]?.count ?? 0}</span>
        </div>
      );

    case "BAR_CHART":
      return (
        <div className="w-full h-full p-2">
          <BarChart
            className="h-full w-full"
            data={data}
            bars={(isGrouped ? metricKeys : ["count"]).map((key, i) => ({
              key,
              label: key.replace(/_/g, " "),
              fill: colors[i % colors.length],
              textClassName: "text-color-secondary",
              stackId: "s",
            }))}
            xAxis={{ key: "name" }}
            yAxis={{ key: isGrouped ? metricKeys[0] : "count" }}
          />
        </div>
      );

    case "LINE_CHART":
      return (
        <div className="w-full h-full p-2">
          <LineChart
            className="h-full w-full"
            data={data}
            lines={(isGrouped ? metricKeys : ["count"]).map((key, i) => ({
              key,
              label: key.replace(/_/g, " "),
              stroke: colors[i % colors.length],
              fill: colors[i % colors.length],
              dashedLine: false,
              showDot: true,
              smoothCurves: true,
            }))}
            xAxis={{ key: "name" }}
            yAxis={{ key: isGrouped ? metricKeys[0] : "count" }}
          />
        </div>
      );

    case "AREA_CHART":
      return (
        <div className="w-full h-full p-2">
          <AreaChart
            className="h-full w-full"
            data={data}
            areas={(isGrouped ? metricKeys : ["count"]).map((key, i) => ({
              key,
              label: key.replace(/_/g, " "),
              stackId: "s",
              fill: colors[i % colors.length],
              fillOpacity: 0.3,
              showDot: false,
              smoothCurves: true,
              strokeColor: colors[i % colors.length],
              strokeOpacity: 1,
            }))}
            xAxis={{ key: "name" }}
            yAxis={{ key: isGrouped ? metricKeys[0] : "count" }}
          />
        </div>
      );

    case "PIE_CHART":
      return (
        <div className="w-full h-full p-2">
          <PieChart
            className="h-full w-full"
            data={data.map((d, i) => ({ ...d, key: `cell-${i}` }))}
            dataKey="count"
            cells={data.map((_, i) => ({ key: `cell-${i}`, fill: colors[i % colors.length] }))}
            showLabel={false}
          />
        </div>
      );

    case "DONUT_CHART":
      return (
        <div className="w-full h-full p-2">
          <PieChart
            className="h-full w-full"
            data={data.map((d, i) => ({ ...d, key: `cell-${i}` }))}
            dataKey="count"
            cells={data.map((_, i) => ({ key: `cell-${i}`, fill: colors[i % colors.length] }))}
            innerRadius="60%"
            showLabel={false}
          />
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-full text-color-tertiary text-xs text-center p-4">
          Chart type &quot;{widget.chart_type}&quot; is not supported yet.
        </div>
      );
  }
});
