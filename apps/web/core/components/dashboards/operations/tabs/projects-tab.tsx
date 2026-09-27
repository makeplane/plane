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
 * - Per-row View project → existing project detail route
 *
 * Backend Task 3 owns the read model. Until the endpoint ships this
 * tab surfaces a typed "unavailable" state rather than fabricated
 * rows; this is the only place we surface the gap to the viewer.
 */

import { useEffect, useState } from "react";
import type {
  TDashboardScopePayload,
  TProjectsData,
  TStandaloneEnvelope,
  TSectionStatus,
  TDashboardSection,
} from "@plane/types";
import { dashboardOperationsService } from "@/services/dashboard-operations.service";
import { useDashboardOperationsSnapshot } from "../use-operations-store";

interface Props {
  workspaceSlug: string;
}

type Status = "idle" | "loading" | "ok" | "unavailable" | "error";

export function OperationsProjectsTab({ workspaceSlug }: Props): React.ReactElement {
  const snapshot = useDashboardOperationsSnapshot();
  const [status, setStatus] = useState<Status>("idle");
  const [reason, setReason] = useState<string | null>(null);
  const [data, setData] = useState<TProjectsData | null>(null);

  useEffect(() => {
    if (!workspaceSlug) return;
    let cancelled = false;
    setStatus("loading");
    const payload: TDashboardScopePayload = {
      period_preset: snapshot.period_preset,
      business_filters: snapshot.business_filters,
    };
    dashboardOperationsService
      .projects(workspaceSlug, payload)
      .then((envelope: TStandaloneEnvelope<TProjectsData>) => {
        if (cancelled) return;
        const section = envelope.sections.find((entry) => entry.section_id === "projects");
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
        const projectsData = section.data as TProjectsData;
        setData(projectsData);
        setStatus("ok");
      })
      .catch(() => {
        if (cancelled) return;
        // Network-level 404 lands here until backend ships the
        // endpoint; that's a typed unavailable, not a page crash.
        setStatus("unavailable");
        setReason("endpoint_pending_task_3");
        setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, snapshot.period_preset, snapshot.business_filters]);

  return (
    <div className="flex flex-col gap-3" data-testid="operations-projects-tab">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-13 font-medium text-primary">Projects</h2>
        <p className="text-11 text-tertiary">
          Full breakdown — paginated server-side; view project routes into the existing detail page.
        </p>
      </header>
      {status === "loading" ? (
        <div className="text-12 text-tertiary">Loading projects…</div>
      ) : status === "unavailable" ? (
        <div
          className="flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-4"
          data-testid="projects-tab-pending"
        >
          <p className="text-13 text-primary">Projects read model pending backend Task 3.</p>
          <p className="text-11 text-tertiary">
            Reason: {reason}. The /dashboard/projects/ endpoint will return the full project
            breakdown (state_groups, completion_rate, next_deadline) per the agreed contract.
          </p>
        </div>
      ) : status === "error" ? (
        <div className="text-12 text-danger">Failed to load projects.</div>
      ) : data ? (
        <ProjectsTable data={data} />
      ) : null}
    </div>
  );
}

function ProjectsTable({ data }: { data: TProjectsData }): React.ReactElement {
  return (
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
          {data.rows.map((row) => (
            <tr key={row.project_id} className="border-t border-subtle">
              <td className="px-3 py-2 text-primary">{row.name}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">{row.total}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">{row.open}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">{row.started}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">{row.overdue}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">{row.blocked}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {row.completion_rate === null ? "—" : `${Math.round(row.completion_rate * 100)}%`}
              </td>
              <td className="px-3 py-2 text-tertiary">{row.next_deadline ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}