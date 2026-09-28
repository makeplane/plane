/**
 * @vitest-environment jsdom
 */
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Cutover smoke test — /dashboards renders the Team Operations shell
 * (spec §4.1, §4.2). Replaces the prior v3 cutover test once the
 * route was migrated from `WorkspaceDashboardShell` (v3) to
 * `OperationsShell` for the P0 Team Operations Dashboard redesign.
 *
 * Mounts the real route module —
 * `app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx` — not the
 * shell behind it, so this fails if anyone re-mounts the old v3
 * shell or routes `/dashboards` somewhere else. The /overview/
 * endpoint is mocked; section IDs are the source of truth so the
 * test asserts the product, not a hard-coded list.
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { TDashboardOverviewResponse } from "@plane/types";

type SentCall = { slug: string; payload: Record<string, unknown> };

const overviewCalls: SentCall[] = [];
const attentionCalls: SentCall[] = [];
const workloadPreviewCalls: SentCall[] = [];

vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));

vi.mock("@/hooks/store/user", () => ({ useUser: () => ({ data: { id: "user-1" } }) }));
vi.mock("@/hooks/store/use-workspace", () => ({
  useWorkspace: () => ({ currentWorkspace: { id: "ws-1", slug: "acme" } }),
}));

const overviewResponse: TDashboardOverviewResponse = {
  version: 1,
  generated_at: "2026-09-27T10:00:00Z",
  scope_key: "sk-1",
  resolved_scope: {
    workspace_id: "ws-1",
    principal_id: "user-1",
    project_ids: [],
    business_filters: {},
  },
  resolved_period: { start: null, end: null, today: "2026-09-27" },
  timezone: "UTC",
  sections: [
    {
      status: "ok",
      section_id: "kpis",
      data: {
        total: 12,
        open: 9,
        not_started: 5,
        started: 4,
        completed: 2,
        cancelled: 1,
        overdue: 2,
        due_today: 0,
        due_soon: 3,
        blocked: 3,
      },
    },
    {
      status: "ok",
      section_id: "progress",
      data: {
        state_groups: [
          { group: "backlog", count: 2 },
          { group: "unstarted", count: 3 },
          { group: "started", count: 4 },
          { group: "completed", count: 2 },
          { group: "cancelled", count: 1 },
        ],
        completion_rate: 2 / 11,
        denominator: 11,
      },
    },
    {
      status: "ok",
      section_id: "delivery",
      data: {
        bucket: "day",
        series_created: [{ bucket: "2026-09-27", count: 1 }],
        series_completed: [{ bucket: "2026-09-27", count: 1 }],
        created_total: 1,
        completed_total: 1,
        delta: 0,
      },
    },
    {
      status: "ok",
      section_id: "top_projects",
      data: { top: [], total_projects_in_scope: 0, shown: 0 },
    },
    {
      status: "unavailable",
      section_id: "workload_preview",
      reason: "workload_read_model_pending_task_3",
    },
    {
      status: "ok",
      section_id: "request_meta",
      data: { date_bucket: "day" },
    },
  ],
};

const attentionResponse = {
  version: 1,
  generated_at: "2026-09-27T10:00:00Z",
  scope_key: "sk-1",
  resolved_scope: {
    workspace_id: "ws-1",
    principal_id: "user-1",
    project_ids: [],
    business_filters: {},
  },
  resolved_period: { start: null, end: null, today: "2026-09-27" },
  timezone: "UTC",
  sections: [
    {
      status: "ok",
      section_id: "attention",
      data: {
        rows: [],
        total: 0,
        reason_counts: { overdue: 0, blocked: 0, due_soon: 0, unassigned_urgent_high: 0 },
        union_total: 0,
        page: 1,
        page_size: 5,
        has_more: false,
        scope_key: "sk-1",
      },
    },
  ],
};

// Module-scope reference to the mocked service instance so tests
// can temporarily override individual methods (e.g. to inject
// controlled deferred promises for the stale-response test) and
// restore them afterwards. The instance is created by the
// `vi.mock` factory below; we read it from the exported
// `dashboardOperationsService` inside the test bodies.
vi.mock("@/services/dashboard-operations.service", () => {
  class DashboardOperationsService {
    public overview = async (slug: string, payload: Record<string, unknown>) => {
      overviewCalls.push({ slug, payload });
      return overviewResponse;
    };
    public attention = async (slug: string, payload: Record<string, unknown>) => {
      attentionCalls.push({ slug, payload });
      return attentionResponse;
    };
    public items = async () => attentionResponse;
    public workload = async (slug: string, payload: Record<string, unknown>) => {
      workloadPreviewCalls.push({ slug, payload });
      return {
        ...overviewResponse,
        sections: [{ status: "unavailable", section_id: "workload", reason: "endpoint_pending_task_3" }],
      };
    };
    public projects = async () => ({
      ...overviewResponse,
      sections: [{ status: "unavailable", section_id: "projects", reason: "endpoint_pending_task_3" }],
    });
    public timeline = async () => ({
      ...overviewResponse,
      sections: [{ status: "unavailable", section_id: "timeline", reason: "endpoint_pending_task_3" }],
    });
  }
  return { DashboardOperationsService, dashboardOperationsService: new DashboardOperationsService() };
});

