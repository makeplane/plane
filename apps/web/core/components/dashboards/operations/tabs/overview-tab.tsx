/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Overview tab (spec §6). Renders the six-KPI strip, the 5-segment
 * progress bar, the dual delivery trend, the top-projects list, the
 * team workload preview, and the needs-attention preview.
 *
 * The workload preview is fetched from /dashboard/workload/ at page=1
 * size=5 by this parent component; the panel itself stays hook-free
 * so it remains unit-testable.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  TAttentionPreviewData,
  TDeliveryTrendData,
  TIssueRow,
  TKpiCounts,
  TProgressData,
  TSectionStatus,
  TSnapshotRule,
  TDashboardOverviewResponse,
  TDashboardSection,
  TTopProjectsData,
  TWorkloadData,
  TWorkloadMemberRow,
} from "@plane/types";
import { buildScopePayload } from "@plane/shared-state";
import { dashboardOperationsService } from "@/services/dashboard-operations.service";
import { useUser } from "@/hooks/store/user";
import {
  useDashboardCustomRange,
  useDashboardOperationsSnapshot,
  useDashboardProjectIds,
} from "../use-operations-store";
import { classifyDashboardError, classifySection, type TDashboardTabError } from "../error-handling";
import { ItemDrawer } from "../item-drawer";
import { KpiStrip } from "../panels/kpi-strip";
import { ProgressPanel } from "../panels/progress-panel";
import { DeliveryPanel } from "../panels/delivery-panel";
import { TopProjectsPanel } from "../panels/top-projects-panel";
import { AttentionPreviewPanel } from "../panels/attention-preview-panel";
import { WorkloadPreviewPanel } from "../panels/workload-preview-panel";

export interface OverviewRequestState {
  status: "idle" | "loading" | "ok" | "error";
  data: TDashboardOverviewResponse | null;
  error: string | null;
}

interface Props {
  workspaceSlug: string;
  state: OverviewRequestState;
  /**
   * Refresh revision passed from the shell. Refresh bumps this counter
   * so the workload + attention preview fetches refetch alongside the
   * overview (per spec §9.5: "mutate + refresh entire visible
   * Dashboard"). When undefined, only scope changes refetch the
   * previews.
   */
  refreshRevision?: number;
}

