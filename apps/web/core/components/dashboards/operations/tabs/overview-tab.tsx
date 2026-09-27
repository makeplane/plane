/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Overview tab (spec §6). Renders the six-KPI strip, the 5-segment
 * progress bar, the dual delivery trend, the top-projects list, the
 * team workload preview (deferred to Task 3 — surfaces a typed
 * placeholder), and the needs-attention preview.
 *
 * Each section consumes the overview envelope and renders its own
 * typed state — never falls back to a fabricated value.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  TAttentionPreviewData,
  TDeliveryTrendData,
  TIssueRow,
  TKpiCounts,
  TProgressData,
  TDashboardOverviewResponse,
  TDashboardSection,
  TTopProjectsData,
} from "@plane/types";
import { dashboardOperationsService } from "@/services/dashboard-operations.service";
import { useDashboardOperationsSnapshot } from "../use-operations-store";
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
}

export function OperationsOverviewTab({ workspaceSlug, state }: Props): React.ReactElement {
  const snapshot = useDashboardOperationsSnapshot();

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
    const payload = {
      period_preset: snapshot.period_preset,
      business_filters: snapshot.business_filters,
      page: 1,
      page_size: 5,
    };
    dashboardOperationsService
      .attention(workspaceSlug, payload, controller.signal)
      .then((response) => {
        if (generation !== attentionGenerationRef.current) return;
        const section = response.sections.find((entry) => entry.section_id === "attention");
        if (!section || section.status !== "ok" || !section.data) {
          setAttentionStatus("error");
          return;
        }
        // The envelope's section.data is `TRequestMetaData | TAttentionPayloadData`;
        // we already filtered to the attention section by id so the data
        // is the attention payload.
        const data = section.data as { rows?: TIssueRow[]; reason_counts?: Record<string, number>; total?: number };
        setAttentionRows(data.rows ?? []);
        setAttentionReasonCounts(data.reason_counts ?? {});
        setAttentionStatus("ok");
      })
      .catch(() => {
        if (generation !== attentionGenerationRef.current) return;
        setAttentionStatus("error");
      });
  }, [workspaceSlug, snapshot.period_preset, snapshot.business_filters]);

  // Resolve each section by id with type-safety.
  const kpis = useMemo<TKpiCounts | null>(() => {
    const found = state.data?.sections.find(
      (s): s is TDashboardSection<TKpiCounts> & { status: "ok" } => s.section_id === "kpis" && s.status === "ok"
    );
    return found?.data ?? null;
  }, [state.data]);

  const progress = useMemo<TProgressData | null>(() => {
    const found = state.data?.sections.find(
      (s): s is TDashboardSection<TProgressData> & { status: "ok" } =>
        s.section_id === "progress" && s.status === "ok"
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

  const workloadSection = useMemo(() => {
    return state.data?.sections.find((s) => s.section_id === "workload_preview");
  }, [state.data]);

  const isLoading = state.status === "loading" || state.status === "idle";

  return (
    <div className="flex flex-col gap-4" data-testid="operations-overview-tab">
      <KpiStrip data={kpis} isLoading={isLoading} error={state.status === "error"} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ProgressPanel data={progress} isLoading={isLoading} error={state.status === "error"} />
        <DeliveryPanel data={delivery} isLoading={isLoading} error={state.status === "error"} />
        <TopProjectsPanel data={topProjects} isLoading={isLoading} error={state.status === "error"} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WorkloadPreviewPanel
          status={workloadSection?.status ?? "unavailable"}
          reason={workloadSection?.reason}
          isLoading={isLoading}
        />
        <AttentionPreviewPanel
          preview={attentionPreview}
          rows={attentionRows}
          reasonCounts={attentionStatus === "ok" ? attentionReasonCounts : null}
          isLoading={isLoading && attentionStatus !== "ok"}
          error={state.status === "error" || attentionStatus === "error"}
        />
      </div>
    </div>
  );
}