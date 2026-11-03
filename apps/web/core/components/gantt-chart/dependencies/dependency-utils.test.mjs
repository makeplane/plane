/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  extractBlockedByDependencies,
  extractGanttRelations,
  validateNewDependency,
  getDependencyDraftStates,
  getDependencyPath,
  isDependencyViolated,
  isTypedDependencyViolated,
} from "./dependency-utils.ts";

test("extracts only unique same-project blocked_by predecessors", () => {
  const relation = { id: "A", project_id: "project", relation_type: "blocked_by" };
  assert.deepEqual(
    extractBlockedByDependencies(
      [
        {
          id: "B",
          issue_relation: [
            relation,
            relation,
            ...["relates_to", "duplicate", "blocking"].map((relation_type) => ({
              id: "A",
              project_id: "project",
              relation_type,
            })),
            { ...relation, project_id: "other" },
            { ...relation, id: "B" },
          ],
        },
        { id: "B", issue_relation: [relation] },
        { id: "C" },
        { id: "D", issue_relation: [relation] },
      ],
      "project"
    ),
    [
      { predecessorId: "A", successorId: "B" },
      { predecessorId: "A", successorId: "D" },
    ]
  );
});

test("equal or earlier successor dates violate Finish-to-Start", () => {
  assert.equal(isDependencyViolated("2026-10-20", "2026-10-20"), true);
  assert.equal(isDependencyViolated("2026-10-20", "2026-10-19"), true);
  assert.equal(isDependencyViolated("2026-10-20", "2026-10-21"), false);
  for (const missing of [null, undefined, ""]) {
    assert.equal(isDependencyViolated(missing, "2026-10-20"), false);
    assert.equal(isDependencyViolated("2026-10-20", missing), false);
  }
});

test("routes separated rows through a forward elbow", () => {
  assert.equal(getDependencyPath({ x: 10, y: 20 }, { x: 26, y: 60 }, 40), "M 10 20 H 18 V 60 H 26");
});

test("routes close or backward links through the gap between rows", () => {
  assert.equal(getDependencyPath({ x: 50, y: 20 }, { x: 10, y: 60 }, 40), "M 50 20 H 58 V 40 H 2 V 60 H 10");
  assert.equal(getDependencyPath({ x: 50, y: 60 }, { x: 55, y: 20 }, 40), "M 50 60 H 58 V 40 H 47 V 20 H 55");
});

test("draws a straight same-row link and rounds coordinates", () => {
  assert.equal(getDependencyPath({ x: 10.123, y: 20.456 }, { x: 40.789, y: 20.456 }, 40), "M 10.1 20.5 H 40.8");
});

const chain = [
  { predecessorId: "A", successorId: "B" },
  { predecessorId: "B", successorId: "C" },
];

test("validates new dependencies in priority order", () => {
  assert.equal(validateNewDependency(chain, ["A|A"], "A", "A"), "self");
  assert.equal(validateNewDependency(chain, ["A|B"], "A", "B"), "duplicate");
  assert.equal(validateNewDependency(chain, ["A|B"], "B", "A"), "occupied");
  assert.equal(validateNewDependency(chain, [], "B", "A"), "cycle");
  assert.equal(validateNewDependency(chain, [], "C", "A"), "cycle");
  assert.equal(validateNewDependency(chain, ["C|D"], "D", "C"), "occupied");
  assert.equal(validateNewDependency(chain, [], "A", "C"), null);
  assert.equal(validateNewDependency(chain, [], "C", "D"), null);
});

test("extracts unique occupied pairs in either direction, excluding other projects and dependency inverses", () => {
  const relation = (id, relation_type, project_id = "project") => ({ id, relation_type, project_id });
  assert.deepEqual(
    extractGanttRelations(
      [
        {
          id: "B",
          issue_relation: [
            relation("A", "blocked_by"),
            relation("C", "relates_to"),
            relation("C", "duplicate"),
            relation("D", "start_before"),
            relation("E", "finish_before"),
            relation("F", "implemented_by"),
            relation("G", "duplicate", "other"),
            relation("B", "duplicate"),
          ],
        },
        { id: "C", issue_relation: [relation("B", "relates_to")] },
        { id: "A", issue_relation: [relation("B", "blocking")] },
        { id: "H", issue_related: [relation("I", "duplicate")] },
      ],
      "project"
    ),
    {
      dependencies: [{ predecessorId: "A", successorId: "B" }],
      otherPairs: ["B|C", "B|D", "B|E", "B|F", "H|I"],
    }
  );
});

