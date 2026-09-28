/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef, Row, RowData, Table } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { Download, Info } from "lucide-react";
import { ANALYTICS_X_AXIS_VALUES, ANALYTICS_Y_AXIS_VALUES, CHART_COLOR_PALETTES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type {
  TAnalyticsDateGrouping,
  TAnalyticsDisplay,
  TAnalyticsDrilldownRequestV2,
  TAnalyticsQueryV2,
  ChartXAxisProperty,
  ChartYAxisMetric,
  TBarItem,
  TChartData,
} from "@plane/types";
// web components
import { generateExtendedColors } from "@/components/chart/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// services
import { AnalyticsService } from "@/services/analytics.service";
// local
import { exportCSV } from "../export";
import { DataTable } from "../insight-table/data-table";
import { ChartLoader } from "../loaders";
import { generateBarColor } from "./utils";
import {
  METRIC_LABELS,
  buildInsightChartData,
  buildDrilldownRequest,
  formatPercentage,
  formatValue,
  isDateDimension,
  metricUnit,
  toMetricKey,
} from "../v2";
import InsightDrilldownDrawer from "../v2/insight-drilldown";
import { SERIES_FALLBACK_KEY, type InsightChartRow } from "../v2/cells";
import { useInsightValueResolver } from "../v2/use-insight-value-resolver";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    export: {
      key: string;
      value: (row: Row<TData>) => string | number;
      label?: string;
    };
  }
}

interface Props {
  query: TAnalyticsQueryV2 | null;
  x_axis: ChartXAxisProperty;
  y_axis: ChartYAxisMetric;
  group_by?: ChartXAxisProperty;
  date_grouping?: TAnalyticsDateGrouping;
  display: TAnalyticsDisplay;
}

const analyticsService = new AnalyticsService();

/**
 * Customized Insights V2 (§18) — the interactive half of the one-engine design
 * (§3.1). Every number on screen comes from `POST /analytics/v2/query`; the
 * client only resolves labels and lays the cells out for the chart and table.
 */
