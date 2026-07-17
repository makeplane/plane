import type { SgTagRow, SportTableKind } from "../../types";
import { parseTimecodeToSeconds } from "../../utils";
import { getTimelineTagEndSeconds, isTimelineTagPlaybackOverrideId } from "./timeline-scale";
import {
  buildTimelinePlayerLaneId,
  getTimelineCategoryLaneId,
  getTimelineJerseyNumberKeys,
  getTimelinePlayerLaneKey,
  getTimelineRowLaneIds,
} from "./timeline-track-assignment";

export type TimelineLaneTone = "offense" | "defense" | "special" | "playerA" | "playerB";

export type TimelineLane = {
  id: string;
  label: string;
  rows: SgTagRow[];
  tone: TimelineLaneTone;
};

export type TimelineRowPlacement = {
  endSeconds: number | null;
  startSeconds: number;
};

export type CategoryLaneDefinition = {
  id: string;
  keywords: string[];
  label: string;
  tone: TimelineLaneTone;
};

export type TimelineTagTypeOption = {
  color: string;
  group: string;
  key: string;
  label: string;
  order: number;
};

export const MARKER_COLORS = [
  "#ef4444",
  "#22c55e",
  "#c084fc",
  "#fbbf24",
  "#f472b6",
  "#60a5fa",
  "#f59e0b",
  "#a3e635",
];
export const PLAYHEAD_OVERFLOW_BUCKET_SECONDS = 300;
export const PLAYHEAD_SMOOTHING_MAX_SECONDS = 1.25;

const EMPTY_TIMELINE_VALUES = new Set(["", "--", "\u2014", "n/a", "na", "none", "null", "undefined"]);

export const LANE_TONE_CLASS: Record<TimelineLaneTone, string> = {
  offense: "border-l-[#2998d8] bg-[#b9defa] text-[#102d3f]",
  defense: "border-l-[#ff4f55] bg-[#ffc2c5] text-[#461316]",
  special: "border-l-[#49c7a2] bg-[#baf4e4] text-[#14382f]",
  playerA: "border-l-[#2998d8] bg-[#afd6f4] text-[#142c3f]",
  playerB: "border-l-[#49c7a2] bg-[#baf4e4] text-[#14382f]",
};

const normalizeLabel = (value: string) => value.trim();

const hasTimelineValue = (value: string | null | undefined) =>
  !EMPTY_TIMELINE_VALUES.has(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );

const normalizeTagTypeKeyPart = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const getUniqueTagTypeParts = (values: readonly string[]) => {
  const seen = new Set<string>();
  const parts: string[] = [];

  values.forEach((value) => {
    const normalizedValue = normalizeTagTypeKeyPart(value);
    if (!normalizedValue || seen.has(normalizedValue) || !hasTimelineValue(normalizedValue)) return;

    seen.add(normalizedValue);
    parts.push(normalizedValue);
  });

  return parts;
};

const getTimelineTagTypeParts = (row: SgTagRow) => {
  const actionParts = getUniqueTagTypeParts([row.action, row.result]);
  if (actionParts.length > 0) return actionParts;

  const detailParts = getUniqueTagTypeParts([row.primaryDetail, row.secondaryDetail]);
  if (detailParts.length > 0) return detailParts;

  return getUniqueTagTypeParts([row.groupValue, row.team]);
};

export const getTimelineTagTypeKey = (row: SgTagRow) => getTimelineTagTypeParts(row).join("|") || row.id;

const formatTagTypeLabelPart = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const getTimelineTagTypeLabel = (row: SgTagRow) => {
  const label = getTimelineTagTypeParts(row).map(formatTagTypeLabelPart).join(" - ");
  return label || "Tag";
};

const formatPlayerLaneLabel = (player: string, playerLabelByNumber: Map<string, string>) => {
  const rosterLabel = getTimelineJerseyNumberKeys(player)
    .map((key) => playerLabelByNumber.get(key))
    .find((label): label is string => Boolean(label));

  if (rosterLabel) return rosterLabel;

  const normalizedPlayer = normalizeLabel(player);
  if (/^\d+$/.test(normalizedPlayer)) return `#${normalizedPlayer}`;

  return normalizedPlayer;
};

