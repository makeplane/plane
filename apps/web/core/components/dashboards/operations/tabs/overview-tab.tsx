/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Overview — layout v2 + Codex review: plain-language panels, Hiện tại /
 * Trong kỳ badges, 30-second fold then scroll for timeline + projects table.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  TAttentionPreviewData,
  TDeliveryTrendData,
  TIssueRow,
  TKpiCounts,
  TProgressData,
  TProjectsData,
  TSectionStatus,
  TSnapshotRule,
  TDashboardOverviewResponse,
  TDashboardSection,
  TTimelineData,
  TTopProjectsData,
  TWorkItemsGroupData,
  TWorkloadMemberRow,
} from "@plane/types";
import { buildScopePayload } from "@plane/shared-state";
import { dashboardOperationsService } from "@/services/dashboard-operations.service";
import { useUser } from "@/hooks/store/user";
import {
  useDashboardCustomRange,
  useDashboardOperationsSnapshot,
  useDashboardProjectIds,
  useDashboardWorkloadBreakdownBy,
} from "../use-operations-store";
import { classifyDashboardError, classifySection, type TDashboardTabError } from "../error-handling";
import { ItemDrawer } from "../item-drawer";
import { KpiStrip } from "../panels/kpi-strip";
import { ProgressPanel } from "../panels/progress-panel";
import { DeliveryPanel } from "../panels/delivery-panel";
import { TopProjectsPanel } from "../panels/top-projects-panel";
import { AttentionPreviewPanel } from "../panels/attention-preview-panel";
import { WorkloadPreviewPanel } from "../panels/workload-preview-panel";
import { WorkItemsGroupPanel } from "../panels/work-items-group-panel";
import { ProjectsPreviewPanel } from "../panels/projects-preview-panel";
import { CyclesPreviewPanel, DeadlinesPreviewPanel } from "../panels/timeline-split-panels";
import { ScopeTimeBadge } from "../panels/scope-time-badge";

export interface OverviewRequestState {
  status: "idle" | "loading" | "ok" | "error";
  data: TDashboardOverviewResponse | null;
  error: string | null;
}

interface Props {
  workspaceSlug: string;
  state: OverviewRequestState;
  refreshRevision?: number;
}

const WORKLOAD_PREVIEW_SIZE = 5;
const PROJECTS_PREVIEW_SIZE = 10;
const GROUP_PREVIEW_LIMIT = 10;

