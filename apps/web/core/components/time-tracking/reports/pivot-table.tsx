/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { download, generateCsv, mkConfig } from "export-to-csv";
import { observer } from "mobx-react";
// plane imports
import { TIME_REPORT_DIMENSIONS, TIME_REPORT_INTERVALS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TTimeEntryFilters, TTimeReport, TTimeReportDimension, TTimeReportInterval } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { formatTimeDuration, renderFormattedDate } from "@plane/utils";
// hooks
import type { TTimeTrackingFilterPatch } from "@/hooks/time-tracking/use-time-tracking-filters";
import { useTimeReport } from "@/hooks/time-tracking/use-time-report";
// local imports
import { TimeTrackingBlockLoader } from "../loaders";
import type { TTimeUnits } from "./report-helpers";
import { filterForGroup, formatUnits, useChartColors } from "./report-helpers";

/** at most this many columns, the biggest first (dates stay in order) */
const MAX_COLUMNS = 40;

export type TPivotConfig = {
  rows: TTimeReportDimension;
  columns: TTimeReportDimension;
  interval: TTimeReportInterval;
};

type TPivotColumn = { key: string | null; label: string };

const keyOf = (key: string | null) => key ?? "__none__";

/** The pivot's columns and a cell lookup, shared by the table and the CSV export. */
export const buildPivot = (report: TTimeReport | undefined, interval: TTimeReportInterval) => {
  if (!report) return { columns: [] as TPivotColumn[], cell: () => 0, columnTotal: () => 0 };
  const totals = new Map<string, { column: TPivotColumn; seconds: number }>();
  const cells = new Map<string, number>();
  for (const group of report.groups)
    for (const sub of group.sub_groups ?? []) {
      const current = totals.get(keyOf(sub.key)) ?? { column: { key: sub.key, label: sub.label }, seconds: 0 };
      current.seconds += sub.total_seconds;
      totals.set(keyOf(sub.key), current);
      cells.set(`${keyOf(group.key)}|${keyOf(sub.key)}`, sub.total_seconds);
    }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts a fresh array
  const columns = Array.from(totals.values()).sort(
    report.sub_group_by === "date"
      ? (a, b) => (a.column.key ?? "").localeCompare(b.column.key ?? "")
      : (a, b) => b.seconds - a.seconds
  );
  const dateLabel = (key: string) => renderFormattedDate(key, interval === "month" ? "MMM yyyy" : "MMM d") ?? key;
  return {
    columns: columns
      .slice(0, MAX_COLUMNS)
      .map(({ column }) =>
        report.sub_group_by === "date" && column.key ? { key: column.key, label: dateLabel(column.key) } : column
      ),
    cell: (rowKey: string | null, columnKey: string | null) => cells.get(`${keyOf(rowKey)}|${keyOf(columnKey)}`) ?? 0,
    columnTotal: (columnKey: string | null) => totals.get(keyOf(columnKey))?.seconds ?? 0,
  };
};

/** Download the pivot as CSV (client side, like the analytics export). */
export const exportPivotCsv = (
  report: TTimeReport,
  interval: TTimeReportInterval,
  rowsLabel: string,
  fileName: string
) => {
  const { columns, cell } = buildPivot(report, interval);
  const data = report.groups.map((group) => {
    const row: Record<string, string | number> = { [rowsLabel]: group.label };
    for (const column of columns) row[column.label] = formatTimeDuration(cell(group.key, column.key), "decimal");
    row.Total = formatTimeDuration(group.total_seconds, "decimal");
    return row;
  });
  const config = mkConfig({ filename: fileName, useKeysAsHeaders: true, fieldSeparator: ",", decimalSeparator: "." });
  download(config)(generateCsv(config)(data));
};

type Props = {
  workspaceSlug: string;
  filters: TTimeEntryFilters;
  weekStart: number;
  units: TTimeUnits;
  config: TPivotConfig;
  onConfigChange: (config: TPivotConfig) => void;
  onDrillDown: (patches: TTimeTrackingFilterPatch[]) => void;
};

