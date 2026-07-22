import type { TIssue } from "@plane/types";
import { parseOppositionTeam } from "@/helpers/opposition-team";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import { formatDateValue, formatTimeValue } from "ce/features/media-library/utils/media-detail-utils";
import type { TEventMediaDetails } from "ce/features/media-library/utils/media-event";
import { SPORT_TABLE_CONFIGS } from "./constants";
import { findExactRawTagFieldValue } from "./raw-tag-fields";
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

const DEFAULT_ARCHIVED_HLS_BASE_URL = "/hls";

export const getArchivedHlsBaseUrl = () => {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_HLS_SERVER_URL?.trim();
  const baseUrl = configuredBaseUrl || DEFAULT_ARCHIVED_HLS_BASE_URL;
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  return normalizedBaseUrl || DEFAULT_ARCHIVED_HLS_BASE_URL;
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
  Boolean(value) &&
  typeof value === "object" &&
  ("field" in (value as GatewayField) || "value" in (value as GatewayField));

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
    return payload.map((entry) => demodulateGatewayEntry(entry)).filter((entry) => Object.keys(entry).length > 0);
  }

  const gatewayResponse = asRecord(payload)["Gateway Response"];
  const result = asRecord(gatewayResponse).result;
  const rows = Array.isArray(result) ? result : [];

  return rows.map((entry) => demodulateGatewayEntry(entry)).filter((entry) => Object.keys(entry).length > 0);
};

export const buildArchivedStreamUrl = (streamName: string) => {
  const normalizedStreamName = streamName.trim().replace(/^\/+|\/+$/g, "");
  if (!normalizedStreamName) return null;

  return `${getArchivedHlsBaseUrl()}/${normalizedStreamName}/llhls.m3u8`;
};

export const buildArchivedPlaylistUrl = (playlistFileName: string) => {
  const normalizedFileName = playlistFileName.trim().replace(/^\/+/, "");
  if (!normalizedFileName) return null;

  return `${getArchivedHlsBaseUrl()}/${normalizedFileName}`;
};

export const getLastPathSegment = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim();
  if (!normalizedValue) return "";

  try {
    const url = new URL(normalizedValue, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return decodeURIComponent(url.pathname.replace(/\/+$/, "").split("/").pop() ?? "").trim();
  } catch {
    return decodeURIComponent(normalizedValue.replace(/\\/g, "/").replace(/\/+$/, "").split("/").pop() ?? "").trim();
  }
};

export const buildCustomPlaylistUrl = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim();
  if (!normalizedValue) return "";
  if (/^https?:\/\//i.test(normalizedValue)) return normalizedValue;

  return buildArchivedPlaylistUrl(normalizedValue) ?? "";
};

export const buildCustomPlaylistThumbnailUrl = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim();
  if (!normalizedValue) return "";
  if (/^https?:\/\//i.test(normalizedValue)) return normalizedValue;

  const cpServerBaseUrl = getCpServerBaseUrl();
  return cpServerBaseUrl
    ? `${cpServerBaseUrl}/blobs/thumbnails/${encodeURIComponent(normalizedValue)}`
    : normalizedValue;
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
    tag.timecode ?? tag.time_code ?? tag.timeRange ?? tag.time_range ?? tag.video_timecode ?? tag.videoTimecode
  );
  if (directTimecode) return directTimecode;

  const start = toText(tag.start ?? tag.clip_start ?? tag.video_timecode_clip_start ?? tag.start_timecode);
  const end = toText(tag.end ?? tag.clip_end ?? tag.video_timecode_clip_end ?? tag.end_timecode);
  if (start && end) return `${start}-${end}`;
  return start || end || "--";
};

