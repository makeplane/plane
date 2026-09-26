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

  // Regression for CodeRabbit finding: a successful pre-clear patch resolving
  // after clear() must reconcile the reloaded record with the persisted state
  // so a later failure restores the persisted state, not the stale pre-patch
  // state.
  it("reconciles a successful pre-clear patch with the reloaded view and restores the persisted state on a later failure", async () => {
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

    // Simulate a fresh load after clear that raced before A's patch landed:
    // the reloaded record and grouped view still reflect the pre-patch state-a.
    issuesById[issueId] = { ...(issuesById[issueId] as TIssue), state_id: "state-a" } as TIssue;
    store.groupedIssueIds = { "state-a": [issueId], "state-b": [], "state-c": [] };
    store.groupedIssueCount = { "state-a": 1, "state-b": 0, "state-c": 0 };

    // A's patch succeeds on the server, so the authoritative state is state-b.
    store.issueService.retrieve = vi.fn().mockResolvedValue({
      ...(issuesById[issueId] as TIssue),
      state_id: "state-b",
    });
    resolvePatch?.({});
    await updateA;

    // The reconcile fetch updates the reloaded record to the persisted state-b.
    expect(issuesById[issueId].state_id).toBe("state-b");

    // Simulate the new view's load correcting the grouped membership to match.
    store.groupedIssueIds = { "state-a": [], "state-b": [issueId], "state-c": [] };

    // A post-clear update that fails must restore to the persisted state-b,
    // not the stale pre-patch state-a.
    store.issueService.patchIssue = vi.fn().mockRejectedValue(new Error("patch failed"));
    await expect(store.issueUpdate("ws", "proj", issueId, { state_id: "state-c" })).rejects.toThrow("patch failed");

    expect(issuesById[issueId].state_id).toBe("state-b");
    expect(store.groupedIssueIds?.["state-b"]).toContain(issueId);
    expect(store.groupedIssueIds?.["state-c"]).not.toContain(issueId);
  });

  // Regression for CodeRabbit finding: a shouldSync=false update persists
  // through another API path (e.g. cycle/module membership) and must advance
  // the rollback target so a later failed patchIssue does not undo that
  // successful write.
  it("advances the rollback target when a shouldSync=false update persists through another API path", async () => {
    const issueId = "issue-1";
    const issuesById: Record<string, Partial<TIssue>> = {
      [issueId]: {
        id: issueId,
        parent_id: null,
        state_id: "state-a",
        cycle_id: undefined,
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

    // addIssueToCycle persists cycle_id through its own API, then applies the
    // local change via issueUpdate(..., false).
    store.issueUpdate("ws", "proj", issueId, { cycle_id: "cycle-1" }, false);
    expect(issuesById[issueId].cycle_id).toBe("cycle-1");

    // A later synced update moves the issue to state-b and the patch fails.
    store.issueService.patchIssue = vi.fn().mockRejectedValue(new Error("patch failed"));
    await expect(store.issueUpdate("ws", "proj", issueId, { state_id: "state-b" })).rejects.toThrow("patch failed");

    // The rollback must restore the pre-update state-a but keep the persisted
    // cycle_id="cycle-1"; without advancing the rollback target, the restore
    // would revert cycle_id to undefined and silently undo the cycle change.
    expect(issuesById[issueId].state_id).toBe("state-a");
    expect(issuesById[issueId].cycle_id).toBe("cycle-1");
  });
});
