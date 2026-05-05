/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * KPI summary card: total logged.
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
    <span className="text-12 font-medium text-tertiary uppercase tracking-wide">{label}</span>
    <span className={`text-2xl font-semibold ${valueClassName}`}>{value}</span>
  </div>
);

export const TimeTrackingSummaryCards: FC<TTimeTrackingSummaryCardsProps> = ({ summary }) => (
  <div className="flex gap-4 flex-wrap">
    <KpiCard label="Total Logged" value={formatMinutesToDisplay(summary.total_duration_minutes)} />
  </div>
);
