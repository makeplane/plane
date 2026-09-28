/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Turns the AnalyticsQuery V2 cell list (§32.1) into the shape the existing
 * chart + insight-table renderers consume (§4 baseline).
 *
 * Pure so the display/normalization behaviour is unit-testable (§49.6). Raw
 * values, percentages and the server-rendered display string are all carried
 * on each row so the on-screen table and the CSV export agree (§17.4, §50.14).
 */

import type { TAnalyticsCell, TAnalyticsDisplay, TAnalyticsDateGrouping } from "@plane/types";

export interface InsightChartRow {
  /** Resolved display label for the primary dimension value. */
  name: string;
  /** Plotted value — honours the display mode (§17.4). */
  count: number;
  /** Sum of the raw series values for this group (breakdown tables). */
  __total: number;
  /** Raw primary-dimension value; the drill-down selection key (§25). */
  __group: string | null;
  /** seriesKey → raw (un-normalised) value. */
  __raw: Record<string, number>;
  /** seriesKey → normalised share in 0..1, `null` when normalisation is off. */
  __pct: Record<string, number | null>;
  /** seriesKey → server-rendered display string, e.g. `18 pts · 42.9%`. */
  __display: Record<string, string>;
  [seriesKey: string]: unknown;
}

export interface InsightChartData {
  rows: InsightChartRow[];
  /** seriesKey → series display label (the chart legend + table columns). */
  schema: Record<string, string>;
  seriesKeys: string[];
  hasBreakdown: boolean;
}

export const SERIES_FALLBACK_KEY = "count";

export const formatValue = (value: number, unit = ""): string => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  if (numeric === Math.trunc(numeric)) return `${numeric}${unit}`;
  return `${numeric.toFixed(2)}${unit}`;
};

export const formatPercentage = (pct: number | null | undefined): string =>
  pct === null || pct === undefined || !Number.isFinite(pct) ? "—" : `${(pct * 100).toFixed(1)}%`;

/**
 * §9.3 date bucket → human label. The engine emits `YYYY-MM-DD` (day/week),
 * `YYYY-MM` (month), `YYYY-Qn` (quarter) and `YYYY` (year).
 */