test("cycle traversal terminates even if existing data already contains a cycle", () => {
  assert.equal(validateNewDependency([...chain, { predecessorId: "C", successorId: "A" }], [], "D", "A"), null);
});

for (const side of ["right", "left"]) {
  test(`draft states match validation across a diamond and occupied pairs (${side})`, () => {
    const dependencies = [
      { predecessorId: "A", successorId: "B" },
      { predecessorId: "A", successorId: "C" },
      { predecessorId: "B", successorId: "D" },
      { predecessorId: "C", successorId: "D" },
    ];
    const candidates = ["A", "B", "C", "D", "E", "F"];
    const otherPairs = ["A|A", "A|B", "A|D", "B|E", "D|E"];
    for (const sourceId of candidates) {
      const states = getDependencyDraftStates(dependencies, otherPairs, sourceId, side, candidates);
      assert.deepEqual(Object.keys(states), candidates);
      for (const candidateId of candidates) {
        const [pred, succ] = side === "right" ? [sourceId, candidateId] : [candidateId, sourceId];
        assert.equal(states[candidateId], validateNewDependency(dependencies, otherPairs, pred, succ));
      }
    }
    assert.deepEqual(getDependencyDraftStates(dependencies, [], "D", "right", candidates), {
      A: "cycle",
      B: "cycle",
      C: "cycle",
      D: "self",
      E: null,
      F: null,
    });
    assert.deepEqual(getDependencyDraftStates(dependencies, [], "A", "left", candidates), {
      A: "self",
      B: "cycle",
      C: "cycle",
      D: "cycle",
      E: null,
      F: null,
    });
  });
}

test("draft traversal handles 10,000 candidates and existing cycles", () => {
  const candidates = Array.from({ length: 10_000 }, (_, index) => String(index));
  const dependencies = candidates.slice(1).map((id, index) => ({
    predecessorId: String(index),
    successorId: id,
  }));
  dependencies.push({ predecessorId: "2", successorId: "0" });
  const states = getDependencyDraftStates(dependencies, [], "0", "left", candidates);
  assert.equal(Object.keys(states).length, 10_000);
  assert.equal(states["0"], "self");
  assert.equal(states["2"], "duplicate");
  assert.equal(states["9999"], "cycle");
});

test("typed paths use the matching edges and keep FS unchanged", () => {
  const from = { x: 50, y: 20 };
  const to = { x: 80, y: 60 };
  assert.equal(getDependencyPath(from, to, 40), getDependencyPath(from, to, 40, 0, "FS"));
  assert.equal(getDependencyPath(from, to, 40, 0, "SS"), "M 50 20 H 42 V 60 H 80");
  assert.equal(getDependencyPath(from, to, 40, 1, "SS"), "M 50 20 H 39 V 60 H 80");
  assert.equal(getDependencyPath(from, to, 40, 0, "FF"), "M 50 20 H 88 V 60 H 80");
  assert.equal(getDependencyPath(from, to, 40, 0, "SF"), "M 50 20 H 42 V 40 H 88 V 60 H 80");
});

test("typed violation checks compare the matching dates only", () => {
  const p = { start: "2026-11-05", end: "2026-11-08" };
  assert.equal(isTypedDependencyViolated("FS", p, { start: "2026-11-08", end: "2026-11-10" }), true);
  assert.equal(isTypedDependencyViolated(undefined, p, { start: "2026-11-09" }), false);
  assert.equal(isTypedDependencyViolated("SS", p, { start: "2026-11-04" }), true);
  assert.equal(isTypedDependencyViolated("SS", p, { start: "2026-11-05" }), false);
  assert.equal(isTypedDependencyViolated("FF", p, { end: "2026-11-07" }), true);
  assert.equal(isTypedDependencyViolated("FF", p, { end: "2026-11-08" }), false);
  assert.equal(isTypedDependencyViolated("SF", p, { end: "2026-11-04" }), true);
  assert.equal(isTypedDependencyViolated("SF", p, { end: null }), false);
});
