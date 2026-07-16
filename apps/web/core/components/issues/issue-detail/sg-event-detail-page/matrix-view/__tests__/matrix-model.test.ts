import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping test runner requires explicit TypeScript extensions.
// @ts-expect-error See comment above.
import { findExactRawTagFieldValue } from "../../raw-tag-fields.ts";
// Node's type-stripping test runner requires explicit TypeScript extensions.
// @ts-expect-error See comment above.
import * as sportMatrixConfig from "../config/sport-matrix-config.ts";
import type { MatrixSourceTag } from "../types/matrix.types";
// @ts-expect-error See comment above.
import { buildMatrixData, orientMatrixData, transposeMatrixData } from "../utils/build-matrix-data.ts";
// @ts-expect-error See comment above.
import * as matrixFilters from "../utils/matrix-filters.ts";
// @ts-expect-error See comment above.
import * as matrixSelection from "../utils/matrix-selection.ts";
// @ts-expect-error See comment above.
import { getMatrixColumnVirtualRange, MATRIX_COLUMN_WIDTH } from "../utils/matrix-virtualization.ts";

const {
  SPORT_MATRIX_CONFIGS,
  SUPPORTED_MATRIX_SPORTS,
  getSportMatrixConfig,
  normalizeMatrixSport,
  resolveSportMatrixConfig,
} = sportMatrixConfig;
const {
  buildMatrixFilterOptions,
  clearMatrixFilters,
  createEmptyMatrixFilters,
  filterMatrixSourceTags,
  hasActiveMatrixFilters,
} = matrixFilters;
const {
  clearMatrixCellSelection,
  getSelectedMatrixClipIds,
  getSelectedMatrixSourceRowIds,
  getSelectedMatrixTagIds,
  pruneMatrixCellSelection,
  toggleMatrixCellSelection,
} = matrixSelection;

const footballConfig = SPORT_MATRIX_CONFIGS["american-football"];

test("matrix column virtualization preserves small tables and windows wide horizontal axes", () => {
  assert.deepEqual(
    getMatrixColumnVirtualRange({ columnCount: 17, scrollLeft: 800, viewportWidth: 1024, virtualize: false }),
    { end: 17, start: 0 }
  );

  const initialRange = getMatrixColumnVirtualRange({
    columnCount: 300,
    scrollLeft: 0,
    viewportWidth: 1024,
    virtualize: true,
  });
  assert.deepEqual(initialRange, { end: 23, start: 0 });

  const middleRange = getMatrixColumnVirtualRange({
    columnCount: 300,
    scrollLeft: MATRIX_COLUMN_WIDTH * 140,
    viewportWidth: 1024,
    virtualize: true,
  });
  assert.deepEqual(middleRange, { end: 163, start: 137 });
  assert.ok(middleRange.end - middleRange.start < 30, "wide matrices should render a bounded column window");

  const finalRange = getMatrixColumnVirtualRange({
    columnCount: 300,
    scrollLeft: MATRIX_COLUMN_WIDTH * 299,
    viewportWidth: 1024,
    virtualize: true,
  });
  assert.equal(finalRange.end, 300);
  assert.ok(finalRange.start < finalRange.end);
});

const footballTags: MatrixSourceTag[] = [
  {
    id: "row-1",
    sourceTagId: "tag-1",
    clipId: "clip-1",
    action: "pass_complete",
    player: "A. Nelson",
    team: "Offense",
    groupValue: "Quarter 1",
    sourceUrl: "https://media.test/clip-1.m3u8",
  },
  {
    id: "row-2",
    clipId: "clip-1",
    action: "Pass Complete",
    player: "A. Nelson",
    team: "Offense",
    groupValue: "Quarter 1",
  },
  {
    id: "row-3",
    sourceTagId: "tag-3",
    action: "mystery_code",
    player: "B. Helper",
    team: "Defense",
    groupValue: "Quarter 2",
  },
  {
    id: "row-4",
    sourceTagId: "tag-4",
    action: "field_goal",
    player: "B. Helper",
    team: "Special",
    groupValue: "Quarter 2",
  },
  {
    id: "row-5",
    sourceTagId: "tag-5",
    action: "pass_incomplete",
    player: "--",
    team: "Offense",
    groupValue: "Quarter 3",
  },
];

