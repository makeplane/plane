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

const getJerseyNumberKeys = (value: string) => {
  const normalizedValue = value.trim().replace(/^#/, "").replace(/\s+/g, "");
  const numberMatch = normalizedValue.match(/^\d+$/)
    ? normalizedValue
    : (value.match(/#\s*([A-Za-z0-9-]+)/)?.[1] ?? value.match(/\b(\d{1,3})\b/)?.[1] ?? "");

  if (!numberMatch) return [];

  const normalizedNumber = numberMatch.replace(/^#/, "").replace(/\s+/g, "");
  const withoutLeadingZeros = normalizedNumber.replace(/^0+(?=\d)/, "");

  return Array.from(new Set([normalizedNumber.toLowerCase(), withoutLeadingZeros.toLowerCase()].filter(Boolean)));
};

const getPlayerLaneKey = (player: string) => getJerseyNumberKeys(player)[0] ?? normalizeLabel(player);

const formatPlayerLaneLabel = (player: string, playerLabelByNumber: Map<string, string>) => {
  const rosterLabel = getJerseyNumberKeys(player)
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

const getComparableText = (row: SgTagRow) =>
  [row.action, row.result, row.primaryDetail, row.secondaryDetail, row.team, row.groupValue]
    .join(" ")
    .toLowerCase()
    .replace(/[_-]+/g, " ");

const getCategoryLaneId = (row: SgTagRow, categoryLanes: CategoryLaneDefinition[]) => {
  const text = getComparableText(row);
  const matchedLane = categoryLanes.find((lane) => lane.keywords.some((keyword) => text.includes(keyword)));

  return matchedLane?.id ?? categoryLanes[0]?.id ?? "actions";
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

    const laneId = getCategoryLaneId(row, categoryLanes);
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

const getRowTimecodeStartSeconds = (row: SgTagRow, timelineDurationSeconds: number | null) => {
  const seconds = row.clipStartSeconds ?? parseTimecodeToSeconds(getTimecodeStart(row.timecode));

  if (seconds === null || !isPlausibleTimelineSecond(seconds, timelineDurationSeconds)) return null;

  return seconds;
};

const getRowEndSeconds = (row: SgTagRow, timelineDurationSeconds: number | null) => {
  if (row.clipEndSeconds !== null && isPlausibleTimelineSecond(row.clipEndSeconds, timelineDurationSeconds)) {
    return row.clipEndSeconds;
  }

  const rangeEnd = row.timecode.split(/\s*[-\u2013\u2014]\s*/)[1];
  const rangeEndSeconds = rangeEnd ? parseTimecodeToSeconds(rangeEnd) : null;

  if (rangeEndSeconds === null || !isPlausibleTimelineSecond(rangeEndSeconds, timelineDurationSeconds)) return null;

  return rangeEndSeconds;
};

const getTimestampMs = (value: string | null) => {
  if (!value) return null;

  const parsedValue = Date.parse(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

const getRowTimestampMs = (row: SgTagRow) =>
  getTimestampMs(row.playlistTimestamp) ?? getTimestampMs(row.playlistFallbackTimestamp);

const getRowDurationSeconds = (row: SgTagRow, timelineDurationSeconds: number | null) => {
  const startSeconds = getRowTimecodeStartSeconds(row, timelineDurationSeconds);
  const endSeconds = getRowEndSeconds(row, timelineDurationSeconds);

  if (startSeconds !== null && endSeconds !== null && endSeconds > startSeconds) {
    return endSeconds - startSeconds;
  }

  return 12;
};

const buildTimelinePlacements = (rows: SgTagRow[], timelineDurationSeconds: number | null) => {
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

    return Math.max(maxSeconds, placement.startSeconds + getRowDurationSeconds(placement.row, timelineDurationSeconds));
  }, 0);
  const fallbackRows = directPlacements.filter((placement) => placement.startSeconds === null);
  const fallbackWindowSeconds =
    timelineDurationSeconds !== null && timelineDurationSeconds > 0
      ? timelineDurationSeconds
      : Math.max(60, Math.ceil(maxKnownSeconds / 300) * 300);
  let fallbackIndex = 0;

  return directPlacements.reduce<Record<string, TimelineRowPlacement>>((accumulator, placement) => {
    const durationSeconds = getRowDurationSeconds(placement.row, timelineDurationSeconds);
    const fallbackStartSeconds =
      fallbackRows.length > 0 ? ((fallbackIndex + 1) * fallbackWindowSeconds) / (fallbackRows.length + 1) : 0;
    const startSeconds = placement.startSeconds ?? fallbackStartSeconds;

    if (placement.startSeconds === null) {
      fallbackIndex += 1;
    }

    accumulator[placement.row.id] = {
      endSeconds: startSeconds + durationSeconds,
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

const buildTickStepSeconds = (totalSeconds: number) => {
  if (totalSeconds <= 60) return 5;
  if (totalSeconds <= 180) return 10;
  if (totalSeconds <= 600) return 30;
  if (totalSeconds <= 1800) return 60;
  if (totalSeconds <= 5400) return 300;
  return 600;
};

const formatTickLabel = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const useSmoothedPlayheadSeconds = (playheadSeconds: number) => {
  const [smoothedPlayheadSeconds, setSmoothedPlayheadSeconds] = useState(playheadSeconds);
  const smoothedPlayheadSecondsRef = useRef(playheadSeconds);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const targetSeconds = Number.isFinite(playheadSeconds) ? playheadSeconds : 0;
    const startSeconds = smoothedPlayheadSecondsRef.current;
    const deltaSeconds = targetSeconds - startSeconds;
    const absoluteDeltaSeconds = Math.abs(deltaSeconds);

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (absoluteDeltaSeconds < 0.08 || absoluteDeltaSeconds > 2.5) {
      smoothedPlayheadSecondsRef.current = targetSeconds;
      setSmoothedPlayheadSeconds(targetSeconds);
      return;
    }

    const startedAtMs = performance.now();
    const durationMs = Math.min(1000, Math.max(120, absoluteDeltaSeconds * 1000));

    const animate = (timestampMs: number) => {
      const progress = Math.min(1, (timestampMs - startedAtMs) / durationMs);
      const nextSeconds = startSeconds + deltaSeconds * progress;

      smoothedPlayheadSecondsRef.current = nextSeconds;
      setSmoothedPlayheadSeconds(nextSeconds);

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current === null) return;
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [playheadSeconds]);

  return smoothedPlayheadSeconds;
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
  const startLabel = formatTickLabel(placement.startSeconds);
  const endLabel =
    placement.endSeconds !== null && placement.endSeconds > placement.startSeconds
      ? formatTickLabel(placement.endSeconds)
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

const buildPlayerLaneId = (player: string) => `player-${player}`;

const buildPlayerLanes = (rows: SgTagRow[], playerLabelByNumber: Map<string, string>) => {
  const playerCounts = rows.reduce<Map<string, number>>((accumulator, row) => {
    const player = normalizeLabel(row.player);
    if (!player || player === "--") return accumulator;

    const playerKey = getPlayerLaneKey(player);
    accumulator.set(playerKey, (accumulator.get(playerKey) ?? 0) + 1);
    return accumulator;
  }, new Map<string, number>());

  return Array.from(playerCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([playerKey], index) => ({
      id: buildPlayerLaneId(playerKey),
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
    const player = normalizeLabel(row.player);
    const categoryLaneId = getCategoryLaneId(row, categoryLaneDefinitions);
    const laneId = player && player !== "--" ? buildPlayerLaneId(getPlayerLaneKey(player)) : categoryLaneId;
    const lane = lanesById.get(laneId) ?? lanesById.get(categoryLaneId) ?? coreLanes[0];

    lane.rows.push(row);
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
  const timelineTrackRef = useRef<HTMLDivElement | null>(null);
  const [timelineTrackWidth, setTimelineTrackWidth] = useState(0);
  const [isTagTypesPanelOpen, setIsTagTypesPanelOpen] = useState(false);
  const [visibleTagTypeKeys, setVisibleTagTypeKeys] = useState<string[] | null>(null);
  const [tagTypeSearchQuery, setTagTypeSearchQuery] = useState("");
  const [collapsedTagTypeGroups, setCollapsedTagTypeGroups] = useState<Record<string, boolean>>({});
  const isTagClipActive = activePlaybackOverrideId?.startsWith("sg-tag-") ?? false;
  const timelineDurationSeconds = isTagClipActive ? null : playerDurationSeconds;
  const smoothedPlayheadSeconds = useSmoothedPlayheadSeconds(playheadSeconds);
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
  const rowPlacements = useMemo(
    () => buildTimelinePlacements(visibleTimelineRows, timelineDurationSeconds),
    [timelineDurationSeconds, visibleTimelineRows]
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
    (row) => row.id === activeTagRowId || activePlaybackOverrideId === buildTagPlaybackOverrideId(row)
  );
  const maxRowSeconds = Object.values(rowPlacements).reduce(
    (maxSeconds, placement) => Math.max(maxSeconds, placement.endSeconds ?? placement.startSeconds),
    0
  );
  const knownTimelineExtentSeconds = Math.max(maxRowSeconds, timelineDurationSeconds ?? 0, 60);
  const overflowTimelineExtentSeconds =
    playheadSeconds > knownTimelineExtentSeconds
      ? Math.ceil(playheadSeconds / PLAYHEAD_OVERFLOW_BUCKET_SECONDS) * PLAYHEAD_OVERFLOW_BUCKET_SECONDS
      : knownTimelineExtentSeconds;
  const timelineExtentSeconds = Math.max(knownTimelineExtentSeconds, overflowTimelineExtentSeconds);
  const totalSeconds = Math.max(1, Math.ceil(timelineExtentSeconds || 0));
  const playheadPosition = Math.min(Math.max((smoothedPlayheadSeconds * 100) / totalSeconds, 0), 100);
  const playheadOffsetPx = timelineTrackWidth > 0 ? (playheadPosition / 100) * timelineTrackWidth : 0;
  const playheadStyle =
    timelineTrackWidth > 0
      ? { transform: `translate3d(${playheadOffsetPx}px, 0, 0) translateX(-50%)` }
      : { left: `${playheadPosition}%` };
  const tickStepSeconds = buildTickStepSeconds(totalSeconds);
  const ticks = Array.from({ length: Math.floor(totalSeconds / tickStepSeconds) + 1 }, (_, index) => {
    const tickSeconds = index * tickStepSeconds;

    return {
      label: formatTickLabel(tickSeconds),
      position: (tickSeconds * 100) / totalSeconds,
    };
  });
  const visibleTicks =
    ticks.at(-1)?.position === 100
      ? ticks
      : [
          ...ticks,
          {
            label: formatTickLabel(totalSeconds),
            position: 100,
          },
        ];
  const hasTimelineRows = sortedTimelineRows.length > 0;
  const jumpToPreviousTag = () => {
    if (!hasTimelineRows) return;

    const previousRow =
      activeTimelineRowIndex >= 0
        ? sortedTimelineRows[(activeTimelineRowIndex - 1 + sortedTimelineRows.length) % sortedTimelineRows.length]
        : ([...sortedTimelineRows]
            .reverse()
            .find((row) => (rowPlacements[row.id]?.startSeconds ?? 0) < Math.max(0, playheadSeconds - 0.5)) ??
          sortedTimelineRows.at(-1));

    if (previousRow) {
      void onPlayTagRow(previousRow);
    }
  };
  const jumpToNextTag = () => {
    if (!hasTimelineRows) return;

    const nextRow =
      activeTimelineRowIndex >= 0
        ? sortedTimelineRows[(activeTimelineRowIndex + 1) % sortedTimelineRows.length]
        : (sortedTimelineRows.find((row) => (rowPlacements[row.id]?.startSeconds ?? 0) > playheadSeconds + 0.5) ??
          sortedTimelineRows[0]);

    if (nextRow) {
      void onPlayTagRow(nextRow);
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

  useEffect(() => {
    const trackElement = timelineTrackRef.current;
    if (!trackElement) return;

    const updateTrackWidth = () => {
      setTimelineTrackWidth(trackElement.getBoundingClientRect().width);
    };

    updateTrackWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateTrackWidth);
      return () => {
        window.removeEventListener("resize", updateTrackWidth);
      };
    }

    const resizeObserver = new ResizeObserver(updateTrackWidth);
    resizeObserver.observe(trackElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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

      <div className="flex min-h-[360px] overflow-hidden">
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
            <span className="inline-flex items-center gap-3">
              <Minus className="h-3.5 w-3.5" />
              <Plus className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <div ref={timelineTrackRef} className="relative min-w-[1400px]">
            <div
              className="absolute left-0 top-0 z-[3] h-[calc(100%-2.5rem)] w-1 rounded-full bg-red-500 will-change-transform"
              style={playheadStyle}
            />
            {timelineLanes.map((lane) => {
              const laneMarkerOffsets = buildLaneMarkerOffsets(lane.rows, rowPlacements);

              return (
                <div key={lane.id} className="relative h-10 border-b border-custom-border-200 bg-custom-background-90">
                  {lane.rows.map((row) => {
                    const placement = rowPlacements[row.id] ?? { endSeconds: 12, startSeconds: 0 };
                    const startSeconds = placement.startSeconds;
                    const left = Math.min(Math.max((startSeconds * 100) / totalSeconds, 0), 99.3);
                    const markerColor =
                      tagTypeOptionsByKey.get(getTimelineTagTypeKey(row))?.color ??
                      MARKER_COLORS[hashString(`${row.action}-${row.player}-${row.timecode}`) % MARKER_COLORS.length];
                    const isActive =
                      activeTagRowId === row.id || activePlaybackOverrideId === buildTagPlaybackOverrideId(row);
                    const isSelected = selectedTagIds.includes(row.id);
                    const markerOffset = (laneMarkerOffsets[row.id] ?? 0) * 5;

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
                            void onPlayTagRow(row);
                          }}
                          className={cn(
                            "absolute top-1/2 h-9 w-1.5 -translate-y-1/2 rounded-full border border-transparent transition-transform hover:scale-125",
                            isActive && "ring-2 ring-custom-primary-100",
                            isSelected && "border-white/80"
                          )}
                          style={{ backgroundColor: markerColor, left: `calc(${left}% + ${markerOffset}px)` }}
                        />
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