/** Rows × columns of time with a light heat tint (plan 9.5.4 §4). */
export const TimeReportPivotTable = observer(function TimeReportPivotTable(props: Props) {
  const { workspaceSlug, filters, weekStart, units, config, onConfigChange, onDrillDown } = props;
  const { t } = useTranslation();
  const colors = useChartColors();
  const params = useMemo(
    () => ({ group_by: config.rows, sub_group_by: config.columns, interval: config.interval, week_start: weekStart }),
    [config, weekStart]
  );
  const { report, isLoading } = useTimeReport(workspaceSlug, filters, params);
  const { columns, cell, columnTotal } = useMemo(() => buildPivot(report, config.interval), [report, config.interval]);
  const max = useMemo(
    () =>
      Math.max(1, ...(report?.groups ?? []).flatMap((group) => columns.map((column) => cell(group.key, column.key)))),
    [report, columns, cell]
  );

  const dimensionLabel = (key: TTimeReportDimension) =>
    t(TIME_REPORT_DIMENSIONS.find((option) => option.key === key)?.i18n_label ?? key);

  const picker = (
    value: TTimeReportDimension,
    exclude: TTimeReportDimension,
    onChange: (value: TTimeReportDimension) => void
  ) => (
    <CustomSelect
      value={value}
      onChange={onChange}
      label={dimensionLabel(value)}
      buttonClassName="h-7 rounded-md border-[0.5px] border-subtle-1 px-2"
    >
      {TIME_REPORT_DIMENSIONS.filter((option) => option.key !== exclude).map((option) => (
        <CustomSelect.Option key={option.key} value={option.key}>
          {t(option.i18n_label)}
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );

  const drill = (rowKey: string | null, columnKey: string | null | undefined) => {
    const patches = [filterForGroup(config.rows, rowKey, config.interval)];
    if (columnKey !== undefined) patches.push(filterForGroup(config.columns, columnKey, config.interval));
    onDrillDown(patches.filter((patch): patch is TTimeTrackingFilterPatch => !!patch));
  };

  return (
    <section className="flex flex-col gap-3 rounded-md border-[0.5px] border-subtle p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-14 font-medium text-primary">{t("time-tracking.reports.pivot")}</h3>
        <div className="flex flex-wrap items-center gap-2 text-13">
          <span className="text-tertiary">{t("time-tracking.reports.pivot_rows")}</span>
          {picker(config.rows, config.columns, (rows) => onConfigChange({ ...config, rows }))}
          <span className="text-tertiary">{t("time-tracking.reports.pivot_columns")}</span>
          {picker(config.columns, config.rows, (columnsDimension) =>
            onConfigChange({ ...config, columns: columnsDimension })
          )}
          {(config.columns === "date" || config.rows === "date") && (
            <CustomSelect
              value={config.interval}
              onChange={(interval: TTimeReportInterval) => onConfigChange({ ...config, interval })}
              label={t(`time-tracking.intervals.${config.interval}`)}
              buttonClassName="h-7 rounded-md border-[0.5px] border-subtle-1 px-2"
            >
              {TIME_REPORT_INTERVALS.map((option) => (
                <CustomSelect.Option key={option.key} value={option.key}>
                  {t(option.i18n_label)}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
          <Button
            variant="secondary"
            size="lg"
            disabled={!report?.groups.length}
            onClick={() =>
              report &&
              exportPivotCsv(report, config.interval, dimensionLabel(config.rows), `time-pivot-${workspaceSlug}`)
            }
          >
            {t("time-tracking.reports.export_pivot_csv")}
          </Button>
        </div>
      </div>
      {report?.multi_valued && <p className="text-11 text-tertiary">{t("time-tracking.reports.multi_valued_note")}</p>}
      {isLoading && !report ? (
        <TimeTrackingBlockLoader height="240px" />
      ) : (
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full border-collapse text-13">
            <thead className="sticky top-0 z-[1] bg-surface-1">
              <tr className="border-b border-subtle text-tertiary">
                <th className="h-9 px-2 text-left font-medium">{dimensionLabel(config.rows)}</th>
                {columns.map((column) => (
                  <th
                    key={keyOf(column.key)}
                    className="max-w-32 truncate px-2 text-right font-medium"
                    title={column.label}
                  >
                    {column.label}
                  </th>
                ))}
                <th className="px-2 text-right font-medium">{t("time-tracking.timesheet.total")}</th>
              </tr>
            </thead>
            <tbody>
              {(report?.groups ?? []).map((group) => (
                <tr key={keyOf(group.key)} className="border-b border-subtle">
                  <td className="max-w-64 truncate px-2 py-1.5 text-primary" title={group.label}>
                    <button type="button" className="hover:underline" onClick={() => drill(group.key, undefined)}>
                      {group.label}
                    </button>
                  </td>
                  {columns.map((column) => {
                    const seconds = cell(group.key, column.key);
                    return (
                      <td key={keyOf(column.key)} className="p-0.5 text-right">
                        {seconds > 0 ? (
                          <button
                            type="button"
                            onClick={() => drill(group.key, column.key)}
                            className="w-full rounded-sm px-1.5 py-1 text-right text-primary tabular-nums hover:ring-1 hover:ring-accent-strong"
                            // sequential magnitude: one hue, stronger for more time; the number stays in text ink
                            style={{
                              backgroundColor: `color-mix(in srgb, ${colors.sequential} ${Math.round(8 + (seconds / max) * 40)}%, transparent)`,
                            }}
                          >
                            {formatUnits(seconds, units)}
                          </button>
                        ) : (
                          <span className="block px-1.5 py-1 text-placeholder">·</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 text-right font-medium text-primary tabular-nums">
                    {formatUnits(group.total_seconds, units)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-layer-1 font-medium">
                <td className="h-9 px-2">{t("time-tracking.timesheet.total")}</td>
                {columns.map((column) => (
                  <td key={keyOf(column.key)} className="px-2 text-right tabular-nums">
                    {formatUnits(columnTotal(column.key), units)}
                  </td>
                ))}
                <td className="px-2 text-right tabular-nums">{formatUnits(report?.total_seconds ?? 0, units)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
});
