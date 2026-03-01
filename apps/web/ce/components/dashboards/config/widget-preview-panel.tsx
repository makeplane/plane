/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Live preview panel for widget config modal.
 * Renders chart previews using propel chart components + static sample data.
 */

import { useMemo } from "react";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { LineChart } from "@plane/propel/charts/line-chart";
import { PieChart } from "@plane/propel/charts/pie-chart";
import { AreaChart } from "@plane/propel/charts/area-chart";
import { ANALYTICS_COLOR_PRESETS } from "@plane/constants";
import { getSampleChartData, getSampleNumberData } from "./widget-sample-data";

// Default color palette fallback
const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];

/** Resolve colors from widget config or fallback */
const getColors = (config: Record<string, unknown>): string[] => {
  const presetId = (config?.color_preset as string) || "modern";
  return ANALYTICS_COLOR_PRESETS[presetId]?.colors ?? DEFAULT_COLORS;
};

type WidgetPreviewPanelProps = {
  widgetType: string;
  config: Record<string, unknown>;
  chartProperty: string;
  chartMetric: string;
};

export function WidgetPreviewPanel({ widgetType, config, chartProperty, chartMetric }: WidgetPreviewPanelProps) {
  const sampleChartData = useMemo(() => getSampleChartData(chartProperty).data, [chartProperty]);
  const sampleNumberData = useMemo(() => getSampleNumberData(chartMetric), [chartMetric]);
  const colors = useMemo(() => getColors(config), [config]);

  const renderPreview = () => {
    switch (widgetType) {
      case "BAR_CHART":
        return (
          <div className="w-full h-full p-2">
            <BarChart
              className="h-full w-full"
              data={sampleChartData}
              bars={[
                {
                  key: "count",
                  label: chartMetric,
                  fill: colors[0],
                  textClassName: "text-color-secondary",
                  stackId: "s",
                },
              ]}
              xAxis={{ key: "name" }}
              yAxis={{ key: "count" }}
            />
          </div>
        );

      case "LINE_CHART":
        return (
          <div className="w-full h-full p-2">
            <LineChart
              className="h-full w-full"
              data={sampleChartData}
              lines={[
                {
                  key: "count",
                  label: chartMetric,
                  stroke: colors[0],
                  fill: colors[0],
                  dashedLine: false,
                  showDot: true,
                  smoothCurves: true,
                },
              ]}
              xAxis={{ key: "name" }}
              yAxis={{ key: "count" }}
            />
          </div>
        );

      case "AREA_CHART":
        return (
          <div className="w-full h-full p-2">
            <AreaChart
              className="h-full w-full"
              data={sampleChartData}
              areas={[
                {
                  key: "count",
                  label: chartMetric,
                  stackId: "s",
                  fill: colors[0],
                  fillOpacity: 0.3,
                  showDot: false,
                  smoothCurves: true,
                  strokeColor: colors[0],
                  strokeOpacity: 1,
                },
              ]}
              xAxis={{ key: "name" }}
              yAxis={{ key: "count" }}
            />
          </div>
        );

      case "PIE_CHART":
        return (
          <div className="w-full h-full p-2">
            <PieChart
              className="h-full w-full"
              data={sampleChartData.map((d, i) => ({ ...d, key: `cell-${i}` }))}
              dataKey="count"
              cells={sampleChartData.map((_, i) => ({ key: `cell-${i}`, fill: colors[i % colors.length] }))}
              showLabel={false}
            />
          </div>
        );

      case "DONUT_CHART":
        return (
          <div className="w-full h-full p-2">
            <PieChart
              className="h-full w-full"
              data={sampleChartData.map((d, i) => ({ ...d, key: `cell-${i}` }))}
              dataKey="count"
              cells={sampleChartData.map((_, i) => ({ key: `cell-${i}`, fill: colors[i % colors.length] }))}
              innerRadius="60%"
              showLabel={false}
            />
          </div>
        );

      case "NUMBER":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <span className="text-4xl font-bold text-color-primary">{sampleNumberData.value}</span>
            <span className="text-xs text-color-tertiary">{chartMetric}</span>
          </div>
        );

      default:
        return <p className="text-sm text-color-tertiary">Select a widget type to see preview</p>;
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-color-subtle bg-layer-1-hover">
      <div className="border-b border-color-subtle px-3 py-2">
        <span className="text-xs font-medium text-color-tertiary">Preview</span>
      </div>
      <div className="flex-1 p-3">
        <div className="h-full min-h-[200px]">{renderPreview()}</div>
      </div>
    </div>
  );
}