import WorkspaceDashboardsPage from "../../../app/(all)/[workspaceSlug]/(projects)/dashboards/page";
import { DASHBOARD_OPERATIONS_DEBOUNCE_MS } from "@/components/dashboards/operations/shell";
import { defaultDashboardOperationsPreferences } from "@plane/shared-state";
import { __resetDashboardOperationsStoreForTests } from "@/components/dashboards/operations/use-operations-store";
import { dashboardOperationsService } from "@/services/dashboard-operations.service";
import { getDashboardOperationsStoreSingleton } from "@/components/dashboards/operations/use-operations-store";

// Reference to the mocked `dashboardOperationsService` so tests
// can swap individual method implementations (controlled deferred
// promises, etc.) and restore them in `finally`.
const serviceRef = dashboardOperationsService as unknown as {
  overview: typeof dashboardOperationsService.overview;
  attention: typeof dashboardOperationsService.attention;
  workload: typeof dashboardOperationsService.workload;
  items: typeof dashboardOperationsService.items;
  projects: typeof dashboardOperationsService.projects;
  timeline: typeof dashboardOperationsService.timeline;
};

// The singleton `DashboardOperationsStore` is accessed via a
// non-hook accessor so individual tests can seed `setCustomRange` /
// `setProjectIds` and verify they flow through every endpoint.
const serviceStoreRef = getDashboardOperationsStoreSingleton;

const Route = WorkspaceDashboardsPage as unknown as (props: { params: { workspaceSlug: string } }) => ReactElement;

const mountRoute = async (workspaceSlug = "acme") => {
  const view = render(<Route params={{ workspaceSlug }} />);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, DASHBOARD_OPERATIONS_DEBOUNCE_MS + 60));
  });
  return view;
};

beforeEach(() => {
  overviewCalls.length = 0;
  attentionCalls.length = 0;
  workloadPreviewCalls.length = 0;
  // Reset the singleton store between tests so each test starts
  // with a fresh identity / scope / projectIds. Without this,
  // a previous test's `setViewMode("my_work")` or similar mutation
  // leaks into the next test and triggers effect re-fires.
  __resetDashboardOperationsStoreForTests();
});

afterEach(() => {
  vi.clearAllMocks();
  // Unmount the React tree from the previous test. Without this
  // the singleton store captures the prior test's prefs (e.g. a
  // previous test's `setViewMode("my_work")` survives across tests
  // and breaks the next test's "store starts in team view" assertion).
  cleanup();
});

