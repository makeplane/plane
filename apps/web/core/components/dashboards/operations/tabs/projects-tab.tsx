/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Projects deep tab (spec §7).
 *
 * Owns:
 * - Full project breakdown table (project_id, name, state_groups
 *   counts, total, cancelled, completion_rate, next_deadline, …)
 * - Independent pagination
 *
 * Surfaces honest state:
 * - `status: "ok"` renders the data.
 * - `status: "unavailable"` from the server renders the typed
 *   unavailable state with the server-supplied reason.
 * - HTTP / network / 5xx failures render an error CTA with a retry
 *   button — never a "metric pending backend" placeholder.
 */

import { useEffect, useState } from "react";
import type { TProjectsData, TProjectBreakdownRow, TStandaloneEnvelope } from "@plane/types";
import { buildScopePayload, buildScopeSignature } from "@plane/shared-state";
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
  /** Manual refresh revision from the shell (spec §9.5). */
  refreshRevision?: number;
}

type TabState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; data: TProjectsData }
  | { kind: "unavailable"; reason: string | undefined }
  | { kind: "error"; error: TDashboardTabError };

export function OperationsProjectsTab({ workspaceSlug, refreshRevision = 0 }: Props): React.ReactElement {
  const { data: currentUser } = useUser();
  const snapshot = useDashboardOperationsSnapshot();
  const projectIds = useDashboardProjectIds();
  const customRange = useDashboardCustomRange();

  const [state, setState] = useState<TabState>({ kind: "idle" });
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const liveScopeKey = buildScopeSignature({
    prefs: snapshot,
    projectIds,
    customRange,
    currentUserId: currentUser?.id ?? null,
  });

  useEffect(() => {
    if (!workspaceSlug) return;
    const controller = new AbortController();
    setState((prev) => (prev.kind === "ok" ? prev : { kind: "loading" }));
    const payload = buildScopePayload({
      prefs: snapshot,
      customRange,
      projectIds,
      currentUserId: currentUser?.id ?? null,
    });
    const scopeAtFetchStart = liveScopeKey;
    const pageAtFetchStart = page;
    const refreshAtFetchStart = refreshRevision;

    dashboardOperationsService
      .projects(workspaceSlug, { ...payload, page }, controller.signal)
      .then((envelope: TStandaloneEnvelope<TProjectsData>) => {
        if (
          liveScopeKey !== scopeAtFetchStart ||
          refreshRevision !== refreshAtFetchStart ||
          page !== pageAtFetchStart
        ) {
          return;
        }
        const section = envelope.sections.find((entry) => entry.section_id === "projects");
        const classified = classifySection<TProjectsData>(
          section as
            | { section_id: string; status: "ok" | "error" | "unavailable"; data?: TProjectsData; reason?: string }
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
        if (controller.signal.aborted) return;
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED" || err?.code === "ABORTED") return;
        setState({ kind: "error", error: classifyDashboardError(err) });
      });

    return () => {
      controller.abort();
    };
  }, [
    workspaceSlug,
    snapshot,
    customRange.start,
    customRange.end,
    projectIds,
    currentUser?.id,
    page,
    refreshRevision,
    liveScopeKey,
    reloadKey,
  ]);

  return (
    <div className="flex flex-col gap-3" data-testid="operations-projects-tab">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-13 font-medium text-primary">Projects</h2>
        <p className="text-11 text-tertiary">
          Full breakdown — paginated server-side; view project routes into the existing detail page.
        </p>
      </header>
      {state.kind === "loading" ? (
        <div className="text-12 text-tertiary" data-testid="projects-tab-loading">
          Loading projects…
        </div>
      ) : state.kind === "unavailable" ? (
        <div
          className="flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-4"
          data-testid="projects-tab-unavailable"
        >
          <p className="text-13 text-primary">Projects unavailable.</p>
          <p className="text-11 text-tertiary">
            {state.reason ? `Reason: ${state.reason}.` : "The server reported this section as unavailable."} Refresh to
            retry, or contact support.
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((n) => n + 1)}
            className="self-start rounded-sm border border-subtle bg-layer-2 px-3 py-1 text-12 text-secondary hover:bg-layer-3"
            data-testid="projects-tab-retry"
          >
            Retry
          </button>
        </div>
      ) : state.kind === "error" ? (
        <ErrorPanel
          title="Failed to load projects"
          error={state.error}
          onRetry={() => setReloadKey((n) => n + 1)}
          testId="projects-tab-error"
        />
      ) : state.kind === "ok" ? (
        <ProjectsTable data={state.data} page={page} onPageChange={setPage} />
      ) : null}
    </div>
  );
}

