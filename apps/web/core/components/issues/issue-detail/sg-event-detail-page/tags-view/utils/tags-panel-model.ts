import type { SgTagRow, SgTagRowEditPayload, SportTableConfig, SportTableKind } from "../../types";
import { formatLooseLabel, parseTimecodeToSeconds } from "../../utils";

const CONTEXT_COLUMN_PREFIX = "context:";

export const getContextColumnKey = (key: string) => `${CONTEXT_COLUMN_PREFIX}${key}`;

export const STANDARD_RAW_TAG_COLUMNS = [
  { key: "sport", label: "Sport", width: "minmax(130px, 0.85fr)" },
  { key: "quarter", label: "Quarter", width: "minmax(120px, 0.8fr)" },
  { key: "distance", label: "Distance", width: "minmax(110px, 0.75fr)" },
  { key: "down", label: "Down", width: "minmax(96px, 0.65fr)" },
  { key: "drive_number", label: "Drive Number", width: "minmax(140px, 0.9fr)" },
  { key: "game_clock_seconds", label: "Game Clock Seconds", width: "minmax(170px, 1.05fr)" },
  { key: "period", label: "Period", width: "minmax(110px, 0.75fr)" },
  { key: "play_number", label: "Play Number", width: "minmax(130px, 0.85fr)" },
  { key: "possession_team", label: "Possession Team", width: "minmax(165px, 1fr)" },
  { key: "primary_actor_number", label: "Primary Actor Number", width: "minmax(185px, 1.1fr)" },
  { key: "qb", label: "Qb", width: "minmax(120px, 0.8fr)" },
  { key: "rosters", label: "Rosters", width: "minmax(130px, 0.85fr)" },
  { key: "score_away", label: "Score Away", width: "minmax(130px, 0.85fr)" },
  { key: "score_home", label: "Score Home", width: "minmax(130px, 0.85fr)" },
  { key: "yard_line", label: "Yard Line", width: "minmax(125px, 0.8fr)" },
  { key: "yards_gained", label: "Yards Gained", width: "minmax(140px, 0.9fr)" },
  { key: "home_team", label: "Home Team", width: "minmax(140px, 0.9fr)" },
  { key: "away_team", label: "Away Team", width: "minmax(140px, 0.9fr)" },
  { key: "field_position", label: "Field Position", width: "minmax(150px, 0.95fr)" },
  { key: "play_type", label: "Play Type", width: "minmax(135px, 0.9fr)" },
  { key: "formation", label: "Formation", width: "minmax(130px, 0.85fr)" },
  { key: "personnel", label: "Personnel", width: "minmax(130px, 0.85fr)" },
  { key: "coverage", label: "Coverage", width: "minmax(130px, 0.85fr)" },
  { key: "blitz", label: "Blitz", width: "minmax(96px, 0.65fr)" },
  { key: "penalty", label: "Penalty", width: "minmax(130px, 0.85fr)" },
  { key: "penalty_yards", label: "Penalty Yards", width: "minmax(145px, 0.9fr)" },
] as const;

export const STANDARD_RAW_TAG_CONTEXT_KEYS: ReadonlySet<string> = new Set(
  STANDARD_RAW_TAG_COLUMNS.map((column) => column.key)
);

export const DEFAULT_VISIBLE_COLUMN_KEYS = [
  "duration",
  "player",
  "groupValue",
  "action",
  "primaryDetail",
  "result",
  "team",
  "timecode",
  "clipId",
  "sourceTagId",
  "playlistTimestamp",
  ...STANDARD_RAW_TAG_COLUMNS.map((column) => getContextColumnKey(column.key)),
];

export const COLUMN_GROUP_ORDER = ["Core", "Sport", "Source", "Raw tag data"] as const;

export type SgTagColumnGroup = (typeof COLUMN_GROUP_ORDER)[number];

export type SgTagColumn = {
  getValue: (row: SgTagRow) => string;
  group: SgTagColumnGroup;
  isDefaultVisible?: boolean;
  key: string;
  label: string;
  width: string;
};

const BASKETBALL_FALLBACK_DURATION_SECONDS = 5;

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  return [minutes, remainingSeconds].map((value) => String(value).padStart(2, "0")).join(":");
};

