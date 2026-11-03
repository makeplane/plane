/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  diffDays,
  scheduleSuccessors,
  buildCalendar,
  isWorkingDay,
  nextWorkingDay,
  onOrAfterWorking,
  addWorkingDays,
  workingSteps,
  findCycleThrough,
} from "./scheduling.ts";

const task = (id, start, end) => ({ id, start, end });
const edge = (predecessorId, successorId, lagDays = 0) => ({ predecessorId, successorId, lagDays });
const tasks = [
  task("A", "2026-11-01", "2026-11-03"),
  task("B", "2026-11-04", "2026-11-06"),
  task("C", "2026-11-07", "2026-11-09"),
];
const chain = [edge("A", "B"), edge("B", "C")];
const change = task("A", "2026-11-01", "2026-11-05");

test("pushes the chain preserving inclusive durations and excluding the dragged task", () => {
  assert.deepEqual(scheduleSuccessors(tasks, chain, change), {
    updates: [
      { id: "B", oldStart: "2026-11-04", oldEnd: "2026-11-06", newStart: "2026-11-06", newEnd: "2026-11-08" },
      { id: "C", oldStart: "2026-11-07", oldEnd: "2026-11-09", newStart: "2026-11-09", newEnd: "2026-11-11" },
    ],
    warnings: [],
    cycle: null,
  });
  assert.equal(tasks[1].start, "2026-11-04");
});

test("uses all predecessors, including those outside the downstream subgraph", () => {
  const result = scheduleSuccessors(
    [...tasks, task("P", "2026-11-01", "2026-11-10")],
    [...chain, edge("P", "B")],
    change
  );
  assert.deepEqual(
    result.updates.map(({ id, newStart, newEnd }) => ({ id, newStart, newEnd })),
    [
      { id: "B", newStart: "2026-11-11", newEnd: "2026-11-13" },
      { id: "C", newStart: "2026-11-14", newEnd: "2026-11-16" },
    ]
  );
});

test("stops at an unchanged successor even if its own successor has an existing violation", () => {
  assert.deepEqual(scheduleSuccessors([tasks[0], task("B", "2026-11-10", "2026-11-12"), tasks[2]], chain, change), {
    updates: [],
    warnings: [],
    cycle: null,
  });
});

test("handles milestones, start-only tasks, and missing dates without propagating through them", () => {
  const result = scheduleSuccessors(
    [
      tasks[0],
      task("B", null, "2026-11-04"),
      task("C", "2026-11-04", null),
      task("D", null, null),
      task("E", "2026-11-01", "2026-11-02"),
    ],
    [edge("A", "D"), edge("A", "C"), edge("A", "B"), edge("D", "E")],
    change
  );
  assert.deepEqual(result, {
    updates: [
      { id: "B", oldStart: null, oldEnd: "2026-11-04", newStart: null, newEnd: "2026-11-06" },
      { id: "C", oldStart: "2026-11-04", oldEnd: null, newStart: "2026-11-06", newEnd: null },
    ],
    warnings: [{ id: "D", reason: "missing_dates" }],
    cycle: null,
  });
});

test("warns once for a missing predecessor end and uses remaining usable predecessors", () => {
  const result = scheduleSuccessors([...tasks, task("P", "2026-11-01", null)], [...chain, edge("P", "B")], change);
  assert.equal(result.updates[0].newStart, "2026-11-06");
  assert.deepEqual(result.warnings, [{ id: "B", reason: "missing_predecessor_end" }]);
  assert.deepEqual(scheduleSuccessors(tasks, chain, task("A", "2026-11-01", null)), {
    updates: [],
    warnings: [{ id: "B", reason: "missing_predecessor_end" }],
    cycle: null,
  });
});

test("uses UTC calendar days across month, year and leap-day boundaries", () => {
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
  assert.equal(diffDays("2026-12-30", "2027-01-02"), 3);
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(
    scheduleSuccessors(
      [task("A", "2026-12-29", "2026-12-30"), task("B", "2026-12-31", "2027-01-02")],
      [edge("A", "B")],
      task("A", "2026-12-29", "2027-01-02")
    ).updates[0].newEnd,
    "2027-01-05"
  );
});

