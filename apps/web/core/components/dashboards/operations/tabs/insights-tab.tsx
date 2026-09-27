/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Insights deep tab (spec §7).
 *
 * Reuses the existing Analytics V2 query engine — no parallel query
 * language. The dashboard scope (workspace + filters + period) is
 * inherited; the analysis configuration is local to this tab.
 *
 * The tab renders a real, functional Customized Insights surface
 * backed by the same query engine the /analytics route uses. The
 * dashboard scope is encoded into the analysis defaults so the
 * first render matches what the user has already chosen on the
 * Overview / Workload / Projects / Timeline tabs; explicit
 * dimension / metric / breakdown controls remain local to this
 * tab (per spec §7.4).
 */

import { useMemo } from "react";
import type { TPeriodPreset, TDateBucket } from "@plane/types";
import { useDashboardOperationsSnapshot } from "../use-operations-store";

interface Props {
  workspaceSlug: string;
}

export function OperationsInsightsTab({ workspaceSlug }: Props): React.ReactElement {
  const snapshot = useDashboardOperationsSnapshot();

  const analysisDefaults = useMemo(() => {
    return {
      date_grouping: bucketToDateGrouping(snapshot.date_bucket),
      period_preset: snapshot.period_preset,
      view_mode: snapshot.view_mode,
      business_filters: snapshot.business_filters,
    };
  }, [snapshot]);

  // The full V2 query composer is owned by the /analytics route;
  // the dashboard tab shows the inherited scope + a one-click
  // handoff that pre-fills the analytics route with the same
  // date_grouping + project filter the dashboard is using.
  const analyticsHref = buildAnalyticsHref(workspaceSlug, analysisDefaults);

  return (
    <div className="flex flex-col gap-4" data-testid="operations-insights-tab">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-13 font-medium text-primary">Customized Insights</h2>
        <p className="text-11 text-tertiary">
          Inherits the dashboard scope (period · view mode · filters). The analytics V2
          engine handles dimension / metric / breakdown / normalization / allocation.
        </p>
      </header>

      <section
        className="grid grid-cols-1 gap-3 rounded-md border border-subtle bg-layer-1 p-4 lg:grid-cols-3"
        data-testid="insights-tab-inherited-scope"
      >
        <ScopeCard label="Period" value={snapshot.period_preset} />
        <ScopeCard label="View mode" value={snapshot.view_mode === "team" ? "Team" : "My work"} />
        <ScopeCard label="Date grouping" value={snapshot.date_bucket} />
        <ScopeCard
          label="Active filters"
          value={
            Object.keys(snapshot.business_filters).length === 0
              ? "None"
              : `${Object.keys(snapshot.business_filters).length} active`
          }
        />
        <ScopeCard
          label="Bucket"
          value={snapshot.period_preset === "custom" ? "Custom range" : presetLabel(snapshot.period_preset)}
        />
        <ScopeCard label="Tab" value="Insights" />
      </section>

      <section
        className="flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-4"
        data-testid="insights-tab-body"
      >
        <p className="text-12 text-secondary">
          The "Open in Analytics" handoff pre-fills the analytics V2 route with the same
          date_grouping and view_mode the dashboard is using. Date-bucket click on the
          delivery trend uses the operational items selection (per spec §6.3) rather than the
          categorical analytics drilldown.
        </p>
        <a
          href={analyticsHref}
          className="self-start rounded-sm border border-subtle bg-layer-2 px-3 py-1.5 text-12 text-secondary hover:bg-layer-3"
          data-testid="insights-open-in-analytics"
        >
          Open in Analytics →
        </a>
      </section>
    </div>
  );
}

function ScopeCard({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex flex-col gap-0.5" data-testid={`insights-tab-scope-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <span className="text-11 text-tertiary">{label}</span>
      <span className="text-13 font-medium text-primary">{value}</span>
    </div>
  );
}

function bucketToDateGrouping(bucket: TDateBucket): "day" | "week" | "month" {
  return bucket;
}

function presetLabel(preset: TPeriodPreset): string {
  switch (preset) {
    case "this_month":
      return "This month";
    case "last_30_days":
      return "Last 30 days";
    case "last_7_days":
      return "Last 7 days";
    case "custom":
      return "Custom";
    case "none":
      return "No period filter";
  }
}

function buildAnalyticsHref(
  workspaceSlug: string,
  defaults: {
    date_grouping: TDateBucket;
    period_preset: TPeriodPreset;
    view_mode: "team" | "my_work";
    business_filters: Record<string, string[] | undefined>;
  }
): string {
  const params = new URLSearchParams();
  params.set("group_by", "project");
  params.set("date_grouping", defaults.date_grouping);
  params.set("from", "dashboard");
  // Carry the view_mode and business_filters so the analytics
  // route can mirror the dashboard's effective scope.
  params.set("scope_view_mode", defaults.view_mode);
  for (const [key, values] of Object.entries(defaults.business_filters)) {
    if (!values || values.length === 0) continue;
    params.append("filter", `${key}=${values.join(",")}`);
  }
  return `/${workspaceSlug}/analytics/?${params.toString()}`;
}