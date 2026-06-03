/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { LineChart } from "@plane/propel/charts/line-chart";
// hooks
import { useUsageMonitor } from "@/hooks/store/use-usage-monitor";

const STANDARD_COLOR = "#16a34a";

export const StandardUsersDashboard = observer(() => {
  const { filters, users, isLoading, error, fetchUsers } = useUsageMonitor();

  useEffect(() => {
    void fetchUsers();
  }, [filters.granularity, filters.date_from, filters.date_to, filters.workspace_id, fetchUsers]);

  const series = users?.series_standard ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-subtle bg-surface-1 p-4">
        <p className="text-11 uppercase tracking-wide text-tertiary">Standard users in range</p>
        <p className="mt-1 text-24 font-semibold text-primary">{users?.total_standard_users ?? 0}</p>
        <p className="mt-1 text-11 text-tertiary">
          Distinct users with ≥1 full day (≥8h / 480 min) logged, deduped across the range.
        </p>
      </div>

      <div className="rounded-lg border border-subtle bg-surface-1 p-4">
        <p className="text-13 font-medium text-primary">Standard users per period</p>
        <p className="mt-1 text-11 text-tertiary">
          Standard is a per-day status — a user counts only on days they logged ≥8h, so the line rises and falls as
          daily logging changes.
        </p>
        {error.users ? (
          <div className="flex h-[300px] items-center justify-center text-13 text-danger-primary">{error.users}</div>
        ) : isLoading.users ? (
          <div className="flex h-[300px] items-center justify-center text-13 text-tertiary">Loading…</div>
        ) : series.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-13 text-tertiary">
            No activity in the selected range.
          </div>
        ) : (
          <LineChart
            className="mt-2 h-[300px] w-full"
            data={series}
            lines={[
              {
                key: "standard_users",
                label: "Standard users",
                stroke: STANDARD_COLOR,
                fill: STANDARD_COLOR,
                dashedLine: false,
                showDot: true,
                smoothCurves: true,
              },
            ]}
            xAxis={{ key: "period", label: "Period" }}
            yAxis={{ key: "standard_users", label: "Standard users", allowDecimals: false }}
          />
        )}
      </div>
    </div>
  );
});
