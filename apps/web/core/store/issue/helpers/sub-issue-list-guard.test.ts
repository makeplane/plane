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
  it("skips newly appearing sub-issues when Show sub-issues is off", () => {
    expect(
      shouldSkipHiddenSubIssueAdd({
        isSubIssue: true,
        isShowSubIssuesEnabled: false,
        isAlreadyInGroupedList: false,
      })
    ).toBe(true);
  });

  it("does not skip when Show sub-issues is on", () => {
    expect(
      shouldSkipHiddenSubIssueAdd({
        isSubIssue: true,
        isShowSubIssuesEnabled: true,
        isAlreadyInGroupedList: false,
      })
    ).toBe(false);
  });

  it("does not skip root issues", () => {
    expect(
      shouldSkipHiddenSubIssueAdd({
        isSubIssue: false,
        isShowSubIssuesEnabled: false,
        isAlreadyInGroupedList: false,
      })
    ).toBe(false);
  });

  // Regression for makeplane/plane#9049: epic children are primary results in
  // epic-filtered kanban even when Show sub-issues is off. Optimistic DnD must
  // still ADD them into the destination column.
  it("does not skip sub-issues already visible in the grouped list", () => {
    expect(
      shouldSkipHiddenSubIssueAdd({
        isSubIssue: true,
        isShowSubIssuesEnabled: false,
        isAlreadyInGroupedList: true,
      })
    ).toBe(false);
  });
});
