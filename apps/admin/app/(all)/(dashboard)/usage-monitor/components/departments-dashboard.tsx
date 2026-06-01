/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { BarChart } from "@plane/propel/charts/bar-chart";
// hooks
import { useUsageMonitor } from "@/hooks/store/use-usage-monitor";

const CHART_COLORS = {
  active: "#3b82f6",
  standard: "#16a34a",
  hours: "#8b5cf6",
};

const toHours = (minutes: number): number => Math.round((minutes / 60) * 10) / 10;

export const DepartmentsDashboard = observer(() => {
  const { filters, departments, isLoading, error, fetchDepartments } = useUsageMonitor();

  useEffect(() => {
    void fetchDepartments();
  }, [filters.granularity, filters.date_from, filters.date_to, filters.workspace_id, fetchDepartments]);

  const workspaces = departments?.workspaces ?? [];
  const usersData = workspaces.map((w) => ({
    key: w.workspace_id,
    name: w.workspace_name,
    active_users: w.active_users,
    standard_users: w.standard_users,
  }));
  const hoursData = workspaces.map((w) => ({
    key: w.workspace_id,
    name: w.workspace_name,
    hours: toHours(w.total_logged_minutes),
  }));
  const projects = departments?.projects ?? [];
  const projectData = projects.map((p) => ({
    key: p.project_id,
    name: p.project_name,
    hours: toHours(p.total_logged_minutes),
  }));

  if (error.departments) {
    return (
      <div className="flex h-[300px] items-center justify-center text-13 text-danger-primary">{error.departments}</div>
    );
  }
  if (isLoading.departments) {
    return <div className="flex h-[300px] items-center justify-center text-13 text-tertiary">Loading…</div>;
  }
  if (workspaces.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-13 text-tertiary">
        No logged time in the selected range.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-11 text-tertiary">
        Counts are per workspace — a user active in multiple workspaces appears in each row, so totals here can exceed
        the instance-wide active-user count (deduped only at the instance level).
      </p>

      <div className="rounded-lg border border-subtle bg-surface-1 p-4">
        <p className="text-13 font-medium text-primary">Active vs standard users by workspace</p>
        <BarChart
          className="mt-2 h-[300px] w-full"
          data={usersData}
          bars={[
            { key: "active_users", label: "Active", stackId: "active", fill: CHART_COLORS.active, textClassName: "" },
            {
              key: "standard_users",
              label: "Standard",
              stackId: "standard",
              fill: CHART_COLORS.standard,
              textClassName: "",
            },
          ]}
          xAxis={{ key: "name", label: "Workspace" }}
          yAxis={{ key: "active_users", label: "Users", allowDecimals: false }}
        />
      </div>

      <div className="rounded-lg border border-subtle bg-surface-1 p-4">
        <p className="text-13 font-medium text-primary">Total logged time by workspace (hours)</p>
        <BarChart
          className="mt-2 h-[280px] w-full"
          data={hoursData}
          bars={[{ key: "hours", label: "Hours", stackId: "hours", fill: CHART_COLORS.hours, textClassName: "" }]}
          xAxis={{ key: "name", label: "Workspace" }}
          yAxis={{ key: "hours", label: "Hours" }}
        />
      </div>

      {filters.workspace_id && projectData.length > 0 && (
        <div className="rounded-lg border border-subtle bg-surface-1 p-4">
          <p className="text-13 font-medium text-primary">Logged time by project (hours)</p>
          <BarChart
            className="mt-2 h-[280px] w-full"
            data={projectData}
            bars={[{ key: "hours", label: "Hours", stackId: "hours", fill: CHART_COLORS.hours, textClassName: "" }]}
            xAxis={{ key: "name", label: "Project" }}
            yAxis={{ key: "hours", label: "Hours" }}
          />
        </div>
      )}
    </div>
  );
});