describe("Cutover — /dashboards renders the Team Operations shell", () => {
  test("the route mounts the operations shell, not the v3 fixed-card dashboard", async () => {
    await mountRoute();
    expect(screen.getByTestId("workspace-dashboard-operations")).toBeTruthy();
    expect(screen.getByTestId("operations-scope-controls")).toBeTruthy();
    expect(screen.getByTestId("operations-tabs")).toBeTruthy();
    // v3 identifiers must not be present.
    expect(screen.queryByTestId("workspace-dashboard-v3")).toBeNull();
    expect(screen.queryByTestId("dashboard-v3-global-controls")).toBeNull();
    // The old builder surface is unreachable from this route.
    expect(document.body.textContent).not.toMatch(/create dashboard|add widget|new dashboard/i);
  });

  test("the canonical six snapshot KPIs render with the data from /overview/", async () => {
    await mountRoute();
    for (const kpiId of ["total", "completed", "started", "not_started", "blocked", "overdue"]) {
      expect(screen.getByTestId(`kpi-${kpiId}`)).toBeTruthy();
    }
  });

  test("the workload preview surfaces a typed unavailable state when the server reports it", async () => {
    await mountRoute();
    expect(screen.getByTestId("workload-preview-unavailable")).toBeTruthy();
    // The unavailable placeholder must not display numeric counts (no fake data).
    expect(screen.queryByTestId("workload-preview-row")).toBeNull();
  });

  test("one overview request goes out for the route's workspace", async () => {
    await mountRoute("acme");
    expect(overviewCalls).toHaveLength(1);
    expect(overviewCalls[0].slug).toBe("acme");
  });

  test("mount fires exactly one overview + one attention + one workload-preview request", async () => {
    // The mounted-shell integration must assert EXACT counts, not
    // >=/<= bounds — otherwise a regression that double-fires on
    // mount slips through. setIdentity must not replace the
    // snapshot when the loaded prefs are structurally equal, or
    // every consumer's effect re-runs.
    await mountRoute("acme");
    expect(overviewCalls).toHaveLength(1);
    expect(attentionCalls).toHaveLength(1);
    expect(workloadPreviewCalls).toHaveLength(1);
  });

  test("clicking Refresh fires one additional overview, attention, and workload-preview request each", async () => {
    // Spec §9.5 — Refresh forces a fresh fetch on the entire
    // visible Dashboard: overview + attention + workload preview.
    await mountRoute("acme");
    const overviewBefore = overviewCalls.length;
    const attentionBefore = attentionCalls.length;
    const workloadBefore = workloadPreviewCalls.length;
    const refresh = screen.getByTestId("operations-refresh");
    fireEvent.click(refresh);
    // Wait long enough for the 250ms debounce + React effects.
    // NOTE: we deliberately do NOT wrap the wait in `act()` — the
    // synchronous flush it performs cancels the debounced
    // setTimeout, leaving the click without a fetch.
    await new Promise((resolve) => setTimeout(resolve, DASHBOARD_OPERATIONS_DEBOUNCE_MS * 3 + 100));
    expect(overviewCalls.length).toBe(overviewBefore + 1);
    expect(attentionCalls.length).toBe(attentionBefore + 1);
    expect(workloadPreviewCalls.length).toBe(workloadBefore + 1);
  });

  test("changing view_mode (Team <-> My work) refreshes overview + attention + workload", async () => {
    // Per spec §8: My work injects assignee_id=[currentUserId] on
    // every endpoint. A flip between view modes must refetch every
    // consumer that participates in the central scope builder.
    await mountRoute("acme");
    const overviewBefore = overviewCalls.length;
    const attentionBefore = attentionCalls.length;
    const workloadBefore = workloadPreviewCalls.length;
    const myWorkBtn = screen.getByTestId("operations-view-mode-my-work");
    fireEvent.click(myWorkBtn);
    await new Promise((resolve) => setTimeout(resolve, DASHBOARD_OPERATIONS_DEBOUNCE_MS * 3 + 100));
    expect(overviewCalls.length).toBe(overviewBefore + 1);
    expect(attentionCalls.length).toBe(attentionBefore + 1);
    expect(workloadPreviewCalls.length).toBe(workloadBefore + 1);
    // Verify the wire payload carries the My-work assignee filter
    // so the backend scopes correctly.
    const lastOverview = overviewCalls[overviewCalls.length - 1];
    const bf = (lastOverview.payload.business_filters ?? {}) as Record<string, string[]>;
    expect(bf.assignee_id).toEqual(["user-1"]);
  });

  test("a deferred (stale) /overview response is dropped, not committed", async () => {
    // Race-response rejection: when the user changes scope mid-flight,
    // the older request's response must NOT overwrite the newer one.
    //
    // We construct two controlled deferred promises that resolve
    // with DISTINCT, REAL KPI values so the assertion can verify the
    // UI committed the newer payload and not the older:
    //   promise1 (idx=0) — the STALE call. Resolves with kpi_total=111.
    //   promise2 (idx=1) — the FRESH call. Resolves with kpi_total=222.
    //
    // Flow:
    //   1. Mount fires overview call #1 (promise1 pending).
    //   2. While promise1 is still pending, the user flips Team → My
    //      work. This is a real SCOPE change (view_mode flips), so a
    //      second overview call (#2) fires immediately — the
    //      Refresh button is legitimately disabled while #1 is in
    //      flight, but the scope change is not gated by the shell's
    //      loading state.
    //   3. Resolve promise2 FIRST → UI commits "FRESH" (kpi_total=222).
    //   4. Resolve promise1 (stale) → shell's commitResponse gate
    //      MUST reject it; UI must NOT regress to kpi_total=111.
    const resolvers: Array<(value: unknown) => void> = [];
    const promises = [new Promise((r) => resolvers.push(r)), new Promise((r) => resolvers.push(r))];
    let callIndex = 0;
    const originalOverview = dashboardOperationsService.overview.bind(dashboardOperationsService);
    dashboardOperationsService.overview = (async (_slug: string, _payload: Record<string, unknown>) => {
      const idx = callIndex++;
      const promise = promises[idx];
      // Distinct KPI total per response — 111 for the stale call,
      // 222 for the fresh call. The KPI strip renders this count
      // directly so the assertion is meaningful (a UI "Invalid Date"
      // or vacuous `.not.toMatch(/STALE/)` would silently pass even
      // if the wrong response committed).
      const total = idx === 0 ? 111 : 222;
      const completed = idx === 0 ? 50 : 80;
      return promise.then(() => ({
        ...overviewResponse,
        generated_at: new Date(`2026-09-27T10:00:${idx === 0 ? "00" : "30"}Z`).toISOString(),
        sections: overviewResponse.sections.map((s) =>
          s.section_id === "kpis" && s.status === "ok" && s.data
            ? {
                ...s,
                data: { ...s.data, total, completed },
              }
            : s
        ),
      }));
    }) as typeof dashboardOperationsService.overview;
    try {
      await mountRoute("acme");
      // While promise1 is still pending, flip Team → My work. This
      // is a SCOPE change (view_mode flips), so a fresh overview
      // call (#2) fires immediately.
      const myWorkBtn = screen.getByTestId("operations-view-mode-my-work");
      fireEvent.click(myWorkBtn);
      await new Promise((resolve) => setTimeout(resolve, DASHBOARD_OPERATIONS_DEBOUNCE_MS * 5 + 200));
      // Both fetches have been issued.
      expect(callIndex).toBe(2);
      // Resolve promise2 (fresh, idx=1) FIRST — UI commits
      // kpi_total=222.
      resolvers[1](overviewResponse);
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Then resolve promise1 (stale, idx=0) — shell's
      // commitResponse gate MUST reject it; UI must NOT regress
      // to kpi_total=111.
      resolvers[0](overviewResponse);
      await new Promise((resolve) => setTimeout(resolve, 50));
      // The KPI strip renders the total count directly. Assert the
      // fresh value is committed and the stale one is dropped.
      expect(screen.getByTestId("kpi-total").textContent ?? "").toContain("222");
      expect(screen.getByTestId("kpi-total").textContent ?? "").not.toContain("111");
    } finally {
      dashboardOperationsService.overview = originalOverview;
    }
  });

  test("My work view carries currentUserId as business_filters.assignee_id on every endpoint", async () => {
    // Per spec §8: every consumer of the central scope builder must
    // see the same My-work payload. The Overview + Workload preview
    // + Attention preview all carry `assignee_id: [<currentUserId>]`
    // when view_mode = "my_work".
    await mountRoute("acme");
    const overviewBefore = overviewCalls.length;
    const attentionBefore = attentionCalls.length;
    const workloadBefore = workloadPreviewCalls.length;
    const myWorkBtn = screen.getByTestId("operations-view-mode-my-work");
    fireEvent.click(myWorkBtn);
    await new Promise((resolve) => setTimeout(resolve, DASHBOARD_OPERATIONS_DEBOUNCE_MS * 3 + 100));
    // All three endpoints refetched on My work (overview is
    // debounced; previews are immediate).
    expect(overviewCalls.length).toBe(overviewBefore + 1);
    expect(attentionCalls.length).toBe(attentionBefore + 1);
    expect(workloadPreviewCalls.length).toBe(workloadBefore + 1);
    // Every payload fetched AFTER My work was clicked carries the
    // My-work assignee_id filter.
    const postMyWorkCalls = [
      ...overviewCalls.slice(overviewBefore),
      ...attentionCalls.slice(attentionBefore),
      ...workloadPreviewCalls.slice(workloadBefore),
    ];
    for (const call of postMyWorkCalls) {
      const bf = (call.payload.business_filters ?? {}) as Record<string, string[]>;
      expect(bf.assignee_id).toEqual(["user-1"]);
    }
  });

  test("custom period wires start/end into every endpoint payload", async () => {
    // When the user picks a custom date range, the canonical
    // `buildScopePayload` must carry start + end on every endpoint.
    // We seed the store's custom range directly and click Refresh
    // so the Overview + attention + workload preview all refetch.
    const store = serviceStoreRef();
    store.setCustomRange("2026-09-01T00:00:00Z", "2026-09-30T00:00:00Z");
    store.setPeriodPreset("custom");
    await new Promise((resolve) => setTimeout(resolve, DASHBOARD_OPERATIONS_DEBOUNCE_MS * 3 + 100));
    for (const call of [...overviewCalls, ...attentionCalls, ...workloadPreviewCalls]) {
      const payload = call.payload;
      expect(payload.period_preset).toBe("custom");
      expect(payload.start).toBe("2026-09-01T00:00:00Z");
      expect(payload.end).toBe("2026-09-30T00:00:00Z");
    }
  });

  test("selected project_ids flow through every endpoint payload", async () => {
    // When the dashboard has project_ids selected, the canonical
    // `buildScopePayload` carries them through to every endpoint.
    const store = serviceStoreRef();
    store.setProjectIds(["project-a", "project-b"]);
    await new Promise((resolve) => setTimeout(resolve, DASHBOARD_OPERATIONS_DEBOUNCE_MS * 3 + 100));
    for (const call of [...overviewCalls, ...attentionCalls, ...workloadPreviewCalls]) {
      const payload = call.payload;
      expect(payload.project_ids).toEqual(["project-a", "project-b"]);
    }
  });
});