test("rejects reachable cycles even past unchanged or undated tasks", () => {
  for (const edges of [
    [...chain, edge("B", "A")],
    [...chain, edge("C", "B")],
  ]) {
    const result = scheduleSuccessors(tasks, edges, change);
    assert.ok(result.cycle?.length);
    assert.deepEqual(result.updates, []);
    assert.deepEqual(result.warnings, []);
  }
});

test("never pulls earlier or touches unrelated tasks and ignores unrelated cycles", () => {
  assert.deepEqual(
    scheduleSuccessors(
      [...tasks, task("X", null, null)],
      [...chain, edge("X", "X")],
      task("A", "2026-10-30", "2026-11-01")
    ),
    { updates: [], warnings: [], cycle: null }
  );
});

test("evaluates a shared successor reached by another moved predecessor with deterministic ties", () => {
  const result = scheduleSuccessors(
    [
      tasks[0],
      task("B", "2026-11-10", "2026-11-12"),
      task("C", "2026-11-04", "2026-11-06"),
      task("D", "2026-11-07", "2026-11-09"),
    ],
    [edge("A", "C"), edge("A", "B"), edge("B", "D"), edge("C", "D")],
    change
  );
  assert.deepEqual(
    result.updates.map(({ id, newStart }) => [id, newStart]),
    [
      ["C", "2026-11-06"],
      ["D", "2026-11-13"],
    ]
  );
});

test("schedules a 500-item chain in less than one second", () => {
  const items = Array.from({ length: 500 }, (_, i) => task(String(i), "2026-11-01", "2026-11-01"));
  const edges = items.slice(1).map((item, i) => edge(String(i), item.id));
  const start = performance.now();
  const result = scheduleSuccessors(items, edges, task("0", "2026-11-01", "2026-11-05"));
  assert.equal(result.updates.length, 499);
  assert.ok(performance.now() - start < 1000);
});

const update = (id, oldStart, oldEnd, newStart, newEnd) => ({ id, oldStart, oldEnd, newStart, newEnd });

test("calendar leap-day scheduling matches the server", () => {
  assert.equal(
    scheduleSuccessors(
      [task("A", "2028-02-27", "2028-02-27"), task("B", "2028-02-28", "2028-02-28")],
      [edge("A", "B")],
      task("A", "2028-02-27", "2028-02-28")
    ).updates[0].newEnd,
    "2028-02-29"
  );
});

test("cycles past both missing and unchanged middle tasks match the server", () => {
  for (const edges of [
    [...chain, edge("B", "A")],
    [...chain, edge("C", "B")],
  ]) {
    for (const middle of [task("B", null, null), task("B", "2026-11-10", "2026-11-12")]) {
      const result = scheduleSuccessors([tasks[0], middle, tasks[2]], edges, change);
      assert.ok(result.cycle);
      assert.equal(result.cycle[0], result.cycle.at(-1));
      assert.deepEqual(result.updates, []);
      assert.deepEqual(result.warnings, []);
    }
  }
});

test("deep 2001-item chains do not depend on recursion limits", () => {
  const items = Array.from({ length: 2001 }, (_, i) => task(String(i), "2026-11-01", "2026-11-01"));
  const edges = items.slice(1).map((item, i) => edge(String(i), item.id));
  assert.equal(scheduleSuccessors(items, edges, { ...change, id: "0" }).updates.length, 2000);
});

test("ISO strings and duplicate edges produce the same schedule", () => {
  assert.deepEqual(scheduleSuccessors(tasks, [...chain, ...chain], change), scheduleSuccessors(tasks, chain, change));
});