const InsightChart = observer(function InsightChart(props: Props) {
  const { query, x_axis, y_axis, group_by, date_grouping, display } = props;
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString() ?? "";
  const { workspaceStates } = useProjectState();
  const { resolvedTheme } = useTheme();
  const resolve = useInsightValueResolver();

  const [drilldown, setDrilldown] = useState<TAnalyticsDrilldownRequestV2 | null>(null);

  const { data, isLoading, error } = useSWR(query ? `analytics-v2-query-${slug}-${JSON.stringify(query)}` : null, () =>
    analyticsService.postAnalyticsV2Query(slug, query as TAnalyticsQueryV2)
  );

  const primaryDim = query?.dimensions?.[0]?.key ?? null;
  const seriesDim = query?.dimensions?.[1]?.key ?? null;
  const hasBreakdown = !!seriesDim;
  const dateDimension = isDateDimension(primaryDim);
  // §25 drill-down resolves raw column values; a date bucket label is a
  // derived value, so calendar axes read but do not drill (RD-454 note).
  const canDrilldown = !!primaryDim && !dateDimension;
  const metricKey = query?.metrics?.[0]?.key ?? toMetricKey(y_axis);
  const metricLabel = METRIC_LABELS[metricKey] ?? metricKey;
  const unit = metricUnit(metricKey);

  const chartData = useMemo(() => {
    if (!data) return null;
    return buildInsightChartData({
      cells: data.data ?? [],
      metricLabel,
      hasBreakdown,
      display,
      unit,
      dateGrouping: dateDimension ? (date_grouping ?? "day") : undefined,
      resolveGroup: (raw) => resolve(primaryDim, raw, date_grouping),
      resolveSeries: (raw) => resolve(seriesDim, raw),
    });
  }, [data, dateDimension, date_grouping, display, hasBreakdown, metricLabel, primaryDim, resolve, seriesDim, unit]);

  const seriesKeys = useMemo(() => chartData?.seriesKeys ?? [], [chartData]);

  const xAxisLabel = useMemo(
    () => ANALYTICS_X_AXIS_VALUES.find((item) => item.value === x_axis)?.label ?? x_axis,
    [x_axis]
  );
  const yAxisLabel = useMemo(
    () => ANALYTICS_Y_AXIS_VALUES.find((item) => item.value === y_axis)?.label ?? metricLabel,
    [metricLabel, y_axis]
  );
  const baseColors = useMemo(
    () => CHART_COLOR_PALETTES[0]?.[resolvedTheme === "dark" ? "dark" : "light"] ?? [],
    [resolvedTheme]
  );

  const bars: TBarItem<string>[] = useMemo(() => {
    if (!chartData) return [];
    if (!hasBreakdown) {
      return [
        {
          key: "count",
          label: metricLabel,
          stackId: "bar-one",
          fill: (payload: Record<string, unknown>) =>
            generateBarColor(
              (payload?.__group as string | null) ?? undefined,
              { x_axis, y_axis, group_by },
              baseColors,
              workspaceStates
            ),
          textClassName: "",
          showPercentage: false,
          showTopBorderRadius: () => true,
          showBottomBorderRadius: () => true,
        },
      ];
    }
    const extendedColors = generateExtendedColors(baseColors, chartData.seriesKeys.length);
    const extremes: Record<string, { top: string | null; bottom: string | null }> = {};
    for (const row of chartData.rows) {
      let top: string | null = null;
      let bottom: string | null = null;
      for (const key of chartData.seriesKeys) {
        if (!row[key]) continue;
        if (!bottom) bottom = key;
        top = key;
      }
      extremes[String(row.__group)] = { top, bottom };
    }
    return chartData.seriesKeys.map((key, index) => ({
      key,
      label: chartData.schema[key] ?? key,
      stackId: "bar-one",
      fill: extendedColors[index] ?? baseColors[0] ?? "#6172E8",
      textClassName: "",
      showPercentage: false,
      showTopBorderRadius: (barKey: string, payload: Record<string, unknown>) =>
        extremes[String(payload?.__group)]?.top === barKey,
      showBottomBorderRadius: (barKey: string, payload: Record<string, unknown>) =>
        extremes[String(payload?.__group)]?.bottom === barKey,
    }));
  }, [baseColors, chartData, group_by, hasBreakdown, metricLabel, workspaceStates, x_axis, y_axis]);

  const openDrilldown = useCallback(
    (groupValue: string | null, seriesValue: string | null) => {
      if (!query || !primaryDim || !canDrilldown) return;
      const request = buildDrilldownRequest(
        { query, primaryKey: primaryDim, groupValue, seriesValue: hasBreakdown ? seriesValue : null },
        { seriesKey: hasBreakdown ? seriesDim : null }
      );
      if (request) setDrilldown(request);
    },
    [canDrilldown, hasBreakdown, primaryDim, query, seriesDim]
  );

  const columns: ColumnDef<InsightChartRow>[] = useMemo(() => {
    if (!chartData) return [];
    const metricColumns: ColumnDef<InsightChartRow>[] = [];
    if (hasBreakdown) {
      metricColumns.push({
        id: "count",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => <div className="text-right">{formatValue(row.original.__total, unit)}</div>,
        meta: {
          export: { key: "Total", value: (row) => row.original.__total, label: "Total" },
        },
      });
    }
    for (const key of seriesKeys) {
      const columnId = key || SERIES_FALLBACK_KEY;
      const label = (chartData.schema[key] ?? key) || "—";
      metricColumns.push({
        id: columnId,
        accessorFn: (row) => row.__display[key] ?? "",
        header: () => <div className="text-right">{label}</div>,
        cell: ({ row }) =>
          canDrilldown ? (
            <button
              type="button"
              className="w-full cursor-pointer rounded-sm text-right hover:bg-layer-1"
              title="Drill down to matching work items"
              onClick={() => openDrilldown(row.original.__group, hasBreakdown ? key : null)}
            >
              {row.original.__display[key] ?? "—"}
            </button>
          ) : (
            <div className="w-full text-right">{row.original.__display[key] ?? "—"}</div>
          ),
        meta: { export: { key: label, value: (row) => row.original.__raw[key] ?? 0, label } },
      });
      if (display !== "value") {
        metricColumns.push({
          id: `${columnId}__pct`,
          accessorFn: (row) => formatPercentage(row.__pct[key]),
          header: () => <div className="text-right">{`${label} %`}</div>,
          cell: ({ row }) => <div className="text-right">{formatPercentage(row.original.__pct[key])}</div>,
          meta: {
            export: {
              key: `${label} %`,
              value: (row) => formatPercentage(row.original.__pct[key]),
              label: `${label} %`,
            },
          },
        });
      }
    }
    return [
      {
        id: "name",
        accessorFn: (row) => row.name,
        header: () => <div className="text-left">{xAxisLabel}</div>,
        cell: ({ row }) => <div className="text-left">{row.original.name}</div>,
        meta: { export: { key: xAxisLabel, value: (row) => row.original.name, label: xAxisLabel } },
      },
      ...metricColumns,
    ];
  }, [canDrilldown, chartData, display, hasBreakdown, openDrilldown, seriesKeys, unit, xAxisLabel]);

  if (!query) {
    return (
      <EmptyStateCompact
        assetKey="unknown"
        assetClassName="size-20"
        rootClassName="border border-subtle px-5 py-10 md:py-20 md:px-20"
        title={t("workspace_empty_state.analytics_work_items.title")}
      />
    );
  }

  if (isLoading) return <ChartLoader />;

  if (error) {
    return (
      <div className="text-danger rounded-md border border-subtle px-5 py-6 text-13">
        {(error as { error?: string } | undefined)?.error ?? "Could not load this insight."}
      </div>
    );
  }

  if (!chartData || chartData.rows.length === 0) {
    return (
      <EmptyStateCompact
        assetKey="unknown"
        assetClassName="size-20"
        rootClassName="border border-subtle px-5 py-10 md:py-20 md:px-20"
        title={t("workspace_empty_state.analytics_work_items.title")}
      />
    );
  }

  const warnings = data?.warnings ?? [];

  return (
    <div className="flex flex-col gap-12">
      {warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-subtle bg-surface-1 px-3 py-2 text-13 text-secondary">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tertiary" />
          <span>{warnings[0]?.message}</span>
        </div>
      )}
      <BarChart
        className="h-[370px] w-full"
        data={chartData.rows as unknown as TChartData<string, string>[]}
        bars={bars}
        margin={{ bottom: 30 }}
        xAxis={{ key: "name", label: xAxisLabel.replace("_", " "), dy: 30 }}
        yAxis={{
          key: "count",
          label: t("common.no_of", {
            entity: `${display === "percentage" ? "Share of " : ""}${yAxisLabel.replace("_", " ")}`,
          }),
          offset: -60,
          dx: -26,
        }}
        onBarClick={({ datum, barKey }) =>
          openDrilldown((datum?.__group as string | null) ?? null, hasBreakdown ? barKey : null)
        }
      />
      <DataTable
        data={chartData.rows}
        columns={columns}
        searchPlaceholder={`${chartData.rows.length} ${xAxisLabel}`}
        actions={(table: Table<InsightChartRow>) => (
          <Button
            variant="secondary"
            prependIcon={<Download className="h-3.5 w-3.5" />}
            onClick={() => exportCSV(table.getRowModel().rows, columns, slug)}
          >
            <div>{t("exporter.csv.short_description")}</div>
          </Button>
        )}
      />
      {drilldown && (
        <InsightDrilldownDrawer workspaceSlug={slug} request={drilldown} onClose={() => setDrilldown(null)} />
      )}
    </div>
  );
});

export default InsightChart;
