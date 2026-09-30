/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import {
  buildGanttDependencyEdges,
  isDependencyRelationInvalid,
  wouldUpdatesViolateDependencies,
} from "../../helpers/gantt-dependency-helpers";

describe("gantt-dependency-helpers", () => {
  it("flags blocking when predecessor finishes after successor starts", () => {
    expect(
      isDependencyRelationInvalid(
        "blocking",
        { start_date: "2026-01-01", target_date: "2026-01-10" },
        { start_date: "2026-01-05", target_date: "2026-01-20" }
      )
    ).toBe(true);
  });

  it("allows valid finish_before relation", () => {
    expect(
      isDependencyRelationInvalid(
        "finish_before",
        { start_date: "2026-01-01", target_date: "2026-01-04" },
        { start_date: "2026-01-05", target_date: "2026-01-20" }
      )
    ).toBe(false);
  });

  it("flags blocking when predecessor ends on the same day successor starts", () => {
    expect(
      isDependencyRelationInvalid(
        "blocking",
        { start_date: "2026-01-01", target_date: "2026-01-05" },
        { start_date: "2026-01-05", target_date: "2026-01-20" }
      )
    ).toBe(true);
  });

  it("treats datetime payloads by calendar day", () => {
    expect(
      isDependencyRelationInvalid(
        "blocking",
        { start_date: "2026-01-01", target_date: "2026-01-10T00:00:00Z" },
        { start_date: "2026-01-05T12:00:00Z", target_date: "2026-01-20" }
      )
    ).toBe(true);
  });

  it("builds edges for visible dependency relations", () => {
    const edges = buildGanttDependencyEdges(
      ["a", "b"],
      {
        a: { blocking: ["b"] },
      },
      (id) =>
        id === "a"
          ? { start_date: "2026-01-01", target_date: "2026-01-10" }
          : { start_date: "2026-01-05", target_date: "2026-01-20" }
    );
    expect(edges).toHaveLength(1);
    expect(edges[0].sourceId).toBe("a");
    expect(edges[0].targetId).toBe("b");
    expect(edges[0].isInvalid).toBe(true);
  });

  it("detects date updates that violate dependencies", () => {
    const violated = wouldUpdatesViolateDependencies(
      [{ id: "a", target_date: "2026-01-12" }],
      {
        a: { blocking: ["b"] },
      },
      (id) =>
        id === "a"
          ? { start_date: "2026-01-01", target_date: "2026-01-04" }
          : { start_date: "2026-01-05", target_date: "2026-01-20" }
    );
    expect(violated).toBe(true);
  });
});
