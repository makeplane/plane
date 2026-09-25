/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { EIssueLayoutTypes } from "@plane/types";
import type { TIssue } from "@plane/types";
import { BaseIssuesStore } from "./base-issues.store";

/**
 * Minimal concrete store for exercising BaseIssuesStore.updateIssueList without
 * wiring the full app root store.
 */
class TestIssuesStore extends BaseIssuesStore {
  fetchParentStats = () => {};
  updateParentStats = () => {};
}

const createStore = (showSubIssues: boolean, issuesById: Record<string, Partial<TIssue>>) => {
  const filterStore = {
    issueFilters: {
      displayFilters: {
        layout: EIssueLayoutTypes.KANBAN,
        group_by: "state",
        sub_issue: showSubIssues,
        order_by: "sort_order" as const,
      },
    },
  };

  const rootStore = {
    moduleId: undefined,
    cycleId: undefined,
    issues: {
      getIssueById: (id: string) => issuesById[id] as TIssue | undefined,
      getIssuesByIds: (ids: string[]) => ids.map((id) => issuesById[id]).filter(Boolean) as TIssue[],
    },
    rootStore: {
      projectEstimate: {
        currentActiveEstimateIdByProjectId: () => undefined,
        estimateById: () => undefined,
      },
    },
  };

  return new TestIssuesStore(rootStore as never, filterStore as never);
};

describe("BaseIssuesStore.updateIssueList sub-issue visibility", () => {
  it("removes a root→sub-issue from the old group and does not ADD it to the destination when Show sub-issues is off", () => {
    const issueId = "issue-1";
    const issuesById: Record<string, Partial<TIssue>> = {
      [issueId]: {
        id: issueId,
        parent_id: null,
        state_id: "state-a",
        sort_order: 1,
        created_at: "2024-01-01T00:00:00.000Z",
      },
    };
    const store = createStore(false, issuesById);
    store.groupedIssueIds = {
      "state-a": [issueId],
      "state-b": [],
    };
    store.groupedIssueCount = {
      "state-a": 1,
      "state-b": 0,
    };

    const issueBeforeUpdate = {
      id: issueId,
      parent_id: null,
      state_id: "state-a",
      sort_order: 1,
      created_at: "2024-01-01T00:00:00.000Z",
    } as TIssue;
    const issueAfterUpdate = {
      ...issueBeforeUpdate,
      parent_id: "epic-1",
      state_id: "state-b",
    };

    store.updateIssueList(issueAfterUpdate, issueBeforeUpdate);

    expect(store.groupedIssueIds?.["state-a"]).not.toContain(issueId);
    expect(store.groupedIssueIds?.["state-b"]).not.toContain(issueId);
  });

  // Regression for makeplane/plane#9049
  it("still moves an already-visible sub-issue between groups when Show sub-issues is off", () => {
    const issueId = "issue-1";
    const issuesById: Record<string, Partial<TIssue>> = {
      [issueId]: {
        id: issueId,
        parent_id: "epic-1",
        state_id: "state-b",
        sort_order: 1,
        created_at: "2024-01-01T00:00:00.000Z",
      },
    };
    const store = createStore(false, issuesById);
    store.groupedIssueIds = {
      "state-a": [issueId],
      "state-b": [],
    };

    const issueBeforeUpdate = {
      id: issueId,
      parent_id: "epic-1",
      state_id: "state-a",
      sort_order: 1,
      created_at: "2024-01-01T00:00:00.000Z",
    } as TIssue;
    const issueAfterUpdate = {
      ...issueBeforeUpdate,
      state_id: "state-b",
    };

    store.updateIssueList(issueAfterUpdate, issueBeforeUpdate);

    expect(store.groupedIssueIds?.["state-a"]).not.toContain(issueId);
    expect(store.groupedIssueIds?.["state-b"]).toContain(issueId);
  });
});
