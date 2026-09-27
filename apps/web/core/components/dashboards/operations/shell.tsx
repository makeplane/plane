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
 *    An identity change IMMEDIATELY clears prior response data so
 *    a new principal never sees the previous principal's rows.
 * 2. Read the canonical scope from the store.
 * 3. Build the request payload via the central `buildScopePayload`
 *    helper (one place that injects `assignee_id` for "My work" and
 *    `start`/`end` for the custom period).
 * 4. Subscribe to the store; recompute the request payload on every
 *    change. The identity fingerprint (workspaceId+userId) is part
 *    of the debounced key so an identity swap refetches even when
 *    the rest of the scope is unchanged.
 * 5. Debounce burst-of-change (250ms) per spec §9.4 via a stable
 *    string key — NOT the raw payload object — so a re-render that
 *    doesn't change the payload never re-fires the request.
 * 6. POST `/api/workspaces/{slug}/dashboard/overview/` with the
 *    canonical scope payload.
 * 7. Race-response rejection: a late response for an old generation
 *    is dropped, never merged. The scope signature is captured at
 *    REQUEST START (not from a ref on response) so a stale ref cannot
 *    cause a cross-scope commit.
 * 8. Render sections; missing sections (status: "unavailable") get a
 *    typed placeholder, never fake zeros.
 *
 * Refresh lifecycle (spec §9.5):
 * - Manual refresh (Refresh button) bumps an in-component revision
 *   counter that is part of the request key, forcing a single fresh
 *   request after the debounce window settles.
 * - Identity swap bumps the revision counter via a "version" derived
 *   from `(workspaceId, userId)` so the same scope with a new viewer
 *   triggers exactly one fresh request.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TDashboardOverviewResponse } from "@plane/types";
import { useUser } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { dashboardOperationsService } from "@/services/dashboard-operations.service";
import {
  buildRequestKey,
  buildScopePayload,
  buildScopeSignature,
  type TDashboardScopeSignature,
} from "@plane/shared-state";
import { OperationsScopeControls } from "./scope-controls";
import { OperationsOverviewTab } from "./tabs/overview-tab";
import { OperationsProjectsTab } from "./tabs/projects-tab";
import { OperationsWorkloadTab } from "./tabs/workload-tab";
import { OperationsTimelineTab } from "./tabs/timeline-tab";
import { OperationsInsightsTab } from "./tabs/insights-tab";
import {
  useDashboardCustomRange,
  useDashboardOperationsSnapshot,
  useDashboardOperationsStore,
  useDashboardProjectIds,
  useDashboardTab,
} from "./use-operations-store";

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

/**
 * Identity fingerprint that participates in the request key. Two
 * requests with identical scope but different principal/workspace
 * intentionally produce different keys, so the shell never leaks
 * one viewer's response into another's view.
 */
function identityFingerprint(workspaceId: string | null, userId: string | null): string {
  return `ws=${workspaceId ?? "_"}|u=${userId ?? "_"}`;
}

