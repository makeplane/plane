/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import type { IModule, TModuleOrderByOptions } from "@plane/types";
import { orderModules } from "./module";

const createModule = (id: string, overrides: Partial<IModule> = {}): IModule => ({
  id,
  name: id,
  description: "",
  description_text: "",
  description_html: "",
  workspace_id: "workspace",
  project_id: "project",
  lead_id: null,
  member_ids: [],
  is_favorite: false,
  sort_order: 0,
  view_props: { filters: {} },
  archived_at: null,
  start_date: null,
  target_date: null,
  created_at: "2026-11-01T12:00:00Z",
  updated_at: "2026-11-01T12:00:00Z",
  total_issues: 0,
  completed_issues: 0,
  backlog_issues: 0,
  started_issues: 0,
  unstarted_issues: 0,
  cancelled_issues: 0,
  backlog_estimate_points: 0,
  started_estimate_points: 0,
  unstarted_estimate_points: 0,
  cancelled_estimate_points: 0,
  ...overrides,
});

const ids = (modules: IModule[]) => modules.map((item) => item.id);

const orderings: { orderBy: TModuleOrderByOptions; expected: string[] }[] = [
  { orderBy: "issues_length", expected: ["empty", "few", "many"] },
  { orderBy: "-issues_length", expected: ["many", "few", "empty"] },
  { orderBy: "target_date", expected: ["few", "many", "empty"] },
  { orderBy: "-target_date", expected: ["many", "few", "empty"] },
  { orderBy: "created_at", expected: ["empty", "few", "many"] },
  { orderBy: "-created_at", expected: ["many", "few", "empty"] },
];

const createModules = () => [
  createModule("few", { total_issues: 2, target_date: "2026-11-05", created_at: "2026-11-02T12:00:00Z" }),
  createModule("empty", { created_at: "2026-11-01T12:00:00Z" }),
  createModule("many", { total_issues: 12, target_date: "2026-11-20", created_at: "2026-11-03T12:00:00Z" }),
];

describe("orderModules", () => {
  it.each(orderings)("sorts by the values for $orderBy", ({ orderBy, expected }) => {
    expect(ids(orderModules(createModules(), orderBy))).toEqual(expected);
  });

  it.each(orderings)("preserves the input array and modules for $orderBy", ({ orderBy }) => {
    const modules = createModules();
    const original = structuredClone(modules);
    modules.forEach(Object.freeze);
    Object.freeze(modules);

    const result = orderModules(modules, orderBy);

    expect(modules).toEqual(original);
    expect(result).not.toBe(modules);
    result.forEach((item) => expect(modules).toContain(item));
  });

  it.each(["-issues_length", "-target_date", "-created_at"] as const)(
    "preserves input order for equal values with %s",
    (orderBy) => {
      const modules = ["first", "second", "third"].map((id) =>
        createModule(id, { total_issues: 5, target_date: "2026-11-10" })
      );
      expect(ids(orderModules(modules, orderBy))).toEqual(["first", "second", "third"]);
    }
  );

  it("keeps undated modules last when sorting due dates descending", () => {
    const modules = [
      createModule("undated-first"),
      createModule("earlier", { target_date: "2026-11-05" }),
      createModule("undated-second"),
      createModule("later", { target_date: "2026-11-20" }),
    ];
    expect(ids(orderModules(modules, "-target_date"))).toEqual(["later", "earlier", "undated-first", "undated-second"]);
  });

  it("preserves natural name ordering in both directions", () => {
    const modules = [createModule("Module 10"), createModule("Module 2"), createModule("Module 1")];
    expect(ids(orderModules(modules, "name"))).toEqual(["Module 1", "Module 2", "Module 10"]);
    expect(ids(orderModules(modules, "-name"))).toEqual(["Module 10", "Module 2", "Module 1"]);
  });

  it.each(["created_at", "-created_at"] as const)(
    "orders creation timestamps across a daylight-saving rollback with %s",
    (orderBy) => {
      const modules = [
        createModule("earlier", { created_at: "2026-11-01T01:59:00-04:00" }),
        createModule("later", { created_at: "2026-11-01T01:01:00-05:00" }),
      ];
      expect(ids(orderModules(modules, orderBy))).toEqual(
        orderBy === "created_at" ? ["earlier", "later"] : ["later", "earlier"]
      );
    }
  );

  it.each(["created_at", "-created_at"] as const)(
    "preserves the input order for equal instants written with different offsets with %s",
    (orderBy) => {
      const modules = [
        createModule("first", { created_at: "2026-11-01T06:01:00.123456Z" }),
        createModule("second", { created_at: "2026-11-01T01:01:00.123456-05:00" }),
        createModule("third", { created_at: "2026-11-01T11:31:00.123456+05:30" }),
      ];
      expect(ids(orderModules(modules, orderBy))).toEqual(["first", "second", "third"]);
    }
  );

  it.each(["created_at", "-created_at"] as const)(
    "retains API microsecond precision and handles missing fractional seconds with %s",
    (orderBy) => {
      const modules = [
        createModule("later", { created_at: "2026-11-01T06:01:00.000002Z" }),
        createModule("whole-second", { created_at: "2026-11-01T01:01:00-05:00" }),
        createModule("earlier", { created_at: "2026-11-01T01:01:00.000001-05:00" }),
      ];
      expect(ids(orderModules(modules, orderBy))).toEqual(
        orderBy === "created_at" ? ["whole-second", "earlier", "later"] : ["later", "earlier", "whole-second"]
      );
    }
  );

  it("preserves manual ordering", () => {
    const modules = [createModule("second", { sort_order: 2 }), createModule("first", { sort_order: 1 })];
    expect(ids(orderModules(modules, "sort_order"))).toEqual(["first", "second"]);
  });

  it("returns an empty result when modules or ordering are missing", () => {
    expect(orderModules([], "-created_at")).toEqual([]);
    expect(orderModules(createModules(), undefined)).toEqual([]);
  });
});
