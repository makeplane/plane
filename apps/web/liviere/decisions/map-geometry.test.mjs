// Liviere/plane fork: tests of map-geometry.ts and the map edges at size. Run:
// node --test apps/web/liviere/decisions/*.test.mjs (invented data only).

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ALL_LINES_LIMIT, linePath, mapLines, touches, visibleLines } from "./map-geometry.ts";
import { mapEdges } from "./model.ts";
import { generateDecisions } from "./fixtures/generate-sample.mjs";

const pairs = (list) => list.map((line) => `${line.from}-${line.to}`);
const numbers = (path) => path.match(/-?\d+(\.\d+)?/g).map(Number);

describe("line paths", () => {
  test("same column: a cubic arc through the left margin", () => {
    const path = linePath({ x: 20, y: 10, width: 30 }, { x: 20, y: 110, width: 30 });
    assert.match(path, /^M5\.0 10\.0 C-11\.0 10\.0 -11\.0 110\.0 5\.0 110\.0$/);
  });

  test("the arc grows with the distance, up to 24 px", () => {
    const far = numbers(linePath({ x: 20, y: 0, width: 30 }, { x: 20, y: 2000, width: 30 }));
    assert.equal(far[2], 5 - 24);
  });

  test("other column: a quadratic curve between the centres", () => {
    const path = linePath({ x: 0, y: 0, width: 30 }, { x: 300, y: 0, width: 30 });
    assert.match(path, /^M0\.0 0\.0 Q150\.0 40\.0 300\.0 0\.0$/);
    const near = numbers(linePath({ x: 0, y: 0, width: 30 }, { x: 100, y: 0, width: 30 }));
    assert.equal(near[3], 18);
  });

  test("lines only between dots on the map", () => {
    const positions = new Map([
      [1, { x: 10, y: 10, width: 30 }],
      [2, { x: 400, y: 50, width: 30 }],
    ]);
    const lines = mapLines(
      [
        { from: 1, to: 2, type: "supersedes" },
        { from: 2, to: 3, type: "related" },
      ],
      positions
    );
    assert.equal(lines.length, 1);
    assert.equal(lines[0].type, "supersedes");
    assert.ok(lines[0].path.startsWith("M10.0 10.0 Q"));
  });
});

describe("readable large maps", () => {
  const many = Array.from({ length: ALL_LINES_LIMIT + 5 }, (_, i) => ({
    from: i + 1,
    to: i + 2,
    type: "related",
    path: "",
    local: false,
  }));

  test("related lines within one box only for the focused decision", () => {
    const lines = [
      { from: 1, to: 2, type: "related", path: "", local: true },
      { from: 1, to: 3, type: "supersedes", path: "", local: true },
      { from: 2, to: 9, type: "related", path: "", local: false },
    ];
    assert.deepEqual(pairs(visibleLines(lines, null, false)), ["1-3", "2-9"]);
    assert.deepEqual(pairs(visibleLines(lines, 2, false)), ["1-2", "1-3", "2-9"]);
    assert.deepEqual(pairs(visibleLines(lines, 3, false)), ["1-3", "2-9"]);
    assert.deepEqual(pairs(visibleLines(lines, null, true)), ["1-2", "1-3", "2-9"]);
  });

  test("a line is local when both ends are in the same box", () => {
    const positions = new Map([
      [1, { x: 10, y: 10, width: 30 }],
      [2, { x: 10, y: 60, width: 30 }],
      [3, { x: 400, y: 60, width: 30 }],
    ]);
    const boxOf = new Map([
      [1, "zamowienia"],
      [2, "zamowienia"],
      [3, "platnosci"],
    ]);
    const lines = mapLines(
      [
        { from: 1, to: 2, type: "related" },
        { from: 2, to: 3, type: "related" },
      ],
      positions,
      boxOf
    );
    assert.deepEqual(
      lines.map((line) => line.local),
      [true, false]
    );
  });

  test("all lines up to the limit", () => {
    assert.equal(visibleLines(many.slice(0, ALL_LINES_LIMIT), null, false).length, ALL_LINES_LIMIT);
  });

  test("above it only the lines of the focused decision, unless all are asked for", () => {
    assert.equal(visibleLines(many, null, false).length, 0);
    assert.deepEqual(
      visibleLines(many, 5, false).map((line) => [line.from, line.to]),
      [
        [4, 5],
        [5, 6],
      ]
    );
    assert.equal(visibleLines(many, null, true).length, many.length);
  });

  test("touches", () => {
    assert.ok(touches({ from: 1, to: 2 }, 2));
    assert.ok(!touches({ from: 1, to: 2 }, 3));
    assert.ok(!touches({ from: 1, to: 2 }, null));
  });
});

describe("300 decisions in 20 areas", () => {
  const { decisions, areas } = generateDecisions({ decisions: 300, areas: 20, seed: 7 });

  test("the generated register is consistent", () => {
    assert.equal(decisions.length, 300);
    assert.equal(areas.length, 20);
    const byNumber = new Map(decisions.map((decision) => [decision.number, decision]));
    const mechanisms = new Map(areas.map((area) => [area.key, new Set(area.mechanisms.map((item) => item.key))]));
    for (const decision of decisions) {
      // What the import checks (apps/api/plane/liviere/decisions/importer.py)
      assert.ok(mechanisms.has(decision.area), `D${decision.number}: unknown area`);
      if (decision.mechanism)
        assert.ok(
          mechanisms.get(decision.area).has(decision.mechanism),
          `D${decision.number}: mechanism of another area`
        );
      assert.notEqual(decision.area2, decision.area, `D${decision.number}: second area equal to the first`);
      if (decision.decided_by === "unknown" || !decision.decided_on)
        assert.ok(decision.needs_review, `D${decision.number}: unknown author or date without needs_review`);
      if (decision.supersedes !== null) assert.equal(byNumber.get(decision.supersedes).status, "superseded");
      for (const other of decision.related) assert.ok(byNumber.get(other).related.includes(decision.number));
    }
    assert.ok(
      decisions.some((decision) => decision.superseded_by.length > 1),
      "has a split"
    );
  });

  test("edges and paths without the DOM take well under a frame", () => {
    // Positions as on a three-column map: rows 26 px apart, columns 326 px apart
    const positions = new Map(
      decisions.map((decision, index) => [
        decision.number,
        { x: 30 + (index % 3) * 326, y: 40 + Math.floor(index / 3) * 26, width: 30 },
      ])
    );
    const runs = 20;
    const started = performance.now();
    let lines = [];
    for (let run = 0; run < runs; run++) lines = mapLines(mapEdges(decisions), positions);
    const perRun = (performance.now() - started) / runs;
    assert.ok(lines.length > 50, `only ${lines.length} lines`);
    assert.ok(perRun < 16, `${perRun.toFixed(2)} ms per run`);
    // Printed for the report: node --test shows it with the test results
    console.log(`map edges and paths: ${lines.length} lines, ${perRun.toFixed(2)} ms per run`);
  });
});
