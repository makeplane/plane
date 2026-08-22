/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import {
  checkDuplicates,
  checkIfArraysHaveSameElements,
  findStringWithMostCharacters,
  groupBy,
  orderArrayBy,
} from "../src/array";

describe("orderArrayBy", () => {
  it("should sort numbers in ascending order by default", () => {
    const input = [{ value: 3 }, { value: 1 }, { value: 2 }];
    const result = orderArrayBy(input, "value");
    expect(result).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }]);
  });

  it("should sort numbers in descending order when specified", () => {
    const input = [{ value: 3 }, { value: 1 }, { value: 2 }];
    const result = orderArrayBy(input, "value", "descending");
    expect(result).toEqual([{ value: 3 }, { value: 2 }, { value: 1 }]);
  });

  it("should sort in descending order when key starts with '-'", () => {
    const input = [{ priority: 1 }, { priority: 5 }, { priority: 3 }];
    const result = orderArrayBy(input, "-priority");
    expect(result).toEqual([{ priority: 5 }, { priority: 3 }, { priority: 1 }]);
  });

  it("should sort strings alphabetically (case-insensitive / natural)", () => {
    const input = [{ name: "banana" }, { name: "Apple" }, { name: "cherry" }];
    const result = orderArrayBy(input, "name");
    expect(result).toEqual([{ name: "Apple" }, { name: "banana" }, { name: "cherry" }]);
  });

  it("should safely sort nested properties using dot notation", () => {
    const input = [
      { user: { profile: { name: "Charlie" } } },
      { user: { profile: { name: "Alice" } } },
      { user: { profile: { name: "Bob" } } },
    ];
    const result = orderArrayBy(input, "user.profile.name");
    expect(result).toEqual([
      { user: { profile: { name: "Alice" } } },
      { user: { profile: { name: "Bob" } } },
      { user: { profile: { name: "Charlie" } } },
    ]);
  });

  it("should NOT throw TypeError when nested parent properties are null or undefined", () => {
    const input = [
      { id: 1, user: { profile: { name: "Charlie" } } },
      { id: 2, user: null },
      { id: 3, user: { profile: null } },
      { id: 4, user: { profile: { name: "Alice" } } },
      { id: 5 },
    ];

    expect(() => orderArrayBy(input, "user.profile.name")).not.toThrow();

    const result = orderArrayBy(input, "user.profile.name");
    // Alice and Charlie first, then items with null/undefined values placed at end
    expect(result[0].id).toBe(4); // Alice
    expect(result[1].id).toBe(1); // Charlie
    // remaining items (ids 2, 3, 5) are placed after defined items
    expect(result.slice(2).map((x) => x.id)).toEqual(expect.arrayContaining([2, 3, 5]));
  });

  it("should deterministically place null and undefined values at the end in ascending order", () => {
    const input = [
      { id: 1, date: "2024-05-01" },
      { id: 2, date: null },
      { id: 3, date: "2024-01-01" },
      { id: 4, date: undefined },
      { id: 5, date: "2024-03-01" },
    ];

    const result = orderArrayBy(input, "date", "ascending");
    expect(result[0].id).toBe(3); // 2024-01-01
    expect(result[1].id).toBe(5); // 2024-03-01
    expect(result[2].id).toBe(1); // 2024-05-01
    expect([result[3].id, result[4].id]).toEqual(expect.arrayContaining([2, 4]));
  });

  it("should handle empty array, null input, or empty key gracefully", () => {
    expect(orderArrayBy([], "key")).toEqual([]);
    expect(orderArrayBy(null as any, "key")).toEqual([]);
    expect(orderArrayBy(undefined as any, "key")).toEqual([]);
    expect(orderArrayBy([{ val: 1 }], "")).toEqual([]);
  });

  it("should not mutate the original array", () => {
    const input = [{ value: 3 }, { value: 1 }];
    const copy = [...input];
    orderArrayBy(input, "value");
    expect(input).toEqual(copy);
  });
});

describe("groupBy", () => {
  it("should group objects by a specified key", () => {
    const array = [
      { type: "A", value: 1 },
      { type: "B", value: 2 },
      { type: "A", value: 3 },
    ];
    expect(groupBy(array, "type")).toEqual({
      A: [
        { type: "A", value: 1 },
        { type: "A", value: 3 },
      ],
      B: [{ type: "B", value: 2 }],
    });
  });

  it("should group objects by nested key with 'None' fallback for missing properties", () => {
    const array = [
      { state: { group: "started" }, id: 1 },
      { state: null, id: 2 },
      { state: { group: "backlog" }, id: 3 },
    ];
    expect(groupBy(array, "state.group")).toEqual({
      started: [{ state: { group: "started" }, id: 1 }],
      None: [{ state: null, id: 2 }],
      backlog: [{ state: { group: "backlog" }, id: 3 }],
    });
  });
});

describe("checkDuplicates", () => {
  it("should return true if array contains duplicates", () => {
    expect(checkDuplicates([1, 2, 2, 3])).toBe(true);
    expect(checkDuplicates(["a", "b", "a"])).toBe(true);
  });

  it("should return false if array has only unique elements", () => {
    expect(checkDuplicates([1, 2, 3])).toBe(false);
    expect(checkDuplicates(["a", "b", "c"])).toBe(false);
  });
});

describe("findStringWithMostCharacters", () => {
  it("should return the longest string in array", () => {
    expect(findStringWithMostCharacters(["a", "bb", "ccc"])).toBe("ccc");
  });

  it("should return empty string for empty input", () => {
    expect(findStringWithMostCharacters([])).toBe("");
    expect(findStringWithMostCharacters(null as any)).toBe("");
  });
});

describe("checkIfArraysHaveSameElements", () => {
  it("should return true if arrays contain same elements in different order", () => {
    expect(checkIfArraysHaveSameElements([1, 2], [2, 1])).toBe(true);
  });

  it("should return false if arrays have different elements", () => {
    expect(checkIfArraysHaveSameElements([1, 2], [1, 3])).toBe(false);
  });
});
