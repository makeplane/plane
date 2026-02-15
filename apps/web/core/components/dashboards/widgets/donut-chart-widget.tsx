/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PieChart } from "@plane/propel/charts/pie-chart";
import { ANALYTICS_COLOR_PRESETS } from "@plane/constants";
import type { IAnalyticsChartData, IAnalyticsWidgetConfig, TCellItem } from "@plane/types";

type DonutChartWidgetProps = {
  data: IAnalyticsChartData;
  config: IAnalyticsWidgetConfig;
  chartProperty: string;
  chartMetric: string;
};

export const DonutChartWidget = observer(function DonutChartWidget({
  data,
  config,
  chartProperty,
  chartMetric,
}: DonutChartWidgetProps) {
  const { data: chartData, schema } = data;
  const colorPreset = ANALYTICS_COLOR_PRESETS[config.color_preset] || ANALYTICS_COLOR_PRESETS.modern;

  // Find metric key (first non-name key)
  const metricKey = Object.keys(schema).find(key => key !== "name") || "count";

  // Create cells array - map each data item to a color
  const cells: TCellItem<string>[] = chartData.map((item, index) => ({
    key: String(item.name || index),
    fill: colorPreset.colors[index % colorPreset.colors.length],
  }));

  // Calculate total for center value
  const total = chartData.reduce((sum, item) => sum + (Number(item[metricKey]) || 0), 0);

  return (
    <PieChart
      className="h-full w-full"
      data={chartData}
      dataKey={metricKey}
      cells={cells}
      innerRadius={60}
      outerRadius={100}
      showLabel={false}
      showTooltip={config.show_tooltip !== false}
      centerLabel={config.center_value !== false ? {
        text: String(total),
        fill: "var(--text-color-primary)",
        className: "text-2xl font-semibold",
      } : undefined}
      legend={config.show_legend !== false ? { align: "center", verticalAlign: "bottom", layout: "horizontal" } : undefined}
      tooltipLabel={(payload: any) => `${payload.name}: ${payload[metricKey]}`}
    />
  );
});

