/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { TDashboardAttentionResponse, TDashboardItemsResponse, TDashboardOverviewResponse } from "@plane/types";

/**
 * The service test uses a stub axios instance so the contract is
 * exercised without a network. It locks in the URL shape the
 * backend views expect and the typed response unwrap.
 */

type AxiosPost = (url: string, data?: unknown, config?: unknown) => Promise<{ data: unknown }>;

const post = vi.fn<AxiosPost>();

class FakeAPIService {
  public baseURL = "http://stub";
  public axiosInstance = { post };
  // The real APIService exposes `post(url, data, config)` which
  // delegates to `this.axiosInstance.post`. The fake mirrors that.
  public post(url: string, data: unknown = {}, config: unknown = {}): Promise<{ data: unknown }> {
    return this.axiosInstance.post(url, data, config);
  }
}

vi.mock("@/services/api.service", () => {
  return { APIService: FakeAPIService };
});

const { DashboardOperationsService } = await import("@/services/dashboard-operations.service");

const OVERVIEW: TDashboardOverviewResponse = {
  version: 1,
  generated_at: "2026-09-27T10:00:00Z",
  scope_key: "sk-1",
  resolved_scope: {
    workspace_id: "ws-1",
    principal_id: "u-1",
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
        total: 0,
        open: 0,
        not_started: 0,
        started: 0,
        completed: 0,
        cancelled: 0,
        overdue: 0,
        due_today: 0,
        due_soon: 0,
        blocked: 0,
      },
    },
    { status: "unavailable", section_id: "workload_preview", reason: "workload_read_model_pending_task_3" },
  ],
};

const ATTENTION: TDashboardAttentionResponse = {
  version: 1,
  generated_at: "2026-09-27T10:00:00Z",
  scope_key: "sk-1",
  resolved_scope: {
    workspace_id: "ws-1",
    principal_id: "u-1",
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
        page_size: 25,
        has_more: false,
        scope_key: "sk-1",
      },
    },
  ],
};

const ITEMS: TDashboardItemsResponse = {
  version: 1,
  generated_at: "2026-09-27T10:00:00Z",
  scope_key: "sk-1",
  resolved_scope: {
    workspace_id: "ws-1",
    principal_id: "u-1",
    project_ids: [],
    business_filters: {},
  },
  resolved_period: { start: null, end: null, today: "2026-09-27" },
  timezone: "UTC",
  sections: [
    {
      status: "ok",
      section_id: "items",
      data: {
        rows: [],
        total: 0,
        page: 1,
        page_size: 25,
        has_more: false,
        scope_key: "sk-1",
      },
    },
  ],
};

describe("DashboardOperationsService — endpoint contract", () => {
  let service: InstanceType<typeof DashboardOperationsService>;

  beforeEach(() => {
    post.mockReset();
    service = new DashboardOperationsService();
  });

  afterEach(() => {
    post.mockReset();
  });

  test("overview() POSTs the singular /dashboard/overview/ endpoint", async () => {
    post.mockResolvedValueOnce({ data: OVERVIEW });
    const result = await service.overview("ws-1", { period_preset: "this_month" });
    expect(post.mock.calls[0]?.[0]).toBe("/api/workspaces/ws-1/dashboard/overview/");
    expect(post.mock.calls[0]?.[1]).toEqual({ period_preset: "this_month" });
    expect(result.sections.find((s) => s.section_id === "kpis")?.status).toBe("ok");
  });

  test("attention() POSTs to /dashboard/attention/ with page + page_size", async () => {
    post.mockResolvedValueOnce({ data: ATTENTION });
    await service.attention("ws-1", { page: 1, page_size: 25 });
    expect(post.mock.calls[0]?.[0]).toBe("/api/workspaces/ws-1/dashboard/attention/");
    expect(post.mock.calls[0]?.[1]).toEqual({ page: 1, page_size: 25 });
  });

  test("items() POSTs to /dashboard/items/ with metric", async () => {
    post.mockResolvedValueOnce({ data: ITEMS });
    await service.items("ws-1", { metric: "overdue", page: 1, page_size: 25 });
    expect(post.mock.calls[0]?.[0]).toBe("/api/workspaces/ws-1/dashboard/items/");
    expect(post.mock.calls[0]?.[1]).toEqual({ metric: "overdue", page: 1, page_size: 25 });
  });

  test("workload() POSTs to /dashboard/workload/ (Task 3 placeholder)", async () => {
    post.mockResolvedValueOnce({
      data: {
        version: 1,
        generated_at: "2026-09-27T10:00:00Z",
        scope_key: "sk-1",
        resolved_scope: { workspace_id: "ws-1", principal_id: "u-1", project_ids: [], business_filters: {} },
        resolved_period: { start: null, end: null, today: "2026-09-27" },
        timezone: "UTC",
        sections: [{ status: "unavailable", section_id: "workload", reason: "endpoint_pending_task_3" }],
      },
    });
    const result = await service.workload("ws-1");
    expect(post.mock.calls[0]?.[0]).toBe("/api/workspaces/ws-1/dashboard/workload/");
    expect(result.sections[0].status).toBe("unavailable");
  });

  test("projects() POSTs to /dashboard/projects/ (Task 3 placeholder)", async () => {
    post.mockResolvedValueOnce({
      data: {
        version: 1,
        generated_at: "2026-09-27T10:00:00Z",
        scope_key: "sk-1",
        resolved_scope: { workspace_id: "ws-1", principal_id: "u-1", project_ids: [], business_filters: {} },
        resolved_period: { start: null, end: null, today: "2026-09-27" },
        timezone: "UTC",
        sections: [{ status: "unavailable", section_id: "projects", reason: "endpoint_pending_task_3" }],
      },
    });
    const result = await service.projects("ws-1");
    expect(post.mock.calls[0]?.[0]).toBe("/api/workspaces/ws-1/dashboard/projects/");
    expect(result.sections[0].status).toBe("unavailable");
  });

  test("timeline() carries the three independent paging cursors", async () => {
    post.mockResolvedValueOnce({
      data: {
        version: 1,
        generated_at: "2026-09-27T10:00:00Z",
        scope_key: "sk-1",
        resolved_scope: { workspace_id: "ws-1", principal_id: "u-1", project_ids: [], business_filters: {} },
        resolved_period: { start: null, end: null, today: "2026-09-27" },
        timezone: "UTC",
        sections: [{ status: "unavailable", section_id: "timeline", reason: "endpoint_pending_task_3" }],
      },
    });
    await service.timeline("ws-1", {
      period_preset: "this_month",
      cycles_page: 2,
      deadlines_page: 3,
      unscheduled_page: 1,
      page_size: 25,
    });
    expect(post.mock.calls[0]?.[0]).toBe("/api/workspaces/ws-1/dashboard/timeline/");
    expect(post.mock.calls[0]?.[1]).toEqual({
      period_preset: "this_month",
      cycles_page: 2,
      deadlines_page: 3,
      unscheduled_page: 1,
      page_size: 25,
    });
  });

  test("overview() forwards the AbortSignal to axios", async () => {
    post.mockResolvedValueOnce({ data: OVERVIEW });
    const controller = new AbortController();
    await service.overview("ws-1", undefined, controller.signal);
    expect(post.mock.calls[0]?.[0]).toBe("/api/workspaces/ws-1/dashboard/overview/");
    expect(post.mock.calls[0]?.[2]).toEqual({ signal: controller.signal });
  });
});
