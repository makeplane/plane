import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping test runner requires explicit TypeScript extensions.
// @ts-expect-error See comment above.
import { getTimelineCategoryLaneId, getTimelineRowLaneIds } from "../utils/timeline-track-assignment.ts";

const footballCategoryLanes = [
  {
    id: "offense",
    keywords: ["pass", "run", "touchdown"],
  },
  {
    id: "defense",
    keywords: ["interception", "sack", "turnover"],
  },
  {
    id: "special",
    keywords: ["field goal", "kickoff", "punt"],
  },
];

const buildRow = (overrides: Partial<Parameters<typeof getTimelineRowLaneIds>[0]> = {}) => ({
  action: "",
  context: {},
  groupValue: "",
  player: "",
  primaryDetail: "",
  result: "",
  secondaryDetail: "",
  team: "",
  ...overrides,
});

test("player-tagged rows still render in their matching category lane", () => {
  const row = buildRow({
    action: "pass_complete",
    player: "#09",
  });

  assert.deepEqual(getTimelineRowLaneIds(row, footballCategoryLanes), ["offense", "player-9"]);
});

test("category assignment also uses tag context metadata", () => {
  const row = buildRow({
    action: "return",
    context: { phase: "special teams kickoff" },
    player: "--",
  });

  assert.equal(getTimelineCategoryLaneId(row, footballCategoryLanes), "special");
  assert.deepEqual(getTimelineRowLaneIds(row, footballCategoryLanes), ["special"]);
});