const findRow = (matrix: ReturnType<typeof buildMatrixData>, label: string) => {
  const row = matrix.rows.find((candidate) => candidate.label === label);
  assert.ok(row, `Expected row ${label}`);
  return row;
};

const findColumn = (matrix: ReturnType<typeof buildMatrixData>, label: string) => {
  const column = matrix.columns.find((candidate) => candidate.label === label);
  assert.ok(column, `Expected column ${label}`);
  return column;
};

test("exact raw tag fields accept normalized spellings without fuzzy participant or clip matches", () => {
  const rawTag = {
    clipId: "clip-top-level",
    player_position: "Quarterback",
    thumbnail_url: "https://media.test/thumb.jpg",
    data: [
      { tag: "player_name_suffix", value: "Jr." },
      { tag: "Primary Actor", value: "A. Nelson" },
      { tag: "source_clip_id", value: "wrong-clip" },
    ],
  };

  assert.equal(findExactRawTagFieldValue(rawTag, ["clip_id"]), "clip-top-level");
  assert.equal(findExactRawTagFieldValue(rawTag, ["thumbnail_url"]), "https://media.test/thumb.jpg");
  assert.equal(
    findExactRawTagFieldValue(rawTag, ["player", "player_name", "athlete", "athlete_name", "primary_actor"]),
    "A. Nelson"
  );
  assert.equal(findExactRawTagFieldValue({ player_position: "Quarterback" }, ["player"]), "");
  assert.equal(findExactRawTagFieldValue({ source_clip_id: "wrong-clip" }, ["clip_id"]), "");
  assert.equal(
    findExactRawTagFieldValue({ data: [{ fieldName: "thumbnailUrl", fieldValue: "nested-thumb.jpg" }] }, [
      "thumbnail_url",
    ]),
    "nested-thumb.jpg"
  );
});

test("buildMatrixData creates zero-filled cells, explicit ids, totals, averages, and appended actions", () => {
  const original = structuredClone(footballTags);
  const matrix = buildMatrixData(footballTags, footballConfig);

  assert.deepEqual(footballTags, original, "source tags must not be mutated");
  assert.equal(matrix.orientation, "entities-by-actions");
  assert.equal(matrix.sourceTagCount, 5);
  assert.deepEqual(
    matrix.entities.map((entity) => [entity.label, entity.dimension]),
    [
      ["Defense", "team"],
      ["Offense", "team"],
      ["Special", "team"],
      ["Quarter 1", "period"],
      ["Quarter 2", "period"],
      ["Quarter 3", "period"],
      ["A. Nelson", "player"],
      ["B. Helper", "player"],
      ["Unassigned", "unassigned"],
    ]
  );
  assert.equal(matrix.actions.length, footballConfig.actions.length + 1);
  assert.equal(matrix.actions.at(-1)?.label, "Mystery Code");
  assert.equal(Object.keys(matrix.cells).length, matrix.entities.length * matrix.actions.length);

  const nelson = findRow(matrix, "A. Nelson");
  const passComplete = findColumn(matrix, "Pass Complete");
  const passCell = nelson.cells[passComplete.id];
  assert.equal(passCell.count, 2);
  assert.deepEqual(passCell.sourceRowIds, ["row-1", "row-2"]);
  assert.deepEqual(passCell.tagIds, ["tag-1", "row-2"]);
  assert.deepEqual(passCell.sourceUrls, ["https://media.test/clip-1.m3u8"]);
  assert.deepEqual(passCell.clipIds, ["clip-1"]);
  assert.equal(nelson.total, 2);
  assert.equal(nelson.average, 2);
  assert.equal(findRow(matrix, "B. Helper").average, 1);

  const zeroCell = nelson.cells[findColumn(matrix, "Touchdown").id];
  assert.equal(zeroCell.count, 0);
  assert.deepEqual(zeroCell.sourceRowIds, []);

  const grandTotal = matrix.rows.reduce((sum, row) => sum + row.total, 0);
  assert.equal(grandTotal, 15, "rollups and a metric fallback retain every explicit source membership");
  assert.deepEqual(
    matrix.entities.filter((entity) => entity.isMetric).map((entity) => entity.label),
    ["A. Nelson", "B. Helper", "Unassigned"]
  );
});

