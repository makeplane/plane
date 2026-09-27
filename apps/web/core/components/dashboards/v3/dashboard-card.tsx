/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * One Workspace Dashboard card body (spec §12, §24.2.15).
 *
 * Mounts the generic renderers extracted in RD-479 — the card owns layout and
 * drill-down wiring only. It never aggregates: value, percentage, total and
 * truncation all arrive in the engine's response (§10.1).
 *
 * Three states, and only three: loading, error, and rendered. The error state
 * is the card's own, so one rejected query never blanks the dashboard (§11).
 */

import { useCallback, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Download } from "lucide-react";
import { CHART_COLOR_PALETTES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { TAnalyticsDrilldownRequestV2, TAnalyticsQueryResponseV2 } from "@plane/types";
import { buildInsightChartData, buildMatrixTableModel } from "@/components/analytics/v2/cells";
import { aggregateCellsToCsvRows, downloadCsv, matrixToCsvRows } from "@/components/analytics/v2/csv";
import { buildDrilldownRequest } from "@/components/analytics/v2/drilldown";
import InsightDrilldownDrawer from "@/components/analytics/v2/insight-drilldown";
import { isDateDimension, METRIC_LABELS, metricUnit } from "@/components/analytics/v2/mapping";
import {
  AggregateTableRenderer,
  BarRenderer,
  DonutRenderer,
  GaugeRenderer,
  LineRenderer,
  MatrixRenderer,
  NumberRenderer,
  PieRenderer,
  WidgetTruncationBanner,
  WorkItemTableRenderer,
} from "@/components/analytics/v2/renderers";
import { useInsightValueResolver } from "@/components/analytics/v2/use-insight-value-resolver";

import type { TWorkspaceDashboardBatchQuery, TWorkspaceDashboardCardResult } from "./batch-composer";
import { isCardDataEmpty } from "./batch-composer";
import type { TCardDefinition, TCardPreference } from "./card-registry";
import { CardDateBasisOverrideLabel, WorkspaceDashboardCardControls } from "./card-controls";

type Props = {
  card: TCardDefinition;
  preference: TCardPreference;
  query: TWorkspaceDashboardBatchQuery;
  result: TWorkspaceDashboardCardResult | undefined;
  workspaceSlug: string;
  onPreferenceChange: (updates: Partial<TCardPreference>) => void;
  onReset: () => void;
};

export function WorkspaceDashboardCard({
  card,
  preference,
  query,
  result,
  workspaceSlug,
  onPreferenceChange,
  onReset,
}: Props) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const resolve = useInsightValueResolver();
  const [drilldown, setDrilldown] = useState<TAnalyticsDrilldownRequestV2 | null>(null);

  const display = query.display ?? "value";
  const metricKey = query.metrics?.[0]?.key ?? "work_item_count";
  const metricLabel = METRIC_LABELS[metricKey] ?? metricKey;
  const unit = metricUnit(metricKey);
  const primaryDim = query.dimensions?.[0]?.key ?? null;
  const seriesDim = query.dimensions?.[1]?.key ?? null;
  const hasBreakdown = !!seriesDim;
  const dateDimension = isDateDimension(primaryDim);
  const canDrilldown = !!primaryDim && !dateDimension;

  const baseColors = useMemo(
    () => CHART_COLOR_PALETTES[0]?.[resolvedTheme === "dark" ? "dark" : "light"] ?? [],
    [resolvedTheme]
  );

  const response = result?.status === "ok" ? result.data : null;

  const chartData = useMemo(() => {
    if (!response) return null;
    return buildInsightChartData({
      cells: response.data ?? [],
      metricLabel,
      hasBreakdown,
      display,
      unit,
      dateGrouping: dateDimension ? (query.time?.group ?? "day") : undefined,
      resolveGroup: (raw) => resolve(primaryDim, raw, query.time?.group),
      resolveSeries: (raw) => resolve(seriesDim, raw),
    });
  }, [
    dateDimension,
    display,
    hasBreakdown,
    metricLabel,
    primaryDim,
    query.time?.group,
    resolve,
    response,
    seriesDim,
    unit,
  ]);

  const matrixModel = useMemo(
    () =>
      response && preference.renderer === "matrix" ? buildMatrixTableModel(response.data ?? [], display, unit) : null,
    [display, preference.renderer, response, unit]
  );

  // §13 — the drill-down replays the *same* query with the clicked cell's
  // selection; the engine derives the rows server-side under the same ACL.
  const openDrilldown = useCallback(
    (groupValue: string | null, seriesValue: string | null) => {
      if (!primaryDim || !canDrilldown) return;
      const request = buildDrilldownRequest(
        { query, primaryKey: primaryDim, groupValue, seriesValue: hasBreakdown ? seriesValue : null },
        { seriesKey: hasBreakdown ? seriesDim : null }
      );
      if (request) setDrilldown(request);
    },
    [canDrilldown, hasBreakdown, primaryDim, query, seriesDim]
  );

  const exportCsv = useCallback(() => {
    if (!response) return;
    const filename = `${card.id}.csv`;
    if (matrixModel) {
      const colLabels: Record<string, string> = {};
      for (const key of matrixModel.colKeys) colLabels[key] = resolve(seriesDim, key || null);
      let body = matrixToCsvRows(matrixModel, colLabels);
      const truncated = response.warnings?.find((warning) => warning.code === "RESULT_TRUNCATED");
      if (truncated) body += `# ${truncated.message}\n`;
      downloadCsv(filename, body);
      return;
    }
    downloadCsv(filename, aggregateCellsToCsvRows(response, { includeTruncationNote: true }));
  }, [card.id, matrixModel, resolve, response, seriesDim]);

  // §7.1 — the KPI band renders five cards across `lg:grid-cols-5`, which at
  // desktop widths leaves ~165px per card. A horizontal header would let
  // "Configure" + "Export as csv" crowd the title off the right edge, so the
  // KPI cards stack title above controls (and collapse the Export button to
  // icon-only to keep the row from wrapping); the other sections keep the
  // side-by-side header that fits their wider columns.
  const exportLabel = t("exporter.csv.short_description");
  const header =
    card.section === "kpi" ? (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-13 font-medium text-primary">{t(card.titleKey)}</h3>
          <CardDateBasisOverrideLabel card={card} />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <WorkspaceDashboardCardControls
            card={card}
            preference={preference}
            onChange={onPreferenceChange}
            onReset={onReset}
          />
          <Button
            variant="secondary"
            size="sm"
            prependIcon={<Download className="h-3.5 w-3.5" />}
            onClick={exportCsv}
            aria-label={exportLabel}
            // §7.1 — KPI cards have ~140px of inner width; the Export label is
            // wider than the row. Drop the label so the icon alone fits while
            // aria-label keeps the action accessible.
          />
        </div>
      </div>
    ) : (
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-13 font-medium text-primary">{t(card.titleKey)}</h3>
          <CardDateBasisOverrideLabel card={card} />
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <WorkspaceDashboardCardControls
            card={card}
            preference={preference}
            onChange={onPreferenceChange}
            onReset={onReset}
          />
          <Button
            variant="secondary"
            size="sm"
            prependIcon={<Download className="h-3.5 w-3.5" />}
            onClick={exportCsv}
            aria-label={exportLabel}
          >
            {exportLabel}
          </Button>
        </div>
      </div>
    );

  if (!result || result.status === "pending") {
    return (
      <div className="flex h-full flex-col gap-2 p-3" data-testid={`dashboard-v3-card-${card.id}`}>
        {header}
        <p className="text-12 text-tertiary">{t("dashboard_v3.card.loading")}</p>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="flex h-full flex-col gap-2 p-3" data-testid={`dashboard-v3-card-${card.id}`}>
        {header}
        <EmptyStateCompact
          assetKey="unknown"
          title={t("dashboard_v3.card.error")}
          description={result.error.message}
          rootClassName="flex-1 border-0 py-6"
        />
      </div>
    );
  }

  if (isCardDataEmpty(result)) {
    return (
      <div className="flex h-full flex-col gap-2 p-3" data-testid={`dashboard-v3-card-${card.id}`}>
        {header}
        <WidgetTruncationBanner warnings={result.data.warnings} />
        <EmptyStateCompact
          assetKey="unknown"
          title={t("dashboard_v3.card.no_data")}
          rootClassName="flex-1 border-0 py-6"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3" data-testid={`dashboard-v3-card-${card.id}`}>
      {header}
      <WidgetTruncationBanner warnings={result.data.warnings} />
      <div className="min-h-0 flex-1 overflow-auto">{renderBody(result.data)}</div>
      {drilldown ? (
        <InsightDrilldownDrawer workspaceSlug={workspaceSlug} request={drilldown} onClose={() => setDrilldown(null)} />
      ) : null}
    </div>
  );

  function renderBody(data: TAnalyticsQueryResponseV2) {
    switch (preference.renderer) {
      case "number":
        return <NumberRenderer value={data.totals?.[metricKey] ?? data.data?.[0]?.value ?? 0} unit={unit} />;
      case "gauge":
        return <GaugeRenderer response={data} metricKey={metricKey} unit={unit} />;
      case "bar":
        return chartData ? (
          <BarRenderer
            chartData={chartData}
            barMode={hasBreakdown ? "stacked" : "basic"}
            baseColors={baseColors}
            onBarClick={openDrilldown}
            canDrilldown={canDrilldown}
          />
        ) : null;
      case "line":
        return chartData ? (
          <LineRenderer
            chartData={chartData}
            baseColors={baseColors}
            hasBreakdown={hasBreakdown}
            canDrilldown={canDrilldown}
            onPointClick={openDrilldown}
          />
        ) : null;
      case "pie":
        return chartData ? (
          <PieRenderer
            chartData={chartData}
            baseColors={baseColors}
            canDrilldown={canDrilldown}
            onSliceClick={(group) => openDrilldown(group, null)}
          />
        ) : null;
      case "donut":
        return chartData ? (
          <DonutRenderer
            chartData={chartData}
            progress={false}
            baseColors={baseColors}
            canDrilldown={canDrilldown}
            onSliceClick={(group) => openDrilldown(group, null)}
          />
        ) : null;
      case "matrix":
        return matrixModel ? (
          <MatrixRenderer
            model={matrixModel}
            resolveRow={(key) => resolve(primaryDim, key || null)}
            resolveCol={(key) => resolve(seriesDim, key || null)}
            onCellClick={(row, col) => openDrilldown(row || null, col || null)}
            canDrilldown={canDrilldown && !!seriesDim}
          />
        ) : null;
      case "work_item_table":
        return (
          <WorkItemTableRenderer
            workspaceSlug={workspaceSlug}
            dashboardId=""
            widgetId={card.id}
            chartData={chartData}
            canDrilldown={canDrilldown}
            onDrilldown={openDrilldown}
            onOpenWorkItems={() => {
              // The engine reads an empty selection as "every work item in this
              // card's query", which is what the button asks for (§13).
              const { key: _cardKey, ...aggregateQuery } = query;
              setDrilldown({
                query: aggregateQuery,
                selection: {} as TAnalyticsDrilldownRequestV2["selection"],
                page: 1,
                page_size: 25,
              });
            }}
          />
        );
      default:
        return <AggregateTableRenderer totals={data.totals ?? {}} />;
    }
  }
}
