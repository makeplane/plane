/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { resolveDrop, buildArrows } from "./drag-logic.ts";
import { extractGanttRelations, validateNewDependency } from "./dependency-utils.ts";
import { extractExternalLinks } from "./external-links.ts";
import { addDays, scheduleSuccessors } from "./scheduling.ts";

const edge = (predecessorId, successorId, lagDays) => ({ predecessorId, successorId, lagDays });
const drop = (overrides = {}) =>
  resolveDrop({
    side: "right",
    fromId: "A",
    targetId: "B",
    rowIds: new Set(["A", "B", "C"]),
    dependencies: [],
    otherPairs: [],
    canCreateExternal: false,
    overEmptyArea: false,
    ...overrides,
  });

for (const [side, predecessorId, successorId] of [
  ["right", "A", "B"],
  ["left", "B", "A"],
]) {
  test(`drop on ${side} creates the correct direction`, () => {
    assert.deepEqual(drop({ side }), { kind: "create", predecessorId, successorId });
  });
}

for (const [error, overrides] of [
  ["self", { targetId: "A" }],
  ["duplicate", { dependencies: [edge("A", "B")] }],
  ["cycle", { dependencies: [edge("B", "C"), edge("C", "A")] }],
  ["occupied", { otherPairs: ["A|B"] }],
]) {
  test(`drop rejects ${error}`, () => assert.deepEqual(drop(overrides), { kind: "error", error }));
}

test("empty area opens the picker only with permission and inside the drop area", () => {
  assert.deepEqual(drop({ targetId: null, overEmptyArea: true, canCreateExternal: true }), { kind: "external-picker" });
  assert.deepEqual(drop({ targetId: null, overEmptyArea: true }), { kind: "none" });
  assert.deepEqual(drop({ targetId: null, canCreateExternal: true }), { kind: "none" });
});

test("a bar outside the rows never creates a dependency or opens the picker", () => {
  assert.deepEqual(drop({ targetId: "outside", overEmptyArea: true, canCreateExternal: true }), { kind: "none" });
});

const row = (y, marginLeft, start_date, target_date) => ({
  y,
  block: { position: { marginLeft, width: 20 }, start_date, target_date },
});

test("arrows omit absent bars and positions and preserve routing and lag", () => {
  const rows = new Map([
    ["A", row(20, 10, "2026-11-01", "2026-11-03")],
    ["B", row(60, 20, "2026-11-03", "2026-11-04")],
    ["C", { y: 100, block: {} }],
  ]);
  assert.deepEqual(buildArrows(rows, [edge("A", "B", -2), edge("A", "C"), edge("missing", "B")], 40), [
    {
      predecessorId: "A",
      successorId: "B",
      path: "M 30 20 H 38 V 40 H 12 V 60 H 20",
      violated: true,
      lagDays: -2,
      fromX: 30,
      toX: 20,
    },
  ]);
});

test("predecessors ending at the same x get separate bend lanes; one predecessor shares its lane", () => {
  const rows = new Map([
    ["A", row(20, 10, null, null)],
    ["B", row(60, 10, null, null)],
    ["C", row(100, 60, null, null)],
    ["D", row(140, 60, null, null)],
  ]);
  const paths = buildArrows(rows, [edge("A", "C"), edge("B", "C"), edge("A", "D")], 40).map((arrow) => arrow.path);
  assert.equal(paths[0], "M 30 20 H 38 V 100 H 60");
  assert.equal(paths[1], "M 30 60 H 41 V 100 H 60");
  assert.equal(paths[2], "M 30 20 H 38 V 140 H 60");
  assert.equal(new Set(paths.slice(0, 2).map((path) => path.split(" ")[4])).size, 2);
});

test("overlapping bars routed back keep their middle runs on different lines", () => {
  const rows = new Map([
    ["A", row(20, 10, null, null)],
    ["B", row(20 + 40, 10, null, null)],
    ["C", row(100, 15, null, null)],
  ]);
  const [first, second] = buildArrows(rows, [edge("A", "C"), edge("B", "C")], 40).map((arrow) => arrow.path);
  assert.notEqual(first.split(" V ")[1].split(" ")[0], second.split(" V ")[1].split(" ")[0]);
});

test("arrows flag equal or earlier starts but allow later or missing dates", () => {
  for (const [start, violated] of [
    ["2026-11-02", true],
    ["2026-11-03", true],
    ["2026-11-04", false],
    [null, false],
  ]) {
    const rows = new Map([
      ["A", row(20, 10, null, "2026-11-03")],
      ["B", row(60, 60, start, null)],
    ]);
    assert.deepEqual(buildArrows(rows, [edge("A", "B", 3)], 40), [
      {
        predecessorId: "A",
        successorId: "B",
        path: "M 30 20 H 38 V 60 H 60",
        violated,
        lagDays: 3,
        fromX: 30,
        toX: 60,
      },
    ]);
  }
});

test("extracting relations and building arrows for 2000 tasks takes less than 500 ms", () => {
  const issues = Array.from({ length: 2000 }, (_, i) => ({
    id: String(i),
    issue_relation: [
      ...[i - 1, i - 2]
        .filter((id) => id >= 0)
        .map((id) => ({ id: String(id), project_id: "project", relation_type: "blocked_by" })),
      ...(i % 100 === 0 ? [{ id: `external-${i}`, project_id: "other", relation_type: "blocked_by" }] : []),
    ],
  }));
  const rows = new Map(issues.map(({ id }, i) => [id, row(i * 40 + 20, i * 10, "2026-11-01", "2026-11-02")]));
  const start = performance.now();
  const { dependencies, otherPairs } = extractGanttRelations(issues, "project");
  const links = extractExternalLinks(issues, "project");
  const arrows = buildArrows(rows, dependencies, 40);
  const elapsed = performance.now() - start;
  console.log(`2000 tasks: extraction + arrows ${elapsed.toFixed(2)} ms`);
  assert.equal(dependencies.length, 3997);
  assert.equal(arrows.length, 3997);
  assert.equal(links.length, 20);
  assert.deepEqual(otherPairs, []);
  assert.ok(elapsed < 500, `${elapsed} ms >= 500 ms`);
  for (let i = 0; i < 3; i++) {
    const cycleStart = performance.now();
    const error = validateNewDependency(dependencies, [], "1999", "0");
    const cycleElapsed = performance.now() - cycleStart;
    console.log(`2000-node cycle check ${i + 1}: ${cycleElapsed.toFixed(2)} ms`);
    assert.equal(error, "cycle");
    assert.ok(cycleElapsed < 100, `${cycleElapsed} ms >= 100 ms`);
  }
});

test("pushing a 500-task schedule takes less than 500 ms", () => {
  const tasks = Array.from({ length: 500 }, (_, i) => ({ id: String(i), start: "2026-11-01", end: "2026-11-02" }));
  const dependencies = tasks.slice(1).map(({ id }, i) => edge(String(i), id));
  const start = performance.now();
  const result = scheduleSuccessors(tasks, dependencies, { ...tasks[0], end: "2026-11-05" });
  const elapsed = performance.now() - start;
  console.log(`500-task schedule: ${elapsed.toFixed(2)} ms`);
  assert.equal(result.updates.length, 499);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.cycle, null);
  assert.equal(result.updates[0].newStart, "2026-11-06");
  assert.equal(result.updates.at(-1).newEnd, addDays("2026-11-05", 998));
  assert.ok(elapsed < 500, `${elapsed} ms >= 500 ms`);
});