const normalizeTagLookupKey = (value: unknown) =>
  toText(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const isTagDataKeyMatch = (normalizedKey: string, normalizedNames: ReadonlySet<string>) => {
  if (!normalizedKey || normalizedNames.has(normalizedKey)) return normalizedNames.has(normalizedKey);

  return Array.from(normalizedNames).some(
    (name) => name.length >= 8 && (normalizedKey.startsWith(`${name}_`) || normalizedKey.endsWith(`_${name}`))
  );
};

const findTagDataMatch = (tag: Record<string, unknown>, names: string[]) => {
  const normalizedNames = new Set(names.map((name) => normalizeTagLookupKey(name)).filter(Boolean));

  for (const name of names) {
    const directValue = toText(tag[name]);
    if (directValue) return { key: name, value: directValue };
  }

  for (const [key, value] of Object.entries(tag)) {
    const normalizedKey = normalizeTagLookupKey(key);
    if (!isTagDataKeyMatch(normalizedKey, normalizedNames)) continue;

    const directValue = toText(value);
    if (directValue) return { key, value: directValue };
  }

  const dataEntries = asArray(tag.data);
  for (const entry of dataEntries) {
    const entryRecord = asRecord(entry);
    const tagName = normalizeTagLookupKey(
      entryRecord.tag ??
        entryRecord.field ??
        entryRecord.field_name ??
        entryRecord.fieldName ??
        entryRecord.name ??
        entryRecord.key
    );
    if (!isTagDataKeyMatch(tagName, normalizedNames)) continue;

    const tagValue = toText(entryRecord.value ?? entryRecord.field_value ?? entryRecord.fieldValue ?? entryRecord.val);
    if (tagValue) return { key: tagName, value: tagValue };
  }

  return null;
};

const findTagDataValue = (tag: Record<string, unknown>, names: string[]) => findTagDataMatch(tag, names)?.value ?? "";

const normalizeTagContextKey = normalizeTagLookupKey;

const TAG_CONTEXT_IGNORED_KEYS = new Set([
  "action",
  "data",
  "id",
  "quarter",
  "result",
  "tag_id",
  "tagid",
  "team",
  "thumbnail_url",
  "thumbnailurl",
  "time_range",
  "timerange",
  "timestamp",
]);

const buildTagContext = (tag: Record<string, unknown>): Readonly<Record<string, string>> => {
  const context: Record<string, string> = {};

  Object.entries(tag).forEach(([key, value]) => {
    const normalizedKey = normalizeTagContextKey(key);
    if (
      TAG_CONTEXT_IGNORED_KEYS.has(normalizedKey) ||
      (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean")
    ) {
      return;
    }
    const normalizedValue = toText(value);
    if (normalizedKey && normalizedValue) context[normalizedKey] = normalizedValue;
  });

  asArray(tag.data).forEach((entry) => {
    const record = asRecord(entry);
    const key = normalizeTagContextKey(
      record.tag ?? record.field ?? record.field_name ?? record.fieldName ?? record.name ?? record.key
    );
    const value = toText(record.value ?? record.field_value ?? record.fieldValue ?? record.val);
    if (key && value) context[key] = value;
  });

  return context;
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

const DEFAULT_SG_TAG_DURATION_SECONDS = 8;

const isDisplayValue = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim().toLowerCase();
  return Boolean(normalizedValue && normalizedValue !== "--" && normalizedValue !== "-" && normalizedValue !== "n/a");
};

const formatFootballActionResult = (action: string) => {
  const normalizedAction = action.trim().toLowerCase();
  if (!normalizedAction || normalizedAction === "--") return "--";

  if (/pass[_\s-]?complete/.test(normalizedAction)) return "Complete";
  if (/pass[_\s-]?incomplete/.test(normalizedAction)) return "Incomplete";
  if (/touchdown|td/.test(normalizedAction)) return "Touchdown";
  if (/interception|intercepted/.test(normalizedAction)) return "Interception";
  if (/fumble/.test(normalizedAction)) return "Fumble";
  if (/sack/.test(normalizedAction)) return "Sack";
  if (/turnover/.test(normalizedAction)) return "Turnover";
  if (/penalty/.test(normalizedAction)) return "Penalty";
  if (/punt/.test(normalizedAction)) return "Punt";
  if (/kickoff/.test(normalizedAction)) return "Kickoff";
  if (/field[_\s-]?goal/.test(normalizedAction)) return "Field Goal";
  if (/extra[_\s-]?point/.test(normalizedAction)) return "Extra Point";
  if (/end[_\s-]?period|period[_\s-]?end/.test(normalizedAction)) return "End Period";
  if (/run|rush/.test(normalizedAction)) return "Run";

  return formatLooseLabel(action);
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

const formatBasketballActionResult = (action: string) => {
  const normalizedAction = action.trim().toLowerCase();
  if (!normalizedAction || normalizedAction === "--") return "--";

  if (/(?:field_goal|three_point|3pt).*made.*3|(?:made_3|3pt_made|three_point_made)/.test(normalizedAction)) {
    return "3 points";
  }
  if (/(?:field_goal|two_point|2pt).*made.*2|(?:made_2|2pt_made|two_point_made)/.test(normalizedAction)) {
    return "2 points";
  }
  if (/(?:free_throw).*made|(?:made_free_throw|free_throw_made)/.test(normalizedAction)) {
    return "1 point";
  }
  if (/miss/.test(normalizedAction)) return "Missed";

  return formatLooseLabel(action);
};

const formatCricketRuns = (value: string) => {
  if (!value) return "--";
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return String(numericValue);
  }
  return formatLooseLabel(value);
};

const formatCricketActionResult = (action: string) => {
  const normalizedAction = normalizeTagLookupKey(action);
  if (!normalizedAction) return "--";

  if (/boundary_six|six|six_runs|6_run/.test(normalizedAction)) return "6";
  if (/boundary_four|four|four_runs|4_run/.test(normalizedAction)) return "4";
  if (/three_runs|3_runs/.test(normalizedAction)) return "3";
  if (/two_runs|2_runs/.test(normalizedAction)) return "2";
  if (/single|one_run|1_run/.test(normalizedAction)) return "1";
  if (/dot_ball|dot/.test(normalizedAction)) return "0";
  if (/run_out|runout/.test(normalizedAction)) return "Run Out";
  if (/wicket|dismissal|bowled|caught|stumped|lbw|out/.test(normalizedAction)) return "Wicket";
  if (/no_ball|noball/.test(normalizedAction)) return "No Ball";
  if (/wide/.test(normalizedAction)) return "Wide";
  if (/leg_bye|legbye/.test(normalizedAction)) return "Leg Bye";
  if (/bye/.test(normalizedAction)) return "Bye";
  if (/end_over|over_end/.test(normalizedAction)) return "End Over";
  if (/end_innings|innings_end/.test(normalizedAction)) return "End Innings";

  return formatLooseLabel(action);
};

const formatCricketOver = (displayValue: string, overNumber: string, ballInOver: string) => {
  if (displayValue) return displayValue;
  if (overNumber && ballInOver) return `${overNumber}.${ballInOver}`;
  if (overNumber) return `Over ${overNumber}`;
  return "";
};

const formatCricketOverGroup = (overNumber: string, overDisplay: string) => {
  if (overNumber) return `Over ${overNumber}`;

  const displayOverNumber = overDisplay.match(/\b(\d+)(?:\.\d+)?\b/)?.[1] || "";
  if (displayOverNumber) return `Over ${displayOverNumber}`;

  return "";
};

export const parseTimecodeToSeconds = (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue || normalizedValue === "--") return null;
  const directSeconds = Number(normalizedValue);
  if (Number.isFinite(directSeconds) && directSeconds >= 0) {
    return directSeconds;
  }

  const firstPart = normalizedValue.split(/\s*[-\u2013\u2014]\s*/)[0].trim();
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
const TIMECODE_RANGE_SEPARATOR_REGEX = /\s*[-\u2013\u2014]\s*/;

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

const getTimestampOffsetSeconds = (value: string | null, baseEventDateTime?: string | null) => {
  if (!value || !baseEventDateTime) return null;

  const parsedValue = Date.parse(value);
  const parsedBaseDate = Date.parse(baseEventDateTime);
  if (Number.isNaN(parsedValue) || Number.isNaN(parsedBaseDate)) return null;

  const offsetSeconds = (parsedValue - parsedBaseDate) / 1000;
  if (!Number.isFinite(offsetSeconds) || offsetSeconds < 0 || offsetSeconds > 24 * 60 * 60) return null;

  return offsetSeconds;
};

const getClockOnlyOffsetSeconds = (value: string, baseEventDateTime?: string | null) => {
  const firstPart = value.trim().split(TIMECODE_RANGE_SEPARATOR_REGEX)[0]?.trim() ?? "";
  if (!CLOCK_ONLY_TIMESTAMP_REGEX.test(firstPart)) return null;

  return getTimestampOffsetSeconds(
    buildClockOnlyPlaylistTimestampFallback(firstPart, baseEventDateTime) ??
      normalizePlaylistTimestamp(firstPart, baseEventDateTime),
    baseEventDateTime
  );
};

const isMillisecondTagKey = (value: string | null | undefined) => {
  const normalizedKey = normalizeTagLookupKey(value);
  return normalizedKey.endsWith("_ms") || normalizedKey.includes("millisecond");
};

const getExplicitTagOffsetSeconds = (value: string, sourceKey?: string | null) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  const millisecondUnitValue = normalizedValue.match(
    /^(\d+(?:\.\d+)?)\s*(?:ms|msec|msecs|millisecond|milliseconds)$/i
  )?.[1];
  if (millisecondUnitValue) {
    const parsedMilliseconds = Number(millisecondUnitValue);
    return Number.isFinite(parsedMilliseconds) && parsedMilliseconds >= 0 ? parsedMilliseconds / 1000 : null;
  }

  const numericOffset = Number(normalizedValue);
  if (Number.isFinite(numericOffset) && isMillisecondTagKey(sourceKey)) return numericOffset / 1000;

  return parseTimecodeToSeconds(normalizedValue);
};

const getExplicitTagDurationSeconds = (value: string, sourceKey?: string | null) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  const millisecondUnitValue = normalizedValue.match(
    /^(\d+(?:\.\d+)?)\s*(?:ms|msec|msecs|millisecond|milliseconds)$/i
  )?.[1];
  if (millisecondUnitValue) {
    const parsedMilliseconds = Number(millisecondUnitValue);
    return Number.isFinite(parsedMilliseconds) && parsedMilliseconds > 0 ? parsedMilliseconds / 1000 : null;
  }

  const unitlessValue =
    normalizedValue.match(/^(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds)$/i)?.[1] ?? normalizedValue;
  const numericDuration = Number(unitlessValue);
  const durationSeconds =
    Number.isFinite(numericDuration) && isMillisecondTagKey(sourceKey)
      ? numericDuration / 1000
      : parseTimecodeToSeconds(unitlessValue);

  return durationSeconds !== null && durationSeconds > 0 ? durationSeconds : null;
};