test("working helpers and calendar validation match the server", () => {
  const c = buildCalendar([1, 2, 3, 4, 5], ["2026-11-09"]);
  assert.equal(isWorkingDay("2026-11-09", c), false);
  assert.equal(isWorkingDay("2026-11-10", c), true);
  assert.equal(nextWorkingDay("2026-11-06", c), "2026-11-10");
  assert.equal(onOrAfterWorking("2026-11-07", c), "2026-11-10");
  assert.equal(onOrAfterWorking("2026-11-06", c), "2026-11-06");
  assert.equal(addWorkingDays("2026-11-10", -1, c), "2026-11-06");
  assert.equal(addWorkingDays("2026-11-07", 0, c), "2026-11-07");
  assert.equal(workingSteps("2026-11-06", "2026-11-11", c), 2);
  // JS has one numeric type, so Python's rejected 1.0 is the valid integer 1 here.
  for (const weekdays of [[], [0], [8], [true], ["1"], [1.5]]) assert.throws(() => buildCalendar(weekdays, []));
  assert.throws(() => buildCalendar([1], [new Date("2026-11-01")]));
  for (const [weekdays, holidays] of [
    [null, []],
    [[1], null],
  ])
    assert.throws(() => buildCalendar(weekdays, holidays));
  const empty = { weekdays: new Set(), holidays: new Set() };
  for (const [helper, args] of [
    [isWorkingDay, ["2026-11-01"]],
    [nextWorkingDay, ["2026-11-01"]],
    [onOrAfterWorking, ["2026-11-01"]],
    [addWorkingDays, ["2026-11-01", 0]],
    [workingSteps, ["2026-11-01", "2026-11-02"]],
  ])
    assert.throws(() => helper(...args, empty), /No working days/);
  assert.throws(() => scheduleSuccessors([], [], task("A", null, null), empty), /No working days/);
  assert.throws(() => addWorkingDays("2026-11-01", 3651, c));
  assert.throws(() => workingSteps("2026-11-01", "2040-11-01", c));
  assert.throws(() => workingSteps("2026-11-02", "2026-11-01", c), /Invalid date range/);
});

test("working loop guards and half-open ranges match the server", () => {
  const start = "2026-11-02";
  let c = buildCalendar(
    [1, 2, 3, 4, 5, 6, 7],
    Array.from({ length: 3651 }, (_, i) => addDays(start, i))
  );
  assert.throws(() => nextWorkingDay(start, c));
  assert.throws(() => onOrAfterWorking(start, c));
  c = buildCalendar([1, 2, 3, 4, 5, 6, 7], []);
  assert.equal(addWorkingDays(start, 3650, c), addDays(start, 3650));
  assert.equal(workingSteps(start, start, c), 0);
  assert.equal(workingSteps(start, addDays(start, 3650), c), 3650);
});

test("weekends, holidays, durations and partial dates match the server", () => {
  const items = [
    task("A", null, "2026-11-06"),
    task("B", "2026-11-05", "2026-11-10"),
    task("C", null, "2026-11-06"),
    task("D", "2026-11-06", null),
  ];
  for (const [holidays, start, end] of [
    [[], "2026-11-09", "2026-11-12"],
    [["2026-11-09"], "2026-11-10", "2026-11-12"],
  ]) {
    const result = scheduleSuccessors(
      items,
      [edge("A", "B"), edge("A", "C"), edge("A", "D")],
      items[0],
      buildCalendar([1, 2, 3, 4, 5], holidays)
    );
    assert.deepEqual(result.updates, [
      update("B", "2026-11-05", "2026-11-10", start, end),
      update("C", null, "2026-11-06", null, start),
      update("D", "2026-11-06", null, start, null),
    ]);
  }
});

test("a holiday on a weekend moves a day off to the next working day, like the server", () => {
  for (const [holidays, extra] of [
    [["2026-11-07"], ["2026-11-09"]],
    [
      ["2026-11-07", "2026-11-08"],
      ["2026-11-09", "2026-11-10"],
    ],
    [["2026-11-07", "2026-11-09"], ["2026-11-10"]],
    [["2026-11-06"], []],
  ]) {
    assert.deepEqual([...buildCalendar([1, 2, 3, 4, 5], holidays).holidays].sort(), [...holidays, ...extra].sort());
  }
});

test("the compensation search is not capped and stays fast", () => {
  const mondays = Array.from({ length: 60 }, (_, i) => addDays("2026-11-09", 7 * i));
  assert.ok(buildCalendar([1], ["2026-11-07", ...mondays]).holidays.has(addDays("2026-11-09", 7 * 60)));
  const days = Array.from({ length: 3651 }, (_, i) => addDays("2026-01-01", i));
  const started = Date.now();
  buildCalendar([1], days);
  assert.ok(Date.now() - started < 500);
});

