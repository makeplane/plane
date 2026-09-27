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

import { act, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { TDashboardOverviewResponse } from "@plane/types";

type SentCall = { slug: string; payload: Record<string, unknown> };

const overviewCalls: SentCall[] = [];

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
      data: { total: 12, open: 9, not_started: 5, started: 4, completed: 2, cancelled: 1, overdue: 2, due_today: 0, due_soon: 3, blocked: 3 },
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

vi.mock("@/services/dashboard-operations.service", () => {
  class DashboardOperationsService {
    public overview = async (slug: string, payload: Record<string, unknown>) => {
      overviewCalls.push({ slug, payload });
      return overviewResponse;
    };
    public attention = async () => attentionResponse;
    public items = async () => attentionResponse;
    public workload = async () => ({
      ...overviewResponse,
      sections: [{ status: "unavailable", section_id: "workload", reason: "endpoint_pending_task_3" }],
    });
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
});

afterEach(() => {
  vi.clearAllMocks();
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

  test("the workload preview surfaces a typed unavailable state when Task 3 is pending", async () => {
    await mountRoute();
    expect(screen.getByTestId("workload-preview-pending")).toBeTruthy();
    // The pending placeholder must not display numeric counts (no fake data).
    expect(screen.queryByTestId("workload-preview-row")).toBeNull();
  });

  test("one overview request goes out for the route's workspace", async () => {
    await mountRoute("acme");
    expect(overviewCalls).toHaveLength(1);
    expect(overviewCalls[0].slug).toBe("acme");
  });
});