"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, PointerEvent, UIEvent, WheelEvent } from "react";
import {
  Check,
  Eye,
  ListPlus,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  SkipBack,
  SkipForward,
  Tags,
  X,
} from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import { SURFACE_CLASS } from "../../constants";
import type { SgTagRow, SportTableKind } from "../../types";
import {
  TIMELINE_HORIZONTAL_SCROLL_CLASS,
  TIMELINE_LANE_LABEL_COLUMN_CLASS,
  TIMELINE_PANEL_ROOT_CLASS,
  TIMELINE_RULER_SCROLL_CLASS,
  TIMELINE_STICKY_FOOTER_CLASS,
  TIMELINE_TRACKS_ROW_CLASS,
  TIMELINE_TRACKS_SCROLL_CLASS,
  getTimelineHorizontalWheelDeltaPx,
} from "../utils/timeline-layout";
import {
  buildLaneMarkerOffsets,
  buildSortedTimelineRows,
  buildTagPlaybackOverrideId,
  buildTimelineLanes,
  buildTimelinePlacements,
  buildTimelineTagTypeOptions,
  getPlaybackOverrideRowId,
  getPositiveDurationSeconds,
  getTimelinePrimaryTagTypeKey,
  getTimelineRowTagTypeKeys,
  hashString,
  LANE_TONE_CLASS,
  MARKER_COLORS,
  PLAYHEAD_OVERFLOW_BUCKET_SECONDS,
} from "../utils/timeline-model";
import type { TimelineRowPlacement, TimelineTagTypeOption } from "../utils/timeline-model";
import {
  DEFAULT_TIMELINE_TAG_DURATION_SECONDS,
  DEFAULT_TIMELINE_SCALE_INDEX,
  TIMELINE_SCALE_LEVELS,
  buildScaledTimelineTicks,
  getNextTimelineScaleIndex,
  getTimelineContentWidth,
  getTimelinePlaybackSeconds,
  getTimelineRangePixels,
  getTimelineScaleIndexFromSliderValue,
  getTimelineScaleLabel,
  getTimelineSecondsFromClientX,
  getTimelineTimePixel,
  isTimelineTagPlaybackOverrideId,
} from "../utils/timeline-scale";
import { formatTooltipText, TimelineTagTooltip } from "./timeline-tag-tooltip";
import { TimelineTagTypesPanel } from "./timeline-tag-types-panel";

type SgEventTimelinePanelProps = {
  activePlaybackOverrideId: string | null;
  activeTagRowId: string | null;
  isCreatingPlaylist?: boolean;
  isMediaLoading: boolean;
  isPlaylistSelectionMode?: boolean;
  onClearTagSelection?: () => void;
  onCreatePlaylist?: () => void;
  isPlayerPlaying: boolean;
  onPlayTagRow: (row: SgTagRow) => Promise<void>;
  onPlaylistSelectionModeChange?: (nextValue: boolean) => void;
  onResetPlayback: () => void;
  onSeekTimelineSeconds?: (seconds: number) => void;
  onToggleTagSelection: (tagId: string) => void;
  playerDurationSeconds: number | null;
  playheadSeconds: number;
  playerPlaybackRate: number;
  playerLabelByNumber: Map<string, string>;
  rows: SgTagRow[];
  selectedTagIds: string[];
  sport: SportTableKind;
  tagTypeRows?: SgTagRow[];
};

const TOOL_BUTTON_CLASS =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100";
const TEXT_TOOL_BUTTON_CLASS =
  "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors";

const getPlayheadTransform = (positionPx: number) => `translate3d(${positionPx}px, 0, 0) translateX(-50%)`;

const getTimelineTickLabelClassName = (position: number) =>
  cn(
    "absolute top-4 whitespace-nowrap text-[10px] font-medium tabular-nums leading-none text-custom-text-400",
    position <= 0 ? "translate-x-0" : position >= 100 ? "-translate-x-full" : "-translate-x-1/2"
  );