test("sport configs expose exactly the requested sports, columns, ordering, aliases, and priorities", () => {
  assert.deepEqual(SUPPORTED_MATRIX_SPORTS, ["american-football", "cricket", "basketball", "baseball", "soccer"]);
  assert.deepEqual(
    footballConfig.actions.map((action) => action.label),
    [
      "Pass Complete",
      "Pass Incomplete",
      "Run",
      "Sack",
      "Field Goal",
      "Punt",
      "Kickoff",
      "Two Point",
      "Penalty",
      "Turnover",
      "Interception",
      "First Down",
      "Touchdown",
      "Fumble",
      "Blocked",
      "Offside",
      "Holding",
    ]
  );
  assert.deepEqual(footballConfig.rowDimensionPriority, ["team", "period", "player"]);
  const expectedColumns = {
    cricket: [
      "Dot Ball",
      "Single",
      "Two Runs",
      "Three Runs",
      "Four",
      "Six",
      "Wide",
      "No Ball",
      "Bye",
      "Leg Bye",
      "Wicket",
      "Run Out",
      "End Over",
      "End Innings",
    ],
    basketball: [
      "Two Point Made",
      "Two Point Missed",
      "Three Point Made",
      "Three Point Missed",
      "Free Throw",
      "Rebound",
      "Assist",
      "Steal",
      "Block",
      "Foul",
      "Turnover",
    ],
    baseball: [
      "Single",
      "Double",
      "Triple",
      "Home Run",
      "Strikeout",
      "Walk",
      "Hit by Pitch",
      "Stolen Base",
      "Error",
      "Run",
      "RBI",
    ],
    soccer: [
      "Goal",
      "Shot",
      "Shot on Target",
      "Pass",
      "Assist",
      "Tackle",
      "Interception",
      "Save",
      "Corner",
      "Foul",
      "Yellow Card",
      "Red Card",
      "Offside",
    ],
  } as const;
  Object.entries(expectedColumns).forEach(([sport, labels]) => {
    assert.deepEqual(
      SPORT_MATRIX_CONFIGS[sport as keyof typeof SPORT_MATRIX_CONFIGS].actions.map((action) => action.label),
      labels
    );
  });
  assert.ok(
    footballConfig.actions.find((action) => action.label === "Pass Complete")?.aliases.includes("pass_complete")
  );
  assert.ok(footballConfig.actions.find((action) => action.label === "Two Point")?.aliases.includes("two_point_conv"));
  assert.ok(
    SPORT_MATRIX_CONFIGS.cricket.actions.find((action) => action.label === "Four")?.aliases.includes("boundary_four")
  );
  assert.ok(
    SPORT_MATRIX_CONFIGS.basketball.actions
      .find((action) => action.label === "Two Point Made")
      ?.aliases.includes("field_goal_made_2")
  );
  assert.ok(
    SPORT_MATRIX_CONFIGS.basketball.actions
      .find((action) => action.label === "Two Point Missed")
      ?.aliases.includes("field_goal_attempt_2")
  );
  Object.values(SPORT_MATRIX_CONFIGS).forEach((config) => {
    assert.deepEqual(config.metricDimensionPriority, ["player", "team", "period"]);
    assert.deepEqual(
      config.actions.map((action) => action.order),
      config.actions.map((_, index) => index)
    );
    assert.ok(config.actions.every((action) => action.category && action.color && action.visible));
  });
});

