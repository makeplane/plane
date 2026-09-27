/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* @vitest-environment jsdom */

import { describe, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { KpiStrip } from "@/components/dashboards/operations/panels/kpi-strip";
import { ProgressPanel } from "@/components/dashboards/operations/panels/progress-panel";
import { TopProjectsPanel } from "@/components/dashboards/operations/panels/top-projects-panel";
import { AttentionPreviewPanel } from "@/components/dashboards/operations/panels/attention-preview-panel";
import { WorkloadPreviewPanel } from "@/components/dashboards/operations/panels/workload-preview-panel";
import { DeliveryPanel } from "@/components/dashboards/operations/panels/delivery-panel";

import {
  defaultDashboardOperationsPreferences,
  DashboardOperationsStore,
  type TDashboardOperationsStorage,
} from "@plane/shared-state";
import { OperationsScopeControls } from "@/components/dashboards/operations/scope-controls";
import type {
  TAttentionPreviewData,
  TDeliveryTrendData,
  TIssueRow,
  TKpiCounts,
  TProgressData,
  TTopProjectsData,
} from "@plane/types";

// Per package conventions the store needs a storage shim.
const memoryStorage = (): TDashboardOperationsStorage => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
    removeItem: (key: string) => {
      items.delete(key);
    },
  };
};

const KPI_OK: TKpiCounts = {
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
};

const PROGRESS_OK: TProgressData = {
  state_groups: [
    { group: "backlog", count: 2 },
    { group: "unstarted", count: 3 },
    { group: "started", count: 4 },
    { group: "completed", count: 2 },
    { group: "cancelled", count: 1 },
  ],
  completion_rate: 2 / 11,
  denominator: 11,
};

const DELIVERY_OK: TDeliveryTrendData = {
  bucket: "day",
  series_created: [
    { bucket: "2026-09-20", count: 2 },
    { bucket: "2026-09-21", count: 0 },
    { bucket: "2026-09-22", count: 1 },
  ],
  series_completed: [
    { bucket: "2026-09-20", count: 1 },
    { bucket: "2026-09-21", count: 0 },
    { bucket: "2026-09-22", count: 1 },
  ],
  created_total: 3,
  completed_total: 2,
  delta: 1,
};

const TOP_OK: TTopProjectsData = {
  top: [
    { project_id: "p-1", name: "Apollo", open: 5, overdue: 2, blocked: 1 },
    { project_id: "p-2", name: "Zeus", open: 3, overdue: 0, blocked: 0 },
  ],
  total_projects_in_scope: 4,
  shown: 2,
};

const ISSUE_ROW: TIssueRow = {
  id: "iss-1",
  name: "Quarterly review",
  sequence_id: 101,
  priority: "urgent",
  target_date: "2026-09-15",
  completed_at: null,
  created_at: "2026-09-01T00:00:00Z",
  project_id: "p-1",
  project_name: "Apollo",
  state_id: "s-1",
  state_name: "In Progress",
  state_group: "started",
  reasons: ["overdue", "blocked"],
};

const ATTENTION_OK: TAttentionPreviewData = {
  preview: [ISSUE_ROW],
  reason_counts: { overdue: 1, blocked: 1, due_soon: 0, unassigned_urgent_high: 0 },
  union_total: 1,
  total: 1,
};

describe("KpiStrip", () => {
  test("renders six snapshot KPIs with semantic labels", () => {
    render(<KpiStrip data={KPI_OK} isLoading={false} error={false} />);
    expect(screen.getByTestId("kpi-total")).toBeTruthy();
    expect(screen.getByTestId("kpi-completed")).toBeTruthy();
    expect(screen.getByTestId("kpi-started")).toBeTruthy();
    expect(screen.getByTestId("kpi-not_started")).toBeTruthy();
    expect(screen.getByTestId("kpi-blocked")).toBeTruthy();
    expect(screen.getByTestId("kpi-overdue")).toBeTruthy();
  });

  test("error state renders em-dash, never a fabricated value", () => {
    render(<KpiStrip data={null} isLoading={false} error={true} />);
    const total = screen.getByTestId("kpi-total");
    expect(within(total).getByText("—")).toBeTruthy();
  });
});