export const SgEventTimelinePanel = ({
  activePlaybackOverrideId,
  activeTagRowId,
  isCreatingPlaylist = false,
  isMediaLoading,
  isPlaylistSelectionMode = false,
  onClearTagSelection,
  onCreatePlaylist,
  isPlayerPlaying,
  onPlayTagRow,
  onPlaylistSelectionModeChange,
  onResetPlayback,
  onSeekTimelineSeconds,
  onToggleTagSelection,
  playerDurationSeconds,
  playheadSeconds,
  playerPlaybackRate,
  playerLabelByNumber,
  rows,
  selectedTagIds,
  sport,
  tagTypeRows,
}: SgEventTimelinePanelProps) => {
  const [isTagTypesPanelOpen, setIsTagTypesPanelOpen] = useState(false);
  const [visibleTagTypeKeys, setVisibleTagTypeKeys] = useState<string[] | null>(null);
  const [tagTypeSearchQuery, setTagTypeSearchQuery] = useState("");
  const [collapsedTagTypeGroups, setCollapsedTagTypeGroups] = useState<Record<string, boolean>>({});
  const [timelineScaleIndex, setTimelineScaleIndex] = useState(DEFAULT_TIMELINE_SCALE_INDEX);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  const timelineRulerScrollRef = useRef<HTMLDivElement | null>(null);
  const playheadTrackElementRef = useRef<HTMLDivElement | null>(null);
  const playheadRulerElementRef = useRef<HTMLDivElement | null>(null);
  const skimmerTrackElementRef = useRef<HTMLDivElement | null>(null);
  const skimmerRulerElementRef = useRef<HTMLDivElement | null>(null);
  const skimmerSecondsRef = useRef<number | null>(null);
  const lastTimelinePointerClientXRef = useRef<number | null>(null);
  const lastTimelinePointerViewportRef = useRef<HTMLDivElement | null>(null);
  const fullStreamDurationSecondsRef = useRef<number | null>(null);
  const isTagClipActive = isTimelineTagPlaybackOverrideId(activePlaybackOverrideId);
  const activePlaybackRowId = getPlaybackOverrideRowId(activePlaybackOverrideId);
  const timelineDurationSeconds = isTagClipActive ? fullStreamDurationSecondsRef.current : playerDurationSeconds;
  const tagTypeSourceRows = tagTypeRows ?? rows;
  const tagTypeOptions = useMemo(
    () => buildTimelineTagTypeOptions(tagTypeSourceRows, sport),
    [sport, tagTypeSourceRows]
  );
  const defaultVisibleTagTypeKeys = useMemo(
    () => tagTypeOptions.filter((option) => option.defaultVisible).map((option) => option.key),
    [tagTypeOptions]
  );
  const tagTypeOptionKeySet = useMemo(() => new Set(tagTypeOptions.map((option) => option.key)), [tagTypeOptions]);
  const activeVisibleTagTypeKeys = useMemo(
    () => (visibleTagTypeKeys ?? defaultVisibleTagTypeKeys).filter((key) => tagTypeOptionKeySet.has(key)),
    [defaultVisibleTagTypeKeys, tagTypeOptionKeySet, visibleTagTypeKeys]
  );
  const activeVisibleTagTypeKeySet = useMemo(() => new Set(activeVisibleTagTypeKeys), [activeVisibleTagTypeKeys]);
  const tagTypeOptionsByKey = useMemo(
    () => new Map(tagTypeOptions.map((option) => [option.key, option])),
    [tagTypeOptions]
  );
  const visibleTimelineRows = useMemo(
    () =>
      rows.filter((row) => getTimelineRowTagTypeKeys(row, sport).some((key) => activeVisibleTagTypeKeySet.has(key))),
    [activeVisibleTagTypeKeySet, rows, sport]
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
  const visibleTicks = buildScaledTimelineTicks(totalSeconds, timelineScale, timelineContentWidth);
  const canZoomOut = timelineScaleIndex > 0;
  const canZoomIn = timelineScaleIndex < TIMELINE_SCALE_LEVELS.length - 1;
  const hasTimelineRows = sortedTimelineRows.length > 0;
  const selectedTagCount = selectedTagIds.length;
  const canCreatePlaylist = Boolean(onCreatePlaylist) && selectedTagCount > 0 && !isCreatingPlaylist;
  const seekableDurationSeconds = Math.max(
    0,
    timelineDurationSeconds ?? fullStreamDurationSecondsRef.current ?? totalSeconds
  );

  const setTimelineIndicatorPosition = useCallback(
    (element: HTMLDivElement | null, seconds: number) => {
      if (!element) return;

      element.style.transform = getPlayheadTransform(getTimelineTimePixel(seconds, totalSeconds, timelineContentWidth));
    },
    [timelineContentWidth, totalSeconds]
  );

  const setPlaybackPlayheadPosition = useCallback(
    (seconds: number) => {
      setTimelineIndicatorPosition(playheadTrackElementRef.current, seconds);
      setTimelineIndicatorPosition(playheadRulerElementRef.current, seconds);
    },
    [setTimelineIndicatorPosition]
  );

  const setTimelineSkimmerVisible = useCallback((isVisible: boolean) => {
    const opacity = isVisible ? "1" : "0";

    if (skimmerTrackElementRef.current) {
      skimmerTrackElementRef.current.style.opacity = opacity;
    }
    if (skimmerRulerElementRef.current) {
      skimmerRulerElementRef.current.style.opacity = opacity;
    }
  }, []);

  const setTimelineSkimmerPosition = useCallback(
    (seconds: number) => {
      skimmerSecondsRef.current = seconds;
      setTimelineIndicatorPosition(skimmerTrackElementRef.current, seconds);
      setTimelineIndicatorPosition(skimmerRulerElementRef.current, seconds);
      setTimelineSkimmerVisible(true);
    },
    [setTimelineIndicatorPosition, setTimelineSkimmerVisible]
  );

  const getTimelinePointerSeconds = useCallback(
    (clientX: number, viewportElement: HTMLDivElement) => {
      const viewportRect = viewportElement.getBoundingClientRect();
      const scrollLeftPx = timelineRulerScrollRef.current?.scrollLeft ?? timelineScrollRef.current?.scrollLeft ?? 0;

      return getTimelineSecondsFromClientX({
        clientX,
        contentWidthPx: timelineContentWidth,
        scrollLeftPx,
        seekableSeconds: seekableDurationSeconds,
        totalSeconds,
        viewportLeftPx: viewportRect.left,
      });
    },
    [seekableDurationSeconds, timelineContentWidth, totalSeconds]
  );

  const isTimelineHorizontalScrollbarPointer = useCallback(
    (event: { clientY: number }, element: HTMLDivElement) => {
      const scrollbarHeight = Math.max(0, element.offsetHeight - element.clientHeight);
      if (scrollbarHeight <= 0) return false;

      return event.clientY >= element.getBoundingClientRect().bottom - scrollbarHeight;
    },
    []
  );

  const refreshTimelineSkimmerFromLastPointer = useCallback(() => {
    const lastClientX = lastTimelinePointerClientXRef.current;
    const lastViewportElement = lastTimelinePointerViewportRef.current;
    if (lastClientX === null || !lastViewportElement || skimmerSecondsRef.current === null) return;

    setTimelineSkimmerPosition(getTimelinePointerSeconds(lastClientX, lastViewportElement));
  }, [getTimelinePointerSeconds, setTimelineSkimmerPosition]);

  const handleTimelinePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (isTimelineHorizontalScrollbarPointer(event, event.currentTarget)) return;

      lastTimelinePointerClientXRef.current = event.clientX;
      lastTimelinePointerViewportRef.current = event.currentTarget;
      setTimelineSkimmerPosition(getTimelinePointerSeconds(event.clientX, event.currentTarget));
    },
    [getTimelinePointerSeconds, isTimelineHorizontalScrollbarPointer, setTimelineSkimmerPosition]
  );

  const handleTimelinePointerLeave = useCallback(() => {
    skimmerSecondsRef.current = null;
    lastTimelinePointerClientXRef.current = null;
    lastTimelinePointerViewportRef.current = null;
    setTimelineSkimmerVisible(false);
  }, [setTimelineSkimmerVisible]);

  const handleTimelineSeekClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0 || isTimelineHorizontalScrollbarPointer(event, event.currentTarget)) return;

      const seekSeconds = getTimelinePointerSeconds(event.clientX, event.currentTarget);
      setPlaybackPlayheadPosition(seekSeconds);
      onSeekTimelineSeconds?.(seekSeconds);
    },
    [
      getTimelinePointerSeconds,
      isTimelineHorizontalScrollbarPointer,
      onSeekTimelineSeconds,
      setPlaybackPlayheadPosition,
    ]
  );

  useEffect(() => {
    if (isTagClipActive || playerDurationSeconds === null || playerDurationSeconds <= 0) return;

    fullStreamDurationSecondsRef.current = playerDurationSeconds;
  }, [isTagClipActive, playerDurationSeconds]);

  useEffect(() => {
    const anchorSeconds = timelinePlayheadSeconds;
    const anchorTimeMs = window.performance.now();
    const activePlaybackRate = Number.isFinite(playerPlaybackRate) && playerPlaybackRate > 0 ? playerPlaybackRate : 1;

    setPlaybackPlayheadPosition(anchorSeconds);

    if (!isPlayerPlaying || anchorSeconds >= totalSeconds) return;

    let animationFrameId = 0;
    const animatePlayhead = (currentTimeMs: number) => {
      const elapsedSeconds = Math.max(0, (currentTimeMs - anchorTimeMs) / 1000) * activePlaybackRate;
      const interpolatedSeconds = Math.min(anchorSeconds + elapsedSeconds, totalSeconds);

      setPlaybackPlayheadPosition(interpolatedSeconds);

      if (interpolatedSeconds < totalSeconds) {
        animationFrameId = window.requestAnimationFrame(animatePlayhead);
      }
    };

    animationFrameId = window.requestAnimationFrame(animatePlayhead);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isPlayerPlaying, playerPlaybackRate, setPlaybackPlayheadPosition, timelinePlayheadSeconds, totalSeconds]);

  useEffect(() => {
    refreshTimelineSkimmerFromLastPointer();
  }, [refreshTimelineSkimmerFromLastPointer]);

  useEffect(() => {
    const trackScrollElement = timelineScrollRef.current;
    const rulerScrollElement = timelineRulerScrollRef.current;
    if (!trackScrollElement || !rulerScrollElement) return;

    trackScrollElement.scrollLeft = rulerScrollElement.scrollLeft;
  }, [timelineContentWidth]);

  const syncTimelineTrackScroll = (nextScrollLeft: number) => {
    const trackScrollElement = timelineScrollRef.current;
    if (!trackScrollElement || Math.abs(trackScrollElement.scrollLeft - nextScrollLeft) < 1) return;

    trackScrollElement.scrollLeft = nextScrollLeft;
  };

  const handleTimelineRulerScroll = (event: UIEvent<HTMLDivElement>) => {
    syncTimelineTrackScroll(event.currentTarget.scrollLeft);
    refreshTimelineSkimmerFromLastPointer();
  };

  const scrollTimelineTo = (nextScrollLeft: number, behavior: "auto" | "smooth" = "auto") => {
    const rulerScrollElement = timelineRulerScrollRef.current;
    const trackScrollElement = timelineScrollRef.current;
    const scrollElement = rulerScrollElement ?? trackScrollElement;
    if (!scrollElement) return;

    scrollElement.scrollTo({ behavior, left: nextScrollLeft });
    if (behavior === "auto") {
      syncTimelineTrackScroll(nextScrollLeft);
      refreshTimelineSkimmerFromLastPointer();
    }
  };

  const scrollTimelineBy = (deltaX: number) => {
    const rulerScrollElement = timelineRulerScrollRef.current;
    if (!rulerScrollElement) return false;

    const maxScrollLeft = Math.max(0, rulerScrollElement.scrollWidth - rulerScrollElement.clientWidth);
    const nextScrollLeft = Math.min(Math.max(rulerScrollElement.scrollLeft + deltaX, 0), maxScrollLeft);
    if (Math.abs(rulerScrollElement.scrollLeft - nextScrollLeft) < 1) return false;

    rulerScrollElement.scrollLeft = nextScrollLeft;
    syncTimelineTrackScroll(nextScrollLeft);
    refreshTimelineSkimmerFromLastPointer();
    return true;
  };

  const handleTimelineHorizontalWheel = (event: WheelEvent<HTMLDivElement>) => {
    const deltaX = getTimelineHorizontalWheelDeltaPx({
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      shiftKey: event.shiftKey,
    });
    if (deltaX === 0 || !scrollTimelineBy(deltaX)) return;

    event.preventDefault();
    event.stopPropagation();
  };

  const scrollTimelineRangeIntoView = (
    range: { leftPx: number; widthPx: number },
    behavior: "auto" | "smooth" = "smooth"
  ) => {
    const scrollElement = timelineRulerScrollRef.current ?? timelineScrollRef.current;
    if (!scrollElement) return;

    const rangeLeft = range.leftPx;
    const rangeRight = range.leftPx + range.widthPx;
    const viewportLeft = scrollElement.scrollLeft;
    const viewportRight = viewportLeft + scrollElement.clientWidth;
    const padding = 80;

    if (rangeLeft < viewportLeft + padding) {
      const nextScrollLeft = Math.max(0, rangeLeft - padding);
      scrollTimelineTo(nextScrollLeft, behavior);
      return;
    }

    if (rangeRight > viewportRight - padding) {
      const nextScrollLeft = Math.max(0, rangeRight - scrollElement.clientWidth + padding);
      scrollTimelineTo(nextScrollLeft, behavior);
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
  const handleTimelineScaleSliderChange = (value: string) => {
    setTimelineScaleIndex((currentIndex) => getTimelineScaleIndexFromSliderValue(value, currentIndex));
  };

  return (
    <section className={cn(SURFACE_CLASS, TIMELINE_PANEL_ROOT_CLASS)} onPointerLeave={handleTimelinePointerLeave}>
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
          <button
            type="button"
            disabled={!onPlaylistSelectionModeChange || !hasTimelineRows}
            onClick={() => onPlaylistSelectionModeChange?.(!isPlaylistSelectionMode)}
            className={cn(
              TEXT_TOOL_BUTTON_CLASS,
              isPlaylistSelectionMode
                ? "border-custom-primary-100/30 bg-custom-primary-100/15 text-custom-primary-100"
                : "border-custom-border-200 bg-custom-background-100 text-custom-text-300 hover:bg-custom-background-90 hover:text-custom-text-100",
              (!onPlaylistSelectionModeChange || !hasTimelineRows) && "cursor-not-allowed opacity-40"
            )}
          >
            <MousePointer2 className="h-3.5 w-3.5" />
            <span>{isPlaylistSelectionMode ? "Selecting Clips" : "Select Clips"}</span>
          </button>
          {selectedTagCount > 0 && (
            <>
              <span className="inline-flex h-8 items-center rounded-md border border-custom-border-200 bg-custom-background-100 px-2 text-xs text-custom-text-300">
                {selectedTagCount} selected
              </span>
              <button
                type="button"
                disabled={!onClearTagSelection}
                onClick={onClearTagSelection}
                className={cn(
                  TEXT_TOOL_BUTTON_CLASS,
                  "border-custom-border-200 bg-custom-background-100 text-custom-text-300 hover:bg-custom-background-90 hover:text-custom-text-100 disabled:cursor-not-allowed disabled:opacity-40"
                )}
              >
                <X className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            </>
          )}
          <button
            type="button"
            disabled={!canCreatePlaylist}
            onClick={onCreatePlaylist}
            className={cn(
              TEXT_TOOL_BUTTON_CLASS,
              "border-custom-primary-100 bg-custom-primary-100 text-white hover:border-custom-primary-200 hover:bg-custom-primary-200 disabled:cursor-not-allowed disabled:opacity-40"
            )}
          >
            <ListPlus className="h-3.5 w-3.5" />
            <span>{isCreatingPlaylist ? "Creating" : "Create Playlist"}</span>
          </button>
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
          {/* <div className="inline-flex h-8 overflow-hidden rounded-md border border-custom-border-200 bg-custom-background-100">
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
          </div> */}
        </div>
      </div>

      <div className={TIMELINE_TRACKS_SCROLL_CLASS}>
        <div className={TIMELINE_TRACKS_ROW_CLASS}>
          <div className={TIMELINE_LANE_LABEL_COLUMN_CLASS}>
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
          </div>

          <div
            ref={timelineScrollRef}
            onClick={handleTimelineSeekClick}
            onPointerMove={handleTimelinePointerMove}
            onWheel={handleTimelineHorizontalWheel}
            className={TIMELINE_HORIZONTAL_SCROLL_CLASS}
          >
            <div
              className="relative transition-[width] duration-150 ease-out"
              style={{ minWidth: "100%", width: timelineContentWidth }}
            >
              <div
                ref={playheadTrackElementRef}
                className="pointer-events-none absolute left-0 top-0 z-[4] h-full w-0 border-l-2 border-red-500 will-change-transform"
                style={{ transform: getPlayheadTransform(playheadPositionPx) }}
              />
              <div
                ref={skimmerTrackElementRef}
                className="pointer-events-none absolute left-0 top-0 z-[3] h-full w-0 border-l-2 border-sky-500 opacity-0 will-change-transform"
                style={{ transform: getPlayheadTransform(0) }}
              />
              {timelineLanes.map((lane) => {
                const laneMarkerOffsets = buildLaneMarkerOffsets(lane.rows, rowPlacements);

                return (
                  <div
                    key={lane.id}
                    className="relative h-10 border-b border-custom-border-200 bg-custom-background-90"
                  >
                    {lane.rows.map((row) => {
                      const placement = rowPlacements[row.id] ?? {
                        endSeconds: DEFAULT_TIMELINE_TAG_DURATION_SECONDS,
                        startSeconds: 0,
                      };
                      const range = getPlacementRange(placement);
                      const markerTagTypeKey = getTimelinePrimaryTagTypeKey(row, sport, activeVisibleTagTypeKeySet);
                      const markerColor =
                        tagTypeOptionsByKey.get(markerTagTypeKey)?.color ??
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
                            onClick={(event) => {
                              event.stopPropagation();

                              if (isPlaylistSelectionMode) {
                                event.preventDefault();
                                onToggleTagSelection(row.id);
                                return;
                              }

                              handlePlayTimelineRow(row);
                            }}
                            onDoubleClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();

                              if (!isPlaylistSelectionMode) {
                                onPlaylistSelectionModeChange?.(true);
                                onToggleTagSelection(row.id);
                              }
                            }}
                            className={cn(
                              "absolute h-7 min-w-1.5 overflow-hidden rounded-md border border-transparent text-left text-[10px] font-medium leading-7 text-white/95 shadow-sm transition-[box-shadow,filter] hover:brightness-110",
                              isPlaylistSelectionMode && "cursor-pointer hover:ring-2 hover:ring-white/40",
                              isActive && "ring-2 ring-custom-primary-100",
                              isSelected && "border-white/90 ring-2 ring-white/80"
                            )}
                            style={{
                              backgroundColor: markerColor,
                              left: range.leftPx,
                              top: 6 + markerOffset * 3,
                              width: range.widthPx,
                            }}
                            aria-pressed={isActive || isSelected}
                          >
                            {isSelected && (
                              <span className="pointer-events-none absolute right-0.5 top-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-custom-background-100 shadow">
                                <Check className="h-2.5 w-2.5" />
                              </span>
                            )}
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
            </div>
          </div>
        </div>
      </div>

      <div className={cn(TIMELINE_STICKY_FOOTER_CLASS, "flex border-t border-custom-border-200")}>
        <div
          className={cn(
            TIMELINE_LANE_LABEL_COLUMN_CLASS,
            "flex h-10 items-center gap-2 px-3 text-[11px] text-custom-text-400"
          )}
        >
          <span className="shrink-0">Zoom</span>
          <span className="inline-flex min-w-0 flex-1 items-center justify-end gap-1.5">
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
            <input
              type="range"
              min={0}
              max={TIMELINE_SCALE_LEVELS.length - 1}
              step={1}
              value={timelineScaleIndex}
              onChange={(event) => handleTimelineScaleSliderChange(event.currentTarget.value)}
              aria-label="Timeline zoom"
              aria-valuetext={getTimelineScaleLabel(timelineScale)}
              className="h-6 w-20 accent-custom-primary-100"
            />
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

        <div
          ref={timelineRulerScrollRef}
          onClick={handleTimelineSeekClick}
          onPointerMove={handleTimelinePointerMove}
          onScroll={handleTimelineRulerScroll}
          onWheel={handleTimelineHorizontalWheel}
          className={TIMELINE_RULER_SCROLL_CLASS}
        >
          <div
            className="relative h-10 transition-[width] duration-150 ease-out"
            style={{ minWidth: "100%", width: timelineContentWidth }}
          >
            <div
              ref={playheadRulerElementRef}
              className="pointer-events-none absolute left-0 top-0 z-[5] h-full w-0 border-l-2 border-red-500 will-change-transform"
              style={{ transform: getPlayheadTransform(playheadPositionPx) }}
            >
              <span className="absolute left-1/2 top-0 h-3.5 w-2.5 -translate-x-1/2 rounded-b-sm bg-red-500" />
            </div>
            <div
              ref={skimmerRulerElementRef}
              className="pointer-events-none absolute left-0 top-0 z-[4] h-full w-0 border-l-2 border-sky-500 opacity-0 will-change-transform"
              style={{ transform: getPlayheadTransform(0) }}
            >
              <span className="absolute left-1/2 top-0 h-3.5 w-2.5 -translate-x-1/2 rounded-b-sm bg-sky-500" />
            </div>
            {visibleTicks.map((tick) => {
              const isMajorTick = tick.kind === "major";

              return (
                <div
                  key={`tick-${tick.kind}-${tick.seconds}`}
                  className="pointer-events-none absolute top-0 h-8 -translate-x-px"
                  style={{ left: `${tick.position}%` }}
                  aria-hidden={!isMajorTick}
                >
                  <span
                    className={cn(
                      "block w-px bg-custom-border-300",
                      isMajorTick ? "h-4 bg-custom-text-300" : "h-2.5 opacity-70"
                    )}
                  />
                  {isMajorTick && <span className={getTimelineTickLabelClassName(tick.position)}>{tick.label}</span>}
                </div>
              );
            })}
            <Plus className="absolute bottom-0 right-1 h-4 w-4 text-custom-text-400" />
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

      <TimelineTagTypesPanel
        activeVisibleTagTypeKeySet={activeVisibleTagTypeKeySet}
        collapsedTagTypeGroups={collapsedTagTypeGroups}
        defaultVisibleTagTypeKeys={defaultVisibleTagTypeKeys}
        isOpen={isTagTypesPanelOpen}
        onClose={() => setIsTagTypesPanelOpen(false)}
        onCollapsedTagTypeGroupsChange={setCollapsedTagTypeGroups}
        onSearchQueryChange={setTagTypeSearchQuery}
        onToggleTagType={handleToggleTagType}
        onVisibleTagTypeKeysChange={setVisibleTagTypeKeys}
        tagTypeGroups={tagTypeGroups}
        tagTypeSearchQuery={tagTypeSearchQuery}
        totalTagTypeCount={totalTagTypeCount}
        visibleTagTypeCount={visibleTagTypeCount}
      />
    </section>
  );
};
