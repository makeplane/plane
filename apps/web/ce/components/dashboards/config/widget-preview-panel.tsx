/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Live preview panel for widget config modal.
 * Uses plain string chart_type values matching backend model.
 */

import { useMemo } from "react";
import type { IAnalyticsWidgetConfig } from "@plane/types";
import { BarChartWidget } from "../widgets/bar-chart-widget";
import { LineChartWidget } from "../widgets/line-chart-widget";
import { AreaChartWidget } from "../widgets/area-chart-widget";
import { DonutChartWidget } from "../widgets/donut-chart-widget";
import { PieChartWidget } from "../widgets/pie-chart-widget";
import { NumberWidget } from "../widgets/number-widget";
import { getSampleChartData, getSampleNumberData } from "./widget-sample-data";

type WidgetPreviewPanelProps = {
  widgetType: string;
  config: Record<string, unknown>;
  chartProperty: string;
  chartMetric: string;
};

export function WidgetPreviewPanel({ widgetType, config, chartProperty, chartMetric }: WidgetPreviewPanelProps) {
  const chartData = useMemo(() => getSampleChartData(chartProperty), [chartProperty]);
  const numberData = useMemo(() => getSampleNumberData(chartMetric), [chartMetric]);
  // Cast config to the type expected by widget components
  const widgetConfig = config as unknown as IAnalyticsWidgetConfig;

  const renderPreview = () => {
    switch (widgetType) {
      case "BAR_CHART":
        return (
          <BarChartWidget
            data={chartData}
            config={widgetConfig}
            chartProperty={chartProperty}
            chartMetric={chartMetric}
          />
        );
      case "LINE_CHART":
        return (
          <LineChartWidget
            data={chartData}
            config={widgetConfig}
            chartProperty={chartProperty}
            chartMetric={chartMetric}
          />
        );
      case "AREA_CHART":
        return (
          <AreaChartWidget
            data={chartData}
            config={widgetConfig}
            chartProperty={chartProperty}
            chartMetric={chartMetric}
          />
        );
      case "DONUT_CHART":
        return (
          <DonutChartWidget
            data={chartData}
            config={widgetConfig}
            chartProperty={chartProperty}
            chartMetric={chartMetric}
          />
        );
      case "PIE_CHART":
        return (
          <PieChartWidget
            data={chartData}
            config={widgetConfig}
            chartProperty={chartProperty}
            chartMetric={chartMetric}
          />
        );
      case "NUMBER":
        return <NumberWidget data={numberData} config={widgetConfig} chartMetric={chartMetric} />;
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