const formatTagOffsetTimecode = (value: string, sourceKey?: string | null) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) return "";

  const offsetSeconds = getExplicitTagOffsetSeconds(normalizedValue, sourceKey);
  return offsetSeconds !== null ? formatClockFromSeconds(String(offsetSeconds)) : normalizedValue;
};

const buildOffsetTimecode = (
  start: string,
  end: string,
  duration: string,
  durationSourceKey?: string | null,
  startSourceKey?: string | null,
  endSourceKey?: string | null
) => {
  const formattedStart = formatTagOffsetTimecode(start, startSourceKey);
  const formattedEnd = formatTagOffsetTimecode(end, endSourceKey);

  if (formattedStart && formattedEnd) return `${formattedStart}-${formattedEnd}`;
  if (formattedStart && duration) {
    const startSeconds = getExplicitTagOffsetSeconds(start, startSourceKey);
    const durationSeconds = getExplicitTagDurationSeconds(duration, durationSourceKey);

    if (startSeconds !== null && durationSeconds !== null) {
      return `${formatClockFromSeconds(String(startSeconds))}-${formatClockFromSeconds(String(startSeconds + durationSeconds))}`;
    }
  }

  return formattedStart || formattedEnd;
};

const formatClipRangeTimecode = (startSeconds: number | null, endSeconds: number | null) => {
  if (startSeconds === null) return "";

  const formattedStart = formatClockFromSeconds(String(startSeconds));
  if (!formattedStart) return "";

  if (endSeconds !== null && endSeconds > startSeconds) {
    const formattedEnd = formatClockFromSeconds(String(endSeconds));
    if (formattedEnd) return `${formattedStart}-${formattedEnd}`;
  }

  return formattedStart;
};

const formatRawTimestampTimecode = (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) return "";

  const offsetTimecode = formatTagOffsetTimecode(normalizedValue);
  if (offsetTimecode && offsetTimecode !== normalizedValue) return offsetTimecode;

  const isoTimeMatch = normalizedValue.match(/^\d{4}-\d{2}-\d{2}[T\s](\d{1,2}:\d{2}(?::\d{2})?)/);
  if (isoTimeMatch?.[1]) return isoTimeMatch[1];

  const clockMatch = normalizedValue.match(/^(\d{1,2}:\d{2}(?::\d{2})?)(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/);
  if (clockMatch?.[1]) return clockMatch[1];

  return normalizedValue;
};

