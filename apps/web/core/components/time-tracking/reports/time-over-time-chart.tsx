/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
// plane imports
import { TIME_REPORT_INTERVALS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TTimeEntryFilters, TTimeReportDimension, TTimeReportInterval } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { getAutoTimeReportInterval, renderFormattedDate } from "@plane/utils";
// hooks
import type { TTimeTrackingFilterPatch } from "@/hooks/time-tracking/use-time-tracking-filters";
import { useTimeReport } from "@/hooks/time-tracking/use-time-report";
// local imports
import { TimeTrackingBlockLoader } from "../loaders";
import { ChartTooltipContent, legendText } from "./chart-tooltip";
import type { TTimeUnits } from "./report-helpers";
import {
  filterForGroup,
  formatUnits,
  MAX_SERIES,
  OTHER_KEY,
  SURFACE_COLOR,
  toHours,
  useChartColors,
} from "./report-helpers";

const STACK_OPTIONS: (TTimeReportDimension | "none")[] = ["none", "user", "project", "billable", "label", "issue"];
const TOTAL_KEY = "__total__";

type Props = {
  workspaceSlug: string;
  filters: TTimeEntryFilters;
  weekStart: number;
  units: TTimeUnits;
  onDrillDown: (patches: TTimeTrackingFilterPatch[]) => void;
};