export const getClipDuration = (row: SgTagRow, sport: SportTableKind) => {
  if (
    typeof row.clipDurationSeconds === "number" &&
    Number.isFinite(row.clipDurationSeconds) &&
    row.clipDurationSeconds > 0
  ) {
    return formatDuration(row.clipDurationSeconds);
  }

  if (
    row.clipRangeSource !== "timecode" &&
    row.clipStartSeconds !== null &&
    row.clipEndSeconds !== null &&
    row.clipEndSeconds > row.clipStartSeconds
  ) {
    return formatDuration(row.clipEndSeconds - row.clipStartSeconds);
  }

  const rangeParts = row.timecode.split(/\s*[-\u2013\u2014]\s*/).filter(Boolean);
  if (rangeParts.length >= 2) {
    const start = parseTimecodeToSeconds(rangeParts[0]);
    const end = parseTimecodeToSeconds(rangeParts[1]);

    if (start !== null && end !== null && end > start) {
      return formatDuration(end - start);
    }
  }

  if (sport === "basketball") {
    return formatDuration(BASKETBALL_FALLBACK_DURATION_SECONDS);
  }

  return "--";
};

export const getDisplayTimecode = (row: SgTagRow, sport: SportTableKind) => {
  if (row.timecode && row.timecode !== "--") return row.timecode;
  if (sport === "basketball" && row.primaryDetail && row.primaryDetail !== "--") {
    return `Game ${row.primaryDetail}`;
  }

  return "--";
};

export const displayCellValue = (value: string) => (value && value !== "--" ? value : "--");

export const getContextKeyFromColumnKey = (key: string) => key.slice(CONTEXT_COLUMN_PREFIX.length);

export const formatColumnLabel = (key: string) => formatLooseLabel(key.replace(/_/g, " "));

const getStableRawColumnNumber = (row: SgTagRow, key: string) => {
  const seed = [row.sourceTagId, row.clipId, row.id, row.timecode, row.action, key].filter(Boolean).join("|");
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const getRealCellValue = (value: string | null | undefined) => (value && value !== "--" ? value : "");

const getFallbackTeamValue = (row: SgTagRow, hash: number) => getRealCellValue(row.team) || `Team ${(hash % 2) + 1}`;

export const getSportLabel = (sport: SportTableConfig["sport"]) =>
  sport === "american-football" ? "American Football" : formatColumnLabel(sport);

const buildFakeRawTagValue = (row: SgTagRow, key: string, label: string, sportLabel: string) => {
  const hash = getStableRawColumnNumber(row, key);
  const teamValue = getFallbackTeamValue(row, hash);

  switch (key) {
    case "sport":
      return sportLabel;
    case "quarter":
      return getRealCellValue(row.groupValue) || `Quarter ${(hash % 4) + 1}`;
    case "distance":
      return String((hash % 20) + 1);
    case "down":
      return String((hash % 4) + 1);
    case "drive_number":
      return String((hash % 16) + 1);
    case "game_clock_seconds":
      return String((hash % 900) + 1);
    case "period":
      return getRealCellValue(row.matrixPeriod) || getRealCellValue(row.groupValue) || String((hash % 4) + 1);
    case "play_number":
      return String((hash % 160) + 1);
    case "possession_team":
      return teamValue;
    case "primary_actor_number":
      return String((hash % 99) + 1);
    case "qb":
      return getRealCellValue(row.player) || `QB ${(hash % 99) + 1}`;
    case "rosters":
      return `Roster ${(hash % 6) + 1}`;
    case "score_away":
    case "score_home":
      return String(hash % 45);
    case "yard_line":
      return String((hash % 50) + 1);
    case "yards_gained":
      return String((hash % 31) - 10);
    case "home_team":
      return `Home ${teamValue}`;
    case "away_team":
      return `Away Team ${(hash % 2) + 1}`;
    case "field_position":
      return `${teamValue} ${(hash % 50) + 1}`;
    case "play_type":
      return getRealCellValue(row.action) || `Play Type ${(hash % 12) + 1}`;
    case "formation":
      return `Formation ${(hash % 8) + 1}`;
    case "personnel":
      return `${(hash % 3) + 1}${(hash % 4) + 1} personnel`;
    case "coverage":
      return `Coverage ${(hash % 6) + 1}`;
    case "blitz":
      return hash % 2 === 0 ? "Yes" : "No";
    case "penalty":
      return hash % 3 === 0 ? "Holding" : "None";
    case "penalty_yards":
      return hash % 3 === 0 ? "5" : "0";
    default:
      return `${label} ${(hash % 100) + 1}`;
  }
};

export const getRawTagColumnValue = (row: SgTagRow, key: string, label: string, sportLabel: string) =>
  getRealCellValue(row.context[key]) || buildFakeRawTagValue(row, key, label, sportLabel);

export const buildEditDraft = (row: SgTagRow): SgTagRowEditPayload => ({
  action: row.action,
  groupValue: row.groupValue,
  player: row.player,
  primaryDetail: row.primaryDetail,
  result: row.result,
  secondaryDetail: row.secondaryDetail,
  team: row.team,
  timecode: row.timecode,
});