const getTimeRangeOffsetSeconds = (value: string, baseEventDateTime?: string | null) =>
  getClockOnlyOffsetSeconds(value, baseEventDateTime) ?? parseTimecodeToSeconds(value);

export const playlistHasMediaSegments = async (playlistUrl: string) => {
  try {
    const response = await fetch(playlistUrl, { cache: "no-store" });
    if (!response.ok) {
      return true;
    }

    const playlistText = await response.text();
    return playlistText.split(/\r?\n/).some((line) => {
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

const getTagThumbnailUrl = (tag: Record<string, unknown>) =>
  findTagDataValue(tag, [
    "thumbnail",
    "thumbnail_name",
    "thumbnailName",
    "thumbnail_file",
    "thumbnailFile",
    "thumbnail_url",
    "thumbnailUrl",
    "poster",
    "poster_url",
    "posterUrl",
    "preview_url",
    "previewUrl",
    "image_url",
    "imageUrl",
    "frame_url",
    "frameUrl",
    "clip_thumbnail",
    "clipThumbnail",
    "clip_thumbnail_url",
    "clipThumbnailUrl",
  ]);

const getSourceTagId = (tag: Record<string, unknown>) =>
  findExactRawTagFieldValue(tag, [
    "id",
    "tag_id",
    "tagId",
    "event_tag_id",
    "eventTagId",
    "source_tag_id",
    "sourceTagId",
    "source_id",
    "sourceId",
    "uuid",
    "guid",
    "_id",
  ]);

const getClipId = (tag: Record<string, unknown>) =>
  findExactRawTagFieldValue(tag, [
    "clip_id",
    "clipId",
    "source_clip_id",
    "sourceClipId",
    "video_clip_id",
    "videoClipId",
    "media_id",
    "mediaId",
    "artifact_id",
    "artifactId",
    "video_id",
    "videoId",
  ]);

const compactHash = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
};

const normalizeComparableTagValue = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const splitTimecodeRange = (value: string) => {
  const [start = "", end = ""] = value.split("-").map((part) => part.trim());

  return {
    end: end.replace(/\s+/g, ""),
    start: start.replace(/\s+/g, ""),
  };
};

const buildSgTagRowDedupeKey = (
  row: Pick<
    SgTagRow,
    | "action"
    | "clipId"
    | "context"
    | "groupValue"
    | "player"
    | "primaryDetail"
    | "result"
    | "secondaryDetail"
    | "team"
    | "timecode"
  >
) => {
  const { start, end } = splitTimecodeRange(row.timecode);

  return JSON.stringify({
    action: normalizeComparableTagValue(row.action),
    clipId: normalizeComparableTagValue(row.clipId ?? ""),
    context: Object.entries(row.context)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, normalizeComparableTagValue(value)]),
    end,
    groupValue: normalizeComparableTagValue(row.groupValue),
    player: normalizeComparableTagValue(row.player),
    primaryDetail: normalizeComparableTagValue(row.primaryDetail),
    result: normalizeComparableTagValue(row.result),
    secondaryDetail: normalizeComparableTagValue(row.secondaryDetail),
    start,
    team: normalizeComparableTagValue(row.team),
  });
};

const buildFallbackTagFieldId = (prefix: string, row: Parameters<typeof buildSgTagRowDedupeKey>[0]) =>
  `${prefix}-${compactHash(buildSgTagRowDedupeKey(row))}`;

const buildStableSgTagRowId = (
  row: Pick<
    SgTagRow,
    | "action"
    | "clipId"
    | "context"
    | "groupValue"
    | "player"
    | "primaryDetail"
    | "result"
    | "secondaryDetail"
    | "team"
    | "timecode"
  >,
  sourceTagId: string | null
) => sourceTagId || `sg-tag-${buildSgTagRowDedupeKey(row)}`;

const getTagRowCompletenessScore = (row: SgTagRow) =>
  [
    row.sourceTagId,
    row.clipId,
    row.sourceUrl,
    row.playlistTimestamp,
    row.playlistFallbackTimestamp,
    row.clipDurationSeconds !== null && row.clipDurationSeconds !== undefined ? "clip-duration" : "",
    row.clipStartSeconds !== null ? "clip-start" : "",
    row.clipEndSeconds !== null ? "clip-end" : "",
    row.matrixParticipant,
    row.matrixPeriod,
    row.player !== "--" ? row.player : "",
    row.result !== "--" ? row.result : "",
    row.primaryDetail !== "--" ? row.primaryDetail : "",
    row.secondaryDetail !== "--" ? row.secondaryDetail : "",
    row.thumbnailUrl,
    Object.keys(row.context).length > 0 ? "context" : "",
  ].filter(Boolean).length;

const mergeDuplicateTagRows = (currentRow: SgTagRow, nextRow: SgTagRow) => {
  const preferredRow =
    getTagRowCompletenessScore(nextRow) > getTagRowCompletenessScore(currentRow) ? nextRow : currentRow;
  const fallbackRow = preferredRow === nextRow ? currentRow : nextRow;
  const mergedRow = {
    ...preferredRow,
    clipId: preferredRow.clipId ?? fallbackRow.clipId,
    clipDurationSeconds: preferredRow.clipDurationSeconds ?? fallbackRow.clipDurationSeconds ?? null,
    clipEndSeconds: preferredRow.clipEndSeconds ?? fallbackRow.clipEndSeconds,
    clipRangeSource: preferredRow.clipRangeSource ?? fallbackRow.clipRangeSource ?? null,
    clipStartSeconds: preferredRow.clipStartSeconds ?? fallbackRow.clipStartSeconds,
    context: { ...fallbackRow.context, ...preferredRow.context },
    matrixParticipant: preferredRow.matrixParticipant ?? fallbackRow.matrixParticipant,
    matrixPeriod: preferredRow.matrixPeriod ?? fallbackRow.matrixPeriod,
    player: preferredRow.player !== "--" ? preferredRow.player : fallbackRow.player,
    playlistFallbackTimestamp: preferredRow.playlistFallbackTimestamp ?? fallbackRow.playlistFallbackTimestamp,
    playlistTimestamp: preferredRow.playlistTimestamp ?? fallbackRow.playlistTimestamp,
    primaryDetail: preferredRow.primaryDetail !== "--" ? preferredRow.primaryDetail : fallbackRow.primaryDetail,
    result: preferredRow.result !== "--" ? preferredRow.result : fallbackRow.result,
    secondaryDetail: preferredRow.secondaryDetail !== "--" ? preferredRow.secondaryDetail : fallbackRow.secondaryDetail,
    sourceTagId: preferredRow.sourceTagId ?? fallbackRow.sourceTagId,
    sourceUrl: preferredRow.sourceUrl || fallbackRow.sourceUrl,
    team: preferredRow.team !== "--" ? preferredRow.team : fallbackRow.team,
    thumbnailUrl: preferredRow.thumbnailUrl || fallbackRow.thumbnailUrl,
    timecode: preferredRow.timecode !== "--" ? preferredRow.timecode : fallbackRow.timecode,
  } satisfies SgTagRow;

  return {
    ...mergedRow,
    id: buildStableSgTagRowId(mergedRow, mergedRow.sourceTagId),
  } satisfies SgTagRow;
};

export const dedupeTagRows = (rows: SgTagRow[]) => {
  const rowsByKey = new Map<string, SgTagRow>();
  const sourceIdToKey = new Map<string, string>();
  let duplicateCount = 0;

  rows.forEach((row) => {
    const contentKey = buildSgTagRowDedupeKey(row);
    const mappedSourceKey = row.sourceTagId ? sourceIdToKey.get(row.sourceTagId) : undefined;
    const existingKey = mappedSourceKey ?? (rowsByKey.has(contentKey) ? contentKey : undefined);

    if (!existingKey) {
      rowsByKey.set(contentKey, row);
      if (row.sourceTagId) {
        sourceIdToKey.set(row.sourceTagId, contentKey);
      }
      return;
    }

    duplicateCount += 1;
    const currentRow = rowsByKey.get(existingKey);
    if (currentRow) {
      rowsByKey.set(existingKey, mergeDuplicateTagRows(currentRow, row));
    }

    if (row.sourceTagId) {
      sourceIdToKey.set(row.sourceTagId, existingKey);
    }
  });

  if (duplicateCount > 0 && process.env.NODE_ENV !== "production") {
    console.info(`[sg-event-detail] Removed ${duplicateCount} duplicate tag row${duplicateCount === 1 ? "" : "s"}.`);
  }

  return Array.from(rowsByKey.values());
};

const preserveTagRowsWithUniqueIds = (rows: SgTagRow[]) => {
  const idCounts = new Map<string, number>();

  return rows.map((row) => {
    const currentCount = idCounts.get(row.id) ?? 0;

    idCounts.set(row.id, currentCount + 1);
    if (currentCount === 0) return row;

    return {
      ...row,
      id: `${row.id}__${currentCount + 1}`,
    };
  });
};

const buildExactTagRowKey = (row: SgTagRow) =>
  JSON.stringify({
    action: row.action,
    clipId: row.clipId,
    clipDurationSeconds: row.clipDurationSeconds,
    clipEndSeconds: row.clipEndSeconds,
    clipRangeSource: row.clipRangeSource,
    clipStartSeconds: row.clipStartSeconds,
    context: Object.entries(row.context)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, normalizeComparableTagValue(value)]),
    groupValue: row.groupValue,
    matrixParticipant: row.matrixParticipant,
    matrixPeriod: row.matrixPeriod,
    player: row.player,
    playlistFallbackTimestamp: row.playlistFallbackTimestamp,
    playlistTimestamp: row.playlistTimestamp,
    primaryDetail: row.primaryDetail,
    result: row.result,
    secondaryDetail: row.secondaryDetail,
    sourceUrl: row.sourceUrl,
    team: row.team,
    timecode: row.timecode,
  });