export function OperationsOverviewTab({ workspaceSlug, state, refreshRevision = 0 }: Props): React.ReactElement {
  const { data: currentUser } = useUser();
  const snapshot = useDashboardOperationsSnapshot();
  const projectIds = useDashboardProjectIds();
  const customRange = useDashboardCustomRange();
  const currentUserId = currentUser?.id ?? null;
  const overviewGroupBy = snapshot.overview_group_by;
  const workloadBreakdownBy = useDashboardWorkloadBreakdownBy();

  const scopePayload = useMemo(
    () =>
      buildScopePayload({
        prefs: snapshot,
        customRange,
        projectIds,
        currentUserId,
      }),
    [snapshot, customRange, projectIds, currentUserId]
  );

  const [workloadRows, setWorkloadRows] = useState<TWorkloadMemberRow[]>([]);
  const [workloadTotalMembers, setWorkloadTotalMembers] = useState<number | undefined>(undefined);
  const [workloadSectionStatus, setWorkloadSectionStatus] = useState<TSectionStatus>("ok");
  const [workloadSectionReason, setWorkloadSectionReason] = useState<string | undefined>(undefined);
  const [workloadFetchError, setWorkloadFetchError] = useState<TDashboardTabError | null>(null);
  const workloadGenerationRef = useRef(0);
  const [workloadReloadKey, setWorkloadReloadKey] = useState(0);

  const [groupData, setGroupData] = useState<TWorkItemsGroupData | null>(null);
  const [groupFetchError, setGroupFetchError] = useState<TDashboardTabError | null>(null);
  const groupGenerationRef = useRef(0);
  const [groupReloadKey, setGroupReloadKey] = useState(0);

  const [projectsData, setProjectsData] = useState<TProjectsData | null>(null);
  const [projectsFetchError, setProjectsFetchError] = useState<TDashboardTabError | null>(null);
  const projectsGenerationRef = useRef(0);
  const [projectsReloadKey, setProjectsReloadKey] = useState(0);

  const [timelineData, setTimelineData] = useState<TTimelineData | null>(null);
  const [timelineFetchError, setTimelineFetchError] = useState<TDashboardTabError | null>(null);
  const timelineGenerationRef = useRef(0);
  const [timelineReloadKey, setTimelineReloadKey] = useState(0);

  useEffect(() => {
    if (!workspaceSlug) return;
    const controller = new AbortController();
    const generation = ++workloadGenerationRef.current;
    setWorkloadFetchError(null);
    dashboardOperationsService
      .workload(
        workspaceSlug,
        {
          ...scopePayload,
          page: 1,
          page_size: WORKLOAD_PREVIEW_SIZE,
          preview: true,
          breakdown_by: workloadBreakdownBy,
        },
        controller.signal
      )
      .then((envelope) => {
        if (generation !== workloadGenerationRef.current) return undefined;
        const section = envelope.sections.find((entry) => entry.section_id === "workload");
        const classified = classifySection(
          section as
            | {
                section_id: string;
                status: "ok" | "error" | "unavailable";
                data?: import("@plane/types").TWorkloadData;
                reason?: string;
              }
            | undefined
        );
        if (classified.kind === "ok") {
          if (classified.data.scope_key && envelope.scope_key && classified.data.scope_key !== envelope.scope_key) {
            return undefined;
          }
          setWorkloadSectionStatus("ok");
          setWorkloadSectionReason(undefined);
          setWorkloadTotalMembers(classified.data.total_members);
          const rows = classified.data.rows;
          setWorkloadRows(rows.slice(0, WORKLOAD_PREVIEW_SIZE));
          return undefined;
        }
        if (classified.kind === "unavailable") {
          setWorkloadSectionStatus("unavailable");
          setWorkloadSectionReason(classified.reason);
          setWorkloadRows([]);
          return undefined;
        }
        setWorkloadSectionStatus("error");
        setWorkloadSectionReason(classified.reason);
        setWorkloadRows([]);
        return undefined;
      })
      .catch((err) => {
        if (generation !== workloadGenerationRef.current) return;
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED" || err?.code === "ABORTED") return;
        setWorkloadSectionStatus("error");
        setWorkloadFetchError(classifyDashboardError(err));
        setWorkloadRows([]);
      });
    return () => controller.abort();
  }, [workspaceSlug, scopePayload, workloadReloadKey, refreshRevision, workloadBreakdownBy]);

  useEffect(() => {
    if (!workspaceSlug) return;
    const controller = new AbortController();
    const generation = ++groupGenerationRef.current;
    setGroupFetchError(null);
    dashboardOperationsService
      .workItemsGroup(
        workspaceSlug,
        { ...scopePayload, group_by: overviewGroupBy, limit: GROUP_PREVIEW_LIMIT },
        controller.signal
      )
      .then((envelope) => {
        if (generation !== groupGenerationRef.current) return undefined;
        const section = envelope.sections.find((entry) => entry.section_id === "work_items_group");
        const classified = classifySection<TWorkItemsGroupData>(section as never);
        if (classified.kind === "ok") {
          setGroupData(classified.data);
          return undefined;
        }
        setGroupData(null);
        setGroupFetchError({ kind: "malformed", message: classified.reason ?? "error" });
        return undefined;
      })
      .catch((err) => {
        if (generation !== groupGenerationRef.current) return;
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED" || err?.code === "ABORTED") return;
        setGroupData(null);
        setGroupFetchError(classifyDashboardError(err));
      });
    return () => controller.abort();
  }, [workspaceSlug, scopePayload, overviewGroupBy, groupReloadKey, refreshRevision]);

  useEffect(() => {
    if (!workspaceSlug) return;
    const controller = new AbortController();
    const generation = ++projectsGenerationRef.current;
    setProjectsFetchError(null);
    dashboardOperationsService
      .projects(workspaceSlug, { ...scopePayload, page: 1, page_size: PROJECTS_PREVIEW_SIZE }, controller.signal)
      .then((envelope) => {
        if (generation !== projectsGenerationRef.current) return undefined;
        const section = envelope.sections.find((entry) => entry.section_id === "projects");
        const classified = classifySection<TProjectsData>(section as never);
        if (classified.kind === "ok") {
          setProjectsData(classified.data);
          return undefined;
        }
        setProjectsData(null);
        setProjectsFetchError({ kind: "malformed", message: classified.reason ?? "error" });
        return undefined;
      })
      .catch((err) => {
        if (generation !== projectsGenerationRef.current) return;
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED" || err?.code === "ABORTED") return;
        setProjectsData(null);
        setProjectsFetchError(classifyDashboardError(err));
      });
    return () => controller.abort();
  }, [workspaceSlug, scopePayload, projectsReloadKey, refreshRevision]);

  useEffect(() => {
    if (!workspaceSlug) return;
    const controller = new AbortController();
    const generation = ++timelineGenerationRef.current;
    setTimelineFetchError(null);
    dashboardOperationsService
      .timeline(
        workspaceSlug,
        { ...scopePayload, page_size: 5, cycles_page: 1, deadlines_page: 1, unscheduled_page: 1 },
        controller.signal
      )
      .then((envelope) => {
        if (generation !== timelineGenerationRef.current) return undefined;
        const section = envelope.sections.find((entry) => entry.section_id === "timeline");
        const classified = classifySection<TTimelineData>(section as never);
        if (classified.kind === "ok") {
          setTimelineData(classified.data);
          return undefined;
        }
        setTimelineData(null);
        setTimelineFetchError({ kind: "malformed", message: classified.reason ?? "error" });
        return undefined;
      })
      .catch((err) => {
        if (generation !== timelineGenerationRef.current) return;
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED" || err?.code === "ABORTED") return;
        setTimelineData(null);
        setTimelineFetchError(classifyDashboardError(err));
      });
    return () => controller.abort();
  }, [workspaceSlug, scopePayload, timelineReloadKey, refreshRevision]);

  const [drawerMetric, setDrawerMetric] = useState<TSnapshotRule | null>(null);
  const onKpiClick = useCallback((metric: TSnapshotRule) => setDrawerMetric(metric), []);
  const onDrawerClose = useCallback(() => setDrawerMetric(null), []);

  const [attentionRows, setAttentionRows] = useState<TIssueRow[]>([]);
  const [attentionReasonCounts, setAttentionReasonCounts] = useState<Record<string, number>>({});
  const [attentionStatus, setAttentionStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const attentionGenerationRef = useRef(0);

  useEffect(() => {
    if (!workspaceSlug) return;
    const controller = new AbortController();
    const generation = ++attentionGenerationRef.current;
    setAttentionStatus("loading");
    dashboardOperationsService
      .attention(workspaceSlug, { ...scopePayload, page: 1, page_size: 5 }, controller.signal)
      .then((response) => {
        if (generation !== attentionGenerationRef.current) return undefined;
        const section = response.sections.find((entry) => entry.section_id === "attention");
        if (!section || section.status !== "ok" || !section.data) {
          setAttentionStatus("error");
          return undefined;
        }
        const data = section.data as { rows?: TIssueRow[]; reason_counts?: Record<string, number> };
        setAttentionRows(data.rows ?? []);
        setAttentionReasonCounts(data.reason_counts ?? {});
        setAttentionStatus("ok");
        return undefined;
      })
      .catch(() => {
        if (generation !== attentionGenerationRef.current) return;
        setAttentionStatus("error");
      });
    return () => controller.abort();
  }, [workspaceSlug, scopePayload, refreshRevision]);

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
  const timelineRetry = () => setTimelineReloadKey((n) => n + 1);

  return (
    <div className="flex flex-col gap-4" data-testid="operations-overview-tab">
      <header className="flex flex-col gap-1 rounded-md border border-subtle bg-layer-2/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-14 font-semibold text-primary">Tóm tắt nhanh</h2>
          <ScopeTimeBadge kind="snapshot" />
        </div>
        <p className="text-12 text-secondary">
          Nhìn tình hình team trong khoảng 30 giây. Cuộn xuống để xem hạn, chu kỳ và bảng dự án chi tiết hơn.
        </p>
        <p className="text-11 text-tertiary">Chạm vào ô số liệu để xem danh sách việc tương ứng.</p>
      </header>

      <KpiStrip data={kpis} isLoading={isLoading} error={state.status === "error"} onMetricClick={onKpiClick} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
        <div className="flex lg:col-span-4">
          <ProgressPanel data={progress} isLoading={isLoading} error={state.status === "error"} />
        </div>
        <div className="flex lg:col-span-4">
          <DeliveryPanel data={delivery} isLoading={isLoading} error={state.status === "error"} />
        </div>
        <div className="flex lg:col-span-4">
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
            totalMembers={workloadTotalMembers}
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

      <p className="text-11 font-medium tracking-wide text-tertiary uppercase">Cuộn thêm — lịch & dự án</p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <CyclesPreviewPanel
            data={timelineData}
            isLoading={isLoading && timelineData === null && timelineFetchError === null}
            error={timelineFetchError}
            onRetry={timelineRetry}
          />
        </div>
        <div className="lg:col-span-5">
          <DeadlinesPreviewPanel
            data={timelineData}
            isLoading={isLoading && timelineData === null && timelineFetchError === null}
            error={timelineFetchError}
            onRetry={timelineRetry}
          />
        </div>
      </div>

      <ProjectsPreviewPanel
        data={projectsData}
        isLoading={isLoading && projectsData === null && projectsFetchError === null}
        error={projectsFetchError}
        onRetry={() => setProjectsReloadKey((n) => n + 1)}
      />

      <WorkItemsGroupPanel
        groupBy={overviewGroupBy}
        data={groupData}
        isLoading={isLoading && groupData === null && groupFetchError === null}
        error={groupFetchError}
        onRetry={() => setGroupReloadKey((n) => n + 1)}
      />

      {drawerMetric !== null ? (
        <ItemDrawer workspaceSlug={workspaceSlug} open onClose={onDrawerClose} metric={drawerMetric} />
      ) : null}
    </div>
  );
}
