/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { runInAction } from "mobx";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EIssueFilterType, WORKSPACE_BOARD_VIEW_ID } from "@plane/constants";
import type { IssuePaginationOptions, TStaticViewTypes } from "@plane/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { WorkspaceService } from "@/services/workspace.service";
import type { IIssueRootStore } from "../root.store";
import { WorkspaceIssuesFilter } from "./filter.store";

const WORKSPACE_SLUG = "test-workspace";
const USER_ID = "user-1";

const PAGINATION: IssuePaginationOptions = { canGroup: true, perPageCount: 100 };

// the store types viewId as TStaticViewTypes, while the board view lives outside STATIC_VIEW_TYPES;
// production reaches the same call through a loosely typed hook (workspace-board-root.tsx)
const BOARD_VIEW_ID = WORKSPACE_BOARD_VIEW_ID as TStaticViewTypes;

const createFilterStore = (globalViewId: string | undefined = BOARD_VIEW_ID) => {
  const fetchIssuesWithExistingPagination = vi.fn();
  const rootIssueStore = {
    globalViewId,
    currentUserId: USER_ID,
    workspaceIssues: { fetchIssuesWithExistingPagination },
  } as unknown as IIssueRootStore;
  const store = new WorkspaceIssuesFilter(rootIssueStore);
  return { store, fetchIssuesWithExistingPagination };
};

const EXPECTED_BOARD_DISPLAY_FILTERS = {
  calendar: { show_weekends: false, layout: "month" },
  layout: EIssueLayoutTypes.KANBAN,
  order_by: "-created_at",
  group_by: "state_detail.group",
  sub_group_by: "project",
  sub_issue: false,
  show_empty_groups: true,
};