const CATEGORY_LANES_BY_SPORT: Record<SportTableKind, CategoryLaneDefinition[]> = {
  "american-football": [
    {
      id: "offense",
      keywords: [
        "catch",
        "completion",
        "conversion",
        "first down",
        "gain",
        "pass",
        "reception",
        "run",
        "rush",
        "touchdown",
        "two point",
      ],
      label: "Offense",
      tone: "offense",
    },
    {
      id: "defense",
      keywords: ["defense", "fumble", "interception", "sack", "safety", "tackle", "turnover"],
      label: "Defense",
      tone: "defense",
    },
    {
      id: "special",
      keywords: ["extra point", "field goal", "kick", "kickoff", "punt", "return", "special"],
      label: "Special",
      tone: "special",
    },
  ],
  baseball: [
    {
      id: "batting",
      keywords: ["batter", "bunt", "double", "hit", "home run", "rbi", "run", "single", "steal", "triple"],
      label: "Batting",
      tone: "offense",
    },
    {
      id: "pitching",
      keywords: ["ball", "balk", "pitch", "pitcher", "strike", "strikeout", "walk", "wild pitch"],
      label: "Pitching",
      tone: "defense",
    },
    {
      id: "fielding",
      keywords: ["catch", "double play", "error", "field", "fielder", "out", "tag", "throw"],
      label: "Fielding",
      tone: "special",
    },
  ],
  basketball: [
    {
      id: "offense",
      keywords: ["assist", "dunk", "free throw", "layup", "made", "offense", "score", "shot", "three", "two point"],
      label: "Offense",
      tone: "offense",
    },
    {
      id: "defense",
      keywords: ["block", "charge", "defense", "foul", "rebound", "steal", "turnover"],
      label: "Defense",
      tone: "defense",
    },
    {
      id: "transition",
      keywords: ["fast break", "substitution", "timeout", "transition"],
      label: "Transition",
      tone: "special",
    },
  ],
  cricket: [
    {
      id: "batting",
      keywords: ["batter", "batting", "boundary", "four", "run", "six", "strike"],
      label: "Batting",
      tone: "offense",
    },
    {
      id: "bowling",
      keywords: ["ball", "bowled", "bowler", "bowling", "delivery", "dot", "lbw", "over", "wicket"],
      label: "Bowling",
      tone: "defense",
    },
    {
      id: "fielding",
      keywords: ["catch", "drop", "field", "run out", "stumping"],
      label: "Fielding",
      tone: "special",
    },
  ],
  default: [
    {
      id: "actions",
      keywords: ["action", "play"],
      label: "Actions",
      tone: "offense",
    },
    {
      id: "results",
      keywords: ["outcome", "result", "score"],
      label: "Results",
      tone: "defense",
    },
    {
      id: "other",
      keywords: ["event", "tag"],
      label: "Other",
      tone: "special",
    },
  ],
  soccer: [
    {
      id: "attack",
      keywords: ["assist", "attack", "cross", "dribble", "goal", "pass", "shot"],
      label: "Attack",
      tone: "offense",
    },
    {
      id: "defense",
      keywords: ["block", "clearance", "defense", "foul", "interception", "save", "tackle"],
      label: "Defense",
      tone: "defense",
    },
    {
      id: "set-pieces",
      keywords: ["corner", "free kick", "goal kick", "penalty", "set piece", "throw in"],
      label: "Set Pieces",
      tone: "special",
    },
  ],
};

const getCategoryLaneDefinitions = (sport: SportTableKind) =>
  CATEGORY_LANES_BY_SPORT[sport] ?? CATEGORY_LANES_BY_SPORT.default;

export const hashString = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

export const buildTimelineTagTypeOptions = (rows: SgTagRow[], sport: SportTableKind) => {
  const categoryLanes = getCategoryLaneDefinitions(sport);
  const categoryLaneById = new Map(categoryLanes.map((lane, index) => [lane.id, { ...lane, order: index }]));
  const optionsByKey = new Map<string, TimelineTagTypeOption>();

  rows.forEach((row) => {
    const key = getTimelineTagTypeKey(row);
    if (optionsByKey.has(key)) return;

    const laneId = getTimelineCategoryLaneId(row, categoryLanes);
    const categoryLane = categoryLaneById.get(laneId) ?? categoryLaneById.get(categoryLanes[0]?.id ?? "");

    optionsByKey.set(key, {
      color: MARKER_COLORS[hashString(key) % MARKER_COLORS.length],
      group: categoryLane?.label ?? "Other",
      key,
      label: getTimelineTagTypeLabel(row),
      order: categoryLane?.order ?? Number.MAX_SAFE_INTEGER,
    });
  });

  return Array.from(optionsByKey.values()).sort(
    (left, right) => left.order - right.order || left.label.localeCompare(right.label)
  );
};