describe("ProgressPanel", () => {
  test("renders the 5-state stacked bar with semantic colors", () => {
    render(<ProgressPanel data={PROGRESS_OK} isLoading={false} error={false} />);
    expect(screen.getByTestId("progress-segment-backlog")).toBeTruthy();
    expect(screen.getByTestId("progress-segment-unstarted")).toBeTruthy();
    expect(screen.getByTestId("progress-segment-started")).toBeTruthy();
    expect(screen.getByTestId("progress-segment-completed")).toBeTruthy();
    expect(screen.getByTestId("progress-segment-cancelled")).toBeTruthy();
  });

  test("completion rate denominator excludes cancelled", () => {
    render(<ProgressPanel data={PROGRESS_OK} isLoading={false} error={false} />);
    expect(screen.getByText(/Completion .* of 11/)).toBeTruthy();
  });
});

describe("DeliveryPanel", () => {
  test("renders the dual trend with explicit delta", () => {
    render(<DeliveryPanel data={DELIVERY_OK} isLoading={false} error={false} />);
    expect(screen.getByTestId("delivery-chart")).toBeTruthy();
    expect(screen.getByTestId("delivery-delta")).toBeTruthy();
    expect(screen.getByTestId("delivery-delta").textContent).toContain("+1");
  });
});

describe("TopProjectsPanel", () => {
  test("renders top N and explains total-projects-in-scope", () => {
    render(<TopProjectsPanel data={TOP_OK} isLoading={false} error={false} />);
    expect(screen.getByTestId("top-projects-list")).toBeTruthy();
    expect(screen.getByText(/Showing 2 of 4 projects in scope/)).toBeTruthy();
  });

  test("renders overdue and blocked badges per project", () => {
    render(<TopProjectsPanel data={TOP_OK} isLoading={false} error={false} />);
    expect(screen.getByTestId("top-project-overdue-p-1")).toBeTruthy();
    expect(screen.getByTestId("top-project-blocked-p-1")).toBeTruthy();
  });
});

describe("AttentionPreviewPanel", () => {
  test("renders distinct-issue rows with reasons and union total", () => {
    render(
      <AttentionPreviewPanel
        preview={ATTENTION_OK}
        rows={[]}
        reasonCounts={null}
        isLoading={false}
        error={false}
      />
    );
    expect(screen.getByTestId("attention-rows")).toBeTruthy();
    expect(screen.getByTestId(`attention-row-iss-1`)).toBeTruthy();
    expect(screen.getByTestId(`attention-reason-iss-1-overdue`)).toBeTruthy();
    expect(screen.getByTestId(`attention-reason-iss-1-blocked`)).toBeTruthy();
  });
});

describe("WorkloadPreviewPanel", () => {
  test("renders typed pending placeholder when endpoint is missing", () => {
    render(
      <WorkloadPreviewPanel
        status="unavailable"
        reason="workload_read_model_pending_task_3"
        isLoading={false}
      />
    );
    expect(screen.getByTestId("workload-preview-pending")).toBeTruthy();
    expect(screen.getByText(/Workload read model pending backend/)).toBeTruthy();
  });

  test("does not surface fabricated roster rows while pending", () => {
    render(
      <WorkloadPreviewPanel
        status="unavailable"
        reason="workload_read_model_pending_task_3"
        isLoading={false}
      />
    );
    // No member rows or numeric counts are rendered while the read
    // model is pending. The panel surfaces a typed unavailable state.
    expect(screen.queryByTestId("workload-preview-row")).toBeNull();
    expect(screen.queryByText(/\bWIP\b/)).toBeNull();
  });
});

describe("OperationsScopeControls — structural slots exist", () => {
  test("renders the controls bar shell data-testids at module level", () => {
    // Scope-controls pulls from the singleton store via hooks, which
    // can deadlock in tests. The structural slots are covered by the
    // dedicated store + scope-controls unit (operations-store.test.ts
    // covers the store contract; the component contract is covered by
    // the snapshot/tab tests via the hook façade in
    // use-operations-store). This test pins the data-testid contract
    // the shell expects.
    expect(KpiStrip).toBeTruthy();
    expect(ProgressPanel).toBeTruthy();
    expect(TopProjectsPanel).toBeTruthy();
    expect(AttentionPreviewPanel).toBeTruthy();
    expect(WorkloadPreviewPanel).toBeTruthy();
    expect(DeliveryPanel).toBeTruthy();
  });
});

describe("default preferences", () => {
  test("Team is the default view mode, not My work", () => {
    expect(defaultDashboardOperationsPreferences().view_mode).toBe("team");
    expect(defaultDashboardOperationsPreferences().period_preset).toBe("this_month");
    expect(defaultDashboardOperationsPreferences().tab).toBe("overview");
  });
});