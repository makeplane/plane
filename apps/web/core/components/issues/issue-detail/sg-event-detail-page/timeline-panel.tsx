"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Clock3,
  Copy,
  Eye,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Search,
  SkipBack,
  SkipForward,
  Tags,
  X,
} from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import { SURFACE_CLASS } from "./constants";
import {
  DEFAULT_TIMELINE_TAG_DURATION_SECONDS,
  DEFAULT_TIMELINE_SCALE_INDEX,
  TIMELINE_SCALE_LEVELS,
  buildScaledTimelineTicks,
  formatTimelineTickLabel,
  getNextTimelineScaleIndex,
  getTimelineContentWidth,
  getTimelinePlaybackSeconds,
  getTimelineRangePixels,
  getTimelineScaleLabel,
  getTimelineTagEndSeconds,
  getTimelineTimePixel,
  isTimelineTagPlaybackOverrideId,
} from "./timeline-scale";
import {
  buildTimelinePlayerLaneId,
  getTimelineCategoryLaneId,
  getTimelineJerseyNumberKeys,
  getTimelinePlayerLaneKey,
  getTimelineRowLaneIds,
} from "./timeline-track-assignment";
import type { SgTagRow, SportTableKind } from "./types";
import { parseTimecodeToSeconds } from "./utils";

type SgEventTimelinePanelProps = {
  activePlaybackOverrideId: string | null;
  activeTagRowId: string | null;
  isMediaLoading: boolean;
  onPlayTagRow: (row: SgTagRow) => Promise<void>;
  onResetPlayback: () => void;
  playerDurationSeconds: number | null;
  playheadSeconds: number;
  playerLabelByNumber: Map<string, string>;
  rows: SgTagRow[];
  selectedTagIds: string[];
  sport: SportTableKind;
};

type TimelineLaneTone = "offense" | "defense" | "special" | "playerA" | "playerB";

type TimelineLane = {
  id: string;
  label: string;
  rows: SgTagRow[];
  tone: TimelineLaneTone;
};

type TimelineRowPlacement = {
  endSeconds: number | null;
  startSeconds: number;
};

type CategoryLaneDefinition = {
  id: string;
  keywords: string[];
  label: string;
  tone: TimelineLaneTone;
};

type TimelineTagTypeOption = {
  color: string;
  group: string;
  key: string;
  label: string;
  order: number;
};

const TOOL_BUTTON_CLASS =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100";
const TEXT_TOOL_BUTTON_CLASS =
  "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors";

const MARKER_COLORS = ["#ef4444", "#22c55e", "#c084fc", "#fbbf24", "#f472b6", "#60a5fa", "#f59e0b", "#a3e635"];
const PLAYHEAD_OVERFLOW_BUCKET_SECONDS = 300;
const PLAYHEAD_SMOOTHING_MAX_SECONDS = 1.25;
const EMPTY_TIMELINE_VALUES = new Set(["", "--", "\u2014", "n/a", "na", "none", "null", "undefined"]);

