/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Insights deep tab (spec §7).
 *
 * Embeds the existing Analytics V2 Customized Insights surface —
 * no parallel query language, no link-only substitution. The
 * dashboard scope (workspace + period + view_mode + filters) is
 * passed in via `inheritedScope` so the V2 controls, chart and
 * drilldown start with the same effective scope the user has
 * chosen on the Operations Dashboard.
 *
 * The local controls (x_axis, y_axis, group_by, date_grouping,
 * normalization, allocation, display) remain editable in-place;
 * the inherited scope only seeds the initial defaults.
 */

import { useDashboardOperationsSnapshot } from "../use-operations-store";
import CustomizedInsights from "@/components/analytics/work-items/customized-insights";

interface Props {
  workspaceSlug: string;
}

export function OperationsInsightsTab({ workspaceSlug }: Props): React.ReactElement {
  const snapshot = useDashboardOperationsSnapshot();

  // Map the dashboard scope to the inherited-scope contract that
  // CustomizedInsights accepts. We pass the same period / bucket /
  // business_filters the dashboard has so the V2 surface starts
  // aligned with the user's other tabs.
  const inheritedScope = {
    workspaceSlug,
    period_preset: snapshot.period_preset,
    date_bucket: snapshot.date_bucket,
    view_mode: snapshot.view_mode,
    business_filters: snapshot.business_filters,
  };

  return (
    <div
      className="flex flex-col gap-3"
      data-testid="operations-insights-tab"
    >
      <CustomizedInsights inheritedScope={inheritedScope} />
    </div>
  );
}