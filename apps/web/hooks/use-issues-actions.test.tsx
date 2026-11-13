/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EIssueFilterType } from "@plane/constants";
import type { IIssueDisplayFilterOptions, IssuePaginationOptions, TIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { useIssuesActions } from "./use-issues-actions";

const h = vi.hoisted(() => ({
  routeParams: {} as Record<string, string | undefined>,
  issuesFetchIssues: vi.fn(),
  issuesFetchNextIssues: vi.fn(),
  issuesCreateIssue: vi.fn(),
  issuesQuickAddIssue: vi.fn(),
  issuesArchiveIssue: vi.fn(),
  issuesUpdateIssue: vi.fn(),
  issuesRemoveIssue: vi.fn(),
  issuesFilterUpdateFilters: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useParams: () => h.routeParams }));

// every sub-hook of useIssuesActions pulls its store through this seam; the store instances
// themselves are covered by the store-level tests
vi.mock("./store/use-issues", () => ({
  useIssues: () => ({
    issues: {
      fetchIssues: h.issuesFetchIssues,
      fetchNextIssues: h.issuesFetchNextIssues,
      createIssue: h.issuesCreateIssue,
      quickAddIssue: h.issuesQuickAddIssue,
      archiveIssue: h.issuesArchiveIssue,
      updateIssue: h.issuesUpdateIssue,
      removeIssue: h.issuesRemoveIssue,
    },
    issuesFilter: { updateFilters: h.issuesFilterUpdateFilters },
  }),
}));

const WORKSPACE_SLUG = "test-workspace";
const PROJECT_ID = "project-1";
const PAGINATION: IssuePaginationOptions = { canGroup: true, perPageCount: 100 };
const ISSUE = { id: "issue-1" } as TIssue;

beforeEach(() => {
  vi.clearAllMocks();
  h.routeParams = { workspaceSlug: WORKSPACE_SLUG };
});

describe("useIssuesActions GLOBAL with a viewId override (workspace board)", () => {
  it("routes fetchIssues, fetchNextIssues and updateFilters to the override when the route has no globalViewId", async () => {
    // the board route only has :workspaceSlug; the board view id arrives via the override
    const { result } = renderHook(() => useIssuesActions(EIssuesStoreType.GLOBAL, "board"));

    await act(async () => {
      await result.current.fetchIssues("init-loader", PAGINATION);
    });
    expect(h.issuesFetchIssues).toHaveBeenCalledWith(WORKSPACE_SLUG, "board", "init-loader", PAGINATION);

    await act(async () => {
      await result.current.fetchNextIssues();
    });
    expect(h.issuesFetchNextIssues).toHaveBeenCalledWith(WORKSPACE_SLUG, "board", undefined, undefined);

    const filters: IIssueDisplayFilterOptions = { group_by: "priority" };
    await act(async () => {
      await result.current.updateFilters(PROJECT_ID, EIssueFilterType.DISPLAY_FILTERS, filters);
    });
    expect(h.issuesFilterUpdateFilters).toHaveBeenCalledWith(
      WORKSPACE_SLUG,
      PROJECT_ID,
      EIssueFilterType.DISPLAY_FILTERS,
      filters,
      "board"
    );
  });

  it("lets the route globalViewId win when both are present", async () => {
    h.routeParams = { workspaceSlug: WORKSPACE_SLUG, globalViewId: "route-view" };
    const { result } = renderHook(() => useIssuesActions(EIssuesStoreType.GLOBAL, "board"));

    await act(async () => {
      await result.current.fetchIssues("init-loader", PAGINATION);
    });
    expect(h.issuesFetchIssues).toHaveBeenCalledWith(WORKSPACE_SLUG, "route-view", "init-loader", PAGINATION);
  });

  it("falls back to the route globalViewId when no override is given", async () => {
    h.routeParams = { workspaceSlug: WORKSPACE_SLUG, globalViewId: "assigned" };
    const { result } = renderHook(() => useIssuesActions(EIssuesStoreType.GLOBAL));

    await act(async () => {
      await result.current.fetchIssues("init-loader", PAGINATION);
    });
    expect(h.issuesFetchIssues).toHaveBeenCalledWith(WORKSPACE_SLUG, "assigned", "init-loader", PAGINATION);

    await act(async () => {
      await result.current.fetchNextIssues();
    });
    expect(h.issuesFetchNextIssues).toHaveBeenCalledWith(WORKSPACE_SLUG, "assigned", undefined, undefined);
  });

  it("exposes quickAddIssue and archiveIssue on the GLOBAL actions object", async () => {
    const { result } = renderHook(() => useIssuesActions(EIssuesStoreType.GLOBAL, "board"));

    expect(result.current.quickAddIssue).toBeTypeOf("function");
    expect(result.current.archiveIssue).toBeTypeOf("function");

    await act(async () => {
      await result.current.quickAddIssue?.(PROJECT_ID, ISSUE);
    });
    expect(h.issuesQuickAddIssue).toHaveBeenCalledWith(WORKSPACE_SLUG, PROJECT_ID, ISSUE);

    await act(async () => {
      await result.current.archiveIssue?.(PROJECT_ID, "issue-1");
    });
    expect(h.issuesArchiveIssue).toHaveBeenCalledWith(WORKSPACE_SLUG, PROJECT_ID, "issue-1");
  });
});

describe("useIssuesActions PROJECT", () => {
  it("never forwards a viewId override to the project store", async () => {
    h.routeParams = { workspaceSlug: WORKSPACE_SLUG, projectId: PROJECT_ID };
    const { result } = renderHook(() => useIssuesActions(EIssuesStoreType.PROJECT, "board"));

    await act(async () => {
      await result.current.fetchIssues("init-loader", PAGINATION);
    });
    expect(h.issuesFetchIssues).toHaveBeenCalledWith(WORKSPACE_SLUG, PROJECT_ID, "init-loader", PAGINATION);

    const filters: IIssueDisplayFilterOptions = { group_by: "priority" };
    await act(async () => {
      await result.current.updateFilters(PROJECT_ID, EIssueFilterType.DISPLAY_FILTERS, filters);
    });
    // project filter updates take no viewId — the override must not leak through
    expect(h.issuesFilterUpdateFilters).toHaveBeenCalledWith(
      WORKSPACE_SLUG,
      PROJECT_ID,
      EIssueFilterType.DISPLAY_FILTERS,
      filters
    );
    expect(h.issuesFilterUpdateFilters.mock.calls[0]).toHaveLength(4);
  });
});