const removeExactDuplicateTagRows = (rows: SgTagRow[]) => {
  const rowsByKey = new Map<string, SgTagRow>();

  rows.forEach((row) => {
    const rowKey = buildExactTagRowKey(row);
    const existingRow = rowsByKey.get(rowKey);

    if (!existingRow) {
      rowsByKey.set(rowKey, row);
      return;
    }

    if (!existingRow.thumbnailUrl && row.thumbnailUrl) {
      rowsByKey.set(rowKey, { ...existingRow, thumbnailUrl: row.thumbnailUrl });
    }
  });

  return Array.from(rowsByKey.values());
};

const normalizeTagRowsForDisplay = (rows: SgTagRow[]) =>
  preserveTagRowsWithUniqueIds(removeExactDuplicateTagRows(rows));

const buildTagRowBySport = (
  tag: Record<string, unknown>,
  sport: SportTableKind,
  baseEventDateTime?: string | null
): SgTagRow | null => {
  const context = buildTagContext(tag);
  const matrixParticipant =
    findExactRawTagFieldValue(tag, ["player", "player_name", "athlete", "athlete_name", "primary_actor"]) || null;
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
    findTagDataValue(tag, ["primary_action", "action", "event_code", "event", "play", "tag"]) ||
    formatLooseLabel(toText(tag.action || tag.event_code || tag.play || tag.tag));
  const result =
    findTagDataValue(tag, [
      "result",
      "outcome",
      "play_outcome",
      "playOutcome",
      "action_result",
      "actionResult",
      "ball_result",
      "ballResult",
      "batting_result",
      "battingResult",
      "bowling_result",
      "bowlingResult",
      "delivery_outcome",
      "deliveryOutcome",
      "primary_result",
      "primaryResult",
      "tag_result",
      "tagResult",
      "gain",
      "yards_gained",
      "yardsGained",
      "play_result",
      "playResult",
      "event_result",
      "eventResult",
      "shot_result",
      "delivery_result",
    ]) || formatLooseLabel(toText(tag.result || tag.outcome));
  const team =
    findTagDataValue(tag, ["team", "unit", "side", "batting_team", "fielding_team", "possession_team"]) ||
    formatLooseLabel(toText(tag.team || tag.unit));

  const rawQuarterValue =
    findTagDataValue(tag, ["quarter", "period", "phase", "segment", "group"]) ||
    toText(tag.quarter || tag.period || tag.phase || tag.segment || tag.group);
  const groupQuarter = normalizeQuarter(rawQuarterValue || "Quarter 1");
  let timecode = buildTimecode(tag);
  const rawPlaylistTimestamp =
    findTagDataValue(tag, [
      "timestamp",
      "tag_timestamp",
      "tagTimestamp",
      "event_timestamp",
      "absolute_timestamp",
      "video_timestamp",
      "clip_timestamp",
      "clipTimestamp",
      "clip_time",
      "clipTime",
      "program_date_time",
      "program_datetime",
      "prog_date_time",
    ]) || toText(tag.timestamp);
  const playlistTimestamp = normalizePlaylistTimestamp(rawPlaylistTimestamp, baseEventDateTime);
  const playlistFallbackTimestamp = buildClockOnlyPlaylistTimestampFallback(rawPlaylistTimestamp, baseEventDateTime);
  const sourceUrl = getTagSourceUrl(tag);
  const thumbnailUrl = getTagThumbnailUrl(tag);
  const explicitSourceTagId = getSourceTagId(tag);
  const explicitClipId = getClipId(tag);
  const rawClipStartMatch = findTagDataMatch(tag, [
    "clipStart",
    "clip_start",
    "clip_start_seconds",
    "clip_start_second",
    "start",
    "start_time",
    "startTime",
    "start_timestamp",
    "startTimestamp",
    "start_offset",
    "startOffset",
    "offset",
    "offset_seconds",
    "offsetSeconds",
    "start_seconds",
    "start_second",
    "start_ms",
    "startMs",
    "start_timecode",
    "video_offset",
    "video_offset_seconds",
    "video_offset_ms",
    "videoOffsetMs",
    "videoStart",
    "video_start",
    "video_start_ms",
    "videoStartMs",
    "video_start_seconds",
    "videoTime",
    "video_time",
    "video_time_ms",
    "videoTimeMs",
    "video_time_seconds",
    "video_timestamp_seconds",
    "video_timestamp_ms",
    "video_timecode_clip_start",
  ]);
  const rawClipStart = rawClipStartMatch?.value ?? "";
  const rawClipEndMatch = findTagDataMatch(tag, [
    "clipEnd",
    "clip_end",
    "clip_end_ms",
    "clipEndMs",
    "clip_end_seconds",
    "clip_end_second",
    "end",
    "end_time",
    "endTime",
    "end_timestamp",
    "endTimestamp",
    "end_offset",
    "endOffset",
    "end_seconds",
    "end_second",
    "end_ms",
    "endMs",
    "end_timecode",
    "videoEnd",
    "video_end",
    "video_end_ms",
    "videoEndMs",
    "video_end_seconds",
    "video_timecode_clip_end",
  ]);
  const rawClipEnd = rawClipEndMatch?.value ?? "";
  const rawClipDurationMatch = findTagDataMatch(tag, [
    "clipDuration",
    "clipDurationSeconds",
    "clip_duration",
    "clip_duration_ms",
    "clipDurationMs",
    "clip_duration_milliseconds",
    "clipDurationMilliseconds",
    "clip_duration_seconds",
    "clip_duration_second",
    "clip_length",
    "clipLength",
    "clip_length_ms",
    "clipLengthMs",
    "clip_length_seconds",
    "clipLengthSeconds",
    "duration",
    "duration_ms",
    "durationMs",
    "duration_milliseconds",
    "durationMilliseconds",
    "durationSec",
    "durationSeconds",
    "duration_sec",
    "duration_seconds",
    "duration_second",
    "length",
    "length_ms",
    "length_seconds",
    "playlist_duration",
    "playlist_duration_ms",
    "playlist_duration_seconds",
    "videoDuration",
    "videoDurationSeconds",
    "video_duration",
    "video_duration_ms",
    "video_duration_seconds",
  ]);
  const rawClipDuration = rawClipDurationMatch?.value ?? "";
  const rawDataTimecode = findTagDataValue(tag, [
    "timecode",
    "time_code",
    "time_range",
    "timerange",
    "time",
    "time_marker",
    "timeMarker",
    "tag_time",
    "tagTime",
    "clip_time",
    "clipTime",
    "clip_timestamp",
    "clipTimestamp",
    "video_timecode",
    "video_timecode_display",
    "video_timestamp",
    "video_time",
    "videoTime",
  ]);
  if (timecode === "--" && rawDataTimecode) {
    timecode = rawDataTimecode;
  }
  const offsetTimecode = buildOffsetTimecode(
    rawClipStart,
    rawClipEnd,
    rawClipDuration,
    rawClipDurationMatch?.key,
    rawClipStartMatch?.key,
    rawClipEndMatch?.key
  );
  if (timecode === "--" && offsetTimecode) {
    timecode = offsetTimecode;
  }

  let groupValue = SPORT_TABLE_CONFIGS.default.defaultGroupValue;
  let matrixPeriod: string | null = null;
  let primaryDetail = "--";
  let resultDisplay = result || "--";
  let secondaryDetail = "--";

  switch (sport) {
    case "american-football": {
      const down = findTagDataValue(tag, ["down", "down_number"]);
      const distance = findTagDataValue(tag, ["distance", "distance_yards", "yards_to_go", "to_go"]);
      const yards =
        findTagDataValue(tag, ["yard", "yards", "yards_gained", "gain_yards", "distance_gained"]) ||
        toText(tag.yard || tag.yards);
      groupValue = groupQuarter;
      matrixPeriod = rawQuarterValue ? groupQuarter : null;
      primaryDetail = formatFootballDownDistance(down, distance);
      secondaryDetail = formatYardValue(yards);
      resultDisplay =
        result || (isDisplayValue(secondaryDetail) ? secondaryDetail : formatFootballActionResult(action));
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
      matrixPeriod = inningDisplay !== "--" ? inningDisplay : null;
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
      matrixPeriod = phase || null;
      primaryDetail = matchTime;
      secondaryDetail = zone !== "--" ? formatLooseLabel(zone) : zone;
      break;
    }
    case "basketball": {
      const periodValue = findTagDataValue(tag, ["period", "quarter"]);
      const rawClockValue = findTagDataValue(tag, ["game_clock", "clock", "game_clock_display"]);
      const clockValue =
        formatClockValue(rawClockValue) ||
        rawClockValue ||
        formatClockValue(findTagDataValue(tag, ["game_clock_seconds"]));
      const points =
        findTagDataValue(tag, ["points_or_runs_scored", "points", "shot_value", "point_value"]) ||
        findTagDataValue(tag, ["score_value"]);
      const quarterLabel = normalizeBasketballQuarter(periodValue || "Q1");
      groupValue = quarterLabel;
      matrixPeriod = periodValue ? quarterLabel : null;
      primaryDetail = clockValue || "--";
      secondaryDetail = formatBasketballValue(points, result);
      resultDisplay = result || (secondaryDetail !== "--" ? secondaryDetail : formatBasketballActionResult(action));
      break;
    }
    case "cricket": {
      const inningsNumber = findTagDataValue(tag, ["innings_number", "inning"]);
      const overDisplay = findTagDataValue(tag, ["over_display"]);
      const overNumber = findTagDataValue(tag, ["over_number"]);
      const ballInOver = findTagDataValue(tag, ["ball_in_over"]);
      const overValue = formatCricketOver(overDisplay, overNumber, ballInOver);
      const overGroupValue = formatCricketOverGroup(overNumber, overDisplay);
      const runs = findTagDataValue(tag, [
        "exact_runs",
        "runs_scored",
        "points_or_runs_scored",
        "runs",
        "run",
        "run_value",
        "runs_value",
        "score_value",
        "score_home",
        "total_runs",
      ]);
      groupValue = overGroupValue || SPORT_TABLE_CONFIGS.cricket.defaultGroupValue;
      matrixPeriod = overGroupValue || (inningsNumber ? `Innings ${inningsNumber}` : null);
      primaryDetail = overValue || "--";
      secondaryDetail = formatCricketRuns(runs);
      resultDisplay = result || (isDisplayValue(secondaryDetail) ? secondaryDetail : formatCricketActionResult(action));
      break;
    }
    default: {
      const phase = formatLooseLabel(toText(tag.quarter || tag.period || tag.phase || tag.segment));
      const value =
        findTagDataValue(tag, ["value", "score_value", "points_or_runs_scored"]) ||
        findTagDataValue(tag, ["count", "zone", "yard", "yards"]);
      groupValue = phase || SPORT_TABLE_CONFIGS.default.defaultGroupValue;
      matrixPeriod = phase || null;
      primaryDetail = phase || "--";
      secondaryDetail = value ? formatLooseLabel(value) : "--";
      break;
    }
  }

  const timestampOffsetSeconds = getTimestampOffsetSeconds(
    playlistTimestamp ?? playlistFallbackTimestamp,
    baseEventDateTime
  );
  const explicitClipStartSeconds = getExplicitTagOffsetSeconds(rawClipStart, rawClipStartMatch?.key);
  const explicitClipEndSeconds = getExplicitTagOffsetSeconds(rawClipEnd, rawClipEndMatch?.key);
  const explicitClipDurationSeconds = getExplicitTagDurationSeconds(rawClipDuration, rawClipDurationMatch?.key);
  const timecodeStartSeconds = getTimeRangeOffsetSeconds(timecode, baseEventDateTime);
  const timecodeEndSeconds = getTimeRangeOffsetSeconds(
    timecode.split(TIMECODE_RANGE_SEPARATOR_REGEX)[1] ?? "",
    baseEventDateTime
  );
  let clipDurationSeconds =
    explicitClipDurationSeconds ??
    (explicitClipStartSeconds !== null &&
    explicitClipEndSeconds !== null &&
    explicitClipEndSeconds > explicitClipStartSeconds
      ? explicitClipEndSeconds - explicitClipStartSeconds
      : null);
  const clipStartSeconds = explicitClipStartSeconds ?? timecodeStartSeconds ?? timestampOffsetSeconds;
  const hasPlaylistTimestamp = Boolean(playlistTimestamp || playlistFallbackTimestamp || rawPlaylistTimestamp);
  const hasClipReference = Boolean(explicitClipId || sourceUrl || thumbnailUrl);
  const shouldUseDefaultSgClipDuration = sport === "american-football" || sport === "cricket";
  if (
    clipDurationSeconds === null &&
    shouldUseDefaultSgClipDuration &&
    (clipStartSeconds !== null || hasPlaylistTimestamp || hasClipReference)
  ) {
    clipDurationSeconds = DEFAULT_SG_TAG_DURATION_SECONDS;
  }
  const clipEndSeconds =
    explicitClipEndSeconds ??
    timecodeEndSeconds ??
    (clipStartSeconds !== null && clipDurationSeconds !== null ? clipStartSeconds + clipDurationSeconds : null);

  if (timecode === "--") {
    const derivedTimecode =
      formatClipRangeTimecode(clipStartSeconds, clipEndSeconds) || formatRawTimestampTimecode(rawPlaylistTimestamp);
    if (derivedTimecode) {
      timecode = derivedTimecode;
    }
  }
  const clipRangeSource =
    explicitClipStartSeconds !== null || explicitClipEndSeconds !== null || explicitClipDurationSeconds !== null
      ? "explicit"
      : timecodeStartSeconds !== null || timecodeEndSeconds !== null
        ? "timecode"
        : null;

  const normalizedAction = action || "--";
  const normalizedPlayer = player || "--";

  if (normalizedAction === "--" && normalizedPlayer === "--" && timecode === "--") {
    return null;
  }

  const rowIdentity = {
    action: normalizedAction,
    clipId: explicitClipId || null,
    context,
    groupValue,
    player: normalizedPlayer,
    primaryDetail,
    result: resultDisplay,
    secondaryDetail,
    team: team || "--",
    timecode,
  };
  const clipId = explicitClipId || buildFallbackTagFieldId("clip", rowIdentity);
  const rowIdentityWithClip = { ...rowIdentity, clipId };
  const sourceTagId = explicitSourceTagId || buildFallbackTagFieldId("tag", rowIdentityWithClip);
  const stableId = buildStableSgTagRowId(rowIdentityWithClip, sourceTagId);

  return {
    action: normalizedAction,
    clipId,
    clipDurationSeconds,
    clipEndSeconds,
    clipRangeSource,
    clipStartSeconds,
    context,
    groupValue,
    id: stableId,
    matrixParticipant,
    matrixPeriod,
    player: normalizedPlayer,
    playlistFallbackTimestamp,
    playlistTimestamp,
    primaryDetail,
    result: resultDisplay,
    secondaryDetail,
    sourceTagId,
    sourceUrl,
    team: team || "--",
    thumbnailUrl,
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
    return normalizeTagRowsForDisplay(
      rawTags
        .map((entry) => buildTagRowBySport(asRecord(entry), sport, baseEventDateTime))
        .filter((row): row is SgTagRow => Boolean(row))
    );
  }

  return normalizeTagRowsForDisplay(
    (eventDetails?.structuredTags ?? []).map((tag) => {
      const defaultConfig = SPORT_TABLE_CONFIGS[sport] ?? SPORT_TABLE_CONFIGS.default;
      const action = tag.action ? formatLooseLabel(tag.action) : tag.label;
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
      const primaryDetail =
        sport === "american-football"
          ? quarterValue
          : sport === "basketball"
            ? "--"
            : defaultConfig.primaryDetailLabel === "Match Time"
              ? tag.timeRange || tag.timestamp || "--"
              : "--";
      const result = tag.result ? formatLooseLabel(tag.result) : "--";
      const team = tag.team ? formatLooseLabel(tag.team) : "--";
      const timecode = tag.timeRange || tag.timestamp || "--";
      const rowIdentity = {
        action,
        clipId: null,
        context: {},
        groupValue,
        player: "--",
        primaryDetail,
        result,
        secondaryDetail: "--",
        team,
        timecode,
      };
      const clipId = buildFallbackTagFieldId("clip", rowIdentity);
      const rowIdentityWithClip = { ...rowIdentity, clipId };
      const sourceTagId = buildFallbackTagFieldId("tag", rowIdentityWithClip);

      return {
        action,
        clipId,
        clipDurationSeconds: null,
        clipEndSeconds: null,
        clipRangeSource: tag.timeRange || tag.timestamp ? "timecode" : null,
        clipStartSeconds: tag.timeRange
          ? getTimeRangeOffsetSeconds(tag.timeRange, baseEventDateTime)
          : tag.timestamp
            ? getTimeRangeOffsetSeconds(tag.timestamp, baseEventDateTime)
            : null,
        context: {},
        groupValue,
        id: buildStableSgTagRowId(rowIdentityWithClip, sourceTagId),
        matrixParticipant: null,
        matrixPeriod: tag.quarter ? quarterValue : null,
        player: "--",
        playlistFallbackTimestamp: buildClockOnlyPlaylistTimestampFallback(tag.timestamp || "", baseEventDateTime),
        playlistTimestamp: normalizePlaylistTimestamp(tag.timestamp || "", baseEventDateTime),
        primaryDetail,
        result,
        secondaryDetail: "--",
        sourceTagId,
        sourceUrl: "",
        team,
        thumbnailUrl: "",
        timecode,
      } satisfies SgTagRow;
    })
  );
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

  return (
    format === "json" &&
    item.mediaType === "document" &&
    (source === "plane-coach" || item.id.startsWith("coach-event-"))
  );
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
