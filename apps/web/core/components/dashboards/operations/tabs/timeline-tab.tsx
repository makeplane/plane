/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Timeline deep tab (spec §7).
 *
 * Owns:
 * - cycle_lanes (cycle_name, start, end, status, progress,
 *   overdue_badge, issue_count)
 * - deadlines (issue_id, sequence_id, name, project_id, project_name,
 *   target_date, days_until_due, priority, owner_ids)
 * - unscheduled_cycles (cycle_id, cycle_name, project_id, reason)
 * - Independent pagination: cycles_page, deadlines_page,
 *   unscheduled_page
 *
 * Surfaces honest state — `unavailable` only when the server returns
 * it explicitly; HTTP / network / 5xx failures render an error CTA
 * with a retry button.
 */

import { useEffect, useState } from "react";
import type {
  TTimelineData,
  TStandaloneEnvelope,
  TCycleLaneRow,
  TTimelineDeadlineRow,
  TUnscheduledCycleRow,
} from "@plane/types";
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
  | { kind: "ok"; data: TTimelineData }
  | { kind: "unavailable"; reason: string | undefined }
  | { kind: "error"; error: TDashboardTabError };

export function OperationsTimelineTab({ workspaceSlug, refreshRevision = 0 }: Props): React.ReactElement {
  const { data: currentUser } = useUser();
  const snapshot = useDashboardOperationsSnapshot();
  const projectIds = useDashboardProjectIds();
  const customRange = useDashboardCustomRange();

  const [state, setState] = useState<TabState>({ kind: "idle" });
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
    const refreshAtFetchStart = refreshRevision;

    dashboardOperationsService
      .timeline(
        workspaceSlug,
        { ...payload, page_size: 25, cycles_page: 1, deadlines_page: 1, unscheduled_page: 1 },
        controller.signal
      )
      .then((envelope: TStandaloneEnvelope<TTimelineData>) => {
        if (liveScopeKey !== scopeAtFetchStart || refreshRevision !== refreshAtFetchStart) {
          return;
        }
        const section = envelope.sections.find((entry) => entry.section_id === "timeline");
        const classified = classifySection<TTimelineData>(
          section as
            | { section_id: string; status: "ok" | "error" | "unavailable"; data?: TTimelineData; reason?: string }
            | undefined
        );
        if (classified.kind === "ok") {
          if (classified.data.scope_key && envelope.scope_key && classified.data.scope_key !== envelope.scope_key) {
            return;
          }
          setState({ kind: "ok", data: classified.data });
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
    refreshRevision,
    liveScopeKey,
    reloadKey,
  ]);

  return (
    <div className="flex flex-col gap-3" data-testid="operations-timeline-tab">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-13 font-medium text-primary">Timeline</h2>
        <p className="text-11 text-tertiary">
          Project cycles + unscheduled groups + 7-day deadline list. Cycles with missing dates go in the unscheduled
          group, never on the axis.
        </p>
      </header>
      {state.kind === "loading" ? (
        <div className="text-12 text-tertiary" data-testid="timeline-tab-loading">
          Loading timeline…
        </div>
      ) : state.kind === "unavailable" ? (
        <div
          className="flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-4"
          data-testid="timeline-tab-unavailable"
        >
          <p className="text-13 text-primary">Timeline unavailable.</p>
          <p className="text-11 text-tertiary">
            {state.reason ? `Reason: ${state.reason}.` : "The server reported this section as unavailable."} Refresh to
            retry.
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((n) => n + 1)}
            className="self-start rounded-sm border border-subtle bg-layer-2 px-3 py-1 text-12 text-secondary hover:bg-layer-3"
            data-testid="timeline-tab-retry"
          >
            Retry
          </button>
        </div>
      ) : state.kind === "error" ? (
        <ErrorPanel
          title="Failed to load timeline"
          error={state.error}
          onRetry={() => setReloadKey((n) => n + 1)}
          testId="timeline-tab-error"
        />
      ) : state.kind === "ok" ? (
        <TimelineView data={state.data} />
      ) : null}
    </div>
  );
}

function TimelineView({ data }: { data: TTimelineData }): React.ReactElement {
  return (
    <div className="flex flex-col gap-4" data-testid="timeline-tab-content">
      <section className="flex flex-col gap-2" aria-label="Cycle lanes">
        <h3 className="text-12 font-medium text-secondary">Cycles in scope · {data.cycle_lanes.total}</h3>
        <ul className="flex flex-col gap-1.5">
          {data.cycle_lanes.rows.map((cycle: TCycleLaneRow) => (
            <li
              key={cycle.cycle_id}
              className="flex items-center gap-2 text-12"
              data-testid={`timeline-cycle-${cycle.cycle_id}`}
            >
              <span className="text-primary">{cycle.cycle_name}</span>
              <span className="text-11 text-tertiary">{cycle.project_name}</span>
              <span className="text-11 text-tertiary">
                {cycle.start ?? "—"} → {cycle.end ?? "—"}
              </span>
              <span className="rounded-sm bg-layer-2 px-1.5 text-11 text-secondary">{cycle.status}</span>
              {cycle.overdue_badge > 0 ? (
                <span className="text-danger rounded-sm bg-danger-subtle px-1.5 text-11">
                  {cycle.overdue_badge} overdue
                </span>
              ) : null}
              <span className="font-mono ml-auto text-tertiary tabular-nums">{cycle.issue_count} issues</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2" aria-label="Unscheduled cycles">
        <h3 className="text-12 font-medium text-secondary">Unscheduled · {data.unscheduled_cycles.total}</h3>
        <ul className="flex flex-col gap-1">
          {data.unscheduled_cycles.rows.map((cycle: TUnscheduledCycleRow) => (
            <li
              key={cycle.cycle_id}
              className="text-12 text-secondary"
              data-testid={`timeline-unscheduled-${cycle.cycle_id}`}
            >
              {cycle.cycle_name} · {cycle.reason}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2" aria-label="Deadlines">
        <h3 className="text-12 font-medium text-secondary">Deadlines · {data.deadlines.total}</h3>
        <ul className="flex flex-col gap-1">
          {data.deadlines.rows.map((row: TTimelineDeadlineRow) => (
            <li
              key={row.issue_id}
              className="flex items-center gap-2 text-12"
              data-testid={`timeline-deadline-${row.issue_id}`}
            >
              <span className="font-mono text-11 text-tertiary" aria-hidden="true">
                {row.project_name}
              </span>
              <span className="flex-1 truncate text-primary">{row.name}</span>
              <span className="text-11 text-tertiary">
                {row.target_date} ({row.days_until_due}d)
              </span>
              <span className="rounded-sm bg-layer-2 px-1.5 text-11 text-secondary">{row.priority}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
