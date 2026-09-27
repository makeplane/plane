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
 * - Per-cell drilldown → /dashboard/items/ with the metric + value
 *
 * Backend Task 3 owns the read model. Until it ships this tab
 * surfaces a typed unavailable state — never fabricated roster rows.
 */

import { useEffect, useState } from "react";
import type {
  TDashboardScopePayload,
  TWorkloadData,
  TStandaloneEnvelope,
  TSectionStatus,
} from "@plane/types";
import { dashboardOperationsService } from "@/services/dashboard-operations.service";
import { useDashboardOperationsSnapshot } from "../use-operations-store";

interface Props {
  workspaceSlug: string;
}

type Status = "idle" | "loading" | "ok" | "unavailable" | "error";

export function OperationsWorkloadTab({ workspaceSlug }: Props): React.ReactElement {
  const snapshot = useDashboardOperationsSnapshot();
  const [status, setStatus] = useState<Status>("idle");
  const [reason, setReason] = useState<string | null>(null);
  const [data, setData] = useState<TWorkloadData | null>(null);

  useEffect(() => {
    if (!workspaceSlug) return;
    let cancelled = false;
    setStatus("loading");
    const payload: TDashboardScopePayload = {
      period_preset: snapshot.period_preset,
      business_filters: snapshot.business_filters,
    };
    dashboardOperationsService
      .workload(workspaceSlug, payload)
      .then((envelope: TStandaloneEnvelope<TWorkloadData>) => {
        if (cancelled) return;
        const section = envelope.sections.find((entry) => entry.section_id === "workload");
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
        const workloadData = section.data as TWorkloadData;
        setData(workloadData);
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
    <div className="flex flex-col gap-3" data-testid="operations-workload-tab">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-13 font-medium text-primary">Workload</h2>
        <p className="text-11 text-tertiary">
          Per-member cells with full credit; workspace totals never sum across rows.
        </p>
      </header>
      {status === "loading" ? (
        <div className="text-12 text-tertiary">Loading workload…</div>
      ) : status === "unavailable" ? (
        <div
          className="flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-4"
          data-testid="workload-tab-pending"
        >
          <p className="text-13 text-primary">Workload read model pending backend Task 3.</p>
          <p className="text-11 text-tertiary">
            Reason: {reason}. The /dashboard/workload/ endpoint will return roster rows with
            distinct totals, unassigned + inactive buckets, and a WIP threshold rule.
          </p>
        </div>
      ) : status === "error" ? (
        <div className="text-12 text-danger">Failed to load workload.</div>
      ) : data ? (
        <WorkloadTable data={data} />
      ) : null}
    </div>
  );
}

function WorkloadTable({ data }: { data: TWorkloadData }): React.ReactElement {
  return (
    <div className="flex flex-col gap-3" data-testid="workload-tab-content">
      <div className="flex flex-wrap items-center gap-3 text-11 text-secondary">
        <span>Members: <strong>{data.total_members}</strong></span>
        <span>Distinct open: <strong>{data.distinct_totals.open}</strong></span>
        <span>Distinct started: <strong>{data.distinct_totals.started}</strong></span>
        <span>Distinct overdue: <strong>{data.distinct_totals.overdue}</strong></span>
        <span>Distinct blocked: <strong>{data.distinct_totals.blocked}</strong></span>
        {data.wip_threshold !== null ? (
          <span>WIP threshold: <strong>{data.wip_threshold}</strong> · {data.wip_warning_reason}</span>
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
            {data.rows.map((row) => (
              <tr
                key={row.member_id ?? "unassigned-row"}
                className="border-t border-subtle"
                data-testid={`workload-row-${row.member_id ?? "unassigned"}`}
              >
                <td className="px-3 py-2 text-primary">{row.display_name}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{row.open}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{row.started}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{row.overdue}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{row.blocked}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{row.due_soon}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{row.completed_in_period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}