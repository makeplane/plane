/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { PieChart } from "@plane/propel/charts/pie-chart";
// hooks
import { useUsageMonitor } from "@/hooks/store/use-usage-monitor";

const CHART_COLORS = {
  standard: "#16a34a",
  non_standard: "#f59e0b",
};

export const StandardUsersDashboard = observer(() => {
  const { filters, users, isLoading, error, fetchUsers } = useUsageMonitor();

  useEffect(() => {
    void fetchUsers();
  }, [filters.granularity, filters.date_from, filters.date_to, filters.workspace_id, fetchUsers]);

  const pie = users?.pie;
  const series = users?.series_standard ?? [];
  const pieData = pie
    ? [
        { key: "standard", name: "Standard", value: pie.standard_users },
        { key: "non_standard", name: "Non-standard", value: pie.non_standard_users },
      ]
    : [];
  const hasPie = !!pie && pie.total_active_users > 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-subtle bg-surface-1 p-4">
        <p className="text-13 font-medium text-primary">Standard vs non-standard users</p>
        <p className="mt-1 text-11 text-tertiary">A user is standard with ≥1 day of ≥8h (480 min) logged in range.</p>
        {error.users ? (
          <div className="flex h-[280px] items-center justify-center text-13 text-danger-primary">{error.users}</div>
        ) : isLoading.users ? (
          <div className="flex h-[280px] items-center justify-center text-13 text-tertiary">Loading…</div>
        ) : !hasPie ? (
          <div className="flex h-[280px] items-center justify-center text-13 text-tertiary">
            No active users in the selected range.
          </div>
        ) : (
          <PieChart
            className="h-[280px] w-full"
            data={pieData}
            dataKey="value"
            cells={[
              { key: "standard", fill: CHART_COLORS.standard },
              { key: "non_standard", fill: CHART_COLORS.non_standard },
            ]}
            showLabel
            showTooltip
            innerRadius="55%"
          />
        )}
      </div>

      <div className="rounded-lg border border-subtle bg-surface-1 p-4">
        <p className="text-13 font-medium text-primary">Standard vs non-standard user-days</p>
        <p className="mt-1 text-11 text-tertiary">Non-overlapping — the two stacks sum to active user-days.</p>
        {error.users ? (
          <div className="flex h-[280px] items-center justify-center text-13 text-danger-primary">{error.users}</div>
        ) : isLoading.users ? (
          <div className="flex h-[280px] items-center justify-center text-13 text-tertiary">Loading…</div>
        ) : series.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-13 text-tertiary">
            No activity in the selected range.
          </div>
        ) : (
          <BarChart
            className="h-[280px] w-full"
            data={series}
            bars={[
              {
                key: "standard_user_days",
                label: "Standard",
                stackId: "user-days",
                fill: CHART_COLORS.standard,
                textClassName: "",
              },
              {
                key: "non_standard_user_days",
                label: "Non-standard",
                stackId: "user-days",
                fill: CHART_COLORS.non_standard,
                textClassName: "",
              },
            ]}
            xAxis={{ key: "period", label: "Period" }}
            yAxis={{ key: "standard_user_days", label: "User-days", allowDecimals: false }}
          />
        )}
      </div>
    </div>
  );
});
