/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { isIssueIdInGroupedIssueIds, shouldSkipHiddenSubIssueAdd } from "./sub-issue-list-guard";

describe("isIssueIdInGroupedIssueIds", () => {
  it("returns false when groupedIssueIds is undefined", () => {
    expect(isIssueIdInGroupedIssueIds(undefined, "issue-1")).toBe(false);
  });

  it("finds an issue in a flat grouped list", () => {
    const grouped = {
      "state-a": ["issue-1", "issue-2"],
      "state-b": ["issue-3"],
    };
    expect(isIssueIdInGroupedIssueIds(grouped, "issue-2")).toBe(true);
    expect(isIssueIdInGroupedIssueIds(grouped, "missing")).toBe(false);
  });

  it("finds an issue in a sub-grouped list", () => {
    const grouped = {
      "state-a": {
        "priority-high": ["issue-1"],
        "priority-low": ["issue-2"],
      },
    };
    expect(isIssueIdInGroupedIssueIds(grouped, "issue-2")).toBe(true);
    expect(isIssueIdInGroupedIssueIds(grouped, "missing")).toBe(false);
  });
});

describe("shouldSkipHiddenSubIssueAdd", () => {
  const baseHidden = {
    isSubIssue: true,
    isShowSubIssuesEnabled: false,
    isAlreadyInGroupedList: false,
    wasAlreadySubIssue: false,
    isExplicitAdd: false,
  };

  it("skips newly appearing sub-issues when Show sub-issues is off", () => {
    expect(shouldSkipHiddenSubIssueAdd(baseHidden)).toBe(true);
  });

  it("does not skip when Show sub-issues is on", () => {
    expect(
      shouldSkipHiddenSubIssueAdd({
        ...baseHidden,
        isShowSubIssuesEnabled: true,
      })
    ).toBe(false);
  });

  it("does not skip root issues", () => {
    expect(
      shouldSkipHiddenSubIssueAdd({
        ...baseHidden,
        isSubIssue: false,
      })
    ).toBe(false);
  });

  // Regression for makeplane/plane#9049: epic children are primary results in
  // epic-filtered kanban even when Show sub-issues is off. Optimistic DnD must
  // still ADD them into the destination column.
  it("does not skip sub-issues already visible that were already sub-issues", () => {
    expect(
      shouldSkipHiddenSubIssueAdd({
        ...baseHidden,
        isAlreadyInGroupedList: true,
        wasAlreadySubIssue: true,
      })
    ).toBe(false);
  });

  // Root → sub-issue while also changing group (e.g. state): the id is still in
  // the source group at snapshot time, but it must not be ADDed to the destination
  // when Show sub-issues is off.
  it("skips when a root issue becomes a sub-issue even if still in the source group", () => {
    expect(
      shouldSkipHiddenSubIssueAdd({
        ...baseHidden,
        isAlreadyInGroupedList: true,
        wasAlreadySubIssue: false,
        isExplicitAdd: false,
      })
    ).toBe(true);
  });

  it("does not skip explicit ADD for an already-visible issue", () => {
    expect(
      shouldSkipHiddenSubIssueAdd({
        ...baseHidden,
        isAlreadyInGroupedList: true,
        wasAlreadySubIssue: false,
        isExplicitAdd: true,
      })
    ).toBe(false);
  });

  // A failed optimistic sub→root (+ group) move looks identical to root→sub at
  // the guard: restoring via reversed updateIssueList would skip the ADD.
  // issueUpdate must restore cloned groupedIssueIds/Count instead.
  it("documents that reverse updateIssueList args cannot restore a visible sub-issue after failed root conversion", () => {
    expect(
      shouldSkipHiddenSubIssueAdd({
        ...baseHidden,
        isAlreadyInGroupedList: true,
        wasAlreadySubIssue: false,
        isExplicitAdd: false,
      })
    ).toBe(true);
  });
});
