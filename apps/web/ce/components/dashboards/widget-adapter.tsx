/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Widget adapter: maps backend chart data to drill-down chart renderers.
 * Handles H2 (click drill-down), M1 (bar orientation), M2 (line type),
 * M3 (donut center value), M4 (number text align + color).
 */

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { useAppRouter } from "@/hooks/use-app-router";
import type { IDashboardWidget } from "@plane/types";
import { useCustomDashboard } from "@/plane-web/hooks/store/use-custom-dashboard";
import { DrillDownBarChart } from "./chart-renderers/drill-down-bar-chart";
import { DrillDownLineChart } from "./chart-renderers/drill-down-line-chart";
import { DrillDownAreaChart } from "./chart-renderers/drill-down-area-chart";
import { DrillDownPieChart } from "./chart-renderers/drill-down-pie-chart";

interface WidgetAdapterProps {
  widget: IDashboardWidget;
  workspaceSlug?: string;
  dashboardId?: string;
}

export const WidgetAdapter = observer(({ widget, workspaceSlug }: WidgetAdapterProps) => {
  const { t } = useTranslation();
  const router = useAppRouter();
  const dashboardStore = useCustomDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- data is MobX observable and stable
  const data = dashboardStore.widgetChartData[widget.id] || [];

  const metricKeys = useMemo(() => {
    if (!data || data.length === 0 || !data[0]) return ["count"];
    return Object.keys(data[0]).filter((k) => k !== "name");
  }, [data]);

  const isGrouped = widget.chart_model === "GROUPED" && metricKeys.length > 1;

  // H2: Build drill-down URL and navigate to filtered issue list
  const handleDrillDown = useCallback(
    (filterKey: string, filterValue: string) => {
      if (!workspaceSlug) return;
      const params = new URLSearchParams();
      params.set(filterKey, filterValue);
      router.push(`/${workspaceSlug}/issues/?${params.toString()}`);
    },
    [router, workspaceSlug]
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-tertiary text-xs">
        {t("analytics_dashboard.no_data_filters")}
      </div>
    );
  }

  switch (widget.chart_type) {
    case "NUMBER": {
      // M4: text_align and text_color from widget config
      const textAlign = (widget.config?.text_align as string) || "center";
      const rawColor = widget.config?.text_color as string | undefined;
      // Only allow valid hex color values to prevent style injection
      const textColor = rawColor && /^#[\da-fA-F]{3,8}$/.test(rawColor) ? rawColor : undefined;
      const alignClass =
        textAlign === "left" ? "justify-start pl-6" : textAlign === "right" ? "justify-end pr-6" : "justify-center";
      return (
        <div className={`flex items-center h-full ${alignClass}`}>
          <span className="text-4xl font-bold" style={textColor ? { color: textColor } : undefined}>
            {data[0]?.count ?? 0}
          </span>
        </div>
      );
    }

    case "BAR_CHART":
      return (
        <DrillDownBarChart
          widget={widget}
          data={data}
          isGrouped={isGrouped}
          metricKeys={metricKeys}
          onDrillDown={handleDrillDown}
        />
      );

    case "LINE_CHART":
      return (
        <DrillDownLineChart
          widget={widget}
          data={data}
          isGrouped={isGrouped}
          metricKeys={metricKeys}
          onDrillDown={handleDrillDown}
        />
      );

    case "AREA_CHART":
      return (
        <DrillDownAreaChart
          widget={widget}
          data={data}
          isGrouped={isGrouped}
          metricKeys={metricKeys}
          onDrillDown={handleDrillDown}
        />
      );

    case "PIE_CHART":
      return <DrillDownPieChart widget={widget} data={data} isDonut={false} onDrillDown={handleDrillDown} />;

    case "DONUT_CHART":
      return <DrillDownPieChart widget={widget} data={data} isDonut={true} onDrillDown={handleDrillDown} />;

    default:
      return (
        <div className="flex items-center justify-center h-full text-tertiary text-xs text-center p-4">
          {t("analytics_dashboard.chart_type_unsupported", { type: widget.chart_type })}
        </div>
      );
  }
});