const getTimecodeStart = (timecode: string) => timecode.split(/\s*[-\u2013\u2014]\s*/)[0] ?? timecode;

const isPlausibleTimelineSecond = (seconds: number, timelineDurationSeconds: number | null) =>
  timelineDurationSeconds === null || timelineDurationSeconds <= 0 || seconds <= timelineDurationSeconds + 60;

export const getPositiveDurationSeconds = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

const getRowTimecodeStartSeconds = (row: SgTagRow, timelineDurationSeconds: number | null) => {
  const seconds = row.clipStartSeconds ?? parseTimecodeToSeconds(getTimecodeStart(row.timecode));

  if (seconds === null || !isPlausibleTimelineSecond(seconds, timelineDurationSeconds)) return null;

  return seconds;
};

const getRowExplicitEndSeconds = (row: SgTagRow, timelineDurationSeconds: number | null) => {
  if (
    row.clipEndSeconds !== null &&
    row.clipRangeSource !== "timecode" &&
    isPlausibleTimelineSecond(row.clipEndSeconds, timelineDurationSeconds)
  ) {
    return row.clipEndSeconds;
  }

  return null;
};

const getTimestampMs = (value: string | null) => {
  if (!value) return null;

  const parsedValue = Date.parse(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

const getRowTimestampMs = (row: SgTagRow) =>
  getTimestampMs(row.playlistTimestamp) ?? getTimestampMs(row.playlistFallbackTimestamp);

const getRowDurationSeconds = (
  row: SgTagRow,
  timelineDurationSeconds: number | null,
  startSeconds: number,
  activeClipDurationSeconds: number | null
) =>
  getTimelineTagEndSeconds({
    clipDurationSeconds: activeClipDurationSeconds ?? getPositiveDurationSeconds(row.clipDurationSeconds),
    explicitEndSeconds: getRowExplicitEndSeconds(row, timelineDurationSeconds),
    startSeconds,
  }) - startSeconds;

export const buildTimelinePlacements = (
  rows: SgTagRow[],
  timelineDurationSeconds: number | null,
  activeClipDurationByRowId: ReadonlyMap<string, number> = new Map()
) => {
  const timestampValues = rows.map(getRowTimestampMs).filter((value): value is number => value !== null);
  const firstTimestampMs = timestampValues.length > 0 ? Math.min(...timestampValues) : null;
  const timelineStartMs = firstTimestampMs;
  const directPlacements = rows.map((row) => {
    const timestampMs = getRowTimestampMs(row);
    const timestampStartSeconds =
      timelineStartMs !== null && timestampMs !== null ? Math.max(0, (timestampMs - timelineStartMs) / 1000) : null;
    const timecodeStartSeconds = getRowTimecodeStartSeconds(row, timelineDurationSeconds);
    const startSeconds = timecodeStartSeconds ?? timestampStartSeconds;

    return {
      row,
      startSeconds,
    };
  });
  const maxKnownSeconds = directPlacements.reduce((maxSeconds, placement) => {
    if (placement.startSeconds === null) return maxSeconds;

    return Math.max(
      maxSeconds,
      placement.startSeconds +
        getRowDurationSeconds(
          placement.row,
          timelineDurationSeconds,
          placement.startSeconds,
          activeClipDurationByRowId.get(placement.row.id) ?? null
        )
    );
  }, 0);
  const fallbackRows = directPlacements.filter((placement) => placement.startSeconds === null);
  const fallbackWindowSeconds =
    timelineDurationSeconds !== null && timelineDurationSeconds > 0
      ? timelineDurationSeconds
      : Math.max(60, Math.ceil(maxKnownSeconds / 300) * 300);
  let fallbackIndex = 0;

  return directPlacements.reduce<Record<string, TimelineRowPlacement>>((accumulator, placement) => {
    const fallbackStartSeconds =
      fallbackRows.length > 0 ? ((fallbackIndex + 1) * fallbackWindowSeconds) / (fallbackRows.length + 1) : 0;
    const startSeconds = placement.startSeconds ?? fallbackStartSeconds;
    const endSeconds = getTimelineTagEndSeconds({
      clipDurationSeconds:
        activeClipDurationByRowId.get(placement.row.id) ??
        getPositiveDurationSeconds(placement.row.clipDurationSeconds),
      explicitEndSeconds: getRowExplicitEndSeconds(placement.row, timelineDurationSeconds),
      startSeconds,
    });

    if (placement.startSeconds === null) {
      fallbackIndex += 1;
    }

    accumulator[placement.row.id] = {
      endSeconds,
      startSeconds,
    };
    return accumulator;
  }, {});
};

export const buildLaneMarkerOffsets = (rows: SgTagRow[], rowPlacements: Record<string, TimelineRowPlacement>) => {
  const collisionCounts = new Map<number, number>();

  return [...rows]
    .sort((left, right) => {
      const leftPlacement = rowPlacements[left.id];
      const rightPlacement = rowPlacements[right.id];

      return (leftPlacement?.startSeconds ?? 0) - (rightPlacement?.startSeconds ?? 0);
    })
    .reduce<Record<string, number>>((accumulator, row) => {
      const placement = rowPlacements[row.id];
      const secondBucket = Math.round(placement?.startSeconds ?? 0);
      const currentCount = collisionCounts.get(secondBucket) ?? 0;

      accumulator[row.id] = currentCount;
      collisionCounts.set(secondBucket, currentCount + 1);
      return accumulator;
    }, {});
};

export const buildSortedTimelineRows = (rows: SgTagRow[], rowPlacements: Record<string, TimelineRowPlacement>) =>
  [...rows].sort((left, right) => {
    const leftPlacement = rowPlacements[left.id];
    const rightPlacement = rowPlacements[right.id];

    return (leftPlacement?.startSeconds ?? 0) - (rightPlacement?.startSeconds ?? 0);
  });

export const buildTagPlaybackOverrideId = (row: SgTagRow) => `sg-tag-${row.id}`;

export const getPlaybackOverrideRowId = (playbackOverrideId: string | null) =>
  isTimelineTagPlaybackOverrideId(playbackOverrideId) ? playbackOverrideId?.slice("sg-tag-".length) ?? null : null;

const buildPlayerLanes = (rows: SgTagRow[], playerLabelByNumber: Map<string, string>) => {
  const playerCounts = rows.reduce<Map<string, number>>((accumulator, row) => {
    const player = normalizeLabel(row.player);
    if (!player || player === "--") return accumulator;

    const playerKey = getTimelinePlayerLaneKey(player);
    accumulator.set(playerKey, (accumulator.get(playerKey) ?? 0) + 1);
    return accumulator;
  }, new Map<string, number>());

  return Array.from(playerCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([playerKey], index) => ({
      id: buildTimelinePlayerLaneId(playerKey),
      label: formatPlayerLaneLabel(playerKey, playerLabelByNumber),
      rows: [],
      tone: index % 2 === 0 ? "playerA" : "playerB",
    })) satisfies TimelineLane[];
};

export const buildTimelineLanes = (
  rows: SgTagRow[],
  sport: SportTableKind,
  playerLabelByNumber: Map<string, string>
) => {
  const categoryLaneDefinitions = CATEGORY_LANES_BY_SPORT[sport] ?? CATEGORY_LANES_BY_SPORT.default;
  const coreLanes: TimelineLane[] = categoryLaneDefinitions.map((lane) => ({
    id: lane.id,
    label: lane.label,
    rows: [],
    tone: lane.tone,
  }));
  const playerLanes = buildPlayerLanes(rows, playerLabelByNumber);
  const lanesById = new Map([...coreLanes, ...playerLanes].map((lane) => [lane.id, lane]));

  rows.forEach((row) => {
    getTimelineRowLaneIds(row, categoryLaneDefinitions).forEach((laneId) => {
      const lane = lanesById.get(laneId) ?? coreLanes[0];
      lane?.rows.push(row);
    });
  });

  return [...coreLanes, ...playerLanes];
};
