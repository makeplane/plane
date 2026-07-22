import assert from "node:assert/strict";
import test from "node:test";
import type { SgTagRow } from "../../types";

// Node's type-stripping test runner requires explicit TypeScript extensions.
// @ts-expect-error See comment above.
import { buildTimelineTagTypeOptions, getTimelineRowTagTypeKeys } from "../utils/timeline-tag-types.ts";

const buildRow = (overrides: Partial<SgTagRow>): SgTagRow => ({
  action: "Run",
  clipDurationSeconds: null,
  clipEndSeconds: null,
  clipId: null,
  clipRangeSource: null,
  clipStartSeconds: null,
  context: {},
  groupValue: "Quarter 1",
  id: "tag-1",
  matrixParticipant: null,
  matrixPeriod: null,
  player: "--",
  playlistFallbackTimestamp: null,
  playlistTimestamp: null,
  primaryDetail: "",
  result: "--",
  secondaryDetail: "",
  sourceTagId: null,
  sourceUrl: "",
  team: "home",
  thumbnailUrl: "",
  timecode: "00:00",
  ...overrides,
});

test("american football timeline exposes the full catalog of tag filters", () => {
  const options = buildTimelineTagTypeOptions([], "american-football");

  assert.equal(options.length, 31);
  assert.deepEqual(
    options.map((option) => option.group),
    [
      ...Array(7).fill("Play call"),
      ...Array(5).fill("Special teams"),
      ...Array(6).fill("Outcome"),
      ...Array(5).fill("Defense"),
      ...Array(4).fill("Down & distance"),
      ...Array(4).fill("Player notes"),
    ]
  );
  assert.deepEqual(
    options.slice(0, 7).map((option) => option.label),
    ["Pass complete", "Pass incomplete", "Run", "Sack", "Play action", "Bootleg", "Draw"]
  );
});

test("american football catalog uses the provided tag color codes", () => {
  const colorsByLabel = new Map(
    buildTimelineTagTypeOptions([], "american-football").map((option) => [option.label, option.color])
  );

  assert.deepEqual(Object.fromEntries(colorsByLabel), {
    "Pass complete": "#7AACD0",
    "Pass incomplete": "#E07B4E",
    Run: "#86CF95",
    Sack: "#E7A0B8",
    "Play action": "#4EB5DE",
    Bootleg: "#7BCCE0",
    Draw: "#CADF72",
    Kickoff: "#F5B400",
    Punt: "#F07C4A",
    "Field goal": "#F0E24A",
    "Two point": "#F0904A",
    "Onside kick": "#E0C07B",
    Touchdown: "#05E5AD",
    Turnover: "#DC2626",
    "Explosive play": "#FD9038",
    Penalty: "#DE4EA8",
    "Big loss": "#A84EDE",
    "Red zone entry": "#DE4E6B",
    Blitz: "#C4A0F0",
    Interception: "#DE4EB0",
    "Sack (defense)": "#9C7BD4",
    "Coverage breakdown": "#DE7BA8",
    "Missed tackle": "#D47B9C",
    "3rd down": "#4A9EDE",
    "4th down": "#4A9EDE",
    "Goal line": "#4ADEC4",
    "2-minute drill": "#E85A4F",
    "Highlight play": "#F0D74A",
    "Coach flag": "#F07A4A",
    Injury: "#F05A5A",
    Substitution: "#A0B0C0",
  });
});

test("football rows can match multiple independent catalog filters", () => {
  const keys = getTimelineRowTagTypeKeys(
    buildRow({
      action: "pass_complete",
      context: { down: "3", highlight: "true" },
      primaryDetail: "3rd & 6",
      result: "Touchdown",
    }),
    "american-football"
  );

  assert.ok(keys.includes("passComplete"));
  assert.ok(keys.includes("touchdown"));
  assert.ok(keys.includes("thirdDown"));
  assert.ok(keys.includes("highlight"));
});

test("unknown football tag values remain available as observed filters", () => {
  const [option] = buildTimelineTagTypeOptions(
    [
      buildRow({
        action: "custom_trick_play",
        result: "--",
      }),
    ],
    "american-football"
  ).filter((currentOption) => currentOption.key === "observed:custom trick play");

  assert.equal(option?.label, "Custom Trick Play");
  assert.equal(option?.group, "Observed tags");
});
