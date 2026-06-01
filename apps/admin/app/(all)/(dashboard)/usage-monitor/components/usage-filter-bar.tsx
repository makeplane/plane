/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { cn } from "@plane/utils";
// hooks
import { useUsageMonitor } from "@/hooks/store/use-usage-monitor";
import { useWorkspace } from "@/hooks/store/use-workspace";
// types
import type { TUsageGranularity, TUsagePreset } from "@/store/usage-monitor.types";

const PRESETS: { key: TUsagePreset; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "3-month", label: "3 Months" },
  { key: "custom", label: "Custom" },
];

const GRANULARITIES: TUsageGranularity[] = ["day", "month", "year"];

const selectClass = "bg-layer-2 border-[0.5px] border-subtle rounded-md px-2 py-1.5 text-13 text-primary";

export const UsageFilterBar = observer(() => {
  const { filters, setFilters } = useUsageMonitor();
  const workspaceStore = useWorkspace();
  const { workspaceIds, workspaces, fetchWorkspaces } = workspaceStore;

  useEffect(() => {
    if (workspaceIds.length === 0) void fetchWorkspaces();
  }, [workspaceIds.length, fetchWorkspaces]);

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Range presets */}
      <div className="flex flex-col gap-1">
        <span className="text-11 text-tertiary">Range</span>
        <div className="flex items-center gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => setFilters({ preset: preset.key })}
              className={cn(
                "px-2.5 py-1.5 text-13 rounded-md transition-colors",
                filters.preset === preset.key
                  ? "bg-primary/10 text-primary"
                  : "text-secondary hover:bg-surface-2 hover:text-primary"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date range — only when preset is custom */}
      {filters.preset === "custom" && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="usage-date-from" className="text-11 text-tertiary">
              From
            </label>
            <input
              id="usage-date-from"
              type="date"
              value={filters.date_from}
              max={filters.date_to}
              onChange={(e) => setFilters({ date_from: e.target.value })}
              className={selectClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="usage-date-to" className="text-11 text-tertiary">
              To
            </label>
            <input
              id="usage-date-to"
              type="date"
              value={filters.date_to}
              min={filters.date_from}
              onChange={(e) => setFilters({ date_to: e.target.value })}
              className={selectClass}
            />
          </div>
        </>
      )}

      {/* Granularity */}
      <div className="flex flex-col gap-1">
        <label htmlFor="usage-granularity" className="text-11 text-tertiary">
          Granularity
        </label>
        <select
          id="usage-granularity"
          value={filters.granularity}
          onChange={(e) => setFilters({ granularity: e.target.value as TUsageGranularity })}
          className={selectClass}
        >
          {GRANULARITIES.map((g) => (
            <option key={g} value={g}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Workspace */}
      <div className="flex flex-col gap-1">
        <label htmlFor="usage-workspace" className="text-11 text-tertiary">
          Workspace
        </label>
        <select
          id="usage-workspace"
          value={filters.workspace_id ?? ""}
          onChange={(e) => setFilters({ workspace_id: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">All workspaces</option>
          {workspaceIds.map((id) => (
            <option key={id} value={id}>
              {workspaces[id]?.name ?? id}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});
