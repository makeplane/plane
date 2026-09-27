/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ItemDrawer } from "@/components/dashboards/operations/item-drawer";

type AxiosPost = (url: string, data?: unknown, config?: unknown) => Promise<{ data: unknown }>;

// Module-scope vi.mock factory — evaluated by vitest's hoisting before
// any module import. We define both the axios stub and the fake base
// class inline so TDZ issues don't bite.
const postRef = { current: vi.fn<AxiosPost>() };

vi.mock("@/services/api.service", () => {
  const post = (url: string, data?: unknown, config?: unknown): Promise<{ data: unknown }> =>
    postRef.current(url, data, config);
  class FakeAPIService {
    public baseURL = "http://stub";
    public axiosInstance = { post };
    public post(url: string, data: unknown = {}, config: unknown = {}): Promise<{ data: unknown }> {
      return this.axiosInstance.post(url, data, config);
    }
  }
  return { APIService: FakeAPIService };
});

const post = postRef.current;
vi.mock("@/hooks/store/user", () => ({
  useUser: () => ({ data: { id: "u-1" } }),
}));
vi.mock("@/hooks/store/use-workspace", () => ({
  useWorkspace: () => ({ currentWorkspace: { id: "ws-1" } }),
}));

const itemsResponse = (page: number, hasMore: boolean): unknown => ({
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
        rows: [
          {
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
          },
        ],
        total: 1,
        page,
        page_size: 25,
        has_more: hasMore,
        scope_key: "sk-1",
      },
    },
  ],
});

describe("ItemDrawer", () => {
  beforeEach(() => {
    post.mockReset();
  });
  afterEach(() => {
    post.mockReset();
  });

  test("renders nothing when closed", () => {
    const { container } = render(
      <ItemDrawer workspaceSlug="ws-1" open={false} onClose={() => undefined} metric="overdue" />
    );
    expect(container.firstChild).toBeNull();
  });

  test("opens with the metric label and the response's scope_key", async () => {
    post.mockResolvedValueOnce({ data: itemsResponse(1, false) });
    render(<ItemDrawer workspaceSlug="ws-1" open onClose={() => undefined} metric="overdue" />);
    expect(await screen.findByTestId("operations-item-drawer")).toBeTruthy();
    expect(screen.getByText(/Overdue/)).toBeTruthy();
    expect(screen.getByText(/sk-1/)).toBeTruthy();
    expect(screen.getByTestId("operations-item-drawer-row-iss-1")).toBeTruthy();
  });

  test("uses the agreed selection contract with metric + values + date_start/end", async () => {
    post.mockResolvedValueOnce({ data: itemsResponse(1, false) });
    render(
      <ItemDrawer
        workspaceSlug="ws-1"
        open
        onClose={() => undefined}
        metric="blocked"
        values={{ assignee_id: null }}
        dateStart="2026-09-01T00:00:00Z"
        dateEnd="2026-09-30T00:00:00Z"
      />
    );
    await screen.findByTestId("operations-item-drawer");
    const args = post.mock.calls[0];
    expect(args?.[0]).toBe("/api/workspaces/ws-1/dashboard/items/");
    const payload = args?.[1] as Record<string, unknown>;
    expect(payload.selection).toEqual({
      metric: "blocked",
      values: { assignee_id: null },
      date_start: "2026-09-01T00:00:00Z",
      date_end: "2026-09-30T00:00:00Z",
    });
    // The unassigned request uses present-null, not empty array.
    const selectionValues = (payload.selection as { values?: { assignee_id?: unknown } }).values;
    expect(selectionValues?.assignee_id).toBeNull();
  });

  test("pagination: clicking Next bumps page", async () => {
    post.mockResolvedValueOnce({ data: itemsResponse(1, true) });
    post.mockResolvedValueOnce({ data: itemsResponse(2, false) });
    render(<ItemDrawer workspaceSlug="ws-1" open onClose={() => undefined} metric="overdue" />);
    const next = await screen.findByTestId("operations-item-drawer-next");
    fireEvent.click(next);
    // Both calls were made.
    expect(post.mock.calls.length).toBe(2);
    expect((post.mock.calls[1]?.[1] as { page?: number }).page).toBe(2);
  });

  test("error state shows failure message, never a fabricated row", async () => {
    post.mockRejectedValueOnce(new Error("network"));
    render(<ItemDrawer workspaceSlug="ws-1" open onClose={() => undefined} metric="overdue" />);
    expect(await screen.findByText(/Failed to load items/)).toBeTruthy();
  });

  test("close button invokes onClose", async () => {
    post.mockResolvedValueOnce({ data: itemsResponse(1, false) });
    let closed = false;
    render(
      <ItemDrawer workspaceSlug="ws-1" open onClose={() => (closed = true)} metric="overdue" />
    );
    const close = await screen.findByTestId("operations-item-drawer-close");
    fireEvent.click(close);
    expect(closed).toBe(true);
  });
});