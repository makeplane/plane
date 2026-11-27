// Liviere/plane fork: tests of model.ts. Run: node --test apps/web/liviere/decisions/
// Node (22.18+, 24) strips the types of model.ts itself; the data is invented (project DEMO).

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  DEFAULT_VIEW_STATE,
  addDays,
  areaMatches,
  availableActions,
  baseMatches,
  compareDecisions,
  daysBetween,
  formatDate,
  groupDecisions,
  hiddenByStatus,
  importFixChange,
  localSearchHits,
  mapEdges,
  parseDecisionNumber,
  parseViewState,
  reviewBadge,
  splitCode,
  statusMatches,
  treeCounts,
  versionChain,
  versionsToSend,
  viewStateParams,
} from "./model.ts";

const decision = (number, fields = {}) => ({
  id: number + 100,
  number,
  identifier: `DEMO-D${number}`,
  title: `Decyzja przykładowa ${number}`,
  rationale: null,
  rejected: null,
  area: "zamowienia",
  mechanism: null,
  area2: null,
  kind: "product",
  status: "active",
  decided_by: "user",
  confirmed: true,
  decided_on: "2026-10-01",
  review_on: null,
  review_condition: null,
  issues: [],
  sources: [],
  supersedes: null,
  superseded_by: [],
  related: [],
  pending_rollout: false,
  rollout: null,
  needs_review: false,
  estimated: [],
  note: null,
  queues: [],
  created_by: null,
  created_at: "2026-10-01T10:00:00+00:00",
  updated_at: "2026-10-01T10:00:00+00:00",
  ...fields,
});

const AREAS = [
  {
    id: 1,
    key: "zamowienia",
    name: "Zamówienia",
    sort_order: 1,
    mechanisms: [
      { id: 2, key: "zwroty", name: "Zwroty", sort_order: 1 },
      { id: 3, key: "wysylka", name: "Wysyłka", sort_order: 2 },
    ],
  },
  { id: 4, key: "platnosci", name: "Płatności", sort_order: 2, mechanisms: [] },
  { id: 5, key: "praca", name: "Sposób pracy", sort_order: 3, mechanisms: [] },
];

const params = (values) => (name) => (name in values ? values[name] : null);
const filter = (fields = {}) => ({ status: "current", kind: "all", queue: null, hits: null, ...fields });
const numbers = (list) => list.map((item) => item.number);

describe("view state", () => {
  test("defaults without parameters", () => {
    assert.deepEqual(parseViewState(params({})), DEFAULT_VIEW_STATE);
  });

  test("reads every known value", () => {
    const state = parseViewState(
      params({
        view: "map",
        area: "zamowienia",
        mech: "zwroty",
        queue: "rollout",
        status: "all",
        kind: "process",
        d: "12",
      })
    );
    assert.deepEqual(state, {
      view: "map",
      area: "zamowienia",
      mech: "zwroty",
      queue: "rollout",
      status: "all",
      kind: "process",
      d: 12,
    });
  });

  test("unknown values fall back", () => {
    const state = parseViewState(
      params({ view: "grid", area: "Not A Key!", mech: "zwroty", queue: "x", status: "old", kind: "law", d: "-3" })
    );
    assert.deepEqual(state, DEFAULT_VIEW_STATE);
    assert.equal(parseViewState(params({ d: "1.5" })).d, null);
    assert.equal(parseViewState(params({ d: "abc" })).d, null);
  });

  test("a mechanism needs its area", () => {
    assert.equal(parseViewState(params({ mech: "zwroty" })).mech, null);
  });

  test("defaults are removed from the URL, the rest is set", () => {
    assert.deepEqual(viewStateParams(DEFAULT_VIEW_STATE), {
      add: {},
      remove: ["view", "area", "mech", "queue", "status", "kind", "d"],
    });
    const change = viewStateParams({ ...DEFAULT_VIEW_STATE, view: "map", area: "praca", d: 7, status: "all" });
    assert.deepEqual(change.add, { view: "map", area: "praca", status: "all", d: "7" });
    assert.deepEqual(change.remove, ["mech", "queue", "kind"]);
  });

  test("round trip", () => {
    const state = { ...DEFAULT_VIEW_STATE, area: "zamowienia", mech: "wysylka", queue: "confirm", kind: "operations" };
    assert.deepEqual(parseViewState(params(viewStateParams(state).add)), state);
  });
});

