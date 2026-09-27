/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Batch composer for the fixed Workspace Dashboard (spec §8, §10.2, §11, §20).
 *
 * Card definitions + per-user preferences + the global scope collapse into one
 * `POST /analytics/v2/batch/` body — the shape RD-480 signed off:
 * `{"queries": [{key, version, source, ...AnalyticsQueryV2}]}`, with the
 * global scope merged into each entry rather than sent as a separate row.
 *
 * Pure on purpose. No network, no store, no React: the whole composition —
 * including the per-card isolation guarantee — is unit-testable, and the shell
 * only has to re-run it when a preference changes.
 */

import type { TAnalyticsComparison, TAnalyticsQueryResponseV2, TAnalyticsQueryV2 } from "@plane/types";
import type { TAnalyticsBatchResultEntry } from "@/components/analytics/v2/batch-composer";
import { isDateDimension } from "@/components/analytics/v2/mapping";
import { reconcileDisplayNormalization } from "@/components/analytics/v2/query";

import {
  WORKSPACE_DASHBOARD_CARDS,
  autoDateGrouping,
  reconcileCardPreference,
  type TCardDefinition,
  type TCardPreference,
} from "./card-registry";

type DashboardTimePreset = NonNullable<TAnalyticsQueryV2["time"]>["preset"];
type DashboardDateBasis = NonNullable<TAnalyticsQueryV2["time"]>["basis"];

/** Global state every card inherits unless its definition opts out (§8). */
export interface TWorkspaceDashboardGlobalScope {
  timePreset: DashboardTimePreset;
  dateBasis: DashboardDateBasis;
  customRange?: { start: string; end: string };
  /** Allowlisted structured filter keys, intersected with each card's own (§8.3). */
  filters: Record<string, string[]>;
  /**
   * Viewer-scoped project scope. Sent as the canonical `project_ids` field,
   * which the engine intersects with the viewer's visible projects — the
   * dashboard never fetches an inaccessible project and filters it away
   * client-side (§14, §20).
   */
  projectIds: string[];
  /**
   * Period-over-period comparison applied at the global scope. Mirrors
   * `TAnalyticsComparison` from `@plane/types` — the engine rejects anything
   * outside that vocab, so this field must round-trip through it exactly.
   */
  comparison: TAnalyticsComparison;
}

export type TWorkspaceDashboardCardResult =
  | { status: "ok"; data: TAnalyticsQueryResponseV2 }
  | { status: "error"; error: { code: string; message: string } }
  | { status: "pending" };

export type TWorkspaceDashboardBatch = Record<string, TWorkspaceDashboardCardResult>;

/** §40.1 — the engine refuses a group limit above 100. */
const DATE_GROUP_LIMIT = 100;
const CATEGORICAL_GROUP_LIMIT = 50;

/**
 * A card entry is `{ key, ...AnalyticsQueryV2 }` — the key is the card id.
 * The open `Record<string, unknown>` half is what makes the entry assignable to
 * the shared batch wire type; the declared half is what the card body reads.
 */
export type TWorkspaceDashboardBatchQuery = TAnalyticsQueryV2 & { key: string } & Record<string, unknown>;

/** Same wire body the RD-480 contract fixture produces. */
export type TWorkspaceDashboardBatchRequest = { queries: TWorkspaceDashboardBatchQuery[] };

/** §8.1 / §8.3 product defaults for the global control row. */
export const DEFAULT_GLOBAL_SCOPE: TWorkspaceDashboardGlobalScope = {
  timePreset: "this_quarter",
  dateBasis: "lifecycle_overlap",
  filters: {},
  projectIds: [],
  comparison: "none",
};

/**
 * The engine has no "match nothing" filter — an empty value list is skipped,
 * which would *widen* the card back to the whole workspace. When a global
 * filter contradicts a product-defined card filter the truth is "no rows", so
 * the intersection collapses to a value no work item can carry.
 */
const NO_MATCH_SENTINEL = "__no_matching_value__";

/**
 * §26 — structured filters are allowlisted key/value lists. Global scope and
 * card-local filters must both hold, so the two bags are intersected
 * key-wise; a card filter can only narrow what the viewer already selected.
 */
export function intersectFilters(
  global: Record<string, string[]>,
  card: Record<string, string[]>
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const key of new Set([...Object.keys(global), ...Object.keys(card)])) {
    const left = global[key];
    const right = card[key];
    if (!left?.length) {
      if (right?.length) out[key] = [...right];
      continue;
    }
    if (!right?.length) {
      out[key] = [...left];
      continue;
    }
    const narrowed = left.filter((value) => right.includes(value));
    out[key] = narrowed.length > 0 ? narrowed : [NO_MATCH_SENTINEL];
  }
  return out;
}

/** §8.2 — a card's semantic basis wins over an incompatible global basis. */
export function resolveCardDateBasis(card: TCardDefinition, globalBasis: DashboardDateBasis): DashboardDateBasis {
  return card.semanticDateBasis ?? globalBasis;
}

