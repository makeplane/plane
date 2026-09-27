/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Workload deep tab (spec §7).
 *
 * Owns:
 * - Full roster table (member_id, display_name, avatar_url, is_active,
 *   open/started/overdue/blocked/due_soon/completed_in_period)
 * - Unassigned + inactive bucket counters
 * - distinct_totals (workspace-side, never row sums)
 * - Server-side pagination with independent page cursors
 *
 * The tab surfaces honest state:
 * - `status: "ok"` renders the data.
 * - `status: "unavailable"` from the server renders the typed
 *   unavailable state with the server-supplied reason.
 * - HTTP / network / 5xx failures render an error CTA with a retry
 *   button — never a "metric pending backend" placeholder.
 */

import { useCallback, useEffect, useState } from "react";
import type { TWorkloadData, TWorkloadMemberRow, TStandaloneEnvelope } from "@plane/types";
import { buildScopePayload } from "@plane/shared-state";
import { dashboardOperationsService } from "@/services/dashboard-operations.service";
import {
  useDashboardCustomRange,
  useDashboardOperationsSnapshot,
  useDashboardProjectIds,
} from "../use-operations-store";
import { useUser } from "@/hooks/store/user";
import { classifyDashboardError, classifySection, type TDashboardTabError } from "../error-handling";
import { ErrorPanel } from "../panels/error-panel";

interface Props {
  workspaceSlug: string;
}

type TabState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; data: TWorkloadData }
  | { kind: "unavailable"; reason: string | undefined }
  | { kind: "error"; error: TDashboardTabError };

export function OperationsWorkloadTab({ workspaceSlug }: Props): React.ReactElement {
  const { data: currentUser } = useUser();
  const snapshot = useDashboardOperationsSnapshot();
  const projectIds = useDashboardProjectIds();
  const customRange = useDashboardCustomRange();

  const [state, setState] = useState<TabState>({ kind: "idle" });
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const fetchPage = useCallback(
    (pageNum: number) => {
      if (!workspaceSlug) return;
      const controller = new AbortController();
      setState((prev) => (prev.kind === "ok" ? prev : { kind: "loading" }));
      const payload = buildScopePayload({
        prefs: snapshot,
        customRange,
        projectIds,
        currentUserId: currentUser?.id ?? null,
      });
      dashboardOperationsService
        .workload(workspaceSlug, { ...payload, page: pageNum }, controller.signal)
        .then((envelope: TStandaloneEnvelope<TWorkloadData>) => {
          const section = envelope.sections.find((entry) => entry.section_id === "workload");
          const classified = classifySection<TWorkloadData>(
            section as
              | { section_id: string; status: "ok" | "error" | "unavailable"; data?: TWorkloadData; reason?: string }
              | undefined
          );
          if (classified.kind === "ok") {
            if (classified.data.scope_key && envelope.scope_key && classified.data.scope_key !== envelope.scope_key) {
              return;
            }
            setState({ kind: "ok", data: classified.data });
            setPage(classified.data.pagination.page);
            return;
          }
          if (classified.kind === "unavailable") {
            setState({ kind: "unavailable", reason: classified.reason });
            return;
          }
          setState({
            kind: "error",
            error: { kind: "malformed", message: classified.reason ?? "section_error" },
          });
        })
        .catch((err) => {
          if (err?.name === "AbortError" || err?.code === "ERR_CANCELED" || err?.code === "ABORTED") return;
          setState({ kind: "error", error: classifyDashboardError(err) });
        });
    },
    [workspaceSlug, snapshot, customRange.start, customRange.end, projectIds, currentUser?.id]
  );

  useEffect(() => {
    fetchPage(page);
    // reloadKey triggers an explicit retry from the error UI.
  }, [fetchPage, page, reloadKey]);

  return (
    <div className="flex flex-col gap-3" data-testid="operations-workload-tab">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-13 font-medium text-primary">Workload</h2>
        <p className="text-11 text-tertiary">
          Per-member cells with full credit; workspace totals never sum across rows.
        </p>
      </header>
      {state.kind === "loading" ? (
        <div className="text-12 text-tertiary" data-testid="workload-tab-loading">
          Loading workload…
        </div>
      ) : state.kind === "unavailable" ? (
        <div
          className="flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-4"
          data-testid="workload-tab-unavailable"
        >
          <p className="text-13 text-primary">Workload unavailable.</p>
          <p className="text-11 text-tertiary">
            {state.reason ? `Reason: ${state.reason}.` : "The server reported this section as unavailable."} If this is
            unexpected, refresh the page or contact support.
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((n) => n + 1)}
            className="self-start rounded-sm border border-subtle bg-layer-2 px-3 py-1 text-12 text-secondary hover:bg-layer-3"
            data-testid="workload-tab-retry"
          >
            Retry
          </button>
        </div>
      ) : state.kind === "error" ? (
        <ErrorPanel
          title="Failed to load workload"
          error={state.error}
          onRetry={() => setReloadKey((n) => n + 1)}
          testId="workload-tab-error"
        />
      ) : state.kind === "ok" ? (
        <WorkloadTable data={state.data} page={page} onPageChange={setPage} />
      ) : null}
    </div>
  );
}