test("explicit aliases and context rules canonicalize codes without inferring unavailable outcomes", () => {
  const cricket = buildMatrixData(
    [
      { id: "c1", action: "boundary_four", player: "Batter" },
      { id: "c2", action: "runs_scored", player: "Batter" },
      { id: "c3", action: "runs_scored", context: { exact_runs: "1" }, player: "Batter" },
    ],
    SPORT_MATRIX_CONFIGS.cricket
  );
  assert.equal(findRow(cricket, "Batter").cells[findColumn(cricket, "Four").id].count, 1);
  assert.equal(findRow(cricket, "Batter").cells[findColumn(cricket, "Single").id].count, 1);
  assert.equal(findRow(cricket, "Batter").cells[findColumn(cricket, "Runs Scored").id].count, 1);

  const basketball = buildMatrixData(
    [
      { id: "b1", action: "field_goal_made_2", player: "Guard" },
      { id: "b2", action: "field_goal_attempt_2", player: "Guard" },
      { id: "b3", action: "field_goal_attempt_2", context: { shot_result: "missed" }, player: "Guard" },
    ],
    SPORT_MATRIX_CONFIGS.basketball
  );
  assert.equal(findRow(basketball, "Guard").cells[findColumn(basketball, "Two Point Made").id].count, 1);
  assert.equal(findRow(basketball, "Guard").cells[findColumn(basketball, "Two Point Missed").id].count, 2);
  assert.equal(
    basketball.actions.some((action) => action.label === "Field Goal Attempt 2"),
    false
  );

  const football = buildMatrixData(
    [{ id: "f1", action: "pass_complete", context: { touchdown: "true" }, team: "Home" }],
    footballConfig
  );
  assert.equal(findRow(football, "Home").cells[findColumn(football, "Pass Complete").id].count, 1);
  assert.equal(findRow(football, "Home").cells[findColumn(football, "Touchdown").id].count, 1);
});

test("orientation transposes the same canonical cells and recomputes action totals and averages", () => {
  const canonical = buildMatrixData(footballTags, footballConfig);
  const transposed = orientMatrixData(canonical, "actions-by-entities");
  const passRow = findRow(transposed, "Pass Complete");
  const nelsonColumn = findColumn(transposed, "A. Nelson");
  const offenseColumn = findColumn(transposed, "Offense");
  const transposedCell = passRow.cells[nelsonColumn.id];
  const canonicalCell = findRow(canonical, "A. Nelson").cells[findColumn(canonical, "Pass Complete").id];

  assert.equal(transposed.orientation, "actions-by-entities");
  assert.equal(transposed.cells, canonical.cells);
  assert.equal(transposedCell, canonicalCell);
  assert.equal(transposedCell.id, canonicalCell.id);
  assert.equal(passRow.cells[offenseColumn.id].count, 2, "rollup cells remain visible");
  assert.equal(passRow.total, 2);
  assert.equal(passRow.average, 2);

  const restored = transposeMatrixData(transposed);
  assert.equal(restored.orientation, "entities-by-actions");
  assert.equal(restored.cells, canonical.cells);
  assert.deepEqual(
    restored.rows.map((row) => [row.id, row.total, row.average]),
    canonical.rows.map((row) => [row.id, row.total, row.average])
  );
});

test("empty source data retains configured actions without fabricating entities or cells", () => {
  const matrix = buildMatrixData([], footballConfig);
  assert.equal(matrix.sourceTagCount, 0);
  assert.deepEqual(matrix.entities, []);
  assert.deepEqual(matrix.rows, []);
  assert.equal(matrix.actions.length, footballConfig.actions.length);
  assert.deepEqual(matrix.cells, {});
});