/** Stacked bars over date buckets (plan 9.5.4 §2). */
export const TimeOverTimeChart = observer(function TimeOverTimeChart(props: Props) {
  const { workspaceSlug, filters, weekStart, units, onDrillDown } = props;
  const { t } = useTranslation();
  const colors = useChartColors();
  const [intervalChoice, setIntervalChoice] = useState<TTimeReportInterval | "auto">("auto");
  const [stackBy, setStackBy] = useState<TTimeReportDimension | "none">("none");

  const interval =
    intervalChoice === "auto"
      ? getAutoTimeReportInterval(
          filters.date_from && filters.date_to ? { from: filters.date_from, to: filters.date_to } : null
        )
      : intervalChoice;
  const params = useMemo(
    () => ({
      group_by: "date" as const,
      sub_group_by: stackBy === "none" ? null : stackBy,
      interval,
      week_start: weekStart,
    }),
    [stackBy, interval, weekStart]
  );
  const { report, isLoading } = useTimeReport(workspaceSlug, filters, params);

  const { data, series } = useMemo(() => {
    if (!report) return { data: [], series: [] as { key: string; label: string }[] };
    if (!report.sub_group_by) {
      return {
        series: [{ key: TOTAL_KEY, label: t("time-tracking.reports.kpi.total") }],
        data: report.groups.map((group) => ({
          bucket: group.key ?? "",
          [TOTAL_KEY]: toHours(group.total_seconds),
          _seconds: { [TOTAL_KEY]: group.total_seconds },
        })),
      };
    }
    // the biggest series overall keep their own color, in order; the rest fold into "Other"
    const totals = new Map<string, { label: string; seconds: number }>();
    for (const group of report.groups)
      for (const sub of group.sub_groups ?? []) {
        const key = sub.key ?? "null";
        const current = totals.get(key) ?? { label: sub.label, seconds: 0 };
        totals.set(key, { label: sub.label, seconds: current.seconds + sub.total_seconds });
      }
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts a fresh array
    const ranked = Array.from(totals.entries()).sort((a, b) => b[1].seconds - a[1].seconds);
    const kept = ranked.slice(0, MAX_SERIES).map(([key, value]) => ({ key, label: value.label }));
    const keptKeys = new Set(kept.map((item) => item.key));
    const hasOther = ranked.length > MAX_SERIES;
    const rows = report.groups.map((group) => {
      const row: Record<string, unknown> = { bucket: group.key ?? "" };
      const seconds: Record<string, number> = {};
      for (const sub of group.sub_groups ?? []) {
        const key = keptKeys.has(sub.key ?? "null") ? (sub.key ?? "null") : OTHER_KEY;
        seconds[key] = (seconds[key] ?? 0) + sub.total_seconds;
      }
      for (const [key, value] of Object.entries(seconds)) row[key] = toHours(value);
      row._seconds = seconds;
      return row;
    });
    return {
      data: rows,
      series: hasOther ? [...kept, { key: OTHER_KEY, label: t("time-tracking.reports.other") }] : kept,
    };
  }, [report, t]);

  const colorFor = (key: string, index: number) =>
    key === OTHER_KEY ? colors.other : colors.series[index % MAX_SERIES];
  const bucketLabel = (bucket: string) =>
    renderFormattedDate(bucket, interval === "month" ? "MMM yyyy" : "MMM d") ?? bucket;

  const handleClick = (bucket: string, seriesKey: string) => {
    const patches = [filterForGroup("date", bucket, interval)];
    if (report?.sub_group_by && seriesKey !== TOTAL_KEY)
      patches.push(filterForGroup(report.sub_group_by, seriesKey === "null" ? null : seriesKey, interval));
    onDrillDown(patches.filter((patch): patch is TTimeTrackingFilterPatch => !!patch));
  };

  return (
    <section className="flex flex-col gap-3 rounded-md border-[0.5px] border-subtle p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-14 font-medium text-primary">{t("time-tracking.reports.time_over_time")}</h3>
        <div className="flex items-center gap-2 text-13">
          <span className="text-tertiary">{t("time-tracking.reports.interval")}</span>
          <CustomSelect
            value={intervalChoice}
            onChange={(value: TTimeReportInterval | "auto") => setIntervalChoice(value)}
            label={
              intervalChoice === "auto"
                ? t("time-tracking.reports.interval_auto")
                : t(`time-tracking.intervals.${intervalChoice}`)
            }
            buttonClassName="h-7 rounded-md border-[0.5px] border-subtle-1 px-2"
          >
            <CustomSelect.Option value="auto">{t("time-tracking.reports.interval_auto")}</CustomSelect.Option>
            {TIME_REPORT_INTERVALS.map((option) => (
              <CustomSelect.Option key={option.key} value={option.key}>
                {t(option.i18n_label)}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
          <span className="text-tertiary">{t("time-tracking.reports.stack_by")}</span>
          <CustomSelect
            value={stackBy}
            onChange={(value: TTimeReportDimension | "none") => setStackBy(value)}
            label={
              stackBy === "none" ? t("time-tracking.reports.stack_none") : t(`time-tracking.dimensions.${stackBy}`)
            }
            buttonClassName="h-7 rounded-md border-[0.5px] border-subtle-1 px-2"
          >
            {STACK_OPTIONS.map((option) => (
              <CustomSelect.Option key={option} value={option}>
                {option === "none" ? t("time-tracking.reports.stack_none") : t(`time-tracking.dimensions.${option}`)}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        </div>
      </div>
      {isLoading && !report ? (
        <TimeTrackingBlockLoader height="280px" />
      ) : (
        <div className="h-72 w-full text-11 text-tertiary">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} />
              <XAxis
                dataKey="bucket"
                tickFormatter={bucketLabel}
                tick={{ fill: "currentColor" }}
                axisLine={false}
                tickLine={false}
                minTickGap={12}
              />
              <YAxis
                tick={{ fill: "currentColor" }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(hours: number) => `${hours}h`}
              />
              <Tooltip
                cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
                content={({ active, payload, label }) => (
                  <ChartTooltipContent
                    active={active}
                    title={bucketLabel(String(label ?? ""))}
                    rows={(payload ?? []).map((item) => ({
                      label: series.find((s) => s.key === item.dataKey)?.label ?? String(item.dataKey),
                      color: String(item.color ?? ""),
                      value: formatUnits(
                        ((item.payload as { _seconds?: Record<string, number> })._seconds ?? {})[
                          String(item.dataKey)
                        ] ?? 0,
                        units
                      ),
                    }))}
                  />
                )}
              />
              {series.length >= 2 && (
                <Legend formatter={legendText} iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              )}
              {series.map((item, index) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.label}
                  stackId="time"
                  fill={colorFor(item.key, index)}
                  stroke={SURFACE_COLOR}
                  strokeWidth={1}
                  maxBarSize={32}
                  radius={index === series.length - 1 ? [4, 4, 0, 0] : 0}
                  cursor="pointer"
                  onClick={(entry: { bucket?: string }) => entry.bucket && handleClick(entry.bucket, item.key)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
});
