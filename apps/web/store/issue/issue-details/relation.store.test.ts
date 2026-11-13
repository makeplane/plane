/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it, vi } from "vitest";
import { runInAction } from "mobx";
import type { TIssueRelationMap, TIssueRelationTypes } from "@plane/types";
import type { IIssueDetail } from "./root.store";
import { IssueRelationStore } from "./relation.store";

vi.mock("@/services/issue", () => ({
  IssueRelationService: class {
    deleteIssueRelation = vi.fn().mockResolvedValue(undefined);
    listIssueRelations = vi.fn().mockResolvedValue({ blocking: [{ id: "B" }] });
  },
}));

function setup(relationMap: Partial<Record<string, Partial<Record<TIssueRelationTypes, string[]>>>>) {
  const activity = { fetchActivities: vi.fn() };
  const root = {
    activity,
    rootIssueStore: { issues: { addIssue: vi.fn() } },
  } as unknown as IIssueDetail;
  const store = new IssueRelationStore(root);
  runInAction(() => {
    // Sparse entries mirror partially loaded relation caches.
    store.relationMap = relationMap as TIssueRelationMap;
  });
  return { store, activity };
}

describe("IssueRelationStore.removeRelation", () => {
  it.each([
    ["blocking", "blocked_by"],
    ["blocked_by", "blocking"],
    ["relates_to", "relates_to"],
    ["duplicate", "duplicate"],
  ] as [TIssueRelationTypes, TIssueRelationTypes][])(
    "removes both sides of %s without removing unrelated %s entries",
    async (relationType, reverseType) => {
      const { store, activity } = setup({
        A: { [relationType]: ["B", "D"] },
        B: { [reverseType]: ["A", "C"] },
      });

      await store.removeRelation("workspace", "project", "A", relationType, "B");

      expect(store.relationMap.A[relationType]).toEqual(["D"]);
      expect(store.relationMap.B[reverseType]).toEqual(["C"]);
      expect(store.issueRelationService.deleteIssueRelation).toHaveBeenCalledExactlyOnceWith(
        "workspace",
        "project",
        "A",
        { relation_type: relationType, related_issue: "B" }
      );
      expect(activity.fetchActivities).toHaveBeenCalledExactlyOnceWith("workspace", "project", "A");
    }
  );

  it.each([
    ["A", "C", "D"],
    ["C", "A", "D"],
    ["C", "D", "A"],
  ])("finds the source in reverse entries %j", async (...reverseIds) => {
    const { store } = setup({ A: { blocking: ["B"] }, B: { blocked_by: reverseIds } });
    await store.removeRelation("workspace", "project", "A", "blocking", "B");
    expect(store.relationMap.B.blocked_by).toEqual(["C", "D"]);
  });

  it.each([{}, { A: { blocking: [] } }])(
    "cleans the reverse side when the forward side is absent: %j",
    async (forward) => {
      const { store } = setup({ ...forward, B: { blocked_by: ["A", "C"] } });
      await store.removeRelation("workspace", "project", "A", "blocking", "B");
      expect(store.relationMap.B.blocked_by).toEqual(["C"]);
    }
  );

  it.each([{}, { B: {} }, { B: { blocked_by: [] } }, { B: { blocked_by: ["C", "D"] } }])(
    "does not remove an unrelated reverse entry when the source is missing: %j",
    async (reverse) => {
      const { store } = setup({ A: { blocking: ["B"] }, ...reverse });
      const before = store.relationMap.B?.blocked_by?.slice();
      await store.removeRelation("workspace", "project", "A", "blocking", "B");
      expect(store.relationMap.A.blocking).toEqual([]);
      expect(store.relationMap.B?.blocked_by).toEqual(before);
    }
  );

  it("updates both cached sides without an API request for local removal", async () => {
    const { store } = setup({ A: { blocking: ["B"] }, B: { blocked_by: ["A", "C"] } });
    await store.removeRelation("workspace", "project", "A", "blocking", "B", true);
    expect(store.relationMap.A.blocking).toEqual([]);
    expect(store.relationMap.B.blocked_by).toEqual(["C"]);
    expect(store.issueRelationService.deleteIssueRelation).not.toHaveBeenCalled();
  });

  it("does not modify the reverse side on API failure and refetches the forward side", async () => {
    const { store, activity } = setup({ A: { blocking: ["B"] }, B: { blocked_by: ["A", "C"] } });
    const error = new Error("Request failed");
    vi.mocked(store.issueRelationService.deleteIssueRelation).mockRejectedValueOnce(error);
    await expect(store.removeRelation("workspace", "project", "A", "blocking", "B")).rejects.toThrow(error);
    expect(store.relationMap.B.blocked_by).toEqual(["A", "C"]);
    expect(store.issueRelationService.listIssueRelations).toHaveBeenCalledExactlyOnceWith("workspace", "project", "A");
    expect(activity.fetchActivities).not.toHaveBeenCalled();
  });
});
