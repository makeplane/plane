/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Loader } from "@plane/ui";
import { EAnalyticsWidgetType } from "@plane/types";
import type {
  IAnalyticsDashboardWidget,
  IAnalyticsChartData,
  IAnalyticsNumberWidgetData,
} from "@plane/types";
import { BarChartWidget } from "./widgets/bar-chart-widget";
import { LineChartWidget } from "./widgets/line-chart-widget";
import { AreaChartWidget } from "./widgets/area-chart-widget";
import { DonutChartWidget } from "./widgets/donut-chart-widget";
import { PieChartWidget } from "./widgets/pie-chart-widget";
import { NumberWidget } from "./widgets/number-widget";

interface WidgetChartRendererProps {
  widget: IAnalyticsDashboardWidget;
  widgetData: IAnalyticsChartData | IAnalyticsNumberWidgetData | undefined;
  isLoading: boolean;
  hasError: boolean;
}

// Type guards
const isChartData = (data: unknown): data is IAnalyticsChartData =>
  !!data && typeof data === "object" && "data" in data && "schema" in data;

const isNumberData = (data: unknown): data is IAnalyticsNumberWidgetData =>
  !!data && typeof data === "object" && "value" in data && "metric" in data;

/** Renders loading / error / chart content for a single analytics widget. */
export const WidgetChartRenderer = ({ widget, widgetData, isLoading, hasError }: WidgetChartRendererProps) => {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader>
          <Loader.Item height="40px" width="40px" />
        </Loader>
      </div>
    );
  }

  if (hasError || !widgetData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-sm text-tertiary">Failed to load widget data</p>
      </div>
    );
  }

  const chartProps = {
    config: widget.config,
    chartProperty: widget.chart_property,
    chartMetric: widget.chart_metric,
  };

  switch (widget.widget_type) {
    case EAnalyticsWidgetType.BAR:
      return isChartData(widgetData) ? <BarChartWidget data={widgetData} {...chartProps} /> : null;
    case EAnalyticsWidgetType.LINE:
      return isChartData(widgetData) ? <LineChartWidget data={widgetData} {...chartProps} /> : null;
    case EAnalyticsWidgetType.AREA:
      return isChartData(widgetData) ? <AreaChartWidget data={widgetData} {...chartProps} /> : null;
    case EAnalyticsWidgetType.DONUT:
      return isChartData(widgetData) ? <DonutChartWidget data={widgetData} {...chartProps} /> : null;
    case EAnalyticsWidgetType.PIE:
      return isChartData(widgetData) ? <PieChartWidget data={widgetData} {...chartProps} /> : null;
    case EAnalyticsWidgetType.NUMBER:
      return isNumberData(widgetData) ? (
        <NumberWidget data={widgetData} config={widget.config} chartMetric={widget.chart_metric} />
      ) : null;
    default:
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-tertiary">Unsupported widget type</p>
        </div>
      );
  }
};