describe("filters", () => {
  test("status filters", () => {
    assert.ok(statusMatches("active", "current"));
    assert.ok(!statusMatches("deferred", "current"));
    assert.ok(statusMatches("superseded", "past"));
    assert.ok(statusMatches("revoked", "past"));
    assert.ok(!statusMatches("done", "past"));
    assert.ok(statusMatches("done", "done"));
    for (const status of ["proposed", "active", "deferred", "done", "superseded", "revoked"])
      assert.ok(statusMatches(status, "all"));
  });

  test("a queue replaces the status filter", () => {
    const proposed = decision(1, { status: "proposed", queues: ["proposed"] });
    assert.ok(!baseMatches(proposed, filter()));
    assert.ok(baseMatches(proposed, filter({ queue: "proposed" })));
    assert.ok(!baseMatches(decision(2), filter({ queue: "proposed" })));
  });

  test("kind and search hits", () => {
    const item = decision(3, { kind: "process" });
    assert.ok(!baseMatches(item, filter({ kind: "product" })));
    assert.ok(baseMatches(item, filter({ kind: "process" })));
    assert.ok(baseMatches(item, filter({ hits: new Set([3]) })));
    assert.ok(!baseMatches(item, filter({ hits: new Set([4]) })));
    assert.ok(!baseMatches(item, filter({ hits: new Set() })));
  });

  test("area, second area and mechanism", () => {
    const own = decision(1, { area: "platnosci", mechanism: null, area2: "zamowienia" });
    const mech = decision(2, { mechanism: "zwroty" });
    assert.ok(areaMatches(own, null, null));
    assert.ok(areaMatches(own, "zamowienia", null));
    assert.ok(areaMatches(own, "platnosci", null));
    assert.ok(!areaMatches(own, "zamowienia", "zwroty"));
    assert.ok(areaMatches(mech, "zamowienia", "zwroty"));
    assert.ok(!areaMatches(mech, "zamowienia", "wysylka"));
  });

  test("hits hidden by the status filter", () => {
    const list = [
      decision(1, { status: "superseded" }),
      decision(2),
      decision(3, { status: "revoked", kind: "process" }),
    ];
    const hits = new Set([1, 2, 3]);
    assert.equal(hiddenByStatus(list, filter({ hits })), 2);
    assert.equal(hiddenByStatus(list, filter({ hits, kind: "product" })), 1);
    assert.equal(hiddenByStatus(list, filter({ hits, status: "all" })), 0);
    assert.equal(hiddenByStatus(list, filter()), 0);
  });
});

describe("search by number and work item", () => {
  test("decision numbers", () => {
    assert.equal(parseDecisionNumber("12"), 12);
    assert.equal(parseDecisionNumber("D12"), 12);
    assert.equal(parseDecisionNumber("d12"), 12);
    assert.equal(parseDecisionNumber(" DEMO-D12 "), 12);
    assert.equal(parseDecisionNumber("DEMO-12"), null);
    assert.equal(parseDecisionNumber("0"), null);
    assert.equal(parseDecisionNumber("zwrot 30 dni"), null);
    assert.equal(parseDecisionNumber("12a"), null);
  });

  test("local hits: number, identifier, linked work item", () => {
    const list = [
      decision(2, { issues: [{ identifier: "DEMO-3", visible: true, id: "x", name: "Zwroty", archived: false }] }),
      decision(3, { issues: [{ identifier: "SHOP-12", visible: false }] }),
      decision(12),
    ];
    assert.deepEqual([...localSearchHits(list, "12")], [12]);
    assert.deepEqual([...localSearchHits(list, "DEMO-D2")], [2]);
    assert.deepEqual([...localSearchHits(list, "demo-3")], [2]);
    assert.deepEqual([...localSearchHits(list, "SHOP-12")], [3]);
    assert.deepEqual([...localSearchHits(list, "wysyłka")], []);
    assert.deepEqual([...localSearchHits(list, "  ")], []);
  });
});

