/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { runInAction } from "mobx";
import { describe, expect, it, vi } from "vitest";
import { WORKSPACE_BOARD_VIEW_ID } from "@plane/constants";
import type { TIssue } from "@plane/types";
import type { IIssueRootStore } from "../root.store";
import { WorkspaceIssuesFilter } from "./filter.store";
import { WorkspaceIssues } from "./issue.store";

vi.mock("@/lib/store-context", () => ({ store: {} }));

const issue = (id: string, stateId: string): TIssue =>
  ({
    id,
    project_id: "project-1",
    state_id: stateId,
    state__group: "unstarted",
    created_at: "2024-01-01T00:00:00Z",
  }) as TIssue;

const setup = async () => {
  const issueMap: Record<string, TIssue> = {};
  const issues = {
    getIssueById: (id: string) => issueMap[id],
    getIssuesByIds: (ids: string[]) => ids.map((id) => issueMap[id]).filter(Boolean),
    addIssue: (items: TIssue[]) => items.forEach((item) => (issueMap[item.id] = item)),
    updateIssue: (id: string, data: Partial<TIssue>) => Object.assign(issueMap[id], data),
    removeIssue: (id: string) => delete issueMap[id],
  };
  const root = {
    globalViewId: undefined,
    issues,
    rootStore: { state: { stateMap: { "state-a": { group: "unstarted" }, "state-b": { group: "started" } } } },
  } as unknown as IIssueRootStore;
  const filters = new WorkspaceIssuesFilter(root);
  const store = new WorkspaceIssues(root, filters);
  await filters.fetchFilters("workspace", WORKSPACE_BOARD_VIEW_ID);
  runInAction(() => {
    store.groupedIssueIds = { unstarted: { "project-1": [] }, started: { "project-1": [] } };
  });
  return { store, issues };
};

describe("workspace board optimistic updates", () => {
  it("moves an issue between state groups within its project", async () => {
    const { store, issues } = await setup();
    const existing = issue("issue-1", "state-a");
    issues.addIssue([existing]);
    runInAction(() => {
      store.groupedIssueIds = { unstarted: { "project-1": [existing.id] }, started: { "project-1": [] } };
    });
    const patch = vi.spyOn(store.issueService, "patchIssue").mockResolvedValue(undefined);

    const update = store.issueUpdate("workspace", "project-1", existing.id, { state_id: "state-b" });
    expect(store.getIssueIds("unstarted", "project-1")).toEqual([]);
    expect(store.getIssueIds("started", "project-1")).toEqual([existing.id]);
    expect(store.issueGroupKey).toBe("state_id");
    expect(store.issueSubGroupKey).toBe("project_id");
    await update;
    expect(patch).toHaveBeenCalledWith("workspace", "project-1", existing.id, { state_id: "state-b" });
  });

  it("places the created quick-add issue in its group without refetching", async () => {
    const { store } = await setup();
    const temporary = issue("temporary", "state-b");
    const created = { ...temporary, id: "created", state__group: "started" } as TIssue;
    vi.spyOn(store.issueService, "createIssue").mockResolvedValue(created);
    const fetch = vi.spyOn(store.workspaceService, "getViewIssues");

    await store.quickAddIssue("workspace", "project-1", temporary);

    expect(store.getIssueIds("started", "project-1")).toEqual([created.id]);
    expect(fetch).not.toHaveBeenCalled();
  });
});
