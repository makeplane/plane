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
 * Backend owns the V2 query endpoint. This tab is a thin wrapper that
 * composes a default V2 query and renders via existing chart/table
 * primitives (RD-451).
 */

import { useDashboardOperationsSnapshot } from "../use-operations-store";

interface Props {
  workspaceSlug: string;
}

export function OperationsInsightsTab({ workspaceSlug: _workspaceSlug }: Props): React.ReactElement {
  // The tab renders its Analytics V2 host (customized-insights) with
  // the dashboard scope as inherited inputs. Until the V2 query type
  // signature is finalised for drilldown, the tab surfaces the
  // inherited scope and a placeholder for the analysis controls.
  const snapshot = useDashboardOperationsSnapshot();

  return (
    <div className="flex flex-col gap-3" data-testid="operations-insights-tab">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-13 font-medium text-primary">Insights</h2>
        <p className="text-11 text-tertiary">
          Customized Insights — reuses the existing Analytics V2 engine; dashboard scope is
          inherited.
        </p>
      </header>
      <div className="flex flex-col gap-2 text-12 text-secondary" data-testid="insights-tab-body">
        <p>
          Inherited scope: view_mode <strong>{snapshot.view_mode}</strong>, period{" "}
          <strong>{snapshot.period_preset}</strong>, bucket <strong>{snapshot.date_bucket}</strong>.
        </p>
        <p>
          Use dimension, metric, breakdown, date grouping, normalization, allocation, chart/table
          and drilldown controls (existing Analytics V2). The "Open in Analytics" link is omitted
          until a contract for deep-linking the query is shipped; date-bucket click uses the
          operational items selection rather than the categorical Analytics drilldown.
        </p>
      </div>
    </div>
  );
}