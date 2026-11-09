/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { EIssueLayoutTypes } from "@plane/types";
import { handleIssueQueryParamsByLayout } from "./base";

describe("handleIssueQueryParamsByLayout", () => {
  it("returns the kanban query param set for the global board", () => {
    expect(handleIssueQueryParamsByLayout(EIssueLayoutTypes.KANBAN, "global_board")).toEqual([
      "filters",
      "group_by",
      "sub_group_by",
      "order_by",
      "type",
      "show_empty_groups",
    ]);
  });

  it("returns null when the layout is undefined", () => {
    expect(handleIssueQueryParamsByLayout(undefined, "global_board")).toBeNull();
    expect(handleIssueQueryParamsByLayout(undefined, "my_issues")).toBeNull();
  });

  it("throws for a layout the view does not support", () => {
    // global_board only declares a kanban layout; there is no null-returning fallback
    expect(() => handleIssueQueryParamsByLayout(EIssueLayoutTypes.SPREADSHEET, "global_board")).toThrow(TypeError);
  });
});
