/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Copy, GripVertical, MoreVertical, Settings, Trash2 } from "lucide-react";
import { useOutsideClickDetector } from "@plane/hooks";
import { Loader } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EAnalyticsWidgetType } from "@plane/types";
import type { IAnalyticsDashboardWidget, IAnalyticsChartData, IAnalyticsNumberWidgetData } from "@plane/types";
import { useAnalyticsDashboard } from "@/hooks/store/use-analytics-dashboard";
import { BarChartWidget } from "./widgets/bar-chart-widget";
import { LineChartWidget } from "./widgets/line-chart-widget";
import { AreaChartWidget } from "./widgets/area-chart-widget";
import { DonutChartWidget } from "./widgets/donut-chart-widget";
import { PieChartWidget } from "./widgets/pie-chart-widget";
import { NumberWidget } from "./widgets/number-widget";

type AnalyticsDashboardWidgetCardProps = {
  widget: IAnalyticsDashboardWidget;
  workspaceSlug: string;
  dashboardId: string;
  isEditMode: boolean;
  onDelete: (widgetId: string) => void;
  onConfigure: (widgetId: string) => void;
  onDuplicate?: (widgetId: string) => void;
};

export const AnalyticsDashboardWidgetCard = observer(function AnalyticsDashboardWidgetCard({
  widget,
  workspaceSlug,
  dashboardId,
  isEditMode,
  onDelete,
  onConfigure,
  onDuplicate,
}: AnalyticsDashboardWidgetCardProps) {
  const analyticsDashboardStore = useAnalyticsDashboard();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  useOutsideClickDetector(menuRef, () => setShowMenu(false));
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        await analyticsDashboardStore.fetchWidgetData(workspaceSlug, dashboardId, widget.id);
      } catch (error) {
        console.error("Failed to fetch widget data:", error);
        setHasError(true);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Failed to load widget data",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workspaceSlug, dashboardId, widget.id, analyticsDashboardStore]);

  const widgetData = analyticsDashboardStore.widgetDataMap.get(widget.id);

  // Type guard to check if data is chart data
  const isChartData = (data: any): data is IAnalyticsChartData => {
    return data && "data" in data && "schema" in data;
  };

  // Type guard to check if data is number widget data
  const isNumberData = (data: any): data is IAnalyticsNumberWidgetData => {
    return data && "value" in data && "metric" in data;
  };

  const renderWidget = () => {
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
          <p className="text-sm text-custom-text-300">Failed to load widget data</p>
        </div>
      );
    }

    switch (widget.widget_type) {
      case EAnalyticsWidgetType.BAR:
        if (!isChartData(widgetData)) return null;
        return (
          <BarChartWidget
            data={widgetData}
            config={widget.config}
            chartProperty={widget.chart_property}
            chartMetric={widget.chart_metric}
          />
        );
      case EAnalyticsWidgetType.LINE:
        if (!isChartData(widgetData)) return null;
        return (
          <LineChartWidget
            data={widgetData}
            config={widget.config}
            chartProperty={widget.chart_property}
            chartMetric={widget.chart_metric}
          />
        );
      case EAnalyticsWidgetType.AREA:
        if (!isChartData(widgetData)) return null;
        return (
          <AreaChartWidget
            data={widgetData}
            config={widget.config}
            chartProperty={widget.chart_property}
            chartMetric={widget.chart_metric}
          />
        );
      case EAnalyticsWidgetType.DONUT:
        if (!isChartData(widgetData)) return null;
        return (
          <DonutChartWidget
            data={widgetData}
            config={widget.config}
            chartProperty={widget.chart_property}
            chartMetric={widget.chart_metric}
          />
        );
      case EAnalyticsWidgetType.PIE:
        if (!isChartData(widgetData)) return null;
        return (
          <PieChartWidget
            data={widgetData}
            config={widget.config}
            chartProperty={widget.chart_property}
            chartMetric={widget.chart_metric}
          />
        );
      case EAnalyticsWidgetType.NUMBER:
        if (!isNumberData(widgetData)) return null;
        return (
          <NumberWidget
            data={widgetData}
            config={widget.config}
            chartMetric={widget.chart_metric}
          />
        );
      default:
        return (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-custom-text-300">Unsupported widget type</p>
          </div>
        );
    }
  };

  return (
    <div className="relative h-full rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isEditMode && (
            <div className="widget-drag-handle cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-custom-text-400" />
            </div>
          )}
          <h3 className="text-sm font-medium text-custom-text-200">{widget.title}</h3>
        </div>
        {isEditMode && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-custom-background-80"
            >
              <MoreVertical className="h-4 w-4 text-custom-text-300" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 z-10 min-w-[160px] rounded-md border border-custom-border-200 bg-custom-background-100 shadow-lg">
                <button
                  onClick={() => {
                    onConfigure(widget.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-custom-text-200 hover:bg-custom-background-80"
                >
                  <Settings className="h-4 w-4" />
                  Configure
                </button>
                {onDuplicate && (
                  <button
                    onClick={() => {
                      onDuplicate(widget.id);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-custom-text-200 hover:bg-custom-background-80"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete(widget.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-custom-background-80"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Widget Content */}
      <div className="h-[calc(100%-3rem)]">
        {renderWidget()}
      </div>
    </div>
  );
});