describe("tree and groups", () => {
  const list = [
    decision(1, { mechanism: "zwroty", decided_on: "2026-09-02" }),
    decision(2, { mechanism: "zwroty", decided_on: "2026-10-10" }),
    decision(3, { mechanism: "wysylka", decided_on: null }),
    decision(4, { area: "platnosci", area2: "zamowienia", decided_on: "2026-11-05" }),
    decision(5, { decided_on: "2026-10-20" }),
    decision(6, { area: "praca", area2: "platnosci", decided_on: "2026-11-24" }),
  ];

  test("counts per area (second area too) and mechanism", () => {
    const counts = treeCounts(list);
    assert.equal(counts.total, 6);
    assert.equal(counts.areas.get("zamowienia"), 5);
    assert.equal(counts.areas.get("platnosci"), 2);
    assert.equal(counts.areas.get("praca"), 1);
    assert.equal(counts.mechanisms.get("zamowienia/zwroty"), 2);
    assert.equal(counts.mechanisms.get("zamowienia/wysylka"), 1);
  });

  test("same area twice counts once", () => {
    assert.equal(treeCounts([decision(1, { area2: "zamowienia" })]).areas.get("zamowienia"), 1);
  });

  test("order: newest date, then number; no date last", () => {
    const sorted = [
      decision(1, { decided_on: null }),
      decision(2),
      decision(3, { decided_on: "2026-11-01" }),
      decision(4),
    ]
      .toSorted(compareDecisions)
      .map((item) => item.number);
    assert.deepEqual(sorted, [3, 4, 2, 1]);
  });

  test("without an area: one group per area in tree order", () => {
    const groups = groupDecisions(list, AREAS, null);
    assert.deepEqual(
      groups.map((group) => [group.type, group.area, numbers(group.items)]),
      [
        ["area", "zamowienia", [5, 2, 1, 3]],
        ["area", "platnosci", [4]],
        ["area", "praca", [6]],
      ]
    );
  });

  test("with an area: general, mechanisms in order, then the second-area ones", () => {
    const groups = groupDecisions(list, AREAS, "zamowienia");
    assert.deepEqual(
      groups.map((group) => [group.type, group.mechanism ?? group.area ?? null, numbers(group.items)]),
      [
        ["mechanism", null, [5]],
        ["mechanism", "zwroty", [2, 1]],
        ["mechanism", "wysylka", [3]],
        ["secondary", "platnosci", [4]],
      ]
    );
  });

  test("an unknown area sorts last", () => {
    const groups = groupDecisions([decision(1, { area: "nowy" }), decision(2, { area: "praca" })], AREAS, null);
    assert.deepEqual(
      groups.map((group) => group.area),
      ["praca", "nowy"]
    );
  });
});

const byNumber = (list) => new Map(list.map((item) => [item.number, item]));

describe("version chain", () => {
  test("linear chain", () => {
    const map = byNumber([
      decision(1, { status: "superseded", superseded_by: [2] }),
      decision(2, { status: "superseded", supersedes: 1, superseded_by: [3] }),
      decision(3, { supersedes: 2 }),
    ]);
    const chain = versionChain(map, 2);
    assert.deepEqual(numbers(chain.previous), [1]);
    assert.deepEqual(chain.next.map(numbers), [[3]]);
    assert.deepEqual(chain.siblings, []);
    assert.deepEqual(numbers(versionChain(map, 3).previous), [1, 2]);
    assert.deepEqual(versionChain(map, 1).next.map(numbers), [[2], [3]]);
  });

  test("split: several successors and siblings", () => {
    const map = byNumber([
      decision(1, { status: "superseded", superseded_by: [9, 4] }),
      decision(4, { supersedes: 1 }),
      decision(9, { status: "superseded", supersedes: 1, superseded_by: [10] }),
      decision(10, { supersedes: 9 }),
    ]);
    assert.deepEqual(versionChain(map, 1).next.map(numbers), [[4, 9], [10]]);
    assert.deepEqual(numbers(versionChain(map, 4).siblings), [9]);
    assert.deepEqual(numbers(versionChain(map, 10).previous), [1, 9]);
  });

  test("a cycle does not loop", () => {
    const map = byNumber([
      decision(1, { supersedes: 2, superseded_by: [2] }),
      decision(2, { supersedes: 1, superseded_by: [1] }),
    ]);
    const chain = versionChain(map, 1);
    assert.deepEqual(numbers(chain.previous), [2]);
    assert.deepEqual(chain.next, []);
  });

  test("missing numbers are skipped", () => {
    const map = byNumber([decision(5, { supersedes: 3, superseded_by: [7] })]);
    assert.deepEqual(versionChain(map, 5), { previous: [], next: [], siblings: [] });
    assert.deepEqual(versionChain(map, 99), { previous: [], next: [], siblings: [] });
  });
});

