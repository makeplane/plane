/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PieChart } from "@plane/propel/charts/pie-chart";
import { ANALYTICS_COLOR_PRESETS } from "@plane/constants";
import type { IAnalyticsChartData, IAnalyticsWidgetConfig, TCellItem } from "@plane/types";

type PieChartWidgetProps = {
  data: IAnalyticsChartData;
  config: IAnalyticsWidgetConfig;
  chartProperty: string;
  chartMetric: string;
};

export const PieChartWidget = observer(function PieChartWidget({
  data,
  config,
  _chartProperty,
  _chartMetric,
}: PieChartWidgetProps) {
  const { data: chartData, schema } = data;
  const colorPreset = ANALYTICS_COLOR_PRESETS[config.color_preset] || ANALYTICS_COLOR_PRESETS.modern;

  // Find metric key (first non-name key)
  const metricKey = Object.keys(schema).find(key => key !== "name") || "count";

  // Create cells array - map each data item to a color
  const cells: TCellItem<string>[] = chartData.map((item, index) => ({
    key: String(item.name || index),
    fill: colorPreset.colors[index % colorPreset.colors.length],
  }));

  return (
    <PieChart
      className="h-full w-full"
      data={chartData}
      dataKey={metricKey}
      cells={cells}
      innerRadius={0}
      outerRadius={"70%"}
      showLabel={true}
      showTooltip={config.show_tooltip !== false}
      legend={config.show_legend !== false ? { align: "center", verticalAlign: "bottom", layout: "horizontal" } : undefined}
      tooltipLabel={(payload: any) => `${payload.name}: ${payload[metricKey]}`}
    />
  );
});