/**
 * The one `AnalyticsQueryV2` for `card`, already reconciled with the user's
 * stored preference. Exported so a card body can hand the exact same query to
 * the drill-down endpoint — the drawer must re-derive rows from the query that
 * produced the aggregate, never from a second one (§13).
 */
export function buildCardQuery(
  card: TCardDefinition,
  preference: Partial<TCardPreference> | undefined,
  scope: TWorkspaceDashboardGlobalScope
): TWorkspaceDashboardBatchQuery {
  const pref = reconcileCardPreference(card, preference ?? {});

  const dimensions: TAnalyticsQueryV2["dimensions"] = [];
  if (pref.dimension) dimensions.push({ key: pref.dimension });
  if (pref.breakdown) dimensions.push({ key: pref.breakdown });

  // §7.1 — a current-state KPI is not "created in the selected period".
  const timeDependent = card.timeDependent;
  const time: NonNullable<TAnalyticsQueryV2["time"]> = timeDependent
    ? {
        preset: scope.timePreset,
        basis: resolveCardDateBasis(card, scope.dateBasis),
      }
    : { preset: "none" };
  if (scope.timePreset === "custom" && scope.customRange && timeDependent) {
    time.preset = "custom";
    time.start = scope.customRange.start;
    time.end = scope.customRange.end;
  }
  if (isDateDimension(pref.dimension)) {
    time.group =
      card.controls.includes("date_grouping") && pref.dateGrouping ? pref.dateGrouping : autoDateGrouping(time.preset);
  }

  // §17.4 — a percentage is meaningless without a denominator.
  const { display, normalization } = reconcileDisplayNormalization(pref.display, pref.normalization);

  return {
    key: card.id,
    version: 1,
    source: "work_items",
    project_ids: scope.projectIds,
    metrics: [{ key: pref.metric }],
    dimensions,
    filters: intersectFilters(scope.filters, card.filters),
    time,
    comparison: { type: "none" },
    normalization,
    display,
    allocation: pref.allocation,
    sort: [{ metric: pref.metric, direction: "desc" }],
    limit: isDateDimension(pref.dimension) ? DATE_GROUP_LIMIT : CATEGORICAL_GROUP_LIMIT,
  };
}

/**
 * §20 — every card in one request. `card-A`…`card-L` in the backend contract
 * fixture are this same list keyed by card id; the batch cap stays
 * backend-owned (`MAX_BATCH_QUERIES`).
 */
export function buildDashboardBatchRequest(
  preferences: Record<string, Partial<TCardPreference>> | undefined,
  scope: TWorkspaceDashboardGlobalScope
): TWorkspaceDashboardBatchRequest {
  return {
    queries: WORKSPACE_DASHBOARD_CARDS.map(
      (card) => buildCardQuery(card, preferences?.[card.id], scope) as TWorkspaceDashboardBatchQuery
    ),
  };
}

/** Every card the dashboard renders — the keys a response must answer. */
export const dashboardCardIds = (): string[] => WORKSPACE_DASHBOARD_CARDS.map((card) => card.id);

const asQueryResponse = (data: unknown): TAnalyticsQueryResponseV2 | null => {
  if (!data || typeof data !== "object") return null;
  const candidate = data as TAnalyticsQueryResponseV2;
  return Array.isArray(candidate.data) ? candidate : null;
};

/**
 * §11 / §24.2.15 — fold the response back into a card-keyed map.
 *
 * A card the engine answered with `error`, or did not answer at all, gets its
 * own error state. The rest of the dashboard keeps rendering.
 */
export function normalizeDashboardBatchResponse(
  results: TAnalyticsBatchResultEntry[] | undefined
): TWorkspaceDashboardBatch {
  const out: TWorkspaceDashboardBatch = {};

  for (const entry of results ?? []) {
    if (!entry || typeof entry.key !== "string") continue;
    const data = entry.status === "ok" ? asQueryResponse(entry.data) : null;
    if (data) out[entry.key] = { status: "ok", data };
    else {
      out[entry.key] = {
        status: "error",
        error: entry.error ?? { code: "INVALID_QUERY", message: "Invalid query" },
      };
    }
  }

  for (const cardId of dashboardCardIds()) {
    if (!out[cardId]) {
      out[cardId] = { status: "error", error: { code: "NO_RESULT", message: "No result returned for this card" } };
    }
  }

  return out;
}

/** §4.2 — no data is a data-empty state, never a "create a dashboard" prompt. */
export function isCardDataEmpty(result: TWorkspaceDashboardCardResult | undefined): boolean {
  if (!result || result.status !== "ok") return false;
  const data = result.data;
  if ((data.data?.length ?? 0) > 0) return false;
  return Object.values(data.totals ?? {}).every((total) => !total);
}

/** True when every card came back empty — the whole dashboard has no data. */
export function isDashboardDataEmpty(batch: TWorkspaceDashboardBatch | undefined): boolean {
  const results = Object.values(batch ?? {});
  if (results.length === 0) return false;
  return results.every((result) => result.status === "ok" && isCardDataEmpty(result));
}