describe("dates", () => {
  test("days between dates, across months and clock changes", () => {
    assert.equal(daysBetween("2026-11-27", "2026-11-27"), 0);
    assert.equal(daysBetween("2026-11-27", "2026-12-11"), 14);
    assert.equal(daysBetween("2026-11-27", "2026-11-20"), -7);
    assert.equal(daysBetween("2026-10-24", "2026-10-26"), 2);
  });

  test("add days and format", () => {
    assert.equal(addDays("2026-11-27", 30), "2026-12-27");
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(formatDate("2026-09-02"), "02.09.2026");
  });

  test("review badge relative to today", () => {
    const today = "2026-11-27";
    assert.equal(reviewBadge(decision(1), today), null);
    assert.equal(reviewBadge(decision(1, { status: "done", review_on: "2026-12-01" }), today), null);
    const soon = reviewBadge(decision(1, { review_on: "2026-12-11" }), today);
    assert.deepEqual(soon, {
      type: "review",
      date: "2026-12-11",
      condition: null,
      estimated: false,
      overdue: false,
      soon: true,
    });
    assert.equal(reviewBadge(decision(1, { review_on: "2026-12-12" }), today).soon, false);
    const past = reviewBadge(decision(1, { review_on: "2026-11-20", estimated: ["review_on"] }), today);
    assert.equal(past.overdue, true);
    assert.equal(past.soon, true);
    assert.equal(past.estimated, true);
    const condition = reviewBadge(
      decision(1, { status: "deferred", review_condition: "gdy zwrotów będzie więcej" }),
      today
    );
    assert.equal(condition.type, "return");
    assert.equal(condition.soon, false);
    assert.equal(reviewBadge(decision(1, { review_on: "2026-12-01" }), null).soon, false);
  });
});

describe("text", () => {
  test("code spans", () => {
    assert.deepEqual(splitCode("Pole `rollout` znika po `ack`."), [
      { code: false, text: "Pole ", start: 0 },
      { code: true, text: "rollout", start: 5 },
      { code: false, text: " znika po ", start: 14 },
      { code: true, text: "ack", start: 24 },
      { code: false, text: ".", start: 29 },
    ]);
    assert.deepEqual(splitCode("bez kodu"), [{ code: false, text: "bez kodu", start: 0 }]);
    assert.deepEqual(splitCode("<b>`x`"), [
      { code: false, text: "<b>", start: 0 },
      { code: true, text: "x", start: 3 },
    ]);
    assert.deepEqual(splitCode(""), []);
  });
});

describe("map edges", () => {
  test("replacements (also a split) and related pairs once", () => {
    const edges = mapEdges([
      decision(1, { status: "superseded", superseded_by: [2, 5] }),
      decision(2, { supersedes: 1, related: [3] }),
      decision(3, { related: [2, 7, 3] }),
      decision(5, { supersedes: 1 }),
      decision(7, { related: [3] }),
    ]);
    assert.deepEqual(edges, [
      { from: 1, to: 2, type: "supersedes" },
      { from: 2, to: 3, type: "related" },
      { from: 3, to: 7, type: "related" },
      { from: 1, to: 5, type: "supersedes" },
    ]);
  });

  test("lines to decisions outside the list are left out", () => {
    assert.deepEqual(mapEdges([decision(2, { supersedes: 1, related: [9] })]), []);
  });
});

