/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TTeamCalendarDay } from "@plane/types";
import { describe, expect, it } from "vitest";
import { countByPerson, filterPeopleByName, getDayPeople, getKindShares } from "./calendar-team";

const day = (date: string, users: Partial<TTeamCalendarDay["users"]>): TTeamCalendarDay => {
  const full = { ONSITE: [], REMOTE: [], OFF: [], LEAVE: [], HOLIDAY: [], UNPLANNED: [], ...users };
  return {
    date,
    holiday: null,
    users: full,
    counts: {
      ONSITE: full.ONSITE.length,
      REMOTE: full.REMOTE.length,
      OFF: full.OFF.length,
      LEAVE: full.LEAVE.length,
      HOLIDAY: full.HOLIDAY.length,
      UNPLANNED: full.UNPLANNED.length,
    },
  };
};

describe("countByPerson", () => {
  it("adds up each person's days per category", () => {
    const counts = countByPerson([
      day("2027-01-04", { ONSITE: ["a", "b"], REMOTE: ["c"] }),
      day("2027-01-05", { ONSITE: ["a"], LEAVE: ["b"], UNPLANNED: ["c"] }),
    ]);

    expect(counts.a).toMatchObject({ ONSITE: 2, REMOTE: 0 });
    expect(counts.b).toMatchObject({ ONSITE: 1, LEAVE: 1 });
    expect(counts.c).toMatchObject({ REMOTE: 1, UNPLANNED: 1 });
  });

  it("has nothing for people with no counted days and for no days", () => {
    expect(countByPerson([])).toEqual({});
    expect(countByPerson([day("2027-01-09", {})])).toEqual({});
  });
});

describe("getKindShares", () => {
  it("gives each non-empty category its share of the total", () => {
    const shares = getKindShares({ ONSITE: 6, REMOTE: 2, OFF: 0, LEAVE: 2, HOLIDAY: 0, UNPLANNED: 0 });

    expect(shares.map((share) => share.kind)).toEqual(["ONSITE", "REMOTE", "LEAVE"]);
    expect(shares.map((share) => share.percent)).toEqual([60, 20, 20]);
    expect(shares.reduce((sum, share) => sum + share.percent, 0)).toBeCloseTo(100);
  });

  it("is empty when nothing is counted", () => {
    expect(getKindShares({ ONSITE: 0, REMOTE: 0, OFF: 0, LEAVE: 0, HOLIDAY: 0, UNPLANNED: 0 })).toEqual([]);
  });
});

describe("filterPeopleByName", () => {
  const names: Record<string, string> = { a: "Ada Admin", b: "Sara Specialist", c: "Omid Specialist" };
  const getName = (id: string) => names[id];

  it("matches part of a name ignoring case and spaces", () => {
    expect(filterPeopleByName(["a", "b", "c"], getName, "  SPEC ")).toEqual(["b", "c"]);
  });

  it("keeps everyone for an empty query and drops people without a known name", () => {
    expect(filterPeopleByName(["a", "b"], getName, "")).toEqual(["a", "b"]);
    expect(filterPeopleByName(["a", "x"], getName, "a")).toEqual(["a"]);
  });
});

describe("getDayPeople", () => {
  it("lists planned workers first and reports how many did not fit", () => {
    const result = getDayPeople(
      day("2027-01-04", { REMOTE: ["r"], ONSITE: ["o1", "o2"], OFF: ["f"], UNPLANNED: ["u"] }),
      3
    );

    expect(result).toEqual({ shown: ["o1", "o2", "r"], extra: 1 });
  });

  it("ignores unplanned people and holidays", () => {
    expect(getDayPeople(day("2027-01-05", { UNPLANNED: ["u"], HOLIDAY: ["h"] }), 3)).toEqual({ shown: [], extra: 0 });
  });
});