export function OperationsShell({ workspaceSlug }: Props): React.ReactElement {
  const { data: currentUser } = useUser();
  const { currentWorkspace } = useWorkspace();
  const userId = currentUser?.id ?? null;
  const workspaceId = currentWorkspace?.id ?? null;

  const store = useDashboardOperationsStore();
  const snapshot = useDashboardOperationsSnapshot();
  const tab = useDashboardTab();
  const projectIds = useDashboardProjectIds();
  const customRange = useDashboardCustomRange();

  const [state, setState] = useState<RequestState>({
    status: "idle",
    data: null,
    error: null,
  });
  // Manual-refresh revision. Bumped by the Refresh button; reset to
  // 0 only on identity swap (the identity revision handles that case).
  const [refreshRevision, setRefreshRevision] = useState(0);
  const lastCommittedRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  // Identity revision. Bumped on every (workspaceId, userId) change
  // so a swap refetches even when the scope itself is unchanged.
  const identityRevision = useMemo(
    () => identityFingerprint(workspaceId, userId),
    [workspaceId, userId]
  );

  // Identity is set on mount + on user/workspace change. The effect
  // also clears prior data immediately so a new viewer never sees
  // the previous viewer's rows flash through before the next
  // response arrives.
  useEffect(() => {
    if (workspaceId === null || userId === null) {
      setState({ status: "idle", data: null, error: null });
    } else {
      store.setIdentity(workspaceId, userId);
      // Clear prior response immediately — race-safe commit gates
      // any late response, but the UI shouldn't display stale rows.
      setState((prev) => ({ ...prev, data: null }));
    }
  }, [store, workspaceId, userId]);

  // Central scope payload — every tab and every endpoint reads its
  // request payload from this single derivation.
  const request = useMemo(
    () =>
      buildScopePayload({
        prefs: snapshot,
        customRange,
        projectIds,
        currentUserId: userId,
      }),
    [snapshot, customRange.start, customRange.end, projectIds, userId]
  );

  // Scope signature: same inputs as the payload, but with a stable
  // string-key form for race-response rejection.
  const scopeSignature = useMemo(
    () =>
      buildScopeSignature({
        prefs: snapshot,
        projectIds,
        customRange,
        currentUserId: userId,
      }),
    [snapshot, customRange.start, customRange.end, projectIds, userId]
  );

  // Composite request key. Includes the identity revision + manual
  // refresh revision so swaps and explicit Refresh clicks refetch
  // even when the scope payload is byte-identical.
  const requestKeySource = useMemo(
    () =>
      `${identityRevision}::${refreshRevision}::${buildRequestKey(request)}`,
    [identityRevision, refreshRevision, request]
  );
  const debouncedRequestKey = useDebouncedValue(
    requestKeySource,
    DASHBOARD_OPERATIONS_DEBOUNCE_MS
  );

  // Fetch overview on each scope change; debounced; race-safe. The
  // effect captures the scope signature at REQUEST START so a stale
  // ref on response cannot cause a cross-scope commit.
  useEffect(() => {
    if (!workspaceSlug) return;
    if (debouncedRequestKey === null) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Capture the request signature NOW. The ref pattern would
    // let a stale signature slip through if a scope change happened
    // mid-flight; capturing the local value closes that gap.
    const signatureAtRequestStart: TDashboardScopeSignature = scopeSignature;
    const requestGeneration = store.beginRequest(signatureAtRequestStart);
    setState((prev) => ({ ...prev, status: "loading", error: null }));

    dashboardOperationsService
      .overview(workspaceSlug, request, controller.signal)
      .then((response) => {
        // Race-safe commit: only commit if the response belongs to
        // the current request generation AND the scope signature
        // captured at request start still matches.
        const committed = store.commitResponse(requestGeneration, signatureAtRequestStart);
        if (!committed) return;
        lastCommittedRef.current = requestGeneration;
        setState({ status: "ok", data: response, error: null });
      })
      .catch((err) => {
        const committed = store.commitResponse(requestGeneration, signatureAtRequestStart);
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
  }, [debouncedRequestKey, store, workspaceSlug]);

  const onRefresh = useCallback(() => {
    // Bump the refresh revision so the next debounced key forces
    // exactly one fresh request. Status is set optimistically so
    // the Refresh button surfaces the loading state immediately.
    setState((prev) => ({ ...prev, status: "loading", error: null }));
    setRefreshRevision((n) => n + 1);
  }, []);

  const onClearFilters = useCallback(() => {
    store.clearFilters();
  }, [store]);

  const onResetView = useCallback(() => {
    store.resetView();
  }, [store]);

  const onCreateWorkItem = useCallback(() => {
    // Spec §4.2 — the only tier-1 CTA is "create work item". The
    // product brief routes to the global issue composer entry
    // (`create-issue`); the legacy `/projects/` listing is the
    // graceful fallback only when the composer modal isn't mounted.
    const composerEvent = "create-issue";
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(composerEvent, { detail: { workspaceSlug } }));
      // Fallback to the projects list if the global composer hasn't
      // mounted. This is a no-op in app shell + storybook; in
      // production the global listener is registered by the root.
      if (!window.localStorage.getItem("plane.global-issue-composer")) {
        window.location.href = `/${workspaceSlug}/projects/`;
      }
    }
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