test("filter options and filters use only explicit tag fields and canonical action categories", () => {
  const tags: MatrixSourceTag[] = [
    { id: "1", action: "field_goal_made_2", player: "Asha", team: "Home", groupValue: "Q1" },
    { id: "2", action: "steal", player: "Bea", team: "Away", groupValue: "Q2" },
    { id: "3", action: "custom_hustle", player: "Asha", team: "Home", groupValue: "Q2" },
  ];
  const config = SPORT_MATRIX_CONFIGS.basketball;
  const options = buildMatrixFilterOptions(tags, config);
  assert.deepEqual(
    options.teams.map((option) => option.value),
    ["Away", "Home"]
  );
  assert.deepEqual(
    options.players.map((option) => option.value),
    ["Asha", "Bea"]
  );
  assert.deepEqual(
    options.periods.map((option) => option.value),
    ["Q1", "Q2"]
  );
  assert.deepEqual(
    options.categories.map((option) => option.value),
    ["scoring", "defense", "other"]
  );

  assert.deepEqual(
    filterMatrixSourceTags(tags, { ...createEmptyMatrixFilters(), teams: ["HOME"] }, config).map((tag) => tag.id),
    ["1", "3"]
  );
  assert.deepEqual(
    filterMatrixSourceTags(tags, { ...createEmptyMatrixFilters(), categories: ["defense"] }, config).map(
      (tag) => tag.id
    ),
    ["2"]
  );
  assert.deepEqual(
    filterMatrixSourceTags(tags, { ...createEmptyMatrixFilters(), search: "made" }, config).map((tag) => tag.id),
    ["1"]
  );
  assert.deepEqual(
    filterMatrixSourceTags(tags, { ...createEmptyMatrixFilters(), search: "custom hustle" }, config).map(
      (tag) => tag.id
    ),
    ["3"]
  );
  assert.equal(hasActiveMatrixFilters(createEmptyMatrixFilters()), false);
  assert.equal(hasActiveMatrixFilters({ ...createEmptyMatrixFilters(), periods: ["Q2"] }), true);
  assert.deepEqual(clearMatrixFilters(), createEmptyMatrixFilters());
});

test("cell selection supports multiple non-empty cells, pruning, clearing, and source id deduplication", () => {
  const matrix = buildMatrixData(footballTags, footballConfig);
  const nelson = findRow(matrix, "A. Nelson");
  const helper = findRow(matrix, "B. Helper");
  const passCell = nelson.cells[findColumn(matrix, "Pass Complete").id];
  const fieldGoalCell = helper.cells[findColumn(matrix, "Field Goal").id];
  const zeroCell = nelson.cells[findColumn(matrix, "Touchdown").id];

  let selection = clearMatrixCellSelection();
  selection = toggleMatrixCellSelection(selection, zeroCell);
  assert.deepEqual(selection, []);
  selection = toggleMatrixCellSelection(selection, passCell);
  selection = toggleMatrixCellSelection(selection, fieldGoalCell);
  assert.deepEqual(selection, [passCell.id, fieldGoalCell.id]);
  assert.deepEqual(getSelectedMatrixSourceRowIds(selection, matrix), ["row-1", "row-2", "row-4"]);
  assert.deepEqual(getSelectedMatrixTagIds(selection, matrix), ["tag-1", "row-2", "tag-4"]);
  assert.deepEqual(getSelectedMatrixClipIds(selection, matrix), ["clip-1"]);
  assert.deepEqual(pruneMatrixCellSelection([...selection, "missing", zeroCell.id], matrix), selection);
  assert.deepEqual(toggleMatrixCellSelection(selection, passCell), [fieldGoalCell.id]);
});

test("unsupported sports resolve explicitly instead of falling back", () => {
  assert.equal(normalizeMatrixSport("Football"), "american-football");
  assert.equal(normalizeMatrixSport("NCAA American Football"), "american-football");
  assert.equal(normalizeMatrixSport("association football"), "soccer");
  assert.equal(normalizeMatrixSport("U18 Association Football"), "soccer");
  assert.equal(getSportMatrixConfig("ice hockey"), null);
  assert.deepEqual(resolveSportMatrixConfig(" Ice Hockey "), {
    input: " Ice Hockey ",
    normalizedInput: "ice-hockey",
    sport: null,
    config: null,
    isSupported: false,
  });
});

test("entity ordering keeps numbered periods in chronological order", () => {
  const matrix = buildMatrixData(
    [
      { id: "q10", action: "run", groupValue: "Quarter 10" },
      { id: "q2", action: "run", groupValue: "Quarter 2" },
      { id: "q1", action: "run", groupValue: "Quarter 1" },
    ],
    footballConfig
  );
  assert.deepEqual(
    matrix.entities.map((entity) => entity.label),
    ["Quarter 1", "Quarter 2", "Quarter 10"]
  );
});
