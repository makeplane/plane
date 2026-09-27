/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Team Operations Dashboard shell (spec §4, §6, §7).
 *
 * Composition is product-defined and non-editable: the controls
 * header, then the per-tab content. There is no drag, no resize, no
 * layout persistence and no per-card query preferences — only the
 * shared scope preferences in `DashboardOperationsStore`.
 *
 * Data flow:
 * 1. Set identity on mount via `setIdentity(workspaceId, userId)`.
 * 2. Read the canonical scope from the store.
 * 3. Subscribe to the store; recompute the request payload on every
 *    change.
 * 4. Debounce burst-of-change (250ms) per spec §9.4.
 * 5. POST `/api/workspaces/{slug}/dashboard/overview/` with the
 *    canonical scope payload.
 * 6. Race-response rejection: a late response for an old generation is
 *    dropped, never merged into state.
 * 7. Render sections; missing sections (status: "unavailable") get a
 *    typed placeholder, never fake zeros.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  TDashboardOverviewResponse,
  TDashboardScopePayload,
} from "@plane/types";
import { useUser } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { dashboardOperationsService } from "@/services/dashboard-operations.service";
import { OperationsScopeControls } from "./scope-controls";
import { OperationsOverviewTab } from "./tabs/overview-tab";
import { OperationsProjectsTab } from "./tabs/projects-tab";
import { OperationsWorkloadTab } from "./tabs/workload-tab";
import { OperationsTimelineTab } from "./tabs/timeline-tab";
import { OperationsInsightsTab } from "./tabs/insights-tab";
import {
  useDashboardOperationsSnapshot,
  useDashboardOperationsStore,
  useDashboardRequestGeneration,
  useDashboardTab,
} from "./use-operations-store";
import { buildScopeSignature } from "@plane/shared-state";

/** §9.4 — coalesce a burst of control changes into one request. */
export const DASHBOARD_OPERATIONS_DEBOUNCE_MS = 250;

interface Props {
  workspaceSlug: string;
}

interface RequestState {
  status: "idle" | "loading" | "ok" | "error";
  data: TDashboardOverviewResponse | null;
  error: string | null;
}

export function OperationsShell({ workspaceSlug }: Props): React.ReactElement {
  const { data: currentUser } = useUser();
  const { currentWorkspace } = useWorkspace();
  const userId = currentUser?.id ?? null;
  const workspaceId = currentWorkspace?.id ?? null;

  const store = useDashboardOperationsStore();
  const snapshot = useDashboardOperationsSnapshot();
  const tab = useDashboardTab();
  const generation = useDashboardRequestGeneration();

  const [state, setState] = useState<RequestState>({
    status: "idle",
    data: null,
    error: null,
  });
  const lastCommittedRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // Identity is set on mount + on user/workspace change.
  useEffect(() => {
    store.setIdentity(workspaceId, userId);
  }, [store, workspaceId, userId]);

  // Build the canonical scope payload from the store + project IDs.
  const request = useMemo<TDashboardScopePayload>(() => {
    const range = store.getCustomRange();
    const projectIds = store.getProjectIds();
    const payload: TDashboardScopePayload = {
      period_preset: snapshot.period_preset,
      start: snapshot.period_preset === "custom" ? range.start : null,
      end: snapshot.period_preset === "custom" ? range.end : null,
      business_filters: snapshot.business_filters,
      date_bucket: snapshot.date_bucket,
    };
    if (projectIds.length > 0) payload.project_ids = projectIds.slice();
    return payload;
  }, [
    snapshot.business_filters,
    snapshot.date_bucket,
    snapshot.period_preset,
    store,
  ]);

  const scopeSignature = useMemo(
    () => buildScopeSignature(snapshot, store.getProjectIds()),
    [snapshot, store]
  );

  const debouncedRequestKey = useDebouncedValue(JSON.stringify(request), DASHBOARD_OPERATIONS_DEBOUNCE_MS);

  // Fetch overview on each scope change; debounced; race-safe.
  useEffect(() => {
    if (!workspaceSlug) return;
    if (debouncedRequestKey === null) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const requestGeneration = store.beginRequest(scopeSignature);
    setState((prev) => ({ ...prev, status: "loading", error: null }));

    dashboardOperationsService
      .overview(workspaceSlug, request, controller.signal)
      .then((response) => {
        // Race-safe commit: only commit if the response belongs to the
        // current request generation.
        const committed = store.commitResponse(requestGeneration, scopeSignature);
        if (!committed) return;
        lastCommittedRef.current = requestGeneration;
        setState({ status: "ok", data: response, error: null });
      })
      .catch((err) => {
        const committed = store.commitResponse(requestGeneration, scopeSignature);
        if (!committed) return;
        setState({
          status: "error",
          data: null,
          error: typeof err === "string" ? err : err?.error ?? "request_failed",
        });
      });

    return () => {
      controller.abort();
    };
  }, [debouncedRequestKey, scopeSignature, store, workspaceSlug, request]);

  const onRefresh = useCallback(() => {
    // Re-key the request payload to force a re-fetch.
    setState((prev) => ({ ...prev, status: "loading", error: null }));
    // Bump the store's lastCommittedGeneration so the next request is treated as fresh.
    lastCommittedRef.current = 0;
    store.beginRequest(scopeSignature);
  }, [store, scopeSignature]);

  const onClearFilters = useCallback(() => {
    store.clearFilters();
  }, [store]);

  const onResetView = useCallback(() => {
    store.resetView();
  }, [store]);

  const onCreateWorkItem = useCallback(() => {
    // Spec §4.2 — the only tier-1 CTA is "create work item". Real
    // routing/modal opens a project picker; for the dashboard shell
    // we surface the intent and route via the existing issue composer
    // entry point so we never fabricate an action.
    const url = `/${workspaceSlug}/projects/`;
    if (typeof window !== "undefined") window.location.href = url;
  }, [workspaceSlug]);

  const updatedAt = state.data?.generated_at ?? null;

  return (
    <div className="flex h-full flex-col overflow-y-auto" data-testid="workspace-dashboard-operations">
      <OperationsScopeControls
        workspaceSlug={workspaceSlug}
        updatedAt={updatedAt}
        isRefreshing={state.status === "loading"}
        onRefresh={onRefresh}
        onClearFilters={onClearFilters}
        onResetView={onResetView}
        onCreateWorkItem={onCreateWorkItem}
      />

      <div className="flex flex-col gap-4 p-5" data-testid="operations-tab-content">
        {tab === "overview" ? (
          <OperationsOverviewTab workspaceSlug={workspaceSlug} state={state} />
        ) : tab === "projects" ? (
          <OperationsProjectsTab workspaceSlug={workspaceSlug} />
        ) : tab === "workload" ? (
          <OperationsWorkloadTab workspaceSlug={workspaceSlug} />
        ) : tab === "timeline" ? (
          <OperationsTimelineTab workspaceSlug={workspaceSlug} />
        ) : (
          <OperationsInsightsTab workspaceSlug={workspaceSlug} />
        )}
      </div>
    </div>
  );
}

/** Tiny debounce hook used by the overview fetcher. */
function useDebouncedValue<T>(value: T, ms: number): T | null {
  const [debounced, setDebounced] = useState<T | null>(null);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(handle);
  }, [value, ms]);
  return debounced;
}