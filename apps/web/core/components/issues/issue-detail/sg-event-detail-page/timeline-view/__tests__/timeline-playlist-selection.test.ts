import assert from "node:assert/strict";
import test from "node:test";
import type { SgTagRow } from "../../types";

// Node's type-stripping test runner requires explicit TypeScript extensions.
// @ts-expect-error See comment above.
import { getTimelinePlaylistRows } from "../utils/timeline-playlist-selection.ts";

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

test("timeline playlist rows include selected playable rows in chronological order", () => {
  const rows = [
    buildRow({ clipStartSeconds: 18, id: "late", playlistTimestamp: "00:18-00:24" }),
    buildRow({ clipStartSeconds: 5, id: "early", playlistTimestamp: "00:05-00:12" }),
    buildRow({ clipStartSeconds: 12, id: "middle", playlistTimestamp: "00:12-00:20" }),
  ];

  assert.deepEqual(
    getTimelinePlaylistRows(rows, ["middle", "late", "early"]).map((row) => row.id),
    ["early", "middle", "late"]
  );
});

test("timeline playlist rows ignore unselected, duplicate, and unplayable rows", () => {
  const rows = [
    buildRow({ id: "selected", playlistTimestamp: "00:10-00:16" }),
    buildRow({ id: "selected", playlistTimestamp: "00:10-00:16" }),
    buildRow({ id: "unselected", playlistTimestamp: "00:20-00:26" }),
    buildRow({ id: "unplayable", playlistTimestamp: null, playlistFallbackTimestamp: null }),
  ];

  assert.deepEqual(
    getTimelinePlaylistRows(rows, ["selected", "unplayable"]).map((row) => row.id),
    ["selected"]
  );
});

test("timeline playlist rows can sort by fallback timestamp when clip start is missing", () => {
  const rows = [
    buildRow({ id: "second", playlistFallbackTimestamp: "00:09-00:14" }),
    buildRow({ id: "first", playlistTimestamp: "00:04-00:10" }),
  ];

  assert.deepEqual(
    getTimelinePlaylistRows(rows, ["second", "first"]).map((row) => row.id),
    ["first", "second"]
  );
});
