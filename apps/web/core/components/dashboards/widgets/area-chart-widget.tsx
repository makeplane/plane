/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { AreaChart } from "@plane/propel/charts/area-chart";
import { ANALYTICS_COLOR_PRESETS } from "@plane/constants";
import type { IAnalyticsChartData, IAnalyticsWidgetConfig, TAreaItem } from "@plane/types";

type AreaChartWidgetProps = {
  data: IAnalyticsChartData;
  config: IAnalyticsWidgetConfig;
  chartProperty: string;
  chartMetric: string;
};

export const AreaChartWidget = observer(function AreaChartWidget({
  data,
  config,
  chartProperty,
  chartMetric,
}: AreaChartWidgetProps) {
  const { data: chartData, schema } = data;
  const colorPreset = ANALYTICS_COLOR_PRESETS[config.color_preset] || ANALYTICS_COLOR_PRESETS.modern;

  // Find metric keys (exclude the property/dimension key)
  const metricKeys = Object.keys(schema).filter(key => key !== "name");

  // Create areas array
  const areas: TAreaItem<string>[] = metricKeys.map((key, index) => ({
    key,
    label: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    fill: colorPreset.colors[index % colorPreset.colors.length],
    strokeColor: colorPreset.colors[index % colorPreset.colors.length],
    fillOpacity: config.fill_opacity || 0.3,
    strokeOpacity: 1,
    showDot: config.show_markers !== false,
    smoothCurves: config.smoothing !== false,
    stackId: "stack",
  }));

  // Get axis labels
  const xAxisLabel = chartProperty.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const yAxisLabel = chartMetric.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <AreaChart
      className="h-full w-full"
      data={chartData}
      areas={areas}
      margin={{ bottom: 30, left: 60 }}
      xAxis={{ key: "name", label: xAxisLabel, dy: 30 }}
      yAxis={{ key: metricKeys[0] || "count", label: yAxisLabel, offset: -60, dx: -26 }}
      showTooltip={config.show_tooltip !== false}
      legend={config.show_legend !== false ? { align: "center", verticalAlign: "bottom", layout: "horizontal" } : undefined}
    />
  );
});