test("lags and multiple predecessors match the server", () => {
  const c = buildCalendar([1, 2, 3, 4, 5], ["2026-11-09"]);
  const items = [task("A", null, "2026-11-06"), task("B", "2026-11-01", "2026-11-02")];
  for (const [calendar, lag, expected] of [
    [undefined, 2, "2026-11-09"],
    [undefined, -2, "2026-11-05"],
    [c, 2, "2026-11-12"],
    [c, -2, "2026-11-05"],
  ]) {
    assert.equal(scheduleSuccessors(items, [edge("A", "B", lag)], items[0], calendar).updates[0].newStart, expected);
  }
  for (const [calendar, expected] of [
    [undefined, "2026-11-09"],
    [c, "2026-11-12"],
  ]) {
    assert.equal(
      scheduleSuccessors(
        [...items, task("P", null, "2026-11-05")],
        [edge("A", "B", -1), edge("P", "B", 3)],
        items[0],
        calendar
      ).updates[0].newStart,
      expected
    );
  }
});

test("pull-earlier with missing predecessor falls back to push", () => {
  const items = [task("A", null, "2026-11-06"), task("B", "2026-11-16", "2026-11-17")];
  for (const [calendar, expected] of [
    [undefined, "2026-11-07"],
    [buildCalendar([1, 2, 3, 4, 5], []), "2026-11-09"],
  ]) {
    assert.deepEqual(scheduleSuccessors(items, [edge("A", "B")], items[0], calendar).updates, []);
    assert.equal(scheduleSuccessors(items, [edge("A", "B")], items[0], calendar, true).updates[0].newStart, expected);
    const result = scheduleSuccessors(
      [...items, task("P", null, null)],
      [edge("A", "B"), edge("P", "B")],
      items[0],
      calendar,
      true
    );
    assert.deepEqual(result.updates, []);
    assert.deepEqual(result.warnings, [{ id: "B", reason: "missing_predecessor_end" }]);
    const early = [items[0], task("B", "2026-11-01", null), task("P", null, null)];
    assert.equal(
      scheduleSuccessors(early, [edge("A", "B"), edge("P", "B")], items[0], calendar, true).updates[0].newStart,
      expected
    );
  }
});

test("working 500-item chain performance and cycle match the server", () => {
  const c = buildCalendar([1, 2, 3, 4, 5], []);
  const items = Array.from({ length: 500 }, (_, i) => task(String(i), "2026-11-02", "2026-11-03"));
  const edges = items.slice(1).map((item, i) => edge(String(i), item.id, 0));
  const start = performance.now();
  const result = scheduleSuccessors(items, edges, items[0], c);
  assert.equal(result.updates.length, 499);
  assert.ok(performance.now() - start < 1000);
  const cycle = scheduleSuccessors(items, [...edges, edge("499", "0", 1)], items[0], c);
  assert.deepEqual(cycle.updates, []);
  assert.deepEqual(cycle.warnings, []);
  assert.equal(cycle.cycle[0], cycle.cycle.at(-1));
});

test("find-cycle self edge matches the server", () => {
  assert.deepEqual(findCycleThrough([], "A", "A"), ["A", "A"]);
});

test("find-cycle direct edge matches the server", () => {
  assert.deepEqual(findCycleThrough([edge("A", "B")], "B", "A"), ["B", "A", "B"]);
});

test("find-cycle long chain matches the server", () => {
  assert.deepEqual(findCycleThrough([edge("A", "B"), edge("B", "C"), edge("C", "D")], "D", "A"), [
    "D",
    "A",
    "B",
    "C",
    "D",
  ]);
});

test("find-cycle absent cycle or duplicate matches the server", () => {
  const edges = [edge("A", "B"), edge("B", "C"), edge("X", "Y"), edge("Y", "X")];
  assert.equal(findCycleThrough(edges, "A", "C"), null);
  assert.equal(findCycleThrough(edges, "A", "B"), null);
  assert.equal(findCycleThrough(edges, "C", "D"), null);
});