function ProjectsTable({
  data,
  page,
  onPageChange,
}: {
  data: TProjectsData;
  page: number;
  onPageChange: (next: number) => void;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-3" data-testid="projects-tab-content">
      <div className="flex flex-wrap items-center gap-3 text-11 text-secondary">
        <span>
          Total in scope: <strong>{data.total_count}</strong>
        </span>
        <span>
          Distinct open: <strong>{data.distinct_totals.open}</strong>
        </span>
        <span>
          Distinct overdue: <strong>{data.distinct_totals.overdue}</strong>
        </span>
        <span>
          Distinct blocked: <strong>{data.distinct_totals.blocked}</strong>
        </span>
        <span>
          Distinct completion (period): <strong>{data.distinct_totals.completed_in_period}</strong>
        </span>
      </div>
      <div className="overflow-hidden rounded-md border border-subtle bg-layer-1">
        <table className="w-full text-12">
          <thead className="bg-layer-2 text-left text-11 text-tertiary">
            <tr>
              <th className="px-3 py-2">Project</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Open</th>
              <th className="px-3 py-2 text-right">Started</th>
              <th className="px-3 py-2 text-right">Overdue</th>
              <th className="px-3 py-2 text-right">Blocked</th>
              <th className="px-3 py-2 text-right">Completion</th>
              <th className="px-3 py-2">Next deadline</th>
            </tr>
          </thead>
          <tbody data-testid="projects-tab-rows">
            {data.rows.map((row: TProjectBreakdownRow) => (
              <tr
                key={row.project_id}
                className="border-t border-subtle"
                data-testid={`projects-row-${row.project_id}`}
              >
                <td className="px-3 py-2 text-primary">{row.name}</td>
                <td className="font-mono px-3 py-2 text-right tabular-nums">{row.total}</td>
                <td className="font-mono px-3 py-2 text-right tabular-nums">{row.open}</td>
                <td className="font-mono px-3 py-2 text-right tabular-nums">{row.started}</td>
                <td className="font-mono px-3 py-2 text-right tabular-nums">{row.overdue}</td>
                <td className="font-mono px-3 py-2 text-right tabular-nums">{row.blocked}</td>
                <td className="font-mono px-3 py-2 text-right tabular-nums">
                  {row.completion_rate === null ? "—" : `${Math.round(row.completion_rate * 100)}%`}
                </td>
                <td className="px-3 py-2 text-tertiary">{row.next_deadline ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="flex items-center justify-between text-11 text-tertiary">
        <span>
          Page {data.pagination.page} · {data.rows.length} of {data.total_count} shown
        </span>
        <span className="flex items-center gap-2">
          <button
            type="button"
            disabled={data.pagination.page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="rounded-sm border border-subtle bg-layer-2 px-2 py-1 text-12 text-secondary hover:bg-layer-3 disabled:text-disabled"
            data-testid="projects-tab-prev"
          >
            ← Prev
          </button>
          <button
            type="button"
            disabled={!data.pagination.has_more}
            onClick={() => onPageChange(page + 1)}
            className="rounded-sm border border-subtle bg-layer-2 px-2 py-1 text-12 text-secondary hover:bg-layer-3 disabled:text-disabled"
            data-testid="projects-tab-next"
          >
            Next →
          </button>
        </span>
      </footer>
    </div>
  );
}
