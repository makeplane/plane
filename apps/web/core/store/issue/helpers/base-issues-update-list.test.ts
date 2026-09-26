/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it, vi } from "vitest";
import { EIssueLayoutTypes } from "@plane/types";
import type { TIssue } from "@plane/types";
import { BaseIssuesStore } from "./base-issues.store";

// base-issues-utils imports `store` from @/lib/store-context, which instantiates
// the full RootStore graph and creates a circular dependency back into
// base-issues.store (ArchivedIssues extends BaseIssuesStore) that fails at
// module-load time under vitest. Mock it with a minimal stand-in so the store
// class can load in isolation. `store` is only read by getPreviousIssuesState,
// which is not exercised by these tests.
vi.mock("@/lib/store-context", () => ({
  store: { issue: { issues: { issuesMap: {} } } },
  rootStore: {},
  StoreContext: {},
  StoreProvider: () => null,
}));

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
      updateIssue: (id: string, data: Partial<TIssue>) => {
        issuesById[id] = { ...(issuesById[id] as TIssue), ...data } as TIssue;
      },
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

describe("BaseIssuesStore.issueUpdate patch-failure rollback", () => {
  it("restores the issue record and list membership when the failing update is still the latest", async () => {
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

    store.issueService.patchIssue = vi.fn().mockRejectedValue(new Error("patch failed"));

    await expect(store.issueUpdate("ws", "proj", issueId, { state_id: "state-b" })).rejects.toThrow("patch failed");

    // Record rolled back to pre-update state.
    expect(issuesById[issueId].state_id).toBe("state-a");
    // List membership rolled back: issue is back in state-a, not in state-b.
    expect(store.groupedIssueIds?.["state-a"]).toContain(issueId);
    expect(store.groupedIssueIds?.["state-b"]).not.toContain(issueId);
  });

  it("does not roll back when a newer optimistic update has changed the issue while the patch was in flight", async () => {
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
      "state-c": [],
    };
    store.groupedIssueCount = {
      "state-a": 1,
      "state-b": 0,
      "state-c": 0,
    };

    // Update A's API call fails asynchronously.
    store.issueService.patchIssue = vi.fn().mockRejectedValue(new Error("patch failed"));

    // Start update A: move issue to state-b. Optimistically applies, then awaits the failing patch.
    const updateA = store.issueUpdate("ws", "proj", issueId, { state_id: "state-b" });

    // While A is in flight, a newer optimistic update B moves the issue to state-c without syncing.
    store.issueUpdate("ws", "proj", issueId, { state_id: "state-c" }, false);

    await expect(updateA).rejects.toThrow("patch failed");

    // The store retains B's newer state — A's rollback must not clobber it.
    expect(issuesById[issueId].state_id).toBe("state-c");
    // List membership reflects B, not a rollback to A's before-state.
    expect(store.groupedIssueIds?.["state-c"]).toContain(issueId);
    expect(store.groupedIssueIds?.["state-a"]).not.toContain(issueId);
    expect(store.groupedIssueIds?.["state-b"]).not.toContain(issueId);
  });

  // Regression for CodeRabbit finding: failed later patch must not restore an
  // optimistic state that came from an earlier rejected patch.
  it("restores the persisted state when both B and C fail, with B failing first", async () => {
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
      "state-c": [],
    };
    store.groupedIssueCount = {
      "state-a": 1,
      "state-b": 0,
      "state-c": 0,
    };

    // Both patches fail. mockRejectedValue yields already-rejected promises, so
    // the await order determines the catch order: B awaits first, then C.
    store.issueService.patchIssue = vi.fn().mockRejectedValue(new Error("patch failed"));

    // Start B: state-a → state-b (synced). Then start C: state-b → state-c (synced).
    const updateB = store.issueUpdate("ws", "proj", issueId, { state_id: "state-b" });
    const updateC = store.issueUpdate("ws", "proj", issueId, { state_id: "state-c" });

    // B fails first: it is no longer the latest (C is), so its rollback is skipped.
    // C then fails: it is the latest, so it restores to the last synced state (state-a).
    await expect(updateB).rejects.toThrow("patch failed");
    await expect(updateC).rejects.toThrow("patch failed");

    // Both patches failed, so the store must reflect the persisted state-a.
    expect(issuesById[issueId].state_id).toBe("state-a");
    expect(store.groupedIssueIds?.["state-a"]).toContain(issueId);
    expect(store.groupedIssueIds?.["state-b"]).not.toContain(issueId);
    expect(store.groupedIssueIds?.["state-c"]).not.toContain(issueId);
  });

  // Regression for CodeRabbit finding: a pre-clear patch resolving after clear()
  // must not pollute the post-clear lastSyncedIssueState map.
  it("does not use a pre-clear patch's state as the restore target after clear()", async () => {
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
      "state-c": [],
    };
    store.groupedIssueCount = {
      "state-a": 1,
      "state-b": 0,
      "state-c": 0,
    };

    // Control when the pre-clear patch resolves.
    let resolvePatch: ((value: unknown) => void) | undefined;
    store.issueService.patchIssue = vi.fn().mockReturnValue(
      new Promise<unknown>((resolve) => {
        resolvePatch = resolve;
      })
    );

    // Start update A: state-a → state-b. Patch stays in flight.
    const updateA = store.issueUpdate("ws", "proj", issueId, { state_id: "state-b" });

    // Clear the grouped view while A's patch is in flight: bumps generation
    // and resets lastSyncedIssueState / issueUpdateTokens.
    store.clear();

    // Simulate a fresh load after clear: the issue is now persisted as state-c.
    issuesById[issueId] = { ...(issuesById[issueId] as TIssue), state_id: "state-c" } as TIssue;
    store.groupedIssueIds = { "state-c": [issueId] };
    store.groupedIssueCount = { "state-c": 1 };

    // Resolve A's pre-clear patch. Without the generation guard, this would
    // store A's attemptedIssue (state-b) into the new lastSyncedIssueState map.
    resolvePatch?.({});
    await updateA;

    // A post-clear update that fails must restore to the post-clear persisted
    // state (state-c), not the stale pre-clear attemptedIssue (state-b).
    store.issueService.patchIssue = vi.fn().mockRejectedValue(new Error("patch failed"));
    await expect(store.issueUpdate("ws", "proj", issueId, { state_id: "state-b" })).rejects.toThrow("patch failed");

    expect(issuesById[issueId].state_id).toBe("state-c");
  });
});
