/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Three KPI summary cards: total logged, total estimated, variance.
 */

import type { FC } from "react";
import { formatMinutesToDisplay } from "@plane/constants";
import type { IWorkLogSummary } from "@plane/types";

type TTimeTrackingSummaryCardsProps = {
  summary: IWorkLogSummary;
};

type TKpiCardProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

const KpiCard: FC<TKpiCardProps> = ({ label, value, valueClassName = "text-primary" }) => (
  <div className="flex flex-col gap-1 flex-1 min-w-[140px] rounded-lg border border-subtle bg-surface-1 px-5 py-4">
    <span className="text-xs font-medium text-tertiary uppercase tracking-wide">{label}</span>
    <span className={`text-2xl font-semibold ${valueClassName}`}>{value}</span>
  </div>
);

export const TimeTrackingSummaryCards: FC<TTimeTrackingSummaryCardsProps> = ({ summary }) => {
  // Sum estimate_time across all issues (null treated as 0)
  const totalEstimatedMinutes = summary.by_issue.reduce((sum, issue) => sum + (issue.estimate_time ?? 0), 0);

  const variance = summary.total_duration_minutes - totalEstimatedMinutes;
  const varianceDisplay =
    variance === 0 ? "0m" : `${variance > 0 ? "+" : ""}${formatMinutesToDisplay(Math.abs(variance))}`;
  const varianceClass = variance > 0 ? "text-red-500" : variance < 0 ? "text-green-500" : "text-primary";

  return (
    <div className="flex gap-4 flex-wrap">
      <KpiCard label="Total Logged" value={formatMinutesToDisplay(summary.total_duration_minutes)} />
      <KpiCard
        label="Total Estimated"
        value={totalEstimatedMinutes > 0 ? formatMinutesToDisplay(totalEstimatedMinutes) : "—"}
      />
      <KpiCard
        label="Variance"
        value={totalEstimatedMinutes > 0 ? varianceDisplay : "—"}
        valueClassName={totalEstimatedMinutes > 0 ? varianceClass : "text-tertiary"}
      />
    </div>
  );
};
