import type { TIssue } from "@plane/types";
import { parseOppositionTeam } from "@/helpers/opposition-team";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import { formatDateValue, formatTimeValue } from "ce/features/media-library/utils/media-detail-utils";
import type { TEventMediaDetails } from "ce/features/media-library/utils/media-event";
import { SPORT_TABLE_CONFIGS } from "./constants";
import type { SgTagRow, SportTableKind } from "./types";

export const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

export const firstNonEmptyRecord = (...values: unknown[]): Record<string, unknown> | null => {
  for (const value of values) {
    const record = asRecord(value);
    if (Object.keys(record).length > 0) {
      return record;
    }
  }

  return null;
};

export const getCpServerBaseUrl = () => process.env.NEXT_PUBLIC_CP_SERVER_URL?.replace(/\/$/, "") ?? "";

export const getArchivedHlsBaseUrl = () => {
  const explicitBaseUrl = process.env.NEXT_PUBLIC_HLS_SERVER_URL?.trim() || "";
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "");
  }

  return process.env.NEXT_PUBLIC_HLS_SERVER_URL;
};

export const toText = (value: unknown): string => {
  if (typeof value === "string") {
    const normalizedValue = value.trim();
    return normalizedValue || "";
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((entry): string => toText(entry))
      .filter(Boolean)
      .join(", ");
  }
  if (value && typeof value === "object" && "name" in (value as Record<string, unknown>)) {
    return toText((value as Record<string, unknown>).name);
  }
  return "";
};

export const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }
  return null;
};

type GatewayField = {
  field?: unknown;
  type?: unknown;
  value?: unknown;
};

const isGatewayField = (value: unknown): value is GatewayField =>
  Boolean(value) && typeof value === "object" && ("field" in (value as GatewayField) || "value" in (value as GatewayField));

const demodulateGatewayValue = (value: unknown, type: unknown): unknown => {
  if (Number(type) === 6 && Array.isArray(value)) {
    return value.map((entry) => demodulateGatewayEntry(entry));
  }

  return value;
};

const demodulateGatewayEntry = (entry: unknown): Record<string, unknown> => {
  if (Array.isArray(entry) && entry.every(isGatewayField)) {
    return entry.reduce<Record<string, unknown>>((accumulator, field) => {
      const fieldName = typeof field.field === "string" ? field.field : "";
      if (!fieldName) return accumulator;

      accumulator[fieldName] = demodulateGatewayValue(field.value, field.type);
      return accumulator;
    }, {});
  }

  return asRecord(entry);
};

export const parseGatewayRows = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((entry) => demodulateGatewayEntry(entry))
      .filter((entry) => Object.keys(entry).length > 0);
  }

  const gatewayResponse = asRecord(payload)["Gateway Response"];
  const result = asRecord(gatewayResponse).result;
  const rows = Array.isArray(result) ? result : [];

  return rows
    .map((entry) => demodulateGatewayEntry(entry))
    .filter((entry) => Object.keys(entry).length > 0);
};

export const buildArchivedStreamUrl = (streamName: string) => {
  const normalizedStreamName = streamName.trim().replace(/^\/+|\/+$/g, "");
  if (!normalizedStreamName) return null;

  return `${getArchivedHlsBaseUrl()}/${normalizedStreamName}/llhls.m3u8`;
};

export const buildArchivedPlaylistUrl = (playlistFileName: string) => {
  const normalizedFileName = playlistFileName.trim();
  if (!normalizedFileName) return null;

  return `${getArchivedHlsBaseUrl()}/${normalizedFileName}`;
};

export const formatLooseLabel = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

export const normalizeSportKey = (value: string | null | undefined): SportTableKind => {
  const normalizedValue = (value ?? "").trim().toLowerCase();
  if (!normalizedValue) return "default";
  if (normalizedValue.includes("american") && normalizedValue.includes("football")) return "american-football";
  if (normalizedValue === "football") return "american-football";
  if (normalizedValue.includes("baseball")) return "baseball";
  if (normalizedValue.includes("basketball")) return "basketball";
  if (normalizedValue.includes("cricket")) return "cricket";
  if (
    normalizedValue.includes("soccer") ||
    normalizedValue.includes("association football") ||
    normalizedValue.includes("association-football")
  ) {
    return "soccer";
  }
  return "default";
};

