/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Live preview panel for widget config modal.
 * Renders the appropriate widget component with static sample data.
 */

import { useMemo } from "react";
import { EAnalyticsWidgetType } from "@plane/types";
import type { IAnalyticsWidgetConfig } from "@plane/types";
import { BarChartWidget } from "../widgets/bar-chart-widget";
import { LineChartWidget } from "../widgets/line-chart-widget";
import { AreaChartWidget } from "../widgets/area-chart-widget";
import { DonutChartWidget } from "../widgets/donut-chart-widget";
import { PieChartWidget } from "../widgets/pie-chart-widget";
import { NumberWidget } from "../widgets/number-widget";
import { getSampleChartData, getSampleNumberData } from "./widget-sample-data";

type WidgetPreviewPanelProps = {
  widgetType: EAnalyticsWidgetType;
  config: IAnalyticsWidgetConfig;
  chartProperty: string;
  chartMetric: string;
};

export function WidgetPreviewPanel({ widgetType, config, chartProperty, chartMetric }: WidgetPreviewPanelProps) {
  const chartData = useMemo(() => getSampleChartData(chartProperty), [chartProperty]);
  const numberData = useMemo(() => getSampleNumberData(chartMetric), [chartMetric]);

  const renderPreview = () => {
    switch (widgetType) {
      case EAnalyticsWidgetType.BAR:
        return <BarChartWidget data={chartData} config={config} chartProperty={chartProperty} chartMetric={chartMetric} />;
      case EAnalyticsWidgetType.LINE:
        return <LineChartWidget data={chartData} config={config} chartProperty={chartProperty} chartMetric={chartMetric} />;
      case EAnalyticsWidgetType.AREA:
        return <AreaChartWidget data={chartData} config={config} chartProperty={chartProperty} chartMetric={chartMetric} />;
      case EAnalyticsWidgetType.DONUT:
        return <DonutChartWidget data={chartData} config={config} chartProperty={chartProperty} chartMetric={chartMetric} />;
      case EAnalyticsWidgetType.PIE:
        return <PieChartWidget data={chartData} config={config} chartProperty={chartProperty} chartMetric={chartMetric} />;
      case EAnalyticsWidgetType.NUMBER:
        return <NumberWidget data={numberData} config={config} chartMetric={chartMetric} />;
      default:
        return <p className="text-sm text-custom-text-300">Select a widget type to see preview</p>;
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-custom-border-200 bg-custom-background-90">
      <div className="border-b border-custom-border-200 px-3 py-2">
        <span className="text-xs font-medium text-custom-text-300">Preview</span>
      </div>
      <div className="flex-1 p-3">
        <div className="h-full min-h-[200px]">{renderPreview()}</div>
      </div>
    </div>
  );
}
