/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowDown, ArrowUp } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TTimeSummary } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import type { TTimeUnits } from "./report-helpers";
import { formatUnits } from "./report-helpers";

type Props = {
  summary: TTimeSummary;
  units: TTimeUnits;
  onOpenNeedsReview: () => void;
};

function Card(props: { label: string; value: string; detail?: React.ReactNode; onClick?: () => void }) {
  const { label, value, detail, onClick } = props;
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn("flex flex-col gap-1 rounded-md border-[0.5px] border-subtle bg-layer-1 p-4 text-left", {
        "hover:bg-layer-1-hover": !!onClick,
      })}
    >
      <span className="text-13 text-tertiary">{label}</span>
      <span className="text-20 font-semibold text-primary tabular-nums">{value}</span>
      {detail && <span className="text-11 text-tertiary">{detail}</span>}
    </Wrapper>
  );
}

/** Headline numbers for the current filters (plan 9.5.4 §1). */
export function TimeReportKpiCards({ summary, units, onOpenNeedsReview }: Props) {
  const { t } = useTranslation();
  const percent = (part: number) => (summary.total_seconds ? Math.round((part / summary.total_seconds) * 100) : 0);

  const previous = summary.previous;
  let change: React.ReactNode = null;
  if (previous && previous.total_seconds > 0) {
    const delta = Math.round(((summary.total_seconds - previous.total_seconds) / previous.total_seconds) * 100);
    const Icon = delta >= 0 ? ArrowUp : ArrowDown;
    // up/down is neutral information here, so it carries an arrow and the number, not a status color
    change = (
      <span className="inline-flex items-center gap-0.5">
        <Icon className="size-3" />
        {Math.abs(delta)}% {t("time-tracking.reports.kpi.vs_previous")}
      </span>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card
        label={t("time-tracking.reports.kpi.total")}
        value={formatUnits(summary.total_seconds, units)}
        detail={change}
      />
      <Card
        label={t("time-tracking.reports.kpi.billable")}
        value={formatUnits(summary.billable_seconds, units)}
        detail={t("time-tracking.reports.kpi.billable_percent", { percent: percent(summary.billable_seconds) })}
      />
      <Card
        label={t("time-tracking.reports.kpi.non_billable")}
        value={formatUnits(summary.non_billable_seconds, units)}
      />
      <Card
        label={t("time-tracking.reports.kpi.avg_per_person_day")}
        value={formatUnits(summary.avg_seconds_per_user_day, units)}
      />
      <Card label={t("time-tracking.reports.kpi.people")} value={String(summary.user_count)} />
      <Card label={t("time-tracking.reports.kpi.work_items")} value={String(summary.issue_count)} />
      <Card
        label={t("time-tracking.reports.kpi.no_work_item")}
        value={formatUnits(summary.no_issue_seconds, units)}
        detail={`${percent(summary.no_issue_seconds)}%`}
      />
      <Card
        label={t("time-tracking.reports.kpi.needs_review")}
        value={String(summary.auto_stopped_count)}
        onClick={summary.auto_stopped_count > 0 ? onOpenNeedsReview : undefined}
      />
    </div>
  );
}
