/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import type { TTimeSummary } from "@plane/types";
import { formatTimeDuration } from "@plane/utils";

/** Total, billable and entry count for the current filters. */
export function TimeEntriesSummaryStrip({ summary }: { summary: TTimeSummary | undefined }) {
  const { t } = useTranslation();
  const items = [
    { label: t("time-tracking.summary.total"), value: summary ? formatTimeDuration(summary.total_seconds) : "–" },
    { label: t("time-tracking.summary.billable"), value: summary ? formatTimeDuration(summary.billable_seconds) : "–" },
    { label: t("time-tracking.summary.entries"), value: summary ? String(summary.entry_count) : "–" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-6">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline gap-2">
          <span className="text-13 text-tertiary">{item.label}</span>
          <span className="text-16 font-semibold text-primary tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
