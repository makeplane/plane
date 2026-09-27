/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Item drawer (spec §6.6) — paginated drilldown for KPI/rule/member/
 * project/date-bucket selections. Calls
 * `POST /api/workspaces/{slug}/dashboard/items/` with the agreed
 * selection payload (selection.metric + selection.values + optional
 * date_start/end + delivery_base + bucket).
 *
 * The drawer always:
 * 1. Locks the scope with the scope_key returned in the response so a
 *    late response cannot leak into a different filter set.
 * 2. Carries the actual metric + values, not just labels.
 * 3. Uses `assignee_id: null` (present-null, never empty array) when
 *    the caller wants the synthetic Unassigned bucket.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  TDashboardItemsPayload,
  TDashboardItemsResponse,
  TDashboardSelection,
  TDashboardSelectionValues,
  TSnapshotRule,
  TIssueRow,
} from "@plane/types";
import { dashboardOperationsService } from "@/services/dashboard-operations.service";
import { useDashboardOperationsStore } from "./use-operations-store";

interface Props {
  workspaceSlug: string;
  open: boolean;
  onClose: () => void;
  /** Metric the drawer is filtering for. */
  metric: TSnapshotRule | "attention";
  /** Optional dimension values that narrow the drilldown. */
  values?: TDashboardSelectionValues;
  /** Optional half-open date window. */
  dateStart?: string;
  dateEnd?: string;
  /** Page size (clamped 1..100 by the backend). */
  pageSize?: number;
}

interface DrawerState {
  status: "idle" | "loading" | "ok" | "error";
  rows: TIssueRow[];
  total: number;
  page: number;
  hasMore: boolean;
  scopeKey: string | null;
  error: string | null;
}

export function ItemDrawer({
  workspaceSlug,
  open,
  onClose,
  metric,
  values,
  dateStart,
  dateEnd,
  pageSize = 25,
}: Props): React.ReactElement | null {
  const store = useDashboardOperationsStore();
  const [state, setState] = useState<DrawerState>({
    status: "idle",
    rows: [],
    total: 0,
    page: 1,
    hasMore: false,
    scopeKey: null,
    error: null,
  });
  const generationRef = useRef(0);

  const fetchPage = useCallback(
    (page: number) => {
      if (!workspaceSlug || !open) return;
      const generation = ++generationRef.current;
      setState((prev) => ({ ...prev, status: "loading", error: null }));

      const selection: TDashboardSelection = {
        metric: metric === "attention" ? "all" : metric,
        values,
        date_start: dateStart,
        date_end: dateEnd,
      };

      const scopePayload = {
        period_preset: store.getPeriodPreset(),
        business_filters: store.getBusinessFilters(),
        project_ids: store.getProjectIds().length > 0 ? store.getProjectIds().slice() : undefined,
      };

      const payload: TDashboardItemsPayload = {
        ...scopePayload,
        selection,
        metric: metric === "attention" ? "all" : metric,
        page,
        page_size: pageSize,
      };

      dashboardOperationsService
        .items(workspaceSlug, payload)
        .then((response: TDashboardItemsResponse) => {
          if (generation !== generationRef.current) return;
          const section = response.sections.find((entry) => entry.section_id === "items");
          if (!section || section.status !== "ok" || !section.data) {
            setState((prev) => ({ ...prev, status: "error", error: "request_failed" }));
            return;
          }
          const data = section.data as { rows?: TIssueRow[]; total?: number; page?: number; has_more?: boolean; scope_key?: string };
          setState({
            status: "ok",
            rows: data.rows ?? [],
            total: data.total ?? 0,
            page: data.page ?? page,
            hasMore: data.has_more ?? false,
            scopeKey: data.scope_key ?? response.scope_key,
            error: null,
          });
        })
        .catch(() => {
          if (generation !== generationRef.current) return;
          setState((prev) => ({ ...prev, status: "error", error: "request_failed" }));
        });
    },
    [workspaceSlug, open, metric, values, dateStart, dateEnd, pageSize, store]
  );

  useEffect(() => {
    if (!open) return;
    fetchPage(1);
  }, [open, fetchPage]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[640px] flex-col border-l border-subtle bg-layer-1 shadow-xl"
      data-testid="operations-item-drawer"
      role="dialog"
      aria-label={`Drawer for ${metric}`}
    >
      <header className="flex items-center justify-between border-b border-subtle px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-14 font-medium text-primary">{labelForMetric(metric)}</h2>
          <p className="text-11 text-tertiary">
            {state.total} distinct issues · scope {state.scopeKey ?? "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm border border-subtle bg-layer-2 px-2 py-1 text-12 text-secondary hover:bg-layer-3"
          data-testid="operations-item-drawer-close"
        >
          Close
        </button>
      </header>

      <div className="flex-1 overflow-y-auto" data-testid="operations-item-drawer-body">
        {state.status === "loading" ? (
          <div className="p-4 text-12 text-tertiary">Loading…</div>
        ) : state.status === "error" ? (
          <div className="p-4 text-12 text-danger">Failed to load items.</div>
        ) : state.rows.length === 0 ? (
          <div className="p-4 text-12 text-tertiary">No matching issues under this scope.</div>
        ) : (
          <ul className="flex flex-col">
            {state.rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-2 border-b border-subtle px-4 py-2 text-12"
                data-testid={`operations-item-drawer-row-${row.id}`}
              >
                <span className="font-mono text-11 text-tertiary" aria-hidden="true">
                  {row.project_name ?? "—"}
                </span>
                <span className="flex-1 truncate text-primary" title={row.name}>
                  {row.name}
                </span>
                <span className="text-11 text-tertiary">{row.target_date ?? "—"}</span>
                <span className="rounded-sm bg-layer-2 px-1.5 text-11 text-secondary">{row.priority ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="flex items-center justify-between border-t border-subtle px-4 py-3">
        <button
          type="button"
          disabled={state.page <= 1 || state.status === "loading"}
          onClick={() => fetchPage(state.page - 1)}
          className="rounded-sm border border-subtle bg-layer-2 px-3 py-1 text-12 text-secondary hover:bg-layer-3 disabled:text-disabled"
          data-testid="operations-item-drawer-prev"
        >
          ← Prev
        </button>
        <span className="text-11 text-tertiary">
          Page {state.page} {state.total > 0 ? `· ${state.total} total` : ""}
        </span>
        <button
          type="button"
          disabled={!state.hasMore || state.status === "loading"}
          onClick={() => fetchPage(state.page + 1)}
          className="rounded-sm border border-subtle bg-layer-2 px-3 py-1 text-12 text-secondary hover:bg-layer-3 disabled:text-disabled"
          data-testid="operations-item-drawer-next"
        >
          Next →
        </button>
      </footer>
    </div>
  );
}

function labelForMetric(metric: TSnapshotRule | "attention"): string {
  if (metric === "attention") return "Attention";
  return metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}