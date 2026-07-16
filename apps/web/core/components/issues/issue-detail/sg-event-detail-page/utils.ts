import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import { formatDateValue, formatTimeValue } from "ce/features/media-library/utils/media-detail-utils";
import type { TEventMediaDetails } from "ce/features/media-library/utils/media-event";
import type { TIssue } from "@plane/types";
import { parseOppositionTeam } from "@/helpers/opposition-team";
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

const findTagDataValue = (tag: Record<string, unknown>, names: string[]) => {
  for (const name of names) {
    const directValue = toText(tag[name]);
    if (directValue) return directValue;
  }

  const dataEntries = asArray(tag.data);
  for (const entry of dataEntries) {
    const entryRecord = asRecord(entry);
    const tagName = toText(
      entryRecord.tag ??
        entryRecord.field ??
        entryRecord.field_name ??
        entryRecord.fieldName ??
        entryRecord.name ??
        entryRecord.key
    )
      .toLowerCase()
      .replace(/\s+/g, "_");
    const match = names.some((name) => tagName === name || tagName.includes(name));
    if (!match) continue;
    const tagValue = toText(entryRecord.value ?? entryRecord.field_value ?? entryRecord.fieldValue ?? entryRecord.val);
    if (tagValue) return tagValue;
  }

  return "";
};

const normalizeTagContextKey = (value: unknown) =>
  toText(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

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
    return String(numericValue);
  }
  return formatLooseLabel(value);
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

const getExplicitTagOffsetSeconds = (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  return parseTimecodeToSeconds(normalizedValue);
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
  toText(tag.id ?? tag.tag_id ?? tag.tagId ?? tag.event_tag_id ?? tag.eventTagId ?? tag.uuid ?? tag.guid ?? tag._id);

const getClipId = (tag: Record<string, unknown>) => findExactRawTagFieldValue(tag, ["clip_id"]);

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
    clipEndSeconds: preferredRow.clipEndSeconds ?? fallbackRow.clipEndSeconds,
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
    clipEndSeconds: row.clipEndSeconds,
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
    findTagDataValue(tag, ["result", "outcome", "gain", "play_result", "shot_result", "delivery_result"]) ||
    formatLooseLabel(toText(tag.result || tag.outcome));
  const team =
    findTagDataValue(tag, ["team", "unit", "side", "batting_team", "fielding_team", "possession_team"]) ||
    formatLooseLabel(toText(tag.team || tag.unit));

  const rawQuarterValue =
    findTagDataValue(tag, ["quarter", "period", "phase", "segment", "group"]) ||
    toText(tag.quarter || tag.period || tag.phase || tag.segment || tag.group);
  const groupQuarter = normalizeQuarter(rawQuarterValue || "Quarter 1");
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
  const thumbnailUrl = getTagThumbnailUrl(tag);
  const sourceTagId = getSourceTagId(tag) || null;
  const clipId = getClipId(tag) || null;
  const rawClipStart = findTagDataValue(tag, [
    "clip_start",
    "clip_start_seconds",
    "clip_start_second",
    "start",
    "start_seconds",
    "start_second",
    "start_timecode",
    "video_offset",
    "video_offset_seconds",
    "video_start",
    "video_start_seconds",
    "video_time",
    "video_time_seconds",
    "video_timestamp_seconds",
    "video_timecode_clip_start",
  ]);
  const rawClipEnd = findTagDataValue(tag, [
    "clip_end",
    "clip_end_seconds",
    "clip_end_second",
    "end",
    "end_seconds",
    "end_second",
    "end_timecode",
    "video_end",
    "video_end_seconds",
    "video_timecode_clip_end",
  ]);
  const clipStartSeconds =
    getExplicitTagOffsetSeconds(rawClipStart) ?? getTimeRangeOffsetSeconds(timecode, baseEventDateTime);
  const clipEndSeconds =
    getExplicitTagOffsetSeconds(rawClipEnd) ??
    getTimeRangeOffsetSeconds(timecode.split(TIMECODE_RANGE_SEPARATOR_REGEX)[1] ?? "", baseEventDateTime);

  let groupValue = SPORT_TABLE_CONFIGS.default.defaultGroupValue;
  let matrixPeriod: string | null = null;
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
      matrixPeriod = rawQuarterValue ? groupQuarter : null;
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
      const clockValue =
        findTagDataValue(tag, ["game_clock", "clock", "game_clock_display"]) ||
        formatClockValue(findTagDataValue(tag, ["game_clock_seconds"]));
      const points =
        findTagDataValue(tag, ["points_or_runs_scored", "points", "shot_value", "point_value"]) ||
        findTagDataValue(tag, ["score_value"]);
      const quarterLabel = normalizeBasketballQuarter(periodValue || "Q1");
      groupValue = quarterLabel;
      matrixPeriod = periodValue ? quarterLabel : null;
      primaryDetail = [quarterLabel, clockValue].filter(Boolean).join(" ") || quarterLabel;
      secondaryDetail = formatBasketballValue(points, result);
      break;
    }
    case "cricket": {
      const inningsNumber = findTagDataValue(tag, ["innings_number", "inning"]);
      const overDisplay = findTagDataValue(tag, ["over_display"]);
      const overNumber = findTagDataValue(tag, ["over_number"]);
      const ballInOver = findTagDataValue(tag, ["ball_in_over"]);
      const overValue = formatCricketOver(overDisplay, overNumber, ballInOver);
      const overGroupValue = formatCricketOverGroup(overNumber, overDisplay);
      const runs = findTagDataValue(tag, ["score_home", "runs_scored", "points_or_runs_scored", "runs", "run_value"]);
      groupValue = overGroupValue || SPORT_TABLE_CONFIGS.cricket.defaultGroupValue;
      matrixPeriod = overGroupValue || (inningsNumber ? `Innings ${inningsNumber}` : null);
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
      matrixPeriod = phase || null;
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

  const stableId = buildStableSgTagRowId(
    {
      action: normalizedAction,
      clipId,
      context,
      groupValue,
      player: normalizedPlayer,
      primaryDetail,
      result: result || "--",
      secondaryDetail,
      team: team || "--",
      timecode,
    },
    sourceTagId
  );

  return {
    action: normalizedAction,
    clipId,
    clipEndSeconds,
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
    result: result || "--",
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
        clipId: null,
        clipEndSeconds: null,
        clipStartSeconds: tag.timeRange
          ? getTimeRangeOffsetSeconds(tag.timeRange, baseEventDateTime)
          : tag.timestamp
            ? getTimeRangeOffsetSeconds(tag.timestamp, baseEventDateTime)
            : null,
        context: {},
        groupValue,
        id: buildStableSgTagRowId(
          {
            action: tag.action ? formatLooseLabel(tag.action) : tag.label,
            clipId: null,
            context: {},
            groupValue,
            player: "--",
            primaryDetail:
              sport === "american-football" || sport === "basketball"
                ? quarterValue
                : defaultConfig.primaryDetailLabel === "Match Time"
                  ? tag.timeRange || tag.timestamp || "--"
                  : "--",
            result: tag.result ? formatLooseLabel(tag.result) : "--",
            secondaryDetail: "--",
            team: tag.team ? formatLooseLabel(tag.team) : "--",
            timecode: tag.timeRange || tag.timestamp || "--",
          },
          null
        ),
        matrixParticipant: null,
        matrixPeriod: tag.quarter ? quarterValue : null,
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
        sourceTagId: null,
        sourceUrl: "",
        team: tag.team ? formatLooseLabel(tag.team) : "--",
        thumbnailUrl: "",
        timecode: tag.timeRange || tag.timestamp || "--",
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