test("date math preserves years 1 through 99 and Python date bounds", () => {
  assert.equal(addDays("0001-01-01", 0), "0001-01-01");
  assert.equal(addDays("0004-02-28", 1), "0004-02-29");
  assert.equal(addDays("0099-12-31", 1), "0100-01-01");
  assert.equal(diffDays("0099-12-31", "0100-01-01"), 1);
  const calendar = buildCalendar([1, 2, 3, 4, 5], ["0001-01-01"]);
  assert.equal(isWorkingDay("0001-01-01", calendar), false);
  assert.equal(nextWorkingDay("0001-01-01", calendar), "0001-01-02");
  assert.equal(addDays("9999-12-30", 1), "9999-12-31");
  assert.throws(() => addDays("0001-01-01", -1), /Invalid date range/);
  assert.throws(() => addDays("9999-12-31", 1), /Invalid date range/);
  assert.throws(() => buildCalendar([1], ["0000-01-01"]));
});

const typed = (type, a, b, lag = 0, calendar) =>
  scheduleSuccessors([a, b], [{ predecessorId: "A", successorId: "B", lagDays: lag, depType: type }], a, calendar);
const upd = (id, oldStart, oldEnd, newStart, newEnd) => ({ id, oldStart, oldEnd, newStart, newEnd });
const dep = task("B", "2026-11-04", "2026-11-06");

test("SS follows the predecessor start, with lag", () => {
  assert.deepEqual(typed("SS", task("A", "2026-11-06", "2026-11-08"), dep).updates, [
    upd("B", "2026-11-04", "2026-11-06", "2026-11-06", "2026-11-08"),
  ]);
  assert.equal(typed("SS", task("A", "2026-11-06", "2026-11-08"), dep, 2).updates[0].newStart, "2026-11-08");
  assert.deepEqual(typed("SS", task("A", "2026-11-01", "2026-11-09"), dep).updates, []);
});

test("FF follows the predecessor end and keeps duration", () => {
  assert.deepEqual(typed("FF", task("A", "2026-11-01", "2026-11-08"), dep).updates, [
    upd("B", "2026-11-04", "2026-11-06", "2026-11-06", "2026-11-08"),
  ]);
  assert.deepEqual(typed("FF", task("A", "2026-11-01", "2026-11-05"), dep).updates, []);
});

test("SF ends the successor no earlier than the predecessor start", () => {
  assert.deepEqual(typed("SF", task("A", "2026-11-10", "2026-11-12"), dep).updates, [
    upd("B", "2026-11-04", "2026-11-06", "2026-11-08", "2026-11-10"),
  ]);
});

test("explicit FS equals the default", () => {
  const a = task("A", "2026-11-01", "2026-11-05");
  assert.deepEqual(typed("FS", a, dep), scheduleSuccessors([a, dep], [edge("A", "B")], a));
});

test("typed dependencies warn about missing dates instead of moving", () => {
  assert.deepEqual(typed("SS", task("A", null, "2026-11-08"), dep).warnings, [
    { id: "B", reason: "missing_predecessor_start" },
  ]);
  const result = typed("FF", task("A", "2026-11-01", "2026-11-08"), task("B", "2026-11-04", null));
  assert.deepEqual(result.updates, []);
  assert.deepEqual(result.warnings, [{ id: "B", reason: "missing_dates" }]);
});

test("FF in a working calendar counts working days for the end constraint", () => {
  const calendar = buildCalendar([1, 2, 3, 4, 5], []);
  assert.deepEqual(
    typed("FF", task("A", "2026-11-02", "2026-11-09"), task("B", "2026-11-04", "2026-11-05"), 0, calendar).updates,
    [upd("B", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-09")]
  );
});

test("a satisfied FF/SF end constraint never measures the successor duration", () => {
  const calendar = buildCalendar([1, 2, 3, 4, 5], []);
  const huge = task("B", "2027-01-01", "2038-01-01");
  for (const type of ["FF", "SF"])
    assert.deepEqual(typed(type, task("A", "2026-11-02", "2026-11-03"), huge, 0, calendar).updates, []);
});
