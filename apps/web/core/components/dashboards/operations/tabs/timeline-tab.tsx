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
 * Backend Task 3 owns the read model. Until it ships this tab
 * surfaces a typed unavailable state — never fabricated cycle lanes.
 */

import { useEffect, useState } from "react";
import type {
  TDashboardScopePayload,
  TTimelineData,
  TStandaloneEnvelope,
  TSectionStatus,
} from "@plane/types";
import { dashboardOperationsService } from "@/services/dashboard-operations.service";
import { useDashboardOperationsSnapshot } from "../use-operations-store";

interface Props {
  workspaceSlug: string;
}

type Status = "idle" | "loading" | "ok" | "unavailable" | "error";

export function OperationsTimelineTab({ workspaceSlug }: Props): React.ReactElement {
  const snapshot = useDashboardOperationsSnapshot();
  const [status, setStatus] = useState<Status>("idle");
  const [reason, setReason] = useState<string | null>(null);
  const [data, setData] = useState<TTimelineData | null>(null);

  useEffect(() => {
    if (!workspaceSlug) return;
    let cancelled = false;
    setStatus("loading");
    const payload: TDashboardScopePayload = {
      period_preset: snapshot.period_preset,
      business_filters: snapshot.business_filters,
    };
    dashboardOperationsService
      .timeline(workspaceSlug, payload, { page_size: 25 })
      .then((envelope: TStandaloneEnvelope<TTimelineData>) => {
        if (cancelled) return;
        const section = envelope.sections.find((entry) => entry.section_id === "timeline");
        const statusValue: TSectionStatus | undefined = section?.status;
        if (!section || statusValue === "unavailable") {
          setStatus("unavailable");
          setReason(section?.reason ?? "endpoint_pending_task_3");
          setData(null);
          return;
        }
        if (statusValue === "error" || !section.data) {
          setStatus("error");
          setData(null);
          return;
        }
        const timelineData = section.data as TTimelineData;
        setData(timelineData);
        setStatus("ok");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("unavailable");
        setReason("endpoint_pending_task_3");
        setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, snapshot.period_preset, snapshot.business_filters]);

  return (
    <div className="flex flex-col gap-3" data-testid="operations-timeline-tab">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-13 font-medium text-primary">Timeline</h2>
        <p className="text-11 text-tertiary">
          Project cycles + unscheduled groups + 7-day deadline list. Cycles with missing dates
          go in the unscheduled group, never on the axis.
        </p>
      </header>
      {status === "loading" ? (
        <div className="text-12 text-tertiary">Loading timeline…</div>
      ) : status === "unavailable" ? (
        <div
          className="flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-4"
          data-testid="timeline-tab-pending"
        >
          <p className="text-13 text-primary">Timeline read model pending backend Task 3.</p>
          <p className="text-11 text-tertiary">
            Reason: {reason}. The /dashboard/timeline/ endpoint will return cycle_lanes,
            deadlines, and unscheduled_cycles with independent paging.
          </p>
        </div>
      ) : status === "error" ? (
        <div className="text-12 text-danger">Failed to load timeline.</div>
      ) : data ? (
        <TimelineView data={data} />
      ) : null}
    </div>
  );
}

function TimelineView({ data }: { data: TTimelineData }): React.ReactElement {
  return (
    <div className="flex flex-col gap-4" data-testid="timeline-tab-content">
      <section className="flex flex-col gap-2" aria-label="Cycle lanes">
        <h3 className="text-12 font-medium text-secondary">
          Cycles in scope · {data.cycle_lanes.total}
        </h3>
        <ul className="flex flex-col gap-1.5">
          {data.cycle_lanes.rows.map((cycle) => (
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
                <span className="rounded-sm bg-danger-subtle px-1.5 text-11 text-danger">
                  {cycle.overdue_badge} overdue
                </span>
              ) : null}
              <span className="ml-auto font-mono tabular-nums text-tertiary">
                {cycle.issue_count} issues
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2" aria-label="Unscheduled cycles">
        <h3 className="text-12 font-medium text-secondary">
          Unscheduled · {data.unscheduled_cycles.total}
        </h3>
        <ul className="flex flex-col gap-1">
          {data.unscheduled_cycles.rows.map((cycle) => (
            <li key={cycle.cycle_id} className="text-12 text-secondary" data-testid={`timeline-unscheduled-${cycle.cycle_id}`}>
              {cycle.cycle_name} · {cycle.reason}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2" aria-label="Deadlines">
        <h3 className="text-12 font-medium text-secondary">
          Deadlines · {data.deadlines.total}
        </h3>
        <ul className="flex flex-col gap-1">
          {data.deadlines.rows.map((row) => (
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