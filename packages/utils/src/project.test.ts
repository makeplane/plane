/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import type { TProject } from "@plane/types";
import { orderProjects } from "./project";

const project = (id: string, createdAt: string, overrides: Partial<TProject> = {}): TProject =>
  ({ id, name: id, created_at: createdAt, members: [], sort_order: 0, ...overrides }) as TProject;
const ids = (projects: TProject[]) => projects.map((p) => p.id);

describe("orderProjects creation dates", () => {
  const projects = [
    project("middle", "2026-11-02T00:00:00Z"),
    project("oldest", "2026-11-01T00:00:00Z"),
    project("newest", "2026-11-03T00:00:00Z"),
  ];

  it("orders newest first instead of keeping incoming store order", () => {
    expect(ids(orderProjects(projects, "-created_at"))).toEqual(["newest", "middle", "oldest"]);
  });

  it("orders oldest first", () => {
    expect(ids(orderProjects(projects, "created_at"))).toEqual(["oldest", "middle", "newest"]);
  });

  it.each(["created_at", "-created_at"] as const)("keeps equal timestamps stable for %s", (direction) => {
    const tied = [project("first", "2026-11-01T00:00:00Z"), project("second", "2026-11-01T00:00:00Z")];
    expect(ids(orderProjects(tied, direction))).toEqual(["first", "second"]);
  });

  it.each(["created_at", "-created_at"] as const)("does not mutate the array or projects for %s", (direction) => {
    const original = structuredClone(projects);
    const sorted = orderProjects(projects, direction);
    expect(projects).toEqual(original);
    expect(sorted).not.toBe(projects);
    expect(sorted.every((p) => projects.includes(p))).toBe(true);
  });

  it("compares instants across timezone offsets", () => {
    const offsetDates = [
      project("later", "2026-11-01T01:15:00-05:00"),
      project("earlier", "2026-11-01T01:45:00-04:00"),
    ];
    expect(ids(orderProjects(offsetDates, "created_at"))).toEqual(["earlier", "later"]);
    expect(ids(orderProjects(offsetDates.toReversed(), "-created_at"))).toEqual(["later", "earlier"]);
  });

  it("keeps equivalent instants with different offsets and fractional representations stable", () => {
    const equivalent = [
      project("first", "2026-11-01T05:45:00.1Z"),
      project("second", "2026-11-01T01:45:00.100000-04:00"),
    ];
    expect(ids(orderProjects(equivalent, "created_at"))).toEqual(["first", "second"]);
    expect(ids(orderProjects(equivalent, "-created_at"))).toEqual(["first", "second"]);
  });

  it.each(["created_at", "-created_at"] as const)("keeps missing dates last for %s", (direction) => {
    const missing = project("missing", "");
    delete missing.created_at;
    expect(ids(orderProjects([missing, project("dated", "2026-11-01T00:00:00Z")], direction))).toEqual([
      "dated",
      "missing",
    ]);
  });

  it("supports Date instances as well as API strings", () => {
    const values = [
      project("earlier", "", { created_at: new Date("2026-11-01T00:00:00.123Z") }),
      project("later", "2026-11-01T00:00:00.123999Z"),
    ];
    expect(ids(orderProjects(values, "-created_at"))).toEqual(["later", "earlier"]);
    expect(ids(orderProjects(values.toReversed(), "created_at"))).toEqual(["earlier", "later"]);
  });

  it("preserves microsecond ordering", () => {
    const precise = [
      project("earlier", "2026-11-01T00:00:00.123001Z"),
      project("later", "2026-11-01T00:00:00.123999Z"),
    ];
    expect(ids(orderProjects(precise, "-created_at"))).toEqual(["later", "earlier"]);
    expect(ids(orderProjects(precise.toReversed(), "created_at"))).toEqual(["earlier", "later"]);
  });

  it.each(["created_at", "-created_at"] as const)("handles empty input for %s", (direction) => {
    expect(orderProjects([], direction)).toEqual([]);
  });
});

describe("orderProjects other orderings", () => {
  const projects = [
    project("beta", "2026-11-01T00:00:00Z", { name: "Beta", sort_order: 2, members: ["a"] }),
    project("alpha", "2026-11-01T00:00:00Z", { name: "alpha", sort_order: 1, members: ["a", "b"] }),
    project("gamma", "2026-11-01T00:00:00Z", { name: "Gamma", sort_order: 3, members: [] }),
  ];

  it.each([
    ["sort_order", ["alpha", "beta", "gamma"]],
    ["name", ["alpha", "beta", "gamma"]],
    ["-name", ["gamma", "beta", "alpha"]],
    ["members_length", ["gamma", "beta", "alpha"]],
    ["-members_length", ["alpha", "beta", "gamma"]],
  ] as const)("preserves %s ordering", (direction, expected) => {
    expect(ids(orderProjects(projects, direction))).toEqual(expected);
  });
});