const EXPECTED_DISPLAY_PROPERTIES = {
  assignee: true,
  start_date: true,
  due_date: true,
  labels: true,
  priority: true,
  state: true,
  sub_issue_count: true,
  attachment_count: true,
  link: true,
  estimate: true,
  key: true,
  created_on: true,
  updated_on: true,
  modules: true,
  cycle: true,
  issue_type: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("WorkspaceIssuesFilter board view (89bfd0a2 regression guard)", () => {
  it("seeds the board view with kanban defaults without touching the transport", async () => {
    const { store } = createFilterStore();
    const getViewDetailsSpy = vi.spyOn(WorkspaceService.prototype, "getViewDetails");

    await store.fetchFilters(WORKSPACE_SLUG, BOARD_VIEW_ID);

    expect(getViewDetailsSpy).not.toHaveBeenCalled();
    expect(store.filters[WORKSPACE_BOARD_VIEW_ID]).toEqual({
      richFilters: undefined,
      displayFilters: EXPECTED_BOARD_DISPLAY_FILTERS,
      displayProperties: EXPECTED_DISPLAY_PROPERTIES,
      kanbanFilters: { group_by: [], sub_group_by: [] },
    });
  });

  it("exposes board filters without a route view id", async () => {
    const { store } = createFilterStore();
    store.rootIssueStore.globalViewId = undefined;
    await store.fetchFilters(WORKSPACE_SLUG, BOARD_VIEW_ID);

    expect(store.issueFilters?.displayFilters).toEqual(EXPECTED_BOARD_DISPLAY_FILTERS);
  });

  it("prefers the route view id over the active board view", async () => {
    const { store } = createFilterStore("all-issues");
    await store.fetchFilters(WORKSPACE_SLUG, "all-issues");
    await store.fetchFilters(WORKSPACE_SLUG, BOARD_VIEW_ID);

    expect(store.issueFilters).toEqual(store.getIssueFilters("all-issues"));
    expect(store.issueFilters?.displayFilters?.layout).toBe(EIssueLayoutTypes.SPREADSHEET);
  });

  it("builds kanban params for the board even when a stored layout says otherwise", async () => {
    const { store } = createFilterStore();
    await store.fetchFilters(WORKSPACE_SLUG, BOARD_VIEW_ID);

    const params = store.getFilterParams(PAGINATION, BOARD_VIEW_ID, undefined, undefined, undefined);
    expect(params).toEqual(
      expect.objectContaining({
        layout: EIssueLayoutTypes.KANBAN,
        group_by: "state__group",
        sub_group_by: "project_id",
        order_by: "-created_at",
      })
    );

    // the guard: a persisted/stored user layout must not override the board's kanban param set
    // (before 89bfd0a2 the stored layout picked the acceptable-params set, and a non-kanban
    // stored layout collapsed the board params to bare pagination)
    const boardDisplayFilters = store.filters[WORKSPACE_BOARD_VIEW_ID]?.displayFilters;
    if (!boardDisplayFilters) throw new Error("board display filters should be seeded");
    runInAction(() => {
      boardDisplayFilters.layout = EIssueLayoutTypes.SPREADSHEET;
    });
    const paramsAfterPoisoning = store.getFilterParams(PAGINATION, BOARD_VIEW_ID, undefined, undefined, undefined);
    expect(paramsAfterPoisoning).toEqual(
      expect.objectContaining({
        group_by: "state__group",
        sub_group_by: "project_id",
        order_by: "-created_at",
      })
    );
  });

  it("keeps non-board views on spreadsheet params", async () => {
    const { store } = createFilterStore();
    await store.fetchFilters(WORKSPACE_SLUG, "assigned");

    const params = store.getFilterParams(PAGINATION, "assigned", undefined, undefined, undefined);
    expect(params).toEqual(
      expect.objectContaining({
        layout: EIssueLayoutTypes.SPREADSHEET,
        assignees: USER_ID,
        order_by: "-created_at",
      })
    );
  });

  it("ignores display filter updates on the board view", async () => {
    const { store, fetchIssuesWithExistingPagination } = createFilterStore();
    await store.fetchFilters(WORKSPACE_SLUG, BOARD_VIEW_ID);
    const before = JSON.parse(JSON.stringify(store.filters[WORKSPACE_BOARD_VIEW_ID]));
    const setSpy = vi.spyOn(store.handleIssuesLocalFilters, "set");

    await store.updateFilters(
      WORKSPACE_SLUG,
      undefined,
      EIssueFilterType.DISPLAY_FILTERS,
      { layout: EIssueLayoutTypes.LIST },
      BOARD_VIEW_ID
    );

    expect(JSON.parse(JSON.stringify(store.filters[WORKSPACE_BOARD_VIEW_ID]))).toEqual(before);
    expect(fetchIssuesWithExistingPagination).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
  });

  it("applies kanban filters in-memory on the board but never persists them", async () => {
    const { store } = createFilterStore();
    await store.fetchFilters(WORKSPACE_SLUG, BOARD_VIEW_ID);
    const setSpy = vi.spyOn(store.handleIssuesLocalFilters, "set");

    await store.updateFilters(
      WORKSPACE_SLUG,
      undefined,
      EIssueFilterType.KANBAN_FILTERS,
      { group_by: ["priority"], sub_group_by: [] },
      BOARD_VIEW_ID
    );

    expect(store.filters[WORKSPACE_BOARD_VIEW_ID].kanbanFilters).toEqual({ group_by: ["priority"], sub_group_by: [] });
    expect(setSpy).not.toHaveBeenCalled();
  });

  it("still persists local filters for non-board views", async () => {
    const { store, fetchIssuesWithExistingPagination } = createFilterStore();
    await store.fetchFilters(WORKSPACE_SLUG, "all-issues");
    const setSpy = vi.spyOn(store.handleIssuesLocalFilters, "set");

    await store.updateFilters(
      WORKSPACE_SLUG,
      undefined,
      EIssueFilterType.DISPLAY_FILTERS,
      { group_by: "priority" },
      "all-issues"
    );

    expect(setSpy).toHaveBeenCalledWith(
      EIssuesStoreType.GLOBAL,
      EIssueFilterType.DISPLAY_FILTERS,
      WORKSPACE_SLUG,
      undefined,
      "all-issues",
      { display_filters: expect.objectContaining({ group_by: "priority", layout: EIssueLayoutTypes.SPREADSHEET }) }
    );
    expect(fetchIssuesWithExistingPagination).toHaveBeenCalledWith(WORKSPACE_SLUG, "all-issues", "mutation");
  });
});