describe("card actions", () => {
  const keys = (fields) => availableActions(decision(1, fields));

  test("in force", () => {
    assert.deepEqual(keys({}), ["change", "defer", "done", "revoke"]);
    assert.deepEqual(keys({ review_on: "2026-12-01" }), ["reviewed", "change", "defer", "done", "revoke"]);
    assert.deepEqual(keys({ decided_by: "agent", confirmed: false }), ["confirm", "change", "defer", "done", "revoke"]);
  });

  test("proposed, deferred, done and past", () => {
    assert.deepEqual(keys({ status: "proposed", decided_by: "agent", confirmed: false }), [
      "accept",
      "change-accept",
      "reject",
    ]);
    assert.deepEqual(keys({ status: "deferred", review_condition: "gdy zwrotów będzie więcej" }), [
      "resume",
      "postpone",
      "done",
      "revoke",
    ]);
    assert.deepEqual(keys({ status: "deferred" }), ["resume", "done", "revoke"]);
    assert.deepEqual(keys({ status: "done" }), []);
    assert.deepEqual(keys({ status: "done", confirmed: false }), ["confirm"]);
    assert.deepEqual(keys({ status: "superseded" }), []);
    assert.deepEqual(keys({ status: "revoked", confirmed: false }), []);
  });

  test("imported entries come first", () => {
    assert.deepEqual(keys({ needs_review: true, decided_by: "unknown", confirmed: false }), [
      "import-ok",
      "import-fix",
      "confirm",
      "change",
      "defer",
      "done",
      "revoke",
    ]);
    assert.deepEqual(keys({ needs_review: true, status: "superseded" }), ["import-ok", "import-fix"]);
  });
});

describe("import correction", () => {
  const imported = decision(3, { decided_by: "unknown", confirmed: false, decided_on: null, needs_review: true });

  test("an unknown author must be chosen", () => {
    assert.equal(importFixChange(imported, { author: "", date: "", status: "active" }), null);
    assert.deepEqual(importFixChange(imported, { author: "user", date: "", status: "active" }), {
      decided_by: "user",
    });
  });

  test("only changed fields", () => {
    const known = decision(4, { decided_by: "user", decided_on: "2026-09-02", needs_review: true });
    assert.equal(importFixChange(known, { author: "user", date: "2026-09-02", status: "active" }), null);
    assert.deepEqual(importFixChange(known, { author: "agent", date: "2026-09-03", status: "done" }), {
      decided_by: "agent",
      decided_on: "2026-09-03",
      status: "done",
    });
    assert.deepEqual(importFixChange(known, { author: "user", date: "", status: "active" }), { decided_on: null });
  });

  test("states outside the import review are not sent", () => {
    const superseded = decision(5, { status: "superseded", needs_review: true });
    assert.equal(importFixChange(superseded, { author: "user", date: "2026-10-01", status: "active" }), null);
    assert.equal(importFixChange(decision(6), { author: "user", date: "2026-10-01", status: "proposed" }), null);
  });
});

describe("change form", () => {
  test("one version and a split", () => {
    assert.deepEqual(versionsToSend([{ title: "  Zwrot do 45 dni ", rationale: " " }]), [{ title: "Zwrot do 45 dni" }]);
    assert.deepEqual(
      versionsToSend([
        { title: "Zwrot do 30 dni", rationale: "Bez zmian" },
        { title: "Zwrot paczkomatem bez opłaty", rationale: "" },
      ]),
      [{ title: "Zwrot do 30 dni", rationale: "Bez zmian" }, { title: "Zwrot paczkomatem bez opłaty" }]
    );
  });

  test("missing, too long or too many titles", () => {
    assert.equal(versionsToSend([]), null);
    assert.equal(versionsToSend([{ title: " ", rationale: "x" }]), null);
    assert.equal(versionsToSend([{ title: "x".repeat(501), rationale: "" }]), null);
    assert.equal(versionsToSend(Array.from({ length: 11 }, (_, i) => ({ title: `D${i}`, rationale: "" }))), null);
    assert.equal(versionsToSend(Array.from({ length: 10 }, (_, i) => ({ title: `D${i}`, rationale: "" })))?.length, 10);
  });
});