export const formatDateBucket = (raw: string, grouping: TAnalyticsDateGrouping = "day"): string => {
  if (!raw) return "—";

  const quarterMatch = /^(\d{4})-Q([1-4])$/.exec(raw);
  if (quarterMatch) return `Q${quarterMatch[2]} ${quarterMatch[1]}`;

  const yearOnly = /^\d{4}$/.exec(raw);
  if (yearOnly) return raw;

  const parts = raw.split("-");
  if (parts.length < 2) return raw;
  const [year, month, day] = parts;
  const monthIndex = Number(month) - 1;
  if (Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return raw;

  const monthName = new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(Number(year), monthIndex, 1));
  const currentYear = new Date().getFullYear();

  switch (grouping) {
    case "year":
      return year;
    case "quarter":
      return `Q${Math.floor(monthIndex / 3) + 1} ${year}`;
    case "month":
      return Number(year) === currentYear ? monthName : `${monthName}, ${year}`;
    case "week": {
      if (!day) return `${monthName}, ${year}`;
      const date = new Date(Number(year), monthIndex, Number(day));
      const week = Math.ceil(((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
      return `${monthName}, Week ${week}`;
    }
    case "day":
    default: {
      if (!day) return `${monthName}, ${year}`;
      const label = `${monthName} ${Number(day)}`;
      return Number(year) === currentYear ? label : `${label}, ${year}`;
    }
  }
};

/** The value a bar segment plots, honouring the display mode (§17.4). */
export const plotValue = (cell: TAnalyticsCell | undefined, display: TAnalyticsDisplay): number => {
  if (!cell) return 0;
  if (display === "percentage" && cell.percentage !== null && cell.percentage !== undefined) return cell.percentage;
  return cell.value;
};

export interface TBuildInsightChartData {
  cells: TAnalyticsCell[];
  /** Label for the single-series (no breakdown) case. */
  metricLabel: string;
  hasBreakdown: boolean;
  display: TAnalyticsDisplay;
  /** Resolves a raw primary-dimension value to a display label. */
  resolveGroup: (raw: string | null) => string;
  /** Resolves a raw series value to a display label. */
  resolveSeries: (raw: string | null) => string;
  /** When set, groups are bucket labels and are ordered chronologically (§9.3). */
  dateGrouping?: TAnalyticsDateGrouping;
  /** Metric unit appended to value strings, e.g. ` pts` (§14.2). */
  unit?: string;
}

/**
 * Group the flat V2 cell list into chart rows.
 *
 * Without a breakdown every cell lands under the synthetic `count` series so
 * the renderer keeps working exactly as it does today. With a breakdown each
 * distinct series becomes a stacked bar segment keyed by its raw value — the
 * same key the drill-down selection uses (§25).
 */
export function buildInsightChartData(options: TBuildInsightChartData): InsightChartData {
  const { cells, metricLabel, hasBreakdown, display, resolveGroup, resolveSeries, dateGrouping, unit = "" } = options;

  const groupOrder: string[] = [];
  const seriesOrder: string[] = [];
  const grouped = new Map<string, Map<string, TAnalyticsCell>>();
  const seriesSeen = new Set<string>();

  for (const cell of cells ?? []) {
    const groupKey = cell.group === null || cell.group === undefined ? "" : String(cell.group);
    const seriesKey = hasBreakdown
      ? cell.series === null || cell.series === undefined
        ? ""
        : String(cell.series)
      : SERIES_FALLBACK_KEY;

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, new Map());
      groupOrder.push(groupKey);
    }
    if (!seriesSeen.has(seriesKey)) {
      seriesSeen.add(seriesKey);
      seriesOrder.push(seriesKey);
    }
    grouped.get(groupKey)?.set(seriesKey, cell);
  }

  // Date buckets arrive metric-ordered from the engine; a calendar axis must
  // read chronologically (§9.3).
  if (dateGrouping) groupOrder.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const schema: Record<string, string> = {};
  for (const seriesKey of seriesOrder) {
    schema[seriesKey] = hasBreakdown ? resolveSeries(seriesKey || null) : metricLabel;
  }

  const rows: InsightChartRow[] = groupOrder.map((groupKey) => {
    const seriesMap = grouped.get(groupKey) ?? new Map<string, TAnalyticsCell>();
    const row: InsightChartRow = {
      name: resolveGroup(groupKey || null),
      count: 0,
      __total: 0,
      __group: groupKey || null,
      __raw: {},
      __pct: {},
      __display: {},
    };
    let total = 0;
    for (const seriesKey of seriesOrder) {
      const cell = seriesMap.get(seriesKey);
      const raw = cell?.value ?? 0;
      total += raw;
      row[seriesKey] = plotValue(cell, display);
      row.__raw[seriesKey] = raw;
      row.__pct[seriesKey] = cell?.percentage ?? null;
      // The engine renders `display` whenever the display mode is not `value`
      // (§17.4); fall back to a plain value string for `value` mode.
      row.__display[seriesKey] = cell?.display ?? formatValue(raw, unit);
    }
    row.__total = total;
    row.count = hasBreakdown ? total : ((row[SERIES_FALLBACK_KEY] as number) ?? 0);
    return row;
  });

  return { rows, schema, seriesKeys: seriesOrder, hasBreakdown };
}

/** §20 cross-tab model, shaped structurally so any producer can feed the renderer. */
export type MatrixTableModel = {
  rowKeys: string[];
  colKeys: string[];
  cells: Record<string, Record<string, { raw: number; display: string }>>;
  rowTotals: Record<string, number>;
  colTotals: Record<string, number>;
  grandTotal: number;
};

/**
 * §12 / §20 — the flat V2 cell list as a matrix model with row, column and
 * grand totals. Lives here rather than in a dashboard surface so the matrix
 * renderer has one generic producer no matter which surface asks for it.
 */
export function buildMatrixTableModel(
  cells: TAnalyticsCell[],
  display: TAnalyticsDisplay,
  unit = ""
): MatrixTableModel {
  const rowKeys: string[] = [];
  const colKeys: string[] = [];
  const rowSet = new Set<string>();
  const colSet = new Set<string>();
  const grid = new Map<string, Map<string, TAnalyticsCell>>();

  for (const cell of cells ?? []) {
    const row = cell.group === null || cell.group === undefined ? "" : String(cell.group);
    const col = cell.series === null || cell.series === undefined ? "" : String(cell.series);
    if (!rowSet.has(row)) {
      rowSet.add(row);
      rowKeys.push(row);
    }
    if (!colSet.has(col)) {
      colSet.add(col);
      colKeys.push(col);
    }
    if (!grid.has(row)) grid.set(row, new Map());
    grid.get(row)?.set(col, cell);
  }

  const cellsOut: MatrixTableModel["cells"] = {};
  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};
  let grandTotal = 0;

  for (const row of rowKeys) {
    cellsOut[row] = {};
    let rowSum = 0;
    for (const col of colKeys) {
      const cell = grid.get(row)?.get(col);
      const raw = cell?.value ?? 0;
      rowSum += raw;
      colTotals[col] = (colTotals[col] ?? 0) + raw;
      const displayStr =
        cell?.display ??
        (display === "percentage"
          ? formatPercentage(cell?.percentage)
          : display === "value_and_percentage"
            ? `${formatValue(raw, unit)} · ${formatPercentage(cell?.percentage)}`
            : formatValue(raw, unit));
      cellsOut[row][col] = { raw, display: displayStr };
    }
    rowTotals[row] = rowSum;
    grandTotal += rowSum;
  }

  return { rowKeys, colKeys, cells: cellsOut, rowTotals, colTotals, grandTotal };
}