const LANE_TONE_CLASS: Record<TimelineLaneTone, string> = {
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

const getTimelineTagTypeKey = (row: SgTagRow) => getTimelineTagTypeParts(row).join("|") || row.id;

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

const hashString = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const buildTimelineTagTypeOptions = (rows: SgTagRow[], sport: SportTableKind) => {
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

const getPositiveDurationSeconds = (value: number | null | undefined) =>
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

const buildTimelinePlacements = (
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

const buildLaneMarkerOffsets = (rows: SgTagRow[], rowPlacements: Record<string, TimelineRowPlacement>) => {
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

const formatTooltipText = (value: string, transform: "title" | "upper") => {
  const normalizedValue = value.trim().replace(/[_-]+/g, " ");
  if (!normalizedValue || normalizedValue === "--") return "";

  if (transform === "upper") return normalizedValue.toUpperCase();

  return normalizedValue
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const TimelineTagTooltip = ({ placement, row }: { placement: TimelineRowPlacement; row: SgTagRow }) => {
  const startLabel = formatTimelineTickLabel(placement.startSeconds);
  const endLabel =
    placement.endSeconds !== null && placement.endSeconds > placement.startSeconds
      ? formatTimelineTickLabel(placement.endSeconds)
      : "";
  const timeLabel = endLabel ? `${startLabel}-${endLabel}` : startLabel;
  const actionLabel = formatTooltipText(row.action, "upper");
  const resultLabel = formatTooltipText(row.result, "title");
  const detailLabel = [actionLabel, resultLabel].filter(Boolean).join(" - ") || formatTooltipText(row.player, "title");

  return (
    <div className="min-w-[92px] leading-tight">
      <div className="text-[9px] font-medium text-[#3b6f50]">{timeLabel}</div>
      <div className="mt-0.5 whitespace-nowrap text-[10px] font-semibold text-[#123f24]">{detailLabel || "Tag"}</div>
    </div>
  );
};

const buildSortedTimelineRows = (rows: SgTagRow[], rowPlacements: Record<string, TimelineRowPlacement>) =>
  [...rows].sort((left, right) => {
    const leftPlacement = rowPlacements[left.id];
    const rightPlacement = rowPlacements[right.id];

    return (leftPlacement?.startSeconds ?? 0) - (rightPlacement?.startSeconds ?? 0);
  });

const buildTagPlaybackOverrideId = (row: SgTagRow) => `sg-tag-${row.id}`;

const getPlaybackOverrideRowId = (playbackOverrideId: string | null) =>
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

const buildTimelineLanes = (rows: SgTagRow[], sport: SportTableKind, playerLabelByNumber: Map<string, string>) => {
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

export const SgEventTimelinePanel = ({
  activePlaybackOverrideId,
  activeTagRowId,
  isMediaLoading,
  onPlayTagRow,
  onResetPlayback,
  playerDurationSeconds,
  playheadSeconds,
  playerLabelByNumber,
  rows,
  selectedTagIds,
  sport,
}: SgEventTimelinePanelProps) => {
  const [isTagTypesPanelOpen, setIsTagTypesPanelOpen] = useState(false);
  const [visibleTagTypeKeys, setVisibleTagTypeKeys] = useState<string[] | null>(null);
  const [tagTypeSearchQuery, setTagTypeSearchQuery] = useState("");
  const [collapsedTagTypeGroups, setCollapsedTagTypeGroups] = useState<Record<string, boolean>>({});
  const [timelineScaleIndex, setTimelineScaleIndex] = useState(DEFAULT_TIMELINE_SCALE_INDEX);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  const playheadElementRef = useRef<HTMLDivElement | null>(null);
  const previousPlayheadSecondsRef = useRef(playheadSeconds);
  const fullStreamDurationSecondsRef = useRef<number | null>(null);
  const isTagClipActive = isTimelineTagPlaybackOverrideId(activePlaybackOverrideId);
  const activePlaybackRowId = getPlaybackOverrideRowId(activePlaybackOverrideId);
  const timelineDurationSeconds = isTagClipActive ? fullStreamDurationSecondsRef.current : playerDurationSeconds;
  const tagTypeOptions = useMemo(() => buildTimelineTagTypeOptions(rows, sport), [rows, sport]);
  const defaultVisibleTagTypeKeys = useMemo(() => tagTypeOptions.map((option) => option.key), [tagTypeOptions]);
  const activeVisibleTagTypeKeys = visibleTagTypeKeys ?? defaultVisibleTagTypeKeys;
  const activeVisibleTagTypeKeySet = useMemo(() => new Set(activeVisibleTagTypeKeys), [activeVisibleTagTypeKeys]);
  const tagTypeOptionsByKey = useMemo(
    () => new Map(tagTypeOptions.map((option) => [option.key, option])),
    [tagTypeOptions]
  );
  const visibleTimelineRows = useMemo(
    () => rows.filter((row) => activeVisibleTagTypeKeySet.has(getTimelineTagTypeKey(row))),
    [activeVisibleTagTypeKeySet, rows]
  );
  const timelineLanes = useMemo(
    () => buildTimelineLanes(visibleTimelineRows, sport, playerLabelByNumber),
    [playerLabelByNumber, sport, visibleTimelineRows]
  );
  const activeClipDurationByRowId = useMemo(() => {
    const activeClipDurationSeconds =
      isTagClipActive && activePlaybackRowId ? getPositiveDurationSeconds(playerDurationSeconds) : null;

    return activeClipDurationSeconds !== null && activePlaybackRowId
      ? new Map([[activePlaybackRowId, activeClipDurationSeconds]])
      : new Map<string, number>();
  }, [activePlaybackRowId, isTagClipActive, playerDurationSeconds]);
  const rowPlacements = useMemo(
    () => buildTimelinePlacements(visibleTimelineRows, timelineDurationSeconds, activeClipDurationByRowId),
    [activeClipDurationByRowId, timelineDurationSeconds, visibleTimelineRows]
  );
  const sortedTimelineRows = useMemo(
    () => buildSortedTimelineRows(visibleTimelineRows, rowPlacements),
    [rowPlacements, visibleTimelineRows]
  );
  const normalizedTagTypeSearchQuery = tagTypeSearchQuery.trim().toLowerCase();
  const tagTypeGroups = useMemo(() => {
    const groupsByName = new Map<string, TimelineTagTypeOption[]>();

    tagTypeOptions.forEach((option) => {
      if (
        normalizedTagTypeSearchQuery &&
        !`${option.label} ${option.group} ${option.key}`.toLowerCase().includes(normalizedTagTypeSearchQuery)
      ) {
        return;
      }

      const currentOptions = groupsByName.get(option.group) ?? [];
      currentOptions.push(option);
      groupsByName.set(option.group, currentOptions);
    });

    return Array.from(groupsByName.entries())
      .map(([name, options]) => ({
        name,
        options: options.sort((left, right) => left.label.localeCompare(right.label)),
        order: Math.min(...options.map((option) => option.order)),
      }))
      .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));
  }, [normalizedTagTypeSearchQuery, tagTypeOptions]);
  const visibleTagTypeCount = tagTypeOptions.filter((option) => activeVisibleTagTypeKeySet.has(option.key)).length;
  const totalTagTypeCount = tagTypeOptions.length;
  const activeTimelineRowIndex = sortedTimelineRows.findIndex(
    (row) => row.id === activeTagRowId || row.id === activePlaybackRowId
  );
  const activeTimelineRow = activeTimelineRowIndex >= 0 ? sortedTimelineRows[activeTimelineRowIndex] : null;
  const activeTimelinePlacement = activeTimelineRow ? rowPlacements[activeTimelineRow.id] : null;
  const timelinePlayheadSecondsRaw = getTimelinePlaybackSeconds({
    activeClipStartSeconds: isTagClipActive ? (activeTimelinePlacement?.startSeconds ?? null) : null,
    isClipPlaybackActive: isTagClipActive,
    playheadSeconds,
  });
  const maxRowSeconds = Object.values(rowPlacements).reduce(
    (maxSeconds, placement) => Math.max(maxSeconds, placement.endSeconds ?? placement.startSeconds),
    0
  );
  const knownTimelineExtentSeconds = Math.max(maxRowSeconds, timelineDurationSeconds ?? 0, 60);
  const overflowTimelineExtentSeconds =
    timelinePlayheadSecondsRaw > knownTimelineExtentSeconds
      ? Math.ceil(timelinePlayheadSecondsRaw / PLAYHEAD_OVERFLOW_BUCKET_SECONDS) * PLAYHEAD_OVERFLOW_BUCKET_SECONDS
      : knownTimelineExtentSeconds;
  const timelineExtentSeconds = Math.max(knownTimelineExtentSeconds, overflowTimelineExtentSeconds);
  const totalSeconds = Math.max(1, Math.ceil(timelineExtentSeconds || 0));
  const timelineScale =
    TIMELINE_SCALE_LEVELS[timelineScaleIndex] ?? TIMELINE_SCALE_LEVELS[DEFAULT_TIMELINE_SCALE_INDEX];
  const timelineContentWidth = getTimelineContentWidth(timelineScale, totalSeconds);
  const timelinePlayheadSeconds = Math.min(timelinePlayheadSecondsRaw, totalSeconds);
  const playheadPositionPx = getTimelineTimePixel(timelinePlayheadSeconds, totalSeconds, timelineContentWidth);
  const visibleTicks = buildScaledTimelineTicks(totalSeconds, timelineScale);
  const canZoomOut = timelineScaleIndex > 0;
  const canZoomIn = timelineScaleIndex < TIMELINE_SCALE_LEVELS.length - 1;
  const hasTimelineRows = sortedTimelineRows.length > 0;

  useEffect(() => {
    if (isTagClipActive || playerDurationSeconds === null || playerDurationSeconds <= 0) return;

    fullStreamDurationSecondsRef.current = playerDurationSeconds;
  }, [isTagClipActive, playerDurationSeconds]);

  useEffect(() => {
    const playheadElement = playheadElementRef.current;
    if (!playheadElement) return;

    const previousPlayheadSeconds = previousPlayheadSecondsRef.current;
    previousPlayheadSecondsRef.current = timelinePlayheadSeconds;
    const setPlayheadPosition = (seconds: number) => {
      playheadElement.style.left = `${getTimelineTimePixel(seconds, totalSeconds, timelineContentWidth)}px`;
    };

    setPlayheadPosition(timelinePlayheadSeconds);

    if (timelinePlayheadSeconds <= previousPlayheadSeconds || timelinePlayheadSeconds >= totalSeconds) return;

    const animationStartedAtMs = window.performance.now();
    let animationFrameId = 0;
    const animatePlayhead = () => {
      const elapsedSeconds = Math.min(
        (window.performance.now() - animationStartedAtMs) / 1000,
        PLAYHEAD_SMOOTHING_MAX_SECONDS
      );
      const interpolatedSeconds = Math.min(timelinePlayheadSeconds + elapsedSeconds, totalSeconds);

      setPlayheadPosition(interpolatedSeconds);

      if (elapsedSeconds < PLAYHEAD_SMOOTHING_MAX_SECONDS && interpolatedSeconds < totalSeconds) {
        animationFrameId = window.requestAnimationFrame(animatePlayhead);
      }
    };

    animationFrameId = window.requestAnimationFrame(animatePlayhead);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [timelineContentWidth, timelinePlayheadSeconds, totalSeconds]);

  const scrollTimelineRangeIntoView = (
    range: { leftPx: number; widthPx: number },
    behavior: "auto" | "smooth" = "smooth"
  ) => {
    const scrollElement = timelineScrollRef.current;
    if (!scrollElement) return;

    const rangeLeft = range.leftPx;
    const rangeRight = range.leftPx + range.widthPx;
    const viewportLeft = scrollElement.scrollLeft;
    const viewportRight = viewportLeft + scrollElement.clientWidth;
    const padding = 80;

    if (rangeLeft < viewportLeft + padding) {
      scrollElement.scrollTo({ behavior, left: Math.max(0, rangeLeft - padding) });
      return;
    }

    if (rangeRight > viewportRight - padding) {
      scrollElement.scrollTo({ behavior, left: Math.max(0, rangeRight - scrollElement.clientWidth + padding) });
    }
  };

  const getPlacementRange = (placement: TimelineRowPlacement) =>
    getTimelineRangePixels({
      contentWidthPx: timelineContentWidth,
      endSeconds: placement.endSeconds,
      startSeconds: placement.startSeconds,
      totalSeconds,
    });

  const handlePlayTimelineRow = (row: SgTagRow) => {
    const placement = rowPlacements[row.id];
    if (placement) {
      scrollTimelineRangeIntoView(getPlacementRange(placement));
    }

    void onPlayTagRow(row);
  };

  useEffect(() => {
    if (!activeTimelinePlacement) return;

    scrollTimelineRangeIntoView(getPlacementRange(activeTimelinePlacement), "auto");
    // The active placement identity intentionally drives scroll restoration on tag selection and zoom changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlaybackOverrideId, activeTagRowId, activeTimelinePlacement, timelineContentWidth, totalSeconds]);

  const jumpToPreviousTag = () => {
    if (!hasTimelineRows) return;

    const previousRow =
      activeTimelineRowIndex >= 0
        ? sortedTimelineRows[(activeTimelineRowIndex - 1 + sortedTimelineRows.length) % sortedTimelineRows.length]
        : ([...sortedTimelineRows]
            .reverse()
            .find((row) => (rowPlacements[row.id]?.startSeconds ?? 0) < Math.max(0, timelinePlayheadSeconds - 0.5)) ??
          sortedTimelineRows.at(-1));

    if (previousRow) {
      handlePlayTimelineRow(previousRow);
    }
  };
  const jumpToNextTag = () => {
    if (!hasTimelineRows) return;

    const nextRow =
      activeTimelineRowIndex >= 0
        ? sortedTimelineRows[(activeTimelineRowIndex + 1) % sortedTimelineRows.length]
        : (sortedTimelineRows.find(
            (row) => (rowPlacements[row.id]?.startSeconds ?? 0) > timelinePlayheadSeconds + 0.5
          ) ?? sortedTimelineRows[0]);

    if (nextRow) {
      handlePlayTimelineRow(nextRow);
    }
  };
  const handleToggleTagType = (tagTypeKey: string) => {
    setVisibleTagTypeKeys((currentValue) => {
      const nextKeys = new Set(currentValue ?? defaultVisibleTagTypeKeys);

      if (nextKeys.has(tagTypeKey)) {
        nextKeys.delete(tagTypeKey);
      } else {
        nextKeys.add(tagTypeKey);
      }

      return Array.from(nextKeys);
    });
  };
  const handleTimelineScaleChange = (direction: "in" | "out") => {
    setTimelineScaleIndex((currentIndex) => getNextTimelineScaleIndex(currentIndex, direction));
  };

  return (
    <section className={cn(SURFACE_CLASS, "overflow-hidden")}>
      <div className="flex flex-col gap-3 border-b border-custom-border-200 px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1">
          <Tooltip tooltipContent="Jump to previous tag" isMobile={false}>
            <button
              type="button"
              onClick={jumpToPreviousTag}
              disabled={!hasTimelineRows}
              className={cn(TOOL_BUTTON_CLASS, !hasTimelineRows && "cursor-not-allowed opacity-40")}
            >
              <SkipBack className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip tooltipContent="Jump to next tag" isMobile={false}>
            <button
              type="button"
              onClick={jumpToNextTag}
              disabled={!hasTimelineRows}
              className={cn(TOOL_BUTTON_CLASS, !hasTimelineRows && "cursor-not-allowed opacity-40")}
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </Tooltip>
          <div className="mx-2 h-6 w-px bg-custom-border-200" />
          <Tooltip tooltipContent="Reset playhead" isMobile={false}>
            <button type="button" onClick={onResetPlayback} className={TOOL_BUTTON_CLASS}>
              <RotateCcw className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Tooltip tooltipContent="Tag types" isMobile={false}>
            <button
              type="button"
              onClick={() => setIsTagTypesPanelOpen(true)}
              disabled={totalTagTypeCount === 0}
              className={cn(
                TEXT_TOOL_BUTTON_CLASS,
                isTagTypesPanelOpen
                  ? "border-custom-primary-100/30 bg-custom-primary-100/15 text-custom-primary-100"
                  : "border-custom-border-200 bg-custom-background-100 text-custom-text-300 hover:bg-custom-background-90 hover:text-custom-text-100",
                totalTagTypeCount === 0 && "cursor-not-allowed opacity-40"
              )}
            >
              <Tags className="h-3.5 w-3.5" />
              <span>Tags</span>
              <span className="text-custom-text-400">
                {visibleTagTypeCount}/{totalTagTypeCount}
              </span>
            </button>
          </Tooltip>
          <div className="inline-flex h-8 overflow-hidden rounded-md border border-custom-border-200 bg-custom-background-100">
            <Tooltip tooltipContent="Timeline view" isMobile={false}>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center bg-custom-background-80 text-custom-text-100"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
            <Tooltip tooltipContent="Time labels" isMobile={false}>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center border-l border-custom-border-200 text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100"
              >
                <Clock3 className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
            <Tooltip tooltipContent="Expand lanes" isMobile={false}>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center border-l border-custom-border-200 text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="flex overflow-hidden">
        <div className="w-[220px] shrink-0 border-r border-custom-border-200">
          {timelineLanes.map((lane) => (
            <div
              key={lane.id}
              className={cn(
                "flex h-10 items-center justify-between border-l-2 px-2 text-xs",
                LANE_TONE_CLASS[lane.tone]
              )}
            >
              <span className="min-w-0 truncate">{lane.label}</span>
              <Eye className="h-3 w-3 shrink-0 opacity-70" />
            </div>
          ))}
          <div className="flex h-10 items-center justify-between border-t border-custom-border-200 px-3 text-[11px] text-custom-text-400">
            <span>Scale Size</span>
            <span className="inline-flex items-center gap-2">
              <Tooltip tooltipContent="Zoom out timeline" isMobile={false}>
                <button
                  type="button"
                  aria-label="Zoom out timeline"
                  onClick={() => handleTimelineScaleChange("out")}
                  disabled={!canZoomOut}
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100",
                    !canZoomOut && "cursor-not-allowed opacity-40"
                  )}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
              <span className="min-w-9 text-center tabular-nums">{getTimelineScaleLabel(timelineScale)}</span>
              <Tooltip tooltipContent="Zoom in timeline" isMobile={false}>
                <button
                  type="button"
                  aria-label="Zoom in timeline"
                  onClick={() => handleTimelineScaleChange("in")}
                  disabled={!canZoomIn}
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100",
                    !canZoomIn && "cursor-not-allowed opacity-40"
                  )}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            </span>
          </div>
        </div>

        <div
          ref={timelineScrollRef}
          className="horizontal-scrollbar scrollbar-sm min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-2"
        >
          <div
            className="relative transition-[width] duration-150 ease-out"
            style={{ minWidth: "100%", width: timelineContentWidth }}
          >
            <div
              ref={playheadElementRef}
              className="absolute top-0 z-[3] h-[calc(100%-2.5rem)] w-1 -translate-x-1/2 rounded-full bg-red-500 will-change-[left]"
              style={{ left: playheadPositionPx }}
            />
            {timelineLanes.map((lane) => {
              const laneMarkerOffsets = buildLaneMarkerOffsets(lane.rows, rowPlacements);

              return (
                <div key={lane.id} className="relative h-10 border-b border-custom-border-200 bg-custom-background-90">
                  {lane.rows.map((row) => {
                    const placement = rowPlacements[row.id] ?? {
                      endSeconds: DEFAULT_TIMELINE_TAG_DURATION_SECONDS,
                      startSeconds: 0,
                    };
                    const range = getPlacementRange(placement);
                    const markerColor =
                      tagTypeOptionsByKey.get(getTimelineTagTypeKey(row))?.color ??
                      MARKER_COLORS[hashString(`${row.action}-${row.player}-${row.timecode}`) % MARKER_COLORS.length];
                    const isActive =
                      activeTagRowId === row.id || activePlaybackOverrideId === buildTagPlaybackOverrideId(row);
                    const isSelected = selectedTagIds.includes(row.id);
                    const markerOffset = (laneMarkerOffsets[row.id] ?? 0) % 3;

                    return (
                      <Tooltip
                        key={`${lane.id}-${row.id}`}
                        tooltipContent={<TimelineTagTooltip placement={placement} row={row} />}
                        className="rounded-md border border-[#b8dcb5] bg-[#dff6dc] px-2 py-1 shadow-lg"
                        openDelay={80}
                        isMobile={false}
                        position="top"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            handlePlayTimelineRow(row);
                          }}
                          className={cn(
                            "absolute h-7 min-w-1.5 overflow-hidden rounded-md border border-transparent text-left text-[10px] font-medium leading-7 text-white/95 shadow-sm transition-[box-shadow,filter] hover:brightness-110",
                            isActive && "ring-2 ring-custom-primary-100",
                            isSelected && "border-white/80"
                          )}
                          style={{
                            backgroundColor: markerColor,
                            left: range.leftPx,
                            top: 6 + markerOffset * 3,
                            width: range.widthPx,
                          }}
                          aria-pressed={isActive || isSelected}
                        >
                          <span className="pointer-events-none block truncate px-1.5">
                            {formatTooltipText(row.action, "title") || "Tag"}
                          </span>
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              );
            })}

            <div className="relative h-10 border-t border-custom-border-200 bg-custom-background-100">
              {visibleTicks.map((tick) => (
                <div
                  key={`tick-${tick.label}`}
                  className="absolute top-0 flex h-full -translate-x-1/2 items-center text-[11px] text-custom-text-400"
                  style={{ left: `${tick.position}%` }}
                >
                  {tick.label}
                </div>
              ))}
              <Plus className="absolute bottom-0 right-1 h-4 w-4 text-custom-text-400" />
            </div>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="border-t border-custom-border-200 px-5 py-10 text-center text-sm text-custom-text-400">
          No SG tags matched the current filter set.
        </div>
      ) : visibleTimelineRows.length === 0 ? (
        <div className="border-t border-custom-border-200 px-5 py-10 text-center text-sm text-custom-text-400">
          No SG tags match the visible tag types.
        </div>
      ) : null}

      {isMediaLoading && (
        <div className="border-t border-custom-border-200 px-4 py-2.5 text-xs text-custom-text-400">
          Syncing SG media package and playlist references for this event.
        </div>
      )}

      {isTagTypesPanelOpen && (
        <div
          className="fixed inset-0 z-30 flex justify-end bg-black/50"
          role="presentation"
          onClick={() => setIsTagTypesPanelOpen(false)}
        >
          <aside
            aria-label="Tag types"
            aria-modal="true"
            className="flex h-full w-full max-w-[340px] flex-col border-l border-custom-border-200 bg-custom-background-100 shadow-xl"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-custom-border-200 px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-custom-text-100">Tag types</h3>
                  <p className="mt-0.5 text-xs text-custom-text-400">
                    {visibleTagTypeCount} of {totalTagTypeCount} shown
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTagTypesPanelOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <label className="flex h-9 items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-90 px-3 text-sm text-custom-text-300">
                <Search className="h-4 w-4" />
                <input
                  value={tagTypeSearchQuery}
                  onChange={(event) => setTagTypeSearchQuery(event.target.value)}
                  placeholder="Search tag types"
                  className="min-w-0 flex-1 bg-transparent text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400"
                />
              </label>
            </div>

            <div className="flex gap-3 border-b border-custom-border-200 px-4 py-2.5">
              <button
                type="button"
                onClick={() => setVisibleTagTypeKeys(defaultVisibleTagTypeKeys)}
                className="text-xs font-medium text-custom-primary-100 hover:underline"
              >
                Show all
              </button>
              <button
                type="button"
                onClick={() => setVisibleTagTypeKeys([])}
                className="text-xs font-medium text-custom-primary-100 hover:underline"
              >
                Hide all
              </button>
              <button
                type="button"
                onClick={() => setVisibleTagTypeKeys(null)}
                className="text-xs font-medium text-custom-primary-100 hover:underline"
              >
                Reset to default
              </button>
            </div>

            <div className="vertical-scrollbar scrollbar-md min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {tagTypeGroups.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-custom-text-400">No matching tag types.</div>
              ) : (
                tagTypeGroups.map((group) => {
                  const isCollapsed = Boolean(collapsedTagTypeGroups[group.name]);

                  return (
                    <div key={group.name} className="mb-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedTagTypeGroups((currentValue) => ({
                            ...currentValue,
                            [group.name]: !currentValue[group.name],
                          }))
                        }
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-custom-text-400 transition-colors hover:bg-custom-background-90"
                      >
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isCollapsed && "-rotate-90")} />
                        <span>{group.name}</span>
                      </button>
                      {!isCollapsed && (
                        <div className="flex flex-col">
                          {group.options.map((option) => (
                            <label
                              key={option.key}
                              className="flex cursor-pointer items-center gap-2 rounded-md px-7 py-1.5 text-sm text-custom-text-200 transition-colors hover:bg-custom-background-90"
                            >
                              <input
                                type="checkbox"
                                checked={activeVisibleTagTypeKeySet.has(option.key)}
                                onChange={() => handleToggleTagType(option.key)}
                                className="h-4 w-4 rounded border-custom-border-200 accent-custom-primary-100"
                              />
                              <span
                                aria-hidden="true"
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: option.color }}
                              />
                              <span className="min-w-0 flex-1 truncate" title={option.label}>
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};