function WorkloadTable({
  data,
  page,
  onPageChange,
}: {
  data: TWorkloadData;
  page: number;
  onPageChange: (next: number) => void;
}): React.ReactElement {
  const warnedIds = new Set(data.wip_warning_member_ids ?? []);
  return (
    <div className="flex flex-col gap-3" data-testid="workload-tab-content">
      <div className="flex flex-wrap items-center gap-3 text-11 text-secondary">
        <span>
          Members: <strong>{data.total_members}</strong>
        </span>
        <span>
          Distinct open: <strong>{data.distinct_totals.open}</strong>
        </span>
        <span>
          Distinct started: <strong>{data.distinct_totals.started}</strong>
        </span>
        <span>
          Distinct overdue: <strong>{data.distinct_totals.overdue}</strong>
        </span>
        <span>
          Distinct blocked: <strong>{data.distinct_totals.blocked}</strong>
        </span>
        {data.wip_threshold !== null ? (
          <span>
            WIP threshold: <strong>{data.wip_threshold}</strong> · {data.wip_warning_reason ?? "no warning"}
          </span>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-md border border-subtle bg-layer-1">
        <table className="w-full text-12">
          <thead className="bg-layer-2 text-left text-11 text-tertiary">
            <tr>
              <th className="px-3 py-2">Member</th>
              <th className="px-3 py-2 text-right">Open</th>
              <th className="px-3 py-2 text-right">Started</th>
              <th className="px-3 py-2 text-right">Overdue</th>
              <th className="px-3 py-2 text-right">Blocked</th>
              <th className="px-3 py-2 text-right">Due soon</th>
              <th className="px-3 py-2 text-right">Completed (period)</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row: TWorkloadMemberRow) => {
              const warned = row.member_id !== null && warnedIds.has(row.member_id);
              return (
                <tr
                  key={row.member_id ?? "unassigned-row"}
                  className="border-t border-subtle"
                  data-testid={`workload-row-${row.member_id ?? "unassigned"}`}
                >
                  <td className="px-3 py-2 text-primary">
                    <span className="inline-flex items-center gap-1.5">
                      {warned ? (
                        <span
                          className="bg-warning inline-block h-1.5 w-1.5 rounded-full"
                          aria-label={`WIP warning (started > ${data.wip_threshold})`}
                          data-testid={`workload-wip-${row.member_id}`}
                        />
                      ) : null}
                      {row.display_name}
                    </span>
                  </td>
                  <td className="font-mono px-3 py-2 text-right tabular-nums">{row.open}</td>
                  <td className="font-mono px-3 py-2 text-right tabular-nums">{row.started}</td>
                  <td className="font-mono px-3 py-2 text-right tabular-nums">{row.overdue}</td>
                  <td className="font-mono px-3 py-2 text-right tabular-nums">{row.blocked}</td>
                  <td className="font-mono px-3 py-2 text-right tabular-nums">{row.due_soon}</td>
                  <td className="font-mono px-3 py-2 text-right tabular-nums">{row.completed_in_period}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="flex items-center justify-between text-11 text-tertiary">
        <span>
          Unassigned: <strong className="text-primary">{data.unassigned.open}</strong> open ·{" "}
          <strong className="text-primary">{data.unassigned.overdue}</strong> overdue ·{" "}
          <strong className="text-primary">{data.unassigned.completed_in_period}</strong> completed (period)
        </span>
        <span className="flex items-center gap-3">
          <span>
            Inactive (former members): <strong className="text-primary">{data.inactive.member_count}</strong>
            {" · "}
            <strong className="text-primary">{data.inactive.open}</strong> open
          </span>
          <span className="flex items-center gap-1">
            <button
              type="button"
              disabled={data.pagination.page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="rounded-sm border border-subtle bg-layer-2 px-2 py-1 text-12 text-secondary hover:bg-layer-3 disabled:text-disabled"
              data-testid="workload-tab-prev"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={!data.pagination.has_more}
              onClick={() => onPageChange(page + 1)}
              className="rounded-sm border border-subtle bg-layer-2 px-2 py-1 text-12 text-secondary hover:bg-layer-3 disabled:text-disabled"
              data-testid="workload-tab-next"
            >
              Next →
            </button>
          </span>
        </span>
      </footer>
    </div>
  );
}
