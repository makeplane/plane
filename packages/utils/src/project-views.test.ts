/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import type { IProjectView, TViewFilterProps } from "@plane/types";
import { shouldFilterView } from "./project-views";

const view = {
  access: 1,
  created_by: "alice",
  created_at: new Date("2026-01-15T12:00:00Z"),
  is_favorite: true,
} as IProjectView;

const permutations = (filters: TViewFilterProps): TViewFilterProps[] => {
  const entries = Object.entries(filters);
  return [Object.fromEntries(entries), Object.fromEntries(entries.toReversed())];
};

describe("shouldFilterView", () => {
  it.each(permutations({ owned_by: ["bob"], view_type: [1] }))(
    "does not restore a view rejected by its owner filter: %o",
    (filters) => expect(shouldFilterView(view, filters)).toBe(false)
  );

  it.each(permutations({ created_at: ["2026-02-01;after"], view_type: [1] }))(
    "does not restore a view rejected by its date filter: %o",
    (filters) => expect(shouldFilterView(view, filters)).toBe(false)
  );

  it.each(permutations({ owned_by: ["alice"], created_at: ["2026-01-01;after"], view_type: [1] }))(
    "includes a view matching every filter: %o",
    (filters) => expect(shouldFilterView(view, filters)).toBe(true)
  );

  it("rejects a nonmatching view type even when other filters match", () => {
    expect(shouldFilterView(view, { owned_by: ["alice"], view_type: [0] })).toBe(false);
  });

  it("preserves the favorites restriction", () => {
    expect(shouldFilterView({ ...view, is_favorite: false }, { view_type: [1], favorites: true })).toBe(false);
  });

  it("ignores absent and empty filters", () => {
    expect(shouldFilterView(view, undefined)).toBe(true);
    expect(shouldFilterView(view, { owned_by: [], created_at: [], view_type: [] })).toBe(true);
  });
});