export function OperationsOverviewTab({
  workspaceSlug,
  state,
  refreshRevision = 0,
}: Props): React.ReactElement {
  const { data: currentUser } = useUser();
  const snapshot = useDashboardOperationsSnapshot();
  const projectIds = useDashboardProjectIds();
  const customRange = useDashboardCustomRange();
  // Current user id participates in the request key so a "My work"
  // view changes assignee_id and refetches the overview + previews
  // — this is the canonical scope parity fix (shell, tabs, drawer).
  const currentUserId = currentUser?.id ?? null;

  // Workload preview — fetched from /dashboard/workload/ with the
  // server-side risk-sorted preview contract (per coordinator
  // finding 2026-09-27 15:21Z). Backend is expected to honour
  // `preview: true` by sorting the FULL roster by
  // (overdue → blocked → started → open → name) and returning
  // the top N, so a Z-named member who is overloaded surfaces
  // even when name-sort pagination would land them on page 2+.
  // If the backend ignores `preview` (legacy), the client falls
  // back to its local sort — same data, smaller cohort.
  //
  // The contract asserts page_size=5 against a full roster; we
  // intentionally do NOT use page_size=100 as a silent workaround.
  const [workloadRows, setWorkloadRows] = useState<TWorkloadMemberRow[]>([]);
  const [workloadSectionStatus, setWorkloadSectionStatus] = useState<TSectionStatus>("ok");
  const [workloadSectionReason, setWorkloadSectionReason] = useState<string | undefined>(undefined);
  const [workloadFetchError, setWorkloadFetchError] = useState<TDashboardTabError | null>(null);
  const workloadGenerationRef = useRef(0);
  const [workloadReloadKey, setWorkloadReloadKey] = useState(0);

  // Canonical scope payload — captured once so every preview effect
// can depend on a single object reference that changes with view_mode
// (My work), project_ids, custom range, etc. Even when the
// underlying store snapshot reference is preserved by the
// snapshot-equality guard, `buildScopePayload` returns a NEW object
// whenever any input changes — so this becomes a precise refetch
// trigger.
const scopePayload = useMemo(
  () =>
    buildScopePayload({
      prefs: snapshot,
      customRange,
      projectIds,
      currentUserId,
    }),
  [snapshot, customRange.start, customRange.end, projectIds, currentUserId]
);

useEffect(() => {
  if (!workspaceSlug) return;
  const controller = new AbortController();
  const generation = ++workloadGenerationRef.current;
  setWorkloadFetchError(null);
  dashboardOperationsService
    .workload(
      workspaceSlug,
      { ...scopePayload, page: 1, page_size: 5, preview: true },
      controller.signal
    )
    .then((envelope) => {
      if (generation !== workloadGenerationRef.current) return;
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
        setWorkloadSectionStatus("ok");
        setWorkloadSectionReason(undefined);
        // Server is authoritative for the preview ordering when
        // it honours `preview: true` — it has the full picture, so
        // we trust the row order it returns. The client sort
        // below is the safety net for the legacy backend that
        // ignores `preview` and paginates by display_name.
        const rows = classified.data.rows;
        const isServerRiskSorted = rows.every((row, index, all) => {
          if (index === 0) return true;
          const prev = all[index - 1];
          const a = [row.overdue, row.blocked, row.started, row.open];
          const p = [prev.overdue, prev.blocked, prev.started, prev.open];
          for (let i = 0; i < 4; i++) {
            if (p[i] !== a[i]) return p[i] > a[i];
          }
          return true;
        });
        if (isServerRiskSorted) {
          setWorkloadRows(rows.slice(0, 5));
        } else {
          const sorted = [...rows].sort(
            (a, b) =>
              b.overdue - a.overdue ||
              b.blocked - a.blocked ||
              b.started - a.started ||
              b.open - a.open ||
              (a.display_name ?? "").localeCompare(b.display_name ?? "")
          );
          setWorkloadRows(sorted.slice(0, 5));
        }
        return;
      }
      if (classified.kind === "unavailable") {
        setWorkloadSectionStatus("unavailable");
        setWorkloadSectionReason(classified.reason);
        setWorkloadRows([]);
        return;
      }
      // section_error / missing section
      setWorkloadSectionStatus("error");
      setWorkloadSectionReason(classified.reason);
      setWorkloadRows([]);
    })
    .catch((err) => {
      if (generation !== workloadGenerationRef.current) return;
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED" || err?.code === "ABORTED") return;
      setWorkloadSectionStatus("error");
      setWorkloadSectionReason(undefined);
      setWorkloadFetchError(classifyDashboardError(err));
      setWorkloadRows([]);
    });
  return () => {
    controller.abort();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [workspaceSlug, scopePayload, workloadReloadKey, refreshRevision]);

  // KPI drilldown: clicking a KPI opens the ItemDrawer with the
  // matching snapshot rule. The drawer carries the canonical scope
  // (period / business_filters / project_ids) so the drilldown
  // resolves to the same effective scope as the KPI's row total.
  const [drawerMetric, setDrawerMetric] = useState<TSnapshotRule | null>(null);
  const onKpiClick = useCallback((metric: TSnapshotRule) => {
    setDrawerMetric(metric);
  }, []);
  const onDrawerClose = useCallback(() => {
    setDrawerMetric(null);
  }, []);

  // Fetch attention rows for the Needs-attention panel using the
  // dedicated /attention/ endpoint, paginated, so the panel always
  // shows up-to-5 + "View all" → drawer (drawer comes in Task 6).
  const [attentionRows, setAttentionRows] = useState<TIssueRow[]>([]);
  const [attentionReasonCounts, setAttentionReasonCounts] = useState<Record<string, number>>({});
  const [attentionStatus, setAttentionStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const attentionAbortRef = useRef<AbortController | null>(null);
  const attentionGenerationRef = useRef(0);

  useEffect(() => {
    if (!workspaceSlug) return;
    attentionAbortRef.current?.abort();
    const controller = new AbortController();
    attentionAbortRef.current = controller;
    const generation = ++attentionGenerationRef.current;
    setAttentionStatus("loading");
    const payload = buildScopePayload({
      prefs: snapshot,
      customRange,
      projectIds,
      currentUserId,
    });
    dashboardOperationsService
      .attention(workspaceSlug, { ...payload, page: 1, page_size: 5 }, controller.signal)
      .then((response) => {
        if (generation !== attentionGenerationRef.current) return;
        const section = response.sections.find((entry) => entry.section_id === "attention");
        if (!section || section.status !== "ok" || !section.data) {
          setAttentionStatus("error");
          return;
        }
        const data = section.data as { rows?: TIssueRow[]; reason_counts?: Record<string, number>; total?: number };
        setAttentionRows(data.rows ?? []);
        setAttentionReasonCounts(data.reason_counts ?? {});
        setAttentionStatus("ok");
      })
      .catch(() => {
        if (generation !== attentionGenerationRef.current) return;
        setAttentionStatus("error");
      });
  }, [workspaceSlug, scopePayload, refreshRevision]);

  // Resolve each section by id with type-safety.
  const kpis = useMemo<TKpiCounts | null>(() => {
    const found = state.data?.sections.find(
      (s): s is TDashboardSection<TKpiCounts> & { status: "ok" } => s.section_id === "kpis" && s.status === "ok"
    );
    return found?.data ?? null;
  }, [state.data]);

  const progress = useMemo<TProgressData | null>(() => {
    const found = state.data?.sections.find(
      (s): s is TDashboardSection<TProgressData> & { status: "ok" } => s.section_id === "progress" && s.status === "ok"
    );
    return found?.data ?? null;
  }, [state.data]);

  const delivery = useMemo<TDeliveryTrendData | null>(() => {
    const found = state.data?.sections.find(
      (s): s is TDashboardSection<TDeliveryTrendData> & { status: "ok" } =>
        s.section_id === "delivery" && s.status === "ok"
    );
    return found?.data ?? null;
  }, [state.data]);

  const topProjects = useMemo<TTopProjectsData | null>(() => {
    const found = state.data?.sections.find(
      (s): s is TDashboardSection<TTopProjectsData> & { status: "ok" } =>
        s.section_id === "top_projects" && s.status === "ok"
    );
    return found?.data ?? null;
  }, [state.data]);

  const attentionPreview = useMemo<TAttentionPreviewData | null>(() => {
    const found = state.data?.sections.find(
      (s): s is TDashboardSection<TAttentionPreviewData> & { status: "ok" } =>
        s.section_id === "attention_preview" && s.status === "ok"
    );
    return found?.data ?? null;
  }, [state.data]);

  const isLoading = state.status === "loading" || state.status === "idle";

  return (
    <div className="flex flex-col gap-4" data-testid="operations-overview-tab">
      <KpiStrip
        data={kpis}
        isLoading={isLoading}
        error={state.status === "error"}
        onMetricClick={onKpiClick}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ProgressPanel data={progress} isLoading={isLoading} error={state.status === "error"} />
        </div>
        <div className="lg:col-span-4">
          <DeliveryPanel data={delivery} isLoading={isLoading} error={state.status === "error"} />
        </div>
        <div className="lg:col-span-3">
          <TopProjectsPanel data={topProjects} isLoading={isLoading} error={state.status === "error"} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <WorkloadPreviewPanel
            status={workloadSectionStatus}
            reason={workloadSectionReason}
            error={workloadFetchError}
            isLoading={isLoading}
            rows={workloadRows}
            onRetry={() => setWorkloadReloadKey((n) => n + 1)}
          />
        </div>
        <div className="lg:col-span-5">
          <AttentionPreviewPanel
            preview={attentionPreview}
            rows={attentionRows}
            reasonCounts={attentionStatus === "ok" ? attentionReasonCounts : null}
            isLoading={isLoading && attentionStatus !== "ok"}
            error={state.status === "error" || attentionStatus === "error"}
          />
        </div>
      </div>
      {drawerMetric !== null ? (
        <ItemDrawer
          workspaceSlug={workspaceSlug}
          open
          onClose={onDrawerClose}
          metric={drawerMetric}
        />
      ) : null}
    </div>
  );
}
