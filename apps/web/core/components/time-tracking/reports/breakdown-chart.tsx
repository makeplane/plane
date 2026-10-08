/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
// plane imports
import { TIME_REPORT_DIMENSIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TTimeEntryFilters, TTimeReportDimension } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import type { TTimeTrackingFilterPatch } from "@/hooks/time-tracking/use-time-tracking-filters";
import { useTimeReport } from "@/hooks/time-tracking/use-time-report";
// local imports
import { TimeTrackingBlockLoader } from "../loaders";
import { ChartTooltipContent, legendText } from "./chart-tooltip";
import type { TTimeUnits } from "./report-helpers";
import {
  filterForGroup,
  foldTopGroups,
  formatUnits,
  MAX_SERIES,
  OTHER_KEY,
  SURFACE_COLOR,
  toHours,
  useChartColors,
} from "./report-helpers";

const BAR_LIMIT = 15;

type Props = {
  workspaceSlug: string;
  filters: TTimeEntryFilters;
  units: TTimeUnits;
  onDrillDown: (patches: TTimeTrackingFilterPatch[]) => void;
};

/** Time per value of a dimension, split billable / non-billable (plan 9.5.4 §3). */
export const BreakdownChart = observer(function BreakdownChart(props: Props) {
  const { workspaceSlug, filters, units, onDrillDown } = props;
  const { t } = useTranslation();
  const colors = useChartColors();
  const [dimension, setDimension] = useState<TTimeReportDimension>("project");
  const [variant, setVariant] = useState<"bar" | "donut">("bar");
  const params = useMemo(() => ({ group_by: dimension }), [dimension]);
  const { report, isLoading } = useTimeReport(workspaceSlug, filters, params);

  // billable and non-billable are two categories: the first two series slots
  const billableColor = colors.series[0];
  const nonBillableColor = colors.series[1];
  const otherLabel = t("time-tracking.reports.other");

  const barData = useMemo(
    () =>
      foldTopGroups(report?.groups ?? [], BAR_LIMIT, otherLabel).map((group) => ({
        key: group.key,
        label: group.label,
        billable: toHours(group.billable_seconds),
        nonBillable: toHours(group.total_seconds - group.billable_seconds),
        _billable: group.billable_seconds,
        _nonBillable: group.total_seconds - group.billable_seconds,
        _total: group.total_seconds,
      })),
    [report, otherLabel]
  );
  const donutData = useMemo(
    () =>
      foldTopGroups(report?.groups ?? [], MAX_SERIES, otherLabel).map((group) => ({
        key: group.key,
        label: group.label,
        hours: toHours(group.total_seconds),
        _total: group.total_seconds,
      })),
    [report, otherLabel]
  );

  const drill = (key: string | null) => {
    const patch = filterForGroup(dimension, key, null);
    if (patch) onDrillDown([patch]);
  };

  const dimensionLabel = (key: TTimeReportDimension) =>
    t(TIME_REPORT_DIMENSIONS.find((option) => option.key === key)?.i18n_label ?? key);
  const isMultiValued = TIME_REPORT_DIMENSIONS.find((option) => option.key === dimension)?.multiValued;

  return (
    <section className="flex flex-col gap-3 rounded-md border-[0.5px] border-subtle p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-14 font-medium text-primary">{t("time-tracking.reports.breakdown")}</h3>
        <div className="flex items-center gap-2 text-13">
          <span className="text-tertiary">{t("time-tracking.reports.breakdown_by")}</span>
          <CustomSelect
            value={dimension}
            onChange={(value: TTimeReportDimension) => setDimension(value)}
            label={dimensionLabel(dimension)}
            buttonClassName="h-7 rounded-md border-[0.5px] border-subtle-1 px-2"
          >
            {TIME_REPORT_DIMENSIONS.filter((option) => option.key !== "date").map((option) => (
              <CustomSelect.Option key={option.key} value={option.key}>
                {t(option.i18n_label)}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
          <div className="flex rounded-md border-[0.5px] border-subtle-1 p-0.5">
            {(["bar", "donut"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={variant === value}
                onClick={() => setVariant(value)}
                className={cn("rounded px-2 py-0.5 text-secondary", {
                  "bg-layer-2 text-primary shadow-raised-100": variant === value,
                })}
              >
                {value === "bar" ? t("time-tracking.reports.chart_bar") : t("time-tracking.reports.chart_donut")}
              </button>
            ))}
          </div>
        </div>
      </div>
      {isMultiValued && <p className="text-11 text-tertiary">{t("time-tracking.reports.multi_valued_note")}</p>}

      {isLoading && !report ? (
        <TimeTrackingBlockLoader height="320px" />
      ) : variant === "bar" ? (
        <div className="w-full text-11 text-tertiary" style={{ height: Math.max(160, barData.length * 32 + 48) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              barCategoryGap="25%"
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={180}
                tick={{ fill: "currentColor" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: string) => (value.length > 28 ? `${value.slice(0, 27)}…` : value)}
              />
              <Tooltip
                cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as (typeof barData)[number] | undefined;
                  return (
                    <ChartTooltipContent
                      active={active}
                      title={row ? `${row.label} · ${formatUnits(row._total, units)}` : ""}
                      rows={
                        row
                          ? [
                              {
                                label: t("time-tracking.billable"),
                                color: billableColor,
                                value: formatUnits(row._billable, units),
                              },
                              {
                                label: t("time-tracking.non_billable"),
                                color: nonBillableColor,
                                value: formatUnits(row._nonBillable, units),
                              },
                            ]
                          : []
                      }
                    />
                  );
                }}
              />
              <Legend formatter={legendText} iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="billable"
                name={t("time-tracking.billable")}
                stackId="split"
                fill={billableColor}
                stroke={SURFACE_COLOR}
                strokeWidth={1}
                maxBarSize={20}
                cursor="pointer"
                onClick={(row: { key?: string | null }) => drill(row.key ?? null)}
              />
              <Bar
                dataKey="nonBillable"
                name={t("time-tracking.non_billable")}
                stackId="split"
                fill={nonBillableColor}
                stroke={SURFACE_COLOR}
                strokeWidth={1}
                maxBarSize={20}
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(row: { key?: string | null }) => drill(row.key ?? null)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-80 w-full text-11 text-tertiary">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as (typeof donutData)[number] | undefined;
                  return (
                    <ChartTooltipContent
                      active={active}
                      title={row?.label ?? ""}
                      rows={
                        row
                          ? [
                              {
                                label: t("time-tracking.reports.kpi.total"),
                                color: String(payload?.[0]?.payload?.fill ?? ""),
                                value: formatUnits(row._total, units),
                              },
                            ]
                          : []
                      }
                    />
                  );
                }}
              />
              <Legend
                iconType="square"
                iconSize={8}
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{ fontSize: 11 }}
              />
              <Pie
                data={donutData}
                dataKey="hours"
                nameKey="label"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={1}
                stroke={SURFACE_COLOR}
                strokeWidth={2}
                cursor="pointer"
                onClick={(slice: { key?: string | null }) => drill(slice.key ?? null)}
              >
                {donutData.map((slice, index) => (
                  <Cell
                    key={slice.key ?? "none"}
                    fill={slice.key === OTHER_KEY ? colors.other : colors.series[index % MAX_SERIES]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
});