export const getSportTableConfig = (sport: string | null | undefined) =>
  SPORT_TABLE_CONFIGS[normalizeSportKey(sport)] ?? SPORT_TABLE_CONFIGS.default;

const toOrdinal = (value: string) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;
  const absoluteValue = Math.abs(numericValue);
  const remainder100 = absoluteValue % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${numericValue}th`;
  const remainder10 = absoluteValue % 10;
  if (remainder10 === 1) return `${numericValue}st`;
  if (remainder10 === 2) return `${numericValue}nd`;
  if (remainder10 === 3) return `${numericValue}rd`;
  return `${numericValue}th`;
};

const formatClockFromSeconds = (value: string) => {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const formatClockValue = (value: string) => {
  if (!value) return "";
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) return value;
  return formatClockFromSeconds(value);
};

export const pickText = (sources: Array<Record<string, unknown> | null | undefined>, keys: string[]) => {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = toText(source[key]);
      if (value) return value;
    }
  }
  return "";
};

const pickArray = (sources: Array<Record<string, unknown> | null | undefined>, keys: string[]) => {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = source[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
};

const normalizeQuarter = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();
  const match = normalizedValue.match(/(\d+)/);
  if (match?.[1]) return `Quarter ${match[1]}`;
  if (normalizedValue.startsWith("q")) return `Quarter ${normalizedValue.slice(1)}`;
  return formatLooseLabel(value) || "Quarter 1";
};

const normalizeBasketballQuarter = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();
  const match = normalizedValue.match(/(\d+)/);
  if (match?.[1]) {
    return normalizedValue.startsWith("ot") ? `OT${match[1]}` : `Q${match[1]}`;
  }
  if (normalizedValue.startsWith("q")) return value.trim().toUpperCase();
  if (normalizedValue.startsWith("ot")) return value.trim().toUpperCase();
  return formatLooseLabel(value) || "Q1";
};

const buildTimecode = (tag: Record<string, unknown>) => {
  const directTimecode = toText(
    tag.timecode ??
      tag.time_code ??
      tag.timeRange ??
      tag.time_range ??
      tag.video_timecode ??
      tag.videoTimecode
  );
  if (directTimecode) return directTimecode;

  const start = toText(tag.start ?? tag.clip_start ?? tag.video_timecode_clip_start ?? tag.start_timecode);
  const end = toText(tag.end ?? tag.clip_end ?? tag.video_timecode_clip_end ?? tag.end_timecode);
  if (start && end) return `${start}-${end}`;
  return start || end || "--";
};

const findTagDataValue = (tag: Record<string, unknown>, names: string[]) => {
  for (const name of names) {
    const directValue = toText(tag[name]);
    if (directValue) return directValue;
  }

  const dataEntries = asArray(tag.data);
  for (const entry of dataEntries) {
    const entryRecord = asRecord(entry);
    const tagName = toText(entryRecord.tag).toLowerCase().replace(/\s+/g, "_");
    const match = names.some((name) => tagName === name || tagName.includes(name));
    if (!match) continue;
    const tagValue = toText(entryRecord.value);
    if (tagValue) return tagValue;
  }

  return "";
};

const formatYardValue = (value: string) => {
  if (!value) return "--";
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    const sign = numericValue > 0 ? "+" : "";
    return `${sign}${numericValue} yd`;
  }
  return formatLooseLabel(value);
};

const formatFootballDownDistance = (down: string, distance: string) => {
  const normalizedDown = down ? toOrdinal(down) : "";
  const normalizedDistance = distance ? String(Number.isFinite(Number(distance)) ? Number(distance) : distance) : "";
  if (normalizedDown && normalizedDistance) return `${normalizedDown} & ${normalizedDistance}`;
  return normalizedDown || normalizedDistance || "--";
};

const formatBaseballInning = (half: string, inning: string) => {
  const normalizedHalf = half ? formatLooseLabel(half) : "";
  const normalizedInning = inning ? toOrdinal(inning) : "";
  if (normalizedHalf && normalizedInning) return `${normalizedHalf} ${normalizedInning}`;
  return normalizedHalf || normalizedInning || "--";
};

const formatBaseballCount = (balls: string, strikes: string, directCount: string) => {
  if (balls || strikes) {
    const normalizedBalls = balls || "0";
    const normalizedStrikes = strikes || "0";
    return `${normalizedBalls}-${normalizedStrikes}`;
  }
  return directCount || "--";
};

const formatBasketballValue = (value: string, result: string) => {
  if (value) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return `${numericValue} point${numericValue === 1 ? "" : "s"}`;
    }
    return formatLooseLabel(value);
  }
  return result || "--";
};

const formatCricketRuns = (value: string) => {
  if (!value) return "--";
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return `${numericValue} run${numericValue === 1 ? "" : "s"}`;
  }
  return formatLooseLabel(value);
};

const formatCricketOver = (displayValue: string, overNumber: string, ballInOver: string) => {
  if (displayValue) return displayValue;
  if (overNumber && ballInOver) return `${overNumber}.${ballInOver}`;
  if (overNumber) return `Over ${overNumber}`;
  return "";
};

export const parseTimecodeToSeconds = (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue || normalizedValue === "--") return null;
  const firstPart = normalizedValue.split("-")[0].trim();
  const parts = firstPart.split(":").map((part) => part.trim());
  if (parts.length < 2 || parts.length > 3) return null;

  const numericParts = parts.map((part) => Number(part));
  if (numericParts.some((part) => !Number.isFinite(part) || part < 0)) return null;

  if (numericParts.length === 2) {
    const [minutes, seconds] = numericParts;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = numericParts;
  return hours * 3600 + minutes * 60 + seconds;
};

const PLAYLIST_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}(?:[+-]\d{2}:\d{2}|Z)$/;
const CLOCK_ONLY_TIMESTAMP_REGEX = /^\d{2}:\d{2}:\d{2}$/;

export const normalizePlaylistTimestamp = (value: string, baseEventDateTime?: string | null) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  if (PLAYLIST_TIMESTAMP_REGEX.test(normalizedValue)) {
    return normalizedValue.endsWith("Z") ? normalizedValue.replace(/Z$/, "+00:00") : normalizedValue;
  }

  if (CLOCK_ONLY_TIMESTAMP_REGEX.test(normalizedValue) && baseEventDateTime) {
    const parsedBaseDate = Date.parse(baseEventDateTime);
    if (!Number.isNaN(parsedBaseDate)) {
      const [hours, minutes, seconds] = normalizedValue.split(":").map((part) => Number(part));
      const nextDate = new Date(parsedBaseDate);
      nextDate.setUTCHours(hours, minutes, seconds, 0);
      return nextDate.toISOString().replace(/Z$/, "+00:00");
    }
  }

  const parsedValue = Date.parse(normalizedValue);
  if (Number.isNaN(parsedValue)) return null;

  return new Date(parsedValue).toISOString().replace(/Z$/, "+00:00");
};

export const buildClockOnlyPlaylistTimestampFallback = (value: string, baseEventDateTime?: string | null) => {
  const normalizedValue = value.trim();
  if (!CLOCK_ONLY_TIMESTAMP_REGEX.test(normalizedValue) || !baseEventDateTime) {
    return null;
  }

  const parsedBaseDate = Date.parse(baseEventDateTime);
  if (Number.isNaN(parsedBaseDate)) {
    return null;
  }

  const [hours, minutes, seconds] = normalizedValue.split(":").map((part) => Number(part));
  const utcCandidate = new Date(parsedBaseDate);
  utcCandidate.setUTCHours(hours, minutes, seconds, 0);

  const diffMs = utcCandidate.getTime() - parsedBaseDate;
  if (Math.abs(diffMs) < 2 * 60 * 60 * 1000) {
    return null;
  }

  const inferredOffsetMs = Math.round(diffMs / (30 * 60 * 1000)) * 30 * 60 * 1000;
  const adjustedCandidate = new Date(utcCandidate.getTime() - inferredOffsetMs);

  return adjustedCandidate.toISOString().replace(/Z$/, "+00:00");
};

export const playlistHasMediaSegments = async (playlistUrl: string) => {
  try {
    const response = await fetch(`/api/hls?url=${encodeURIComponent(playlistUrl)}`, { cache: "no-store" });
    if (!response.ok) {
      return true;
    }

    const playlistText = await response.text();
    return playlistText
      .split(/\r?\n/)
      .some((line) => {
        const trimmedLine = line.trim();
        return Boolean(trimmedLine) && !trimmedLine.startsWith("#");
      });
  } catch {
    return true;
  }
};

const getTagSourceUrl = (tag: Record<string, unknown>) =>
  findTagDataValue(tag, [
    "playlist_url",
    "playlistUrl",
    "video_url",
    "videoUrl",
    "source_url",
    "sourceUrl",
    "media_url",
    "mediaUrl",
    "clip_url",
    "clipUrl",
    "url",
    "link",
    "path",
  ]);

const buildTagRowBySport = (
  tag: Record<string, unknown>,
  sport: SportTableKind,
  index: number,
  baseEventDateTime?: string | null
): SgTagRow | null => {
  const player =
    findTagDataValue(tag, [
      "player",
      "player_name",
      "athlete",
      "athlete_name",
      "primary_actor",
      "ball_handler",
      "striker",
      "batter",
      "pitcher",
      "scorer",
      "shooter",
      "jersey",
    ]) || "--";
  const action =
    findTagDataValue(tag, ["primary_action", "action", "event_code", "event", "play"]) ||
    formatLooseLabel(toText(tag.action || tag.event_code || tag.play));
  const result =
    findTagDataValue(tag, ["result", "outcome", "gain", "play_result", "shot_result", "delivery_result"]) ||
    formatLooseLabel(toText(tag.result || tag.outcome));
  const team =
    findTagDataValue(tag, ["team", "unit", "side", "batting_team", "fielding_team", "possession_team"]) ||
    formatLooseLabel(toText(tag.team || tag.unit));

  const groupQuarter = normalizeQuarter(
    toText(tag.quarter || tag.period || tag.phase || tag.segment || tag.group || "Quarter 1")
  );
  const timecode = buildTimecode(tag);
  const rawPlaylistTimestamp =
    findTagDataValue(tag, [
      "timestamp",
      "event_timestamp",
      "absolute_timestamp",
      "video_timestamp",
      "program_date_time",
      "program_datetime",
      "prog_date_time",
    ]) || toText(tag.timestamp);
  const playlistTimestamp = normalizePlaylistTimestamp(rawPlaylistTimestamp, baseEventDateTime);
  const playlistFallbackTimestamp = buildClockOnlyPlaylistTimestampFallback(rawPlaylistTimestamp, baseEventDateTime);
  const sourceUrl = getTagSourceUrl(tag);
  const clipStartSeconds = parseTimecodeToSeconds(
    findTagDataValue(tag, ["clip_start", "start", "video_timecode_clip_start", "start_timecode"]) || timecode
  );
  const clipEndSeconds = parseTimecodeToSeconds(
    findTagDataValue(tag, ["clip_end", "end", "video_timecode_clip_end", "end_timecode"]) || ""
  );

  let groupValue = SPORT_TABLE_CONFIGS.default.defaultGroupValue;
  let primaryDetail = "--";
  let secondaryDetail = "--";

  switch (sport) {
    case "american-football": {
      const down = findTagDataValue(tag, ["down", "down_number"]);
      const distance = findTagDataValue(tag, ["distance", "distance_yards", "yards_to_go", "to_go"]);
      const yards =
        findTagDataValue(tag, ["yard", "yards", "yards_gained", "gain_yards", "distance_gained"]) ||
        toText(tag.yard || tag.yards);
      groupValue = groupQuarter;
      primaryDetail = formatFootballDownDistance(down, distance);
      secondaryDetail = formatYardValue(yards);
      break;
    }
    case "baseball": {
      const inningNumber = findTagDataValue(tag, ["inning_number", "inning"]);
      const halfInning = findTagDataValue(tag, ["half_inning", "half", "inning_half"]);
      const balls = findTagDataValue(tag, ["balls"]);
      const strikes = findTagDataValue(tag, ["strikes"]);
      const count = findTagDataValue(tag, ["count", "pitch_count"]);
      const inningDisplay = formatBaseballInning(halfInning, inningNumber);
      groupValue = inningDisplay !== "--" ? inningDisplay : SPORT_TABLE_CONFIGS.baseball.defaultGroupValue;
      primaryDetail = inningDisplay;
      secondaryDetail = formatBaseballCount(balls, strikes, count);
      break;
    }
    case "soccer": {
      const phase =
        findTagDataValue(tag, ["half", "period", "phase"]) || formatLooseLabel(toText(tag.period || tag.phase));
      const matchTime =
        findTagDataValue(tag, ["match_time", "match_clock", "game_clock", "clock", "minute"]) ||
        formatClockValue(findTagDataValue(tag, ["game_clock_seconds"])) ||
        "--";
      const zone = findTagDataValue(tag, ["zone", "shot_zone", "field_zone", "area", "field_position"]) || "--";
      groupValue = phase || SPORT_TABLE_CONFIGS.soccer.defaultGroupValue;
      primaryDetail = matchTime;
      secondaryDetail = zone !== "--" ? formatLooseLabel(zone) : zone;
      break;
    }
    case "basketball": {
      const periodValue = findTagDataValue(tag, ["period", "quarter"]);
      const clockValue =
        findTagDataValue(tag, ["game_clock", "clock", "game_clock_display"]) ||
        formatClockValue(findTagDataValue(tag, ["game_clock_seconds"]));
      const points =
        findTagDataValue(tag, ["points_or_runs_scored", "points", "shot_value", "point_value"]) ||
        findTagDataValue(tag, ["score_value"]);
      const quarterLabel = normalizeBasketballQuarter(periodValue || "Q1");
      groupValue = quarterLabel;
      primaryDetail = [quarterLabel, clockValue].filter(Boolean).join(" ") || quarterLabel;
      secondaryDetail = formatBasketballValue(points, result);
      break;
    }
    case "cricket": {
      const overDisplay = findTagDataValue(tag, ["over_display", "over"]);
      const overNumber = findTagDataValue(tag, ["over_number"]);
      const ballInOver = findTagDataValue(tag, ["ball_in_over"]);
      const overValue = formatCricketOver(overDisplay, overNumber, ballInOver);
      const runs = findTagDataValue(tag, ["runs_scored", "points_or_runs_scored", "runs", "run_value"]);
      groupValue = overValue ? `Over ${overValue}` : SPORT_TABLE_CONFIGS.cricket.defaultGroupValue;
      primaryDetail = overValue || "--";
      secondaryDetail = formatCricketRuns(runs);
      break;
    }
    default: {
      const phase = formatLooseLabel(toText(tag.quarter || tag.period || tag.phase || tag.segment));
      const value =
        findTagDataValue(tag, ["value", "score_value", "points_or_runs_scored"]) ||
        findTagDataValue(tag, ["count", "zone", "yard", "yards"]);
      groupValue = phase || SPORT_TABLE_CONFIGS.default.defaultGroupValue;
      primaryDetail = phase || "--";
      secondaryDetail = value ? formatLooseLabel(value) : "--";
      break;
    }
  }

  const normalizedAction = action || "--";
  const normalizedPlayer = player || "--";

  if (normalizedAction === "--" && normalizedPlayer === "--" && timecode === "--") {
    return null;
  }

  return {
    action: normalizedAction,
    clipEndSeconds,
    clipStartSeconds,
    groupValue,
    id: `${sport}-${groupValue}-${normalizedAction}-${index}`,
    player: normalizedPlayer,
    playlistFallbackTimestamp,
    playlistTimestamp,
    primaryDetail,
    result: result || "--",
    secondaryDetail,
    sourceUrl,
    team: team || "--",
    timecode,
  };
};

export const normalizeTagRows = (
  payload: Record<string, unknown> | null,
  eventDetails: TEventMediaDetails | null,
  sport: SportTableKind,
  baseEventDateTime: string | null
) => {
  const root = payload ? asRecord(payload) : null;
  const nestedEvent = root ? asRecord(root.event) : null;
  const nestedRawEvent = root ? asRecord(root.rawEvent) : null;
  const rawTags = pickArray([root, nestedEvent, nestedRawEvent], ["tags", "event_tags", "eventTags"]);

  if (rawTags.length > 0) {
    return rawTags
      .map((entry, index) => buildTagRowBySport(asRecord(entry), sport, index, baseEventDateTime))
      .filter((row): row is SgTagRow => Boolean(row));
  }

  return (eventDetails?.structuredTags ?? []).map((tag, index) => {
    const defaultConfig = SPORT_TABLE_CONFIGS[sport] ?? SPORT_TABLE_CONFIGS.default;
    const quarterValue =
      sport === "basketball"
        ? normalizeBasketballQuarter(tag.quarter || defaultConfig.defaultGroupValue)
        : normalizeQuarter(tag.quarter || defaultConfig.defaultGroupValue);
    const groupValue =
      sport === "american-football"
        ? quarterValue
        : sport === "basketball"
          ? quarterValue
          : defaultConfig.defaultGroupValue;

    return {
      action: tag.action ? formatLooseLabel(tag.action) : tag.label,
      clipEndSeconds: null,
      clipStartSeconds: tag.timeRange ? parseTimecodeToSeconds(tag.timeRange) : null,
      groupValue,
      id: `${sport}-${groupValue}-${tag.action || "tag"}-${index}`,
      player: "--",
      playlistFallbackTimestamp: buildClockOnlyPlaylistTimestampFallback(tag.timestamp || "", baseEventDateTime),
      playlistTimestamp: normalizePlaylistTimestamp(tag.timestamp || "", baseEventDateTime),
      primaryDetail:
        sport === "american-football" || sport === "basketball"
          ? quarterValue
          : defaultConfig.primaryDetailLabel === "Match Time"
            ? tag.timeRange || tag.timestamp || "--"
            : "--",
      result: tag.result ? formatLooseLabel(tag.result) : "--",
      secondaryDetail: "--",
      sourceUrl: "",
      team: tag.team ? formatLooseLabel(tag.team) : "--",
      timecode: tag.timeRange || tag.timestamp || "--",
    } satisfies SgTagRow;
  });
};

export const buildBaseEventDateTime = (dateValue: string, timeValue: string) => {
  const normalizedDateValue = dateValue.trim();
  const normalizedTimeValue = timeValue.trim();
  const candidates = [
    normalizedTimeValue.includes("T") ? normalizedTimeValue : "",
    normalizedDateValue.includes("T") ? normalizedDateValue : "",
    normalizedDateValue && normalizedTimeValue ? `${normalizedDateValue} ${normalizedTimeValue}` : "",
    normalizedDateValue,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const parsedValue = Date.parse(candidate);
    if (!Number.isNaN(parsedValue)) {
      return new Date(parsedValue).toISOString().replace(/Z$/, "+00:00");
    }
  }

  return null;
};

export const isCoachCompletedEventJsonItem = (item: TMediaItem | null) => {
  if (!item) return false;

  const meta = asRecord(item.meta);
  const format = item.format.toLowerCase();
  const source = toText(meta.source).toLowerCase();

  return format === "json" && item.mediaType === "document" && (source === "plane-coach" || item.id.startsWith("coach-event-"));
};

export const formatLongDateTime = (dateValue: string, timeValue: string) => {
  const combinedValue = [dateValue, timeValue].filter(Boolean).join(" ").trim();
  const parsedValue = combinedValue || dateValue || timeValue;
  if (!parsedValue) return "--";

  const parsed = Date.parse(parsedValue);
  if (Number.isNaN(parsed)) {
    if (dateValue && timeValue) return `${formatDateValue(dateValue)}, ${formatTimeValue(timeValue)}`;
    return formatDateValue(parsedValue);
  }

  return new Date(parsed).toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const buildEventTitle = ({
  eventDetails,
  issue,
  payload,
  projectName,
}: {
  eventDetails: TEventMediaDetails | null;
  issue: TIssue;
  payload: Record<string, unknown> | null;
  projectName: string;
}) => {
  const titleSources = [asRecord(payload), asRecord(asRecord(payload).event)];
  const directTitle = pickText(titleSources, ["title", "name", "event_name"]);
  if (directTitle) return directTitle;
  if (eventDetails?.title) return eventDetails.title;

  const oppositionName = parseOppositionTeam(issue.opposition_team)?.name || "";
  if (projectName && oppositionName) return `${projectName} vs ${oppositionName}`;

  return issue.name || "SG Event";
};
