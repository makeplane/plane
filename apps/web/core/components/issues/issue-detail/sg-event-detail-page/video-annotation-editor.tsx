"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  UIEvent as ReactUIEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  ChevronRight,
  Circle,
  FastForward,
  Minus,
  Pencil,
  Plus,
  Rewind,
  Save,
  SkipBack,
  SkipForward,
  Square,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type {
  TCustomPlaylistAnnotation,
  TCustomPlaylistAnnotationStrokeStyle,
  TCustomPlaylistAnnotationTool,
} from "@/services/media-library.service";
import {
  PlaylistAnnotationOverlay,
  arePlaylistAnnotationsEqual,
  getActivePlaylistAnnotations,
  normalizePlaylistAnnotations,
} from "./matrix-view/components/playlist-annotation-overlay";

type VideoAnnotationEditorProps = {
  annotationKey: string;
  annotations: TCustomPlaylistAnnotation[] | unknown;
  autoEnableAnnotationModeKey?: number | string;
  canEdit: boolean;
  className?: string;
  currentTime: number;
  durationSeconds?: number | null;
  enableAnnotationTransforms?: boolean;
  enableTextTool?: boolean;
  fitToVideoBounds?: boolean;
  isPlaying?: boolean;
  modeResetKey?: number | string;
  onModeChange?: (enabled: boolean) => void;
  onRequestPause?: () => void;
  onSave: (annotations: TCustomPlaylistAnnotation[]) => Promise<TCustomPlaylistAnnotation[] | void>;
  onSeek?: (seconds: number) => void;
  playbackRate?: number;
  propertyHostElement?: HTMLElement | null;
  toolbarHostElement?: HTMLElement | null;
  showTimeline?: boolean;
  thumbnailUrl?: string | null;
  timelineHostElement?: HTMLElement | null;
};

const DEFAULT_VIDEO_ANNOTATION_COLOR = "#f97316";
const VIDEO_ANNOTATION_COLOR_PRESETS = [
  "#f97316",
  "#ef4444",
  "#eab308",
  "#22c55e",
  "#38bdf8",
  "#6366f1",
  "#a855f7",
  "#ffffff",
  "#111827",
] as const;
const VIDEO_ANNOTATION_DURATIONS = [1, 2, 4, 8];
const VIDEO_ANNOTATION_STROKE_WIDTHS = [3, 5, 8];
const VIDEO_ANNOTATION_STROKE_STYLES: { label: string; value: TCustomPlaylistAnnotationStrokeStyle }[] = [
  { label: "Solid", value: "solid" },
  { label: "Dotted", value: "dotted" },
];
const VIDEO_ANNOTATION_TEXT_FONT_SIZES = [20, 28, 36, 48];
const VIDEO_ANNOTATION_TEXT_FONT_WEIGHTS = [
  { label: "Regular", value: 400 },
  { label: "Bold", value: 700 },
] as const;
const VIDEO_ANNOTATION_TEXT_FONT_FAMILIES = [
  { label: "Sans", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Mono", value: "monospace" },
] as const;
const VIDEO_ANNOTATION_TIMELINE_ZOOM_STEPS = [50, 75, 100, 150, 200, 300];
const VIDEO_ANNOTATION_TIMELINE_DEFAULT_ZOOM_PERCENT = 100;
const VIDEO_ANNOTATION_TIMELINE_CLIP_MIN_WIDTH_PX = 56;
const VIDEO_ANNOTATION_TIMELINE_CLIP_GAP_PX = 8;
const VIDEO_ANNOTATION_TIMELINE_MOMENT_COLUMN_WIDTH_PX = 236;
const VIDEO_ANNOTATION_TIMELINE_MIN_DURATION_SECONDS = 0.1;
const VIDEO_ANNOTATION_TOOL_BUTTON_CLASS =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border border-custom-border-200 bg-custom-background-100 text-custom-text-200 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40 disabled:cursor-not-allowed disabled:opacity-45";
const VIDEO_ANNOTATION_TOOLS = [
  { icon: Pencil, label: "Freehand draw", type: "pen" },
  { icon: Type, label: "Text", type: "text" },
  { icon: Square, label: "Rectangle", type: "rectangle" },
  { icon: Circle, label: "Ellipse", type: "ellipse" },
  { icon: Minus, label: "Line", type: "line" },
  { icon: ArrowUpRight, label: "Arrow", type: "arrow" },
] satisfies Array<{ icon: typeof Pencil; label: string; type: TCustomPlaylistAnnotationTool }>;

const formatAnnotationTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const clampTimelineValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getTimelineDuration = (
  durationSeconds: number | null | undefined,
  annotations: TCustomPlaylistAnnotation[],
  currentTime: number
) => {
  const normalizedDuration = Number(durationSeconds);
  const annotationEndSeconds = annotations.reduce(
    (maxSeconds, annotation) => Math.max(maxSeconds, annotation.startTime, annotation.endTime),
    0
  );
  const fallbackDuration = Math.max(annotationEndSeconds, currentTime, 1);

  return Number.isFinite(normalizedDuration) && normalizedDuration > 0 ? normalizedDuration : fallbackDuration;
};

const getTimelinePercent = (seconds: number, durationSeconds: number) => {
  if (!Number.isFinite(seconds) || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;

  return clampTimelineValue((seconds / durationSeconds) * 100, 0, 100);
};

const getAnnotationColor = (annotation: TCustomPlaylistAnnotation) => {
  const style = annotation.style ?? {};
  return typeof style.stroke === "string" ? style.stroke : typeof style.color === "string" ? style.color : "#f97316";
};

const normalizeAnnotationHexColor = (value: string) => {
  const trimmedValue = value.trim();
  const prefixedValue = trimmedValue.startsWith("#") ? trimmedValue : `#${trimmedValue}`;

  return /^#[0-9a-fA-F]{6}$/.test(prefixedValue) ? prefixedValue.toLowerCase() : null;
};

const getRgbFromHexColor = (colorValue: string) => {
  const normalizedColor = normalizeAnnotationHexColor(colorValue) ?? DEFAULT_VIDEO_ANNOTATION_COLOR;
  const colorNumber = Number.parseInt(normalizedColor.slice(1), 16);

  return {
    blue: colorNumber & 255,
    green: (colorNumber >> 8) & 255,
    red: (colorNumber >> 16) & 255,
  };
};

const getHexColorFromRgb = (red: number, green: number, blue: number) => {
  const toHexChannel = (channelValue: number) =>
    Math.round(clampTimelineValue(channelValue, 0, 255))
      .toString(16)
      .padStart(2, "0");

  return `#${toHexChannel(red)}${toHexChannel(green)}${toHexChannel(blue)}`;
};

const getHsvFromRgb = (red: number, green: number, blue: number) => {
  const normalizedRed = clampTimelineValue(red, 0, 255) / 255;
  const normalizedGreen = clampTimelineValue(green, 0, 255) / 255;
  const normalizedBlue = clampTimelineValue(blue, 0, 255) / 255;
  const maxChannel = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
  const minChannel = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
  const delta = maxChannel - minChannel;
  let hue = 0;

  if (delta > 0) {
    if (maxChannel === normalizedRed) {
      hue = 60 * (((normalizedGreen - normalizedBlue) / delta) % 6);
    } else if (maxChannel === normalizedGreen) {
      hue = 60 * ((normalizedBlue - normalizedRed) / delta + 2);
    } else {
      hue = 60 * ((normalizedRed - normalizedGreen) / delta + 4);
    }
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation: maxChannel === 0 ? 0 : delta / maxChannel,
    value: maxChannel,
  };
};

const getRgbFromHsv = (hue: number, saturation: number, value: number) => {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const normalizedSaturation = clampTimelineValue(saturation, 0, 1);
  const normalizedValue = clampTimelineValue(value, 0, 1);
  const chroma = normalizedValue * normalizedSaturation;
  const huePrime = normalizedHue / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  const match = normalizedValue - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (huePrime >= 0 && huePrime < 1) {
    red = chroma;
    green = x;
  } else if (huePrime < 2) {
    red = x;
    green = chroma;
  } else if (huePrime < 3) {
    green = chroma;
    blue = x;
  } else if (huePrime < 4) {
    green = x;
    blue = chroma;
  } else if (huePrime < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return {
    blue: Math.round((blue + match) * 255),
    green: Math.round((green + match) * 255),
    red: Math.round((red + match) * 255),
  };
};

const getHexColorFromHsv = (hue: number, saturation: number, value: number) => {
  const rgbColor = getRgbFromHsv(hue, saturation, value);
  return getHexColorFromRgb(rgbColor.red, rgbColor.green, rgbColor.blue);
};

const getTimelineColorWithAlpha = (color: string, alpha: number) => {
  const normalizedColor = color.trim();
  const hexMatch = normalizedColor.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hexValue =
      hexMatch[1].length === 3
        ? hexMatch[1]
            .split("")
            .map((character) => `${character}${character}`)
            .join("")
        : hexMatch[1];
    const red = parseInt(hexValue.slice(0, 2), 16);
    const green = parseInt(hexValue.slice(2, 4), 16);
    const blue = parseInt(hexValue.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  const rgbMatch = normalizedColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  }

  return normalizedColor;
};

const getAnnotationTimelineToolLabel = (type: TCustomPlaylistAnnotationTool) => {
  if (type === "arrow") return "Arrow";
  if (type === "ellipse") return "Oval";
  if (type === "image") return "Image";
  if (type === "line") return "Line";
  if (type === "pen") return "Draw";
  if (type === "rectangle") return "Rect";
  if (type === "text") return "Text";

  return "Annotation";
};

const getAnnotationTimelineLabel = (annotation: TCustomPlaylistAnnotation, index: number) => {
  if (annotation.content?.trim()) return annotation.content.trim();

  if (annotation.type === "pen") return `Draw ${index + 1}`;
  if (annotation.type === "rectangle") return `Box ${index + 1}`;
  if (annotation.type === "ellipse") return `Circle ${index + 1}`;
  if (annotation.type === "arrow") return `Arrow ${index + 1}`;
  if (annotation.type === "line") return `Line ${index + 1}`;

  return `Annotation ${index + 1}`;
};

const getAnnotationTimelineIcon = (annotation: TCustomPlaylistAnnotation) => {
  if (annotation.type === "arrow") return ArrowUpRight;
  if (annotation.type === "ellipse") return Circle;
  if (annotation.type === "line") return Minus;
  if (annotation.type === "pen") return Pencil;
  if (annotation.type === "rectangle" || annotation.type === "image") return Square;
  if (annotation.type === "text") return Type;

  return Pencil;
};

const getAnnotationTimelineMomentTitle = (annotation: TCustomPlaylistAnnotation) =>
  annotation.title?.trim() || annotation.content?.trim();

type AnnotationTimelineMomentItem = {
  annotation: TCustomPlaylistAnnotation;
  index: number;
};

type AnnotationTimelineMoment = {
  annotations: AnnotationTimelineMomentItem[];
  id: string;
  startTime: number;
  title: string;
};

type AnnotationTimelineResizeState = {
  annotationId: string;
  hasMoved: boolean;
  originalEndTime: number;
  pointerId: number;
  startClientX: number;
  startTime: number;
};

const getAnnotationMomentKey = (seconds: number) => (Math.round(seconds * 10) / 10).toFixed(1);

const buildAnnotationTimelineMoments = (annotations: TCustomPlaylistAnnotation[]): AnnotationTimelineMoment[] => {
  const momentMap = new Map<string, AnnotationTimelineMoment>();

  annotations.forEach((annotation, index) => {
    const momentKey = getAnnotationMomentKey(annotation.startTime);
    const momentStartTime = Number(momentKey);
    const existingMoment = momentMap.get(momentKey);

    if (existingMoment) {
      existingMoment.annotations.push({ annotation, index });
      return;
    }

    momentMap.set(momentKey, {
      annotations: [{ annotation, index }],
      id: `moment-${momentKey}`,
      startTime: momentStartTime,
      title:
        getAnnotationTimelineMomentTitle(annotation) || `${getAnnotationTimelineToolLabel(annotation.type)} moment`,
    });
  });

  return [...momentMap.values()].sort((firstMoment, secondMoment) => firstMoment.startTime - secondMoment.startTime);
};

const getAnnotationTrackIndex = (annotation: TCustomPlaylistAnnotation) => {
  const trackIndex = Number(annotation.trackIndex);

  return Number.isInteger(trackIndex) && trackIndex >= 0 ? trackIndex : null;
};

const getAnnotationCollisionEndTime = (annotation: TCustomPlaylistAnnotation, minimumVisibleDurationSeconds: number) =>
  Math.max(annotation.endTime, annotation.startTime + minimumVisibleDurationSeconds);

const doAnnotationTimeRangesOverlap = (
  firstAnnotation: TCustomPlaylistAnnotation,
  secondAnnotation: TCustomPlaylistAnnotation,
  minimumVisibleDurationSeconds = 0
) =>
  firstAnnotation.startTime < getAnnotationCollisionEndTime(secondAnnotation, minimumVisibleDurationSeconds) &&
  getAnnotationCollisionEndTime(firstAnnotation, minimumVisibleDurationSeconds) > secondAnnotation.startTime;

const canPlaceAnnotationInTimelineLane = (
  laneAnnotations: TCustomPlaylistAnnotation[] | undefined,
  annotation: TCustomPlaylistAnnotation,
  minimumVisibleDurationSeconds = 0
) =>
  (laneAnnotations ?? []).every(
    (laneAnnotation) =>
      laneAnnotation.id === annotation.id ||
      !doAnnotationTimeRangesOverlap(laneAnnotation, annotation, minimumVisibleDurationSeconds)
  );

const resolveAnnotationTimelineLayers = (
  annotations: TCustomPlaylistAnnotation[],
  priorityAnnotationId?: string,
  minimumVisibleDurationSeconds = 0
): TCustomPlaylistAnnotation[] => {
  const originalAnnotationIndexes = new Map(annotations.map((annotation, index) => [annotation.id, index]));
  const lanes: TCustomPlaylistAnnotation[][] = [];
  const prioritizedAnnotation = priorityAnnotationId
    ? annotations.find((annotation) => annotation.id === priorityAnnotationId)
    : undefined;
  const remainingAnnotations = annotations
    .filter((annotation) => annotation.id !== priorityAnnotationId)
    .sort((firstAnnotation, secondAnnotation) => {
      const firstTrackIndex = getAnnotationTrackIndex(firstAnnotation) ?? 0;
      const secondTrackIndex = getAnnotationTrackIndex(secondAnnotation) ?? 0;

      return (
        firstTrackIndex - secondTrackIndex ||
        firstAnnotation.startTime - secondAnnotation.startTime ||
        firstAnnotation.endTime - secondAnnotation.endTime
      );
    });
  const placementQueue = prioritizedAnnotation
    ? [prioritizedAnnotation, ...remainingAnnotations]
    : remainingAnnotations;

  const resolvedAnnotations = placementQueue.map((annotation) => {
    let targetTrackIndex = getAnnotationTrackIndex(annotation) ?? 0;

    while (!canPlaceAnnotationInTimelineLane(lanes[targetTrackIndex], annotation, minimumVisibleDurationSeconds)) {
      targetTrackIndex += 1;
    }

    const resolvedAnnotation =
      annotation.trackIndex === targetTrackIndex ? annotation : { ...annotation, trackIndex: targetTrackIndex };

    lanes[targetTrackIndex] = lanes[targetTrackIndex] ?? [];
    lanes[targetTrackIndex].push(resolvedAnnotation);

    return resolvedAnnotation;
  });

  return resolvedAnnotations.sort(
    (firstAnnotation, secondAnnotation) =>
      (originalAnnotationIndexes.get(firstAnnotation.id) ?? 0) -
      (originalAnnotationIndexes.get(secondAnnotation.id) ?? 0)
  );
};

const ANNOTATION_TIMELINE_TICK_STEPS_SECONDS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1200];

const buildAnnotationTimelineTicks = (durationSeconds: number, zoomPercent: number) => {
  const safeDurationSeconds = Math.max(1, Math.ceil(durationSeconds));
  const zoomScale = clampTimelineValue(zoomPercent / 100, 0.5, 3);
  const targetTickCount = Math.round(18 * zoomScale);
  const minimumStepSeconds = safeDurationSeconds / targetTickCount;
  const stepSeconds =
    ANNOTATION_TIMELINE_TICK_STEPS_SECONDS.find((step) => step >= minimumStepSeconds) ??
    ANNOTATION_TIMELINE_TICK_STEPS_SECONDS[ANNOTATION_TIMELINE_TICK_STEPS_SECONDS.length - 1];
  const ticks: number[] = [];

  for (let seconds = 0; seconds <= safeDurationSeconds; seconds += stepSeconds) {
    ticks.push(seconds);
  }

  if (ticks[ticks.length - 1] !== safeDurationSeconds) {
    ticks.push(safeDurationSeconds);
  }

  return ticks;
};

const getTimelineContentWidthPx = (durationSeconds: number, zoomPercent: number) => {
  const safeDurationSeconds = Math.max(1, durationSeconds);
  const baseTimelineWidth = Math.max(960, safeDurationSeconds * 4);

  return Math.min(32000, Math.max(760, Math.ceil(baseTimelineWidth * (zoomPercent / 100))));
};

export const VideoAnnotationEditor = ({
  annotationKey,
  annotations: savedAnnotationValue,
  autoEnableAnnotationModeKey,
  canEdit,
  className,
  currentTime,
  durationSeconds = null,
  enableAnnotationTransforms = false,
  enableTextTool = false,
  fitToVideoBounds = false,
  isPlaying = false,
  modeResetKey,
  onModeChange,
  onRequestPause,
  onSave,
  onSeek,
  playbackRate = 1,
  propertyHostElement = null,
  toolbarHostElement = null,
  showTimeline = false,
  timelineHostElement = null,
}: VideoAnnotationEditorProps) => {
  const savedAnnotations = useMemo(
    () => resolveAnnotationTimelineLayers(normalizePlaylistAnnotations(savedAnnotationValue)),
    [savedAnnotationValue]
  );
  const [annotations, setAnnotations] = useState<TCustomPlaylistAnnotation[]>(savedAnnotations);
  const [baselineAnnotations, setBaselineAnnotations] = useState<TCustomPlaylistAnnotation[]>(savedAnnotations);
  const [isAnnotationMode, setIsAnnotationMode] = useState(canEdit);
  const [annotationTool, setAnnotationTool] = useState<TCustomPlaylistAnnotationTool>("pen");
  const [annotationColor, setAnnotationColor] = useState(DEFAULT_VIDEO_ANNOTATION_COLOR);
  const [annotationColorInputValue, setAnnotationColorInputValue] = useState(DEFAULT_VIDEO_ANNOTATION_COLOR);
  const [isAnnotationColorPickerOpen, setIsAnnotationColorPickerOpen] = useState(false);
  const [annotationStrokeWidth, setAnnotationStrokeWidth] = useState(5);
  const [annotationStrokeStyle, setAnnotationStrokeStyle] = useState<TCustomPlaylistAnnotationStrokeStyle>("solid");
  const [annotationDurationSeconds, setAnnotationDurationSeconds] = useState(2);
  const [annotationTextFontSize, setAnnotationTextFontSize] = useState(28);
  const [annotationTextFontWeight, setAnnotationTextFontWeight] = useState(700);
  const [annotationTextFontFamily, setAnnotationTextFontFamily] = useState("sans-serif");
  const [timelineZoomPercent, setTimelineZoomPercent] = useState(VIDEO_ANNOTATION_TIMELINE_DEFAULT_ZOOM_PERCENT);
  const [openTimelineMomentIds, setOpenTimelineMomentIds] = useState<Set<string>>(() => new Set());
  const [editingTimelineMoment, setEditingTimelineMoment] = useState<{ id: string; value: string } | null>(null);
  const [timelineResizeId, setTimelineResizeId] = useState<string | null>(null);
  const [annotationClockTick, setAnnotationClockTick] = useState(0);
  const [isSavingAnnotations, setIsSavingAnnotations] = useState(false);
  const clockOriginRef = useRef({
    mediaTime: currentTime,
    wallTime: typeof performance !== "undefined" ? performance.now() : Date.now(),
  });
  const timelineHeaderScrollableElementRef = useRef<HTMLDivElement | null>(null);
  const timelineScrollableElementRef = useRef<HTMLDivElement | null>(null);
  const timelineResizeStateRef = useRef<AnnotationTimelineResizeState | null>(null);
  const hasAnnotationChanges = !arePlaylistAnnotationsEqual(annotations, baselineAnnotations);
  const availableAnnotationTools = useMemo(
    () => VIDEO_ANNOTATION_TOOLS.filter((toolOption) => enableTextTool || toolOption.type !== "text"),
    [enableTextTool]
  );
  const sortedAnnotations = useMemo(
    () =>
      [...annotations].sort((first, second) => first.startTime - second.startTime || first.endTime - second.endTime),
    [annotations]
  );
  const annotationTimelineMoments = useMemo(
    () => buildAnnotationTimelineMoments(sortedAnnotations),
    [sortedAnnotations]
  );
  const safePlaybackRate = Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1;
  const effectiveCurrentTime = useMemo(() => {
    void annotationClockTick;

    if (!isPlaying) return currentTime;

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const elapsedSeconds = Math.max(0, (now - clockOriginRef.current.wallTime) / 1000);
    return Math.max(0, clockOriginRef.current.mediaTime + elapsedSeconds * safePlaybackRate);
  }, [annotationClockTick, currentTime, isPlaying, safePlaybackRate]);
  const activeAnnotations = useMemo(
    () => getActivePlaylistAnnotations(sortedAnnotations, effectiveCurrentTime),
    [effectiveCurrentTime, sortedAnnotations]
  );
  const activeAnnotationIds = useMemo(
    () => new Set(activeAnnotations.map((annotation) => annotation.id)),
    [activeAnnotations]
  );
  const hasActiveAnnotations = activeAnnotations.length > 0;
  const timelineDurationSeconds = useMemo(
    () => getTimelineDuration(durationSeconds, sortedAnnotations, effectiveCurrentTime),
    [durationSeconds, effectiveCurrentTime, sortedAnnotations]
  );
  const timelineProgressPercent = getTimelinePercent(effectiveCurrentTime, timelineDurationSeconds);
  const timelineTicks = useMemo(
    () => buildAnnotationTimelineTicks(timelineDurationSeconds, timelineZoomPercent),
    [timelineDurationSeconds, timelineZoomPercent]
  );
  const timelineContentWidthPx = getTimelineContentWidthPx(timelineDurationSeconds, timelineZoomPercent);
  const minimumVisibleAnnotationDurationSeconds =
    ((VIDEO_ANNOTATION_TIMELINE_CLIP_MIN_WIDTH_PX + VIDEO_ANNOTATION_TIMELINE_CLIP_GAP_PX) /
      Math.max(1, timelineContentWidthPx)) *
    timelineDurationSeconds;
  const timelineZoomIndex = VIDEO_ANNOTATION_TIMELINE_ZOOM_STEPS.indexOf(timelineZoomPercent);
  const activeTimelineZoomIndex =
    timelineZoomIndex >= 0
      ? timelineZoomIndex
      : VIDEO_ANNOTATION_TIMELINE_ZOOM_STEPS.indexOf(VIDEO_ANNOTATION_TIMELINE_DEFAULT_ZOOM_PERCENT);
  const canZoomTimelineOut = activeTimelineZoomIndex > 0;
  const canZoomTimelineIn =
    activeTimelineZoomIndex >= 0 && activeTimelineZoomIndex < VIDEO_ANNOTATION_TIMELINE_ZOOM_STEPS.length - 1;

  useEffect(() => {
    setOpenTimelineMomentIds((currentMomentIds) => {
      const availableMomentIds = new Set(annotationTimelineMoments.map((moment) => moment.id));
      const nextMomentIds = new Set([...currentMomentIds].filter((momentId) => availableMomentIds.has(momentId)));

      if (nextMomentIds.size === 0 && annotationTimelineMoments[0]) {
        nextMomentIds.add(annotationTimelineMoments[0].id);
      }

      if (
        nextMomentIds.size === currentMomentIds.size &&
        [...nextMomentIds].every((momentId) => currentMomentIds.has(momentId))
      ) {
        return currentMomentIds;
      }

      return nextMomentIds;
    });
  }, [annotationTimelineMoments]);

  useEffect(() => {
    clockOriginRef.current = {
      mediaTime: currentTime,
      wallTime: typeof performance !== "undefined" ? performance.now() : Date.now(),
    };
    setAnnotationClockTick((currentValue) => currentValue + 1);
  }, [currentTime, isPlaying, safePlaybackRate]);

  useEffect(() => {
    if (!isPlaying || sortedAnnotations.length === 0) return;

    const nextBoundary = sortedAnnotations.reduce<number | null>((currentBoundary, annotation) => {
      const candidateBoundaries = [annotation.startTime, annotation.endTime].filter(
        (boundary) => boundary > effectiveCurrentTime + 0.005
      );
      const annotationBoundary = candidateBoundaries.length > 0 ? Math.min(...candidateBoundaries) : null;
      if (annotationBoundary === null) return currentBoundary;
      return currentBoundary === null ? annotationBoundary : Math.min(currentBoundary, annotationBoundary);
    }, null);
    if (nextBoundary === null) return;

    const delayMs = Math.max(16, ((nextBoundary - effectiveCurrentTime) / safePlaybackRate) * 1000);
    const timeoutId = window.setTimeout(() => {
      setAnnotationClockTick((currentValue) => currentValue + 1);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [effectiveCurrentTime, isPlaying, safePlaybackRate, sortedAnnotations]);

  useEffect(() => {
    if (!showTimeline || !isPlaying) return;

    const intervalId = window.setInterval(() => {
      setAnnotationClockTick((currentValue) => currentValue + 1);
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, showTimeline]);

  useEffect(() => {
    const shouldOpenAnnotationMode = canEdit;
    setAnnotations(savedAnnotations);
    setBaselineAnnotations(savedAnnotations);
    setIsAnnotationMode(shouldOpenAnnotationMode);
    setIsSavingAnnotations(false);
    onModeChange?.(shouldOpenAnnotationMode);
  }, [annotationKey, canEdit, onModeChange, savedAnnotations]);

  useEffect(() => {
    if (enableTextTool || annotationTool !== "text") return;

    setAnnotationTool("pen");
  }, [annotationTool, enableTextTool]);

  useEffect(() => {
    setAnnotationColorInputValue(annotationColor.toUpperCase());
  }, [annotationColor]);

  useEffect(
    () => () => {
      onModeChange?.(false);
    },
    [onModeChange]
  );

  useEffect(() => {
    const shouldOpenAnnotationMode = canEdit;
    setIsAnnotationMode(shouldOpenAnnotationMode);
    onModeChange?.(shouldOpenAnnotationMode);
  }, [canEdit, modeResetKey, onModeChange]);

  useEffect(() => {
    if (autoEnableAnnotationModeKey === undefined || !canEdit) return;

    setIsAnnotationMode(true);
    onModeChange?.(true);
  }, [autoEnableAnnotationModeKey, canEdit, onModeChange]);

  const handleToggleAnnotationMode = useCallback(() => {
    const nextValue = !isAnnotationMode;
    if (nextValue) onRequestPause?.();
    setIsAnnotationMode(nextValue);
    onModeChange?.(nextValue);
  }, [isAnnotationMode, onModeChange, onRequestPause]);

  const handleSelectAnnotationTool = useCallback(
    (tool: TCustomPlaylistAnnotationTool) => {
      onRequestPause?.();
      setAnnotationTool(tool);
      if (isAnnotationMode) return;

      setIsAnnotationMode(true);
      onModeChange?.(true);
    },
    [isAnnotationMode, onModeChange, onRequestPause]
  );

  const handleUndoVisibleAnnotation = useCallback(() => {
    setAnnotations((currentAnnotations) => {
      const annotationToRemove = activeAnnotations[activeAnnotations.length - 1];
      if (!annotationToRemove) return currentAnnotations;

      return currentAnnotations.filter((annotation) => annotation.id !== annotationToRemove.id);
    });
  }, [activeAnnotations]);

  const handleClearVisibleAnnotations = useCallback(() => {
    const activeAnnotationIds = new Set(activeAnnotations.map((annotation) => annotation.id));
    setAnnotations((currentAnnotations) =>
      currentAnnotations.filter((annotation) => !activeAnnotationIds.has(annotation.id))
    );
  }, [activeAnnotations]);

  const handleCreateAnnotation = useCallback(
    (annotation: TCustomPlaylistAnnotation) => {
      setAnnotations((currentAnnotations) =>
        resolveAnnotationTimelineLayers(
          normalizePlaylistAnnotations([...currentAnnotations, annotation]),
          annotation.id,
          minimumVisibleAnnotationDurationSeconds
        )
      );
    },
    [minimumVisibleAnnotationDurationSeconds]
  );

  const handleUpdateAnnotation = useCallback(
    (updatedAnnotation: TCustomPlaylistAnnotation) => {
      setAnnotations((currentAnnotations) =>
        resolveAnnotationTimelineLayers(
          normalizePlaylistAnnotations(
            currentAnnotations.map((annotation) =>
              annotation.id === updatedAnnotation.id ? updatedAnnotation : annotation
            )
          ),
          updatedAnnotation.id,
          minimumVisibleAnnotationDurationSeconds
        )
      );
    },
    [minimumVisibleAnnotationDurationSeconds]
  );

  const handleSaveAnnotations = useCallback(async () => {
    if (isSavingAnnotations || !hasAnnotationChanges) return;

    setIsSavingAnnotations(true);
    try {
      const annotationsToSave = resolveAnnotationTimelineLayers(
        normalizePlaylistAnnotations(annotations),
        undefined,
        minimumVisibleAnnotationDurationSeconds
      );
      const updatedAnnotations = resolveAnnotationTimelineLayers(
        normalizePlaylistAnnotations((await onSave(annotationsToSave)) ?? annotationsToSave),
        undefined,
        minimumVisibleAnnotationDurationSeconds
      );
      setAnnotations(updatedAnnotations);
      setBaselineAnnotations(updatedAnnotations);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Annotations saved",
        message: "The video annotations were updated.",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Save annotations failed",
        message: "Unable to save video annotations. Please try again.",
      });
    } finally {
      setIsSavingAnnotations(false);
    }
  }, [annotations, hasAnnotationChanges, isSavingAnnotations, minimumVisibleAnnotationDurationSeconds, onSave]);

  const handleTimelineSeek = useCallback(
    (seconds: number) => {
      if (!onSeek) return;

      onSeek(clampTimelineValue(seconds, 0, timelineDurationSeconds));
    },
    [onSeek, timelineDurationSeconds]
  );

  const handleTimelinePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!onSeek) return;

      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) return;

      const scrollableWidth = Math.max(timelineContentWidthPx, event.currentTarget.scrollWidth, rect.width);
      const pointerOffset = event.clientX - rect.left + event.currentTarget.scrollLeft;
      const ratio = clampTimelineValue(pointerOffset / scrollableWidth, 0, 1);
      handleTimelineSeek(ratio * timelineDurationSeconds);
    },
    [handleTimelineSeek, onSeek, timelineContentWidthPx, timelineDurationSeconds]
  );

  const handleTimelineKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!onSeek) return;

      const smallStep = Math.max(1, timelineDurationSeconds / 100);
      const largeStep = Math.max(5, timelineDurationSeconds / 20);
      let nextTime: number | null = null;

      if (event.key === "ArrowLeft") nextTime = effectiveCurrentTime - smallStep;
      if (event.key === "ArrowRight") nextTime = effectiveCurrentTime + smallStep;
      if (event.key === "PageUp") nextTime = effectiveCurrentTime + largeStep;
      if (event.key === "PageDown") nextTime = effectiveCurrentTime - largeStep;
      if (event.key === "Home") nextTime = 0;
      if (event.key === "End") nextTime = timelineDurationSeconds;

      if (nextTime === null) return;

      event.preventDefault();
      handleTimelineSeek(nextTime);
    },
    [effectiveCurrentTime, handleTimelineSeek, onSeek, timelineDurationSeconds]
  );

  const handleTimelineHeaderScroll = useCallback((event: ReactUIEvent<HTMLDivElement>) => {
    const timelineBodyElement = timelineScrollableElementRef.current;
    if (!timelineBodyElement || timelineBodyElement.scrollLeft === event.currentTarget.scrollLeft) return;

    timelineBodyElement.scrollLeft = event.currentTarget.scrollLeft;
  }, []);

  const handleTimelineBodyScroll = useCallback((event: ReactUIEvent<HTMLDivElement>) => {
    const timelineHeaderElement = timelineHeaderScrollableElementRef.current;
    if (!timelineHeaderElement || timelineHeaderElement.scrollLeft === event.currentTarget.scrollLeft) return;

    timelineHeaderElement.scrollLeft = event.currentTarget.scrollLeft;
  }, []);

  const updateAnnotationTimelineResize = useCallback(
    (event: PointerEvent) => {
      const resizeState = timelineResizeStateRef.current;
      if (!resizeState || resizeState.pointerId !== event.pointerId) return;

      event.preventDefault();
      if (Math.abs(event.clientX - resizeState.startClientX) > 2) {
        resizeState.hasMoved = true;
      }

      const timelineResizeWidthPx = Math.max(
        1,
        timelineScrollableElementRef.current?.scrollWidth ?? timelineContentWidthPx
      );
      const deltaSeconds =
        ((event.clientX - resizeState.startClientX) / timelineResizeWidthPx) * timelineDurationSeconds;
      const nextEndTime = Number(
        clampTimelineValue(
          resizeState.originalEndTime + deltaSeconds,
          resizeState.startTime + VIDEO_ANNOTATION_TIMELINE_MIN_DURATION_SECONDS,
          timelineDurationSeconds
        ).toFixed(3)
      );

      setAnnotations((currentAnnotations) =>
        currentAnnotations.map((annotation) =>
          annotation.id === resizeState.annotationId ? { ...annotation, endTime: nextEndTime } : annotation
        )
      );
    },
    [timelineContentWidthPx, timelineDurationSeconds]
  );

  useEffect(() => {
    if (!timelineResizeId) return;

    const finishAnnotationTimelineResize = (event: PointerEvent) => {
      const resizeState = timelineResizeStateRef.current;
      if (!resizeState || resizeState.pointerId !== event.pointerId) return;

      if (resizeState.hasMoved) {
        event.preventDefault();
      }

      timelineResizeStateRef.current = null;
      setTimelineResizeId(null);
    };

    window.addEventListener("pointermove", updateAnnotationTimelineResize);
    window.addEventListener("pointerup", finishAnnotationTimelineResize);
    window.addEventListener("pointercancel", finishAnnotationTimelineResize);

    return () => {
      window.removeEventListener("pointermove", updateAnnotationTimelineResize);
      window.removeEventListener("pointerup", finishAnnotationTimelineResize);
      window.removeEventListener("pointercancel", finishAnnotationTimelineResize);
    };
  }, [timelineResizeId, updateAnnotationTimelineResize]);

  const handleAnnotationTimelineResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, annotation: TCustomPlaylistAnnotation) => {
      if (event.button !== 0 || isSavingAnnotations) return;

      event.preventDefault();
      event.stopPropagation();
      timelineResizeStateRef.current = {
        annotationId: annotation.id,
        hasMoved: false,
        originalEndTime: annotation.endTime,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startTime: annotation.startTime,
      };
      setTimelineResizeId(annotation.id);
    },
    [isSavingAnnotations]
  );

  const annotationButtonClass = VIDEO_ANNOTATION_TOOL_BUTTON_CLASS;

  const stepTimelineZoom = (direction: "in" | "out") => {
    const nextIndex = clampTimelineValue(
      activeTimelineZoomIndex + (direction === "in" ? 1 : -1),
      0,
      VIDEO_ANNOTATION_TIMELINE_ZOOM_STEPS.length - 1
    );

    setTimelineZoomPercent(VIDEO_ANNOTATION_TIMELINE_ZOOM_STEPS[nextIndex]);
  };

  const jumpToRelativeTimelineTime = (deltaSeconds: number) => {
    handleTimelineSeek(effectiveCurrentTime + deltaSeconds);
  };

  const jumpToNearestAnnotation = (direction: "previous" | "next") => {
    if (sortedAnnotations.length === 0) return;

    const edgeOffsetSeconds = direction === "previous" ? -0.05 : 0.05;
    const candidate =
      direction === "previous"
        ? [...sortedAnnotations]
            .reverse()
            .find((annotation) => annotation.startTime < effectiveCurrentTime + edgeOffsetSeconds)
        : sortedAnnotations.find((annotation) => annotation.startTime > effectiveCurrentTime + edgeOffsetSeconds);

    handleTimelineSeek(
      (candidate ?? sortedAnnotations[direction === "previous" ? sortedAnnotations.length - 1 : 0]).startTime
    );
  };

  const toggleTimelineMoment = (momentId: string) => {
    setOpenTimelineMomentIds((currentMomentIds) => {
      const nextMomentIds = new Set(currentMomentIds);

      if (nextMomentIds.has(momentId)) {
        nextMomentIds.delete(momentId);
      } else {
        nextMomentIds.add(momentId);
      }

      return nextMomentIds;
    });
  };

  const beginEditingTimelineMoment = (moment: AnnotationTimelineMoment) => {
    setEditingTimelineMoment({ id: moment.id, value: moment.title });
  };

  const commitTimelineMomentTitle = (moment: AnnotationTimelineMoment, value: string) => {
    const nextTitle = value.trim();
    setEditingTimelineMoment(null);
    if (!nextTitle || nextTitle === moment.title) return;

    const momentAnnotationIds = new Set(moment.annotations.map(({ annotation }) => annotation.id));
    setAnnotations((currentAnnotations) =>
      currentAnnotations.map((annotation) => {
        if (!momentAnnotationIds.has(annotation.id)) return annotation;

        const { timelineTitle: _timelineTitle, ...annotationWithoutLegacyTitle } =
          annotation as TCustomPlaylistAnnotation & {
            timelineTitle?: string;
          };

        return { ...annotationWithoutLegacyTitle, title: nextTitle };
      })
    );
  };

  const timelineContent =
    showTimeline && timelineHostElement ? (
      <div className="overflow-hidden rounded-[6px] border border-custom-border-200 bg-[#0c0c0c] shadow-sm">
        <div className="flex min-h-[52px] flex-wrap items-center gap-2 border-b border-custom-border-200 bg-custom-background-100 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleTimelineSeek(0)}
              disabled={!onSeek}
              className={VIDEO_ANNOTATION_TOOL_BUTTON_CLASS}
              aria-label="Jump to start"
              title="Jump to start"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => jumpToNearestAnnotation("previous")}
              disabled={!onSeek || sortedAnnotations.length === 0}
              className={VIDEO_ANNOTATION_TOOL_BUTTON_CLASS}
              aria-label="Previous annotation"
              title="Previous annotation"
            >
              <Rewind className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => jumpToRelativeTimelineTime(-1)}
              disabled={!onSeek}
              className={VIDEO_ANNOTATION_TOOL_BUTTON_CLASS}
              aria-label="Step backward one second"
              title="Step backward one second"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => jumpToRelativeTimelineTime(1)}
              disabled={!onSeek}
              className={VIDEO_ANNOTATION_TOOL_BUTTON_CLASS}
              aria-label="Step forward one second"
              title="Step forward one second"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => jumpToNearestAnnotation("next")}
              disabled={!onSeek || sortedAnnotations.length === 0}
              className={VIDEO_ANNOTATION_TOOL_BUTTON_CLASS}
              aria-label="Next annotation"
              title="Next annotation"
            >
              <FastForward className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleTimelineSeek(timelineDurationSeconds)}
              disabled={!onSeek}
              className={VIDEO_ANNOTATION_TOOL_BUTTON_CLASS}
              aria-label="Jump to end"
              title="Jump to end"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <div className="flex min-w-0 items-baseline gap-2 font-mono tabular-nums">
            <span className="text-[18px] font-semibold leading-none text-custom-text-100">
              {formatAnnotationTime(effectiveCurrentTime)}
            </span>
            <span className="text-[12px] text-custom-text-400">/</span>
            <span className="text-[14px] font-semibold leading-none text-custom-text-200">
              {formatAnnotationTime(timelineDurationSeconds)}
            </span>
          </div>

          <div className="ml-auto flex min-w-0 items-center justify-end">
            <span className="hidden text-[12px] text-custom-text-300 md:inline">
              {sortedAnnotations.length} annotation{sortedAnnotations.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div
          className="grid bg-[#0c0c0c]"
          style={{
            gridTemplateColumns: `${VIDEO_ANNOTATION_TIMELINE_MOMENT_COLUMN_WIDTH_PX}px minmax(0, 1fr)`,
          }}
        >
          <div className="flex h-[30px] items-center border-b border-r border-custom-border-200 bg-[#101010] px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-custom-text-400">
            Moments
          </div>
          <div
            ref={timelineHeaderScrollableElementRef}
            className={[
              "min-w-0 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sg-matrix-active-border)]",
              onSeek ? "" : "cursor-default",
            ].join(" ")}
            onPointerDown={handleTimelinePointerDown}
            onScroll={handleTimelineHeaderScroll}
          >
            <div
              className="relative h-[30px] border-b border-custom-border-200 bg-[#0c0c0c]"
              style={{ width: `max(100%, ${timelineContentWidthPx}px)` }}
            >
              {timelineTicks.map((seconds) => {
                const tickPercent = getTimelinePercent(seconds, timelineDurationSeconds);

                return (
                  <div
                    key={`annotation-header-tick-${seconds}`}
                    className="pointer-events-none absolute top-0 h-[30px] -translate-x-px"
                    style={{ left: `${tickPercent}%` }}
                  >
                    <span className="block h-2.5 w-px bg-custom-border-300" />
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[11px] leading-none text-custom-text-400">
                      {formatAnnotationTime(seconds)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="vertical-scrollbar scrollbar-md grid max-h-[308px] overflow-y-auto overflow-x-hidden bg-[#0c0c0c]"
          style={{
            gridTemplateColumns: `${VIDEO_ANNOTATION_TIMELINE_MOMENT_COLUMN_WIDTH_PX}px minmax(0, 1fr)`,
          }}
        >
          <div className="shrink-0 border-r border-custom-border-200 bg-[#101010]">
            {annotationTimelineMoments.map((moment) => {
              const isMomentOpen = openTimelineMomentIds.has(moment.id);
              const isEditingMomentTitle = editingTimelineMoment?.id === moment.id;

              return (
                <div key={`moment-label-${moment.id}`}>
                  <div
                    className={[
                      "flex h-11 w-full items-center gap-2 border-b border-[#111] px-3 text-left transition-colors hover:bg-custom-background-90",
                      isMomentOpen ? "bg-custom-background-90" : "bg-[#101010]",
                    ].join(" ")}
                    title={`${formatAnnotationTime(moment.startTime)} - ${moment.title}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTimelineMoment(moment.id)}
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-[4px] text-custom-text-400 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-expanded={isMomentOpen}
                      aria-label={`${isMomentOpen ? "Collapse" : "Expand"} ${moment.title}`}
                    >
                      <ChevronRight
                        className={["h-3.5 w-3.5 transition-transform", isMomentOpen ? "rotate-90" : ""].join(" ")}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTimelineSeek(moment.startTime)}
                      className="shrink-0 rounded-[6px] border border-custom-border-200 bg-custom-background-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-custom-text-100 transition-colors hover:border-custom-text-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      title={`Seek to ${formatAnnotationTime(moment.startTime)}`}
                    >
                      {formatAnnotationTime(moment.startTime)}
                    </button>
                    <input
                      type="text"
                      value={isEditingMomentTitle ? editingTimelineMoment.value : moment.title}
                      onChange={(event) =>
                        setEditingTimelineMoment({ id: moment.id, value: event.currentTarget.value })
                      }
                      onFocus={() => beginEditingTimelineMoment(moment)}
                      onBlur={(event) => commitTimelineMomentTitle(moment, event.currentTarget.value)}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        event.stopPropagation();
                        if (event.key === "Enter") {
                          event.preventDefault();
                          event.currentTarget.blur();
                        }
                      }}
                      className="min-w-0 flex-1 rounded-[4px] border border-transparent bg-transparent px-1 py-0.5 text-[13px] font-medium text-custom-text-100 outline-none transition-colors focus:border-custom-border-300 focus:bg-custom-background-100"
                      aria-label={`Edit title for ${formatAnnotationTime(moment.startTime)} moment`}
                    />
                    <span className="shrink-0 rounded-full border border-custom-border-200 bg-custom-background-100 px-2 text-[11px] leading-[17px] text-custom-text-300">
                      {moment.annotations.length}
                    </span>
                  </div>
                  {isMomentOpen &&
                    moment.annotations.map(({ annotation, index }) => {
                      const color = getAnnotationColor(annotation);
                      const annotationLabel = getAnnotationTimelineLabel(annotation, index);

                      return (
                        <button
                          key={`moment-item-label-${annotation.id}`}
                          type="button"
                          onClick={() => handleTimelineSeek(annotation.startTime)}
                          className="flex h-[34px] w-full items-center gap-2 border-b border-[#0a0a0a] bg-custom-background-90 px-3 pl-10 text-left transition-colors hover:bg-custom-background-80"
                          title={annotationLabel}
                        >
                          <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
                          <span className="min-w-0 truncate text-[12px] font-medium text-custom-text-200">
                            {getAnnotationTimelineToolLabel(annotation.type)} - {annotationLabel}
                          </span>
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </div>

          <div
            ref={timelineScrollableElementRef}
            aria-label="Seek annotation timeline"
            aria-valuemax={Math.round(timelineDurationSeconds)}
            aria-valuemin={0}
            aria-valuenow={Math.round(clampTimelineValue(effectiveCurrentTime, 0, timelineDurationSeconds))}
            className={[
              "horizontal-scrollbar scrollbar-md min-w-0 cursor-pointer overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sg-matrix-active-border)]",
              onSeek ? "" : "cursor-default",
            ].join(" ")}
            onKeyDown={handleTimelineKeyDown}
            onPointerDown={handleTimelinePointerDown}
            onScroll={handleTimelineBodyScroll}
            role="slider"
            tabIndex={onSeek ? 0 : -1}
          >
            <div
              className="relative min-h-full bg-[#0c0c0c]"
              style={{ width: `max(100%, ${timelineContentWidthPx}px)` }}
            >
              {timelineTicks.map((seconds) => (
                <span
                  key={`annotation-grid-${seconds}`}
                  className="pointer-events-none absolute bottom-0 top-0 w-px -translate-x-px bg-custom-border-200/40"
                  style={{ left: `${getTimelinePercent(seconds, timelineDurationSeconds)}%` }}
                />
              ))}

              <span
                className="pointer-events-none absolute bottom-0 top-0 z-20 w-0 -translate-x-1/2 border-l-2 border-[#ef4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                style={{ left: `${timelineProgressPercent}%` }}
              >
                <span className="absolute -top-px left-1/2 h-2 w-2.5 -translate-x-1/2 rounded-[2px] bg-[#ef4444]" />
              </span>

              {annotationTimelineMoments.map((moment) => {
                const isMomentOpen = openTimelineMomentIds.has(moment.id);

                return (
                  <div key={`moment-track-${moment.id}`}>
                    <div className="relative h-11 border-b border-[#0a0a0a] bg-[#0c0c0c]">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleTimelineMoment(moment.id);
                          handleTimelineSeek(moment.startTime);
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                        className={[
                          "absolute top-1/2 inline-flex h-[26px] max-w-[280px] -translate-y-1/2 items-center gap-2 rounded-[6px] border px-2 text-[11px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                          isMomentOpen
                            ? "border-custom-text-400 bg-custom-background-80 text-custom-text-100"
                            : "border-custom-border-200 bg-custom-background-100 text-custom-text-200 hover:border-custom-text-400 hover:text-custom-text-100",
                        ].join(" ")}
                        style={{ left: `${getTimelinePercent(moment.startTime, timelineDurationSeconds)}%` }}
                        aria-expanded={isMomentOpen}
                        aria-label={`${isMomentOpen ? "Collapse" : "Expand"} ${moment.title}`}
                        title={`${formatAnnotationTime(moment.startTime)} - ${moment.title}`}
                      >
                        <ChevronRight
                          className={[
                            "h-3.5 w-3.5 shrink-0 transition-transform",
                            isMomentOpen ? "rotate-90" : "",
                          ].join(" ")}
                        />
                        <span className="flex shrink-0 items-center">
                          {moment.annotations.slice(0, 4).map(({ annotation }, summaryIndex) => {
                            const SummaryIcon = getAnnotationTimelineIcon(annotation);
                            const color = getAnnotationColor(annotation);

                            return (
                              <span
                                key={`moment-summary-${annotation.id}`}
                                className="grid h-[18px] w-[18px] place-items-center rounded-[5px] border border-[#0c0c0c]"
                                style={{
                                  backgroundColor: getTimelineColorWithAlpha(color, 0.06),
                                  marginLeft: summaryIndex === 0 ? 0 : -5,
                                }}
                              >
                                <SummaryIcon
                                  className="h-2.5 w-2.5"
                                  style={{ color: getTimelineColorWithAlpha(color, 0.5) }}
                                />
                              </span>
                            );
                          })}
                        </span>
                        <span className="min-w-0 truncate">{moment.title}</span>
                      </button>
                    </div>
                    {isMomentOpen &&
                      moment.annotations.map(({ annotation, index }) => {
                        const leftPercent = getTimelinePercent(annotation.startTime, timelineDurationSeconds);
                        const rightPercent = getTimelinePercent(annotation.endTime, timelineDurationSeconds);
                        const widthPercent = Math.max(0.8, rightPercent - leftPercent);
                        const isActive = activeAnnotationIds.has(annotation.id);
                        const color = getAnnotationColor(annotation);
                        const AnnotationIcon = getAnnotationTimelineIcon(annotation);
                        const annotationLabel = getAnnotationTimelineLabel(annotation, index);
                        const annotationDurationSeconds = Math.max(0, annotation.endTime - annotation.startTime);
                        const isResizing = timelineResizeId === annotation.id;

                        return (
                          <div
                            key={`moment-item-track-${annotation.id}`}
                            className="relative h-[34px] border-b border-[#0a0a0a] bg-custom-background-90"
                          >
                            <div
                              className={[
                                "absolute top-1/2 z-10 min-w-14 -translate-y-1/2",
                                isResizing ? "z-30" : "",
                              ].join(" ")}
                              style={{
                                left: `${leftPercent}%`,
                                width: `max(${VIDEO_ANNOTATION_TIMELINE_CLIP_MIN_WIDTH_PX}px, ${widthPercent}%)`,
                              }}
                            >
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleTimelineSeek(annotation.startTime);
                                }}
                                onPointerDown={(event) => event.stopPropagation()}
                                className={[
                                  "relative inline-flex h-6 w-full cursor-pointer items-center gap-1.5 overflow-hidden rounded-[5px] border px-3 pl-3 pr-4 text-left text-[11px] font-semibold text-custom-text-100 shadow-sm transition-[filter,box-shadow] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40",
                                  isResizing ? "shadow-[0_0_0_1px_rgba(255,255,255,0.16)]" : "",
                                ].join(" ")}
                                style={{
                                  backgroundColor: getTimelineColorWithAlpha(color, 0.06),
                                  borderColor: getTimelineColorWithAlpha(color, isActive || isResizing ? 0.28 : 0.18),
                                }}
                                aria-current={isActive ? "true" : undefined}
                                title={`${getAnnotationTimelineToolLabel(annotation.type)} - ${annotationLabel}. Start ${formatAnnotationTime(annotation.startTime)}. Duration ${formatAnnotationTime(annotationDurationSeconds)}.`}
                              >
                                <span
                                  aria-hidden="true"
                                  className="absolute inset-y-0 left-0 w-[3px]"
                                  style={{ backgroundColor: getTimelineColorWithAlpha(color, 0.38) }}
                                />
                                <AnnotationIcon
                                  className="h-3 w-3 shrink-0"
                                  style={{ color: getTimelineColorWithAlpha(color, 0.5) }}
                                />
                                <span className="min-w-0 truncate">{annotationLabel}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                }}
                                onPointerDown={(event) => handleAnnotationTimelineResizePointerDown(event, annotation)}
                                className={[
                                  "absolute inset-y-0 right-0 grid w-3 cursor-ew-resize place-items-center rounded-r-[5px] text-custom-text-100/60 transition-colors hover:bg-white/15 hover:text-custom-text-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                                  isResizing ? "bg-white/20 text-custom-text-100" : "",
                                ].join(" ")}
                                aria-label={`Resize ${annotationLabel} duration`}
                                title="Pull to change duration"
                              >
                                <span className="h-3 w-px rounded-full bg-current" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              })}

              {annotationTimelineMoments.length === 0 && (
                <div className="relative h-11 border-b border-[#0a0a0a]">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-custom-text-400">
                    No annotations yet
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex h-11 items-center gap-3 border-t border-custom-border-200 bg-custom-background-100 px-3">
          <span className="shrink-0 text-[12px] font-medium text-custom-text-200">Scale Size</span>
          <div className="flex h-[28px] items-center overflow-hidden rounded-[8px] border border-custom-border-200 bg-custom-background-90">
            <button
              type="button"
              onClick={() => stepTimelineZoom("out")}
              disabled={!canZoomTimelineOut}
              className="grid h-full w-9 place-items-center text-custom-text-200 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Zoom timeline out"
              title="Zoom timeline out"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="h-full w-px bg-custom-border-200" />
            <span className="inline-flex h-full min-w-14 items-center justify-center px-2 text-[12px] font-semibold text-custom-text-100 tabular-nums">
              {timelineZoomPercent}%
            </span>
            <span className="h-full w-px bg-custom-border-200" />
            <button
              type="button"
              onClick={() => stepTimelineZoom("in")}
              disabled={!canZoomTimelineIn}
              className="grid h-full w-9 place-items-center text-custom-text-200 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Zoom timeline in"
              title="Zoom timeline in"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    ) : null;

  const annotationColorRgb = getRgbFromHexColor(annotationColor);
  const annotationColorHsv = getHsvFromRgb(annotationColorRgb.red, annotationColorRgb.green, annotationColorRgb.blue);

  const handleAnnotationColorChange = (colorValue: string) => {
    const normalizedColor = normalizeAnnotationHexColor(colorValue);
    if (!normalizedColor) return;

    setAnnotationColor(normalizedColor);
    setAnnotationColorInputValue(normalizedColor.toUpperCase());
  };

  const handleAnnotationColorInputChange = (colorValue: string) => {
    setAnnotationColorInputValue(colorValue.toUpperCase());

    const normalizedColor = normalizeAnnotationHexColor(colorValue);
    if (normalizedColor) setAnnotationColor(normalizedColor);
  };

  const handleAnnotationColorInputBlur = () => {
    setAnnotationColorInputValue(annotationColor.toUpperCase());
  };

  const handleAnnotationColorChannelChange = (channel: "blue" | "green" | "red", colorValue: string) => {
    const channelValue = clampTimelineValue(Number(colorValue), 0, 255);
    const nextColor = {
      ...annotationColorRgb,
      [channel]: channelValue,
    };

    handleAnnotationColorChange(getHexColorFromRgb(nextColor.red, nextColor.green, nextColor.blue));
  };

  const handleAnnotationColorHueChange = (hueValue: string) => {
    const nextHue = clampTimelineValue(Number(hueValue), 0, 360);
    handleAnnotationColorChange(getHexColorFromHsv(nextHue, annotationColorHsv.saturation, annotationColorHsv.value));
  };

  const updateAnnotationColorFromPickerPoint = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const pickerRect = event.currentTarget.getBoundingClientRect();
    const saturation = clampTimelineValue((event.clientX - pickerRect.left) / pickerRect.width, 0, 1);
    const value = 1 - clampTimelineValue((event.clientY - pickerRect.top) / pickerRect.height, 0, 1);

    handleAnnotationColorChange(getHexColorFromHsv(annotationColorHsv.hue, saturation, value));
  };

  const handleAnnotationColorPickerPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateAnnotationColorFromPickerPoint(event);
  };

  const handleAnnotationColorPickerPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.buttons !== 1) return;
    updateAnnotationColorFromPickerPoint(event);
  };

  const renderAnnotationColorPicker = () => (
    <label
      className="relative inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-custom-border-200 bg-custom-background-90 transition-colors hover:bg-custom-background-80 focus-within:ring-2 focus-within:ring-custom-primary-100/40"
      title={`Pick annotation color (${annotationColor.toUpperCase()})`}
    >
      <span
        className="h-4 w-4 rounded-full border border-custom-border-200 shadow-sm"
        style={{ backgroundColor: annotationColor }}
      />
      <input
        type="color"
        value={annotationColor}
        onChange={(event) => handleAnnotationColorChange(event.currentTarget.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label="Pick annotation color"
      />
    </label>
  );

  const shouldRenderSeparateAnnotationProperties = showTimeline && Boolean(propertyHostElement);
  const selectedAnnotationToolOption =
    availableAnnotationTools.find((toolOption) => toolOption.type === annotationTool) ?? availableAnnotationTools[0];
  const SelectedAnnotationToolIcon = selectedAnnotationToolOption?.icon ?? Pencil;
  const annotationPanelOptionClass =
    "inline-flex h-8 min-w-0 items-center justify-center rounded-[5px] border border-custom-border-200 bg-custom-background-90 px-2 text-[10px] font-semibold text-custom-text-200 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40";
  const annotationPropertyPanelContent = canEdit ? (
    <div className="flex h-full w-full min-w-0 flex-col gap-3 overflow-y-auto rounded-[7px] border border-custom-border-200 bg-custom-background-100 p-2 shadow-sm">
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">Properties</div>
        <div className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-custom-text-100">
          <SelectedAnnotationToolIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 truncate">{selectedAnnotationToolOption?.label ?? "Annotation"}</span>
        </div>
      </div>

      {isAnnotationMode ? (
        <>
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">Color</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnnotationColorPickerOpen((currentValue) => !currentValue)}
                  className={[
                    "flex h-9 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-custom-border-200 bg-custom-background-90 transition-colors hover:bg-custom-background-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40",
                    isAnnotationColorPickerOpen ? "border-custom-primary-100 bg-custom-primary-100/10" : "",
                  ].join(" ")}
                  aria-expanded={isAnnotationColorPickerOpen}
                  aria-label={`Open annotation color picker. Current color ${annotationColor.toUpperCase()}`}
                  title={`Pick annotation color (${annotationColor.toUpperCase()})`}
                >
                  <span
                    className="h-5 w-7 rounded-[4px] border border-custom-border-200 shadow-sm"
                    style={{ backgroundColor: annotationColor }}
                  />
                </button>
                <input
                  type="text"
                  value={annotationColorInputValue}
                  onBlur={handleAnnotationColorInputBlur}
                  onChange={(event) => handleAnnotationColorInputChange(event.currentTarget.value)}
                  className="h-9 min-w-0 flex-1 rounded-[5px] border border-custom-border-200 bg-custom-background-90 px-2 font-mono text-[11px] font-semibold uppercase text-custom-text-100 outline-none transition-colors placeholder:text-custom-text-400 focus:border-custom-primary-100 focus:ring-2 focus:ring-custom-primary-100/30"
                  aria-label="Annotation color hex value"
                  placeholder="#F97316"
                  spellCheck={false}
                />
              </div>
              {isAnnotationColorPickerOpen ? (
                <div className="space-y-2 rounded-[6px] border border-custom-border-200 bg-custom-background-90 p-2 shadow-sm">
                  <button
                    type="button"
                    onPointerDown={handleAnnotationColorPickerPointerDown}
                    onPointerMove={handleAnnotationColorPickerPointerMove}
                    className="relative h-28 w-full touch-none overflow-hidden rounded-[5px] border border-custom-border-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40"
                    style={{
                      background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, rgba(255,255,255,0)), hsl(${annotationColorHsv.hue}, 100%, 50%)`,
                    }}
                    aria-label="Pick annotation color shade"
                    title="Drag to pick color"
                  >
                    <span
                      className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.65)]"
                      style={{
                        left: `${annotationColorHsv.saturation * 100}%`,
                        top: `${(1 - annotationColorHsv.value) * 100}%`,
                      }}
                    />
                  </button>
                  <label className="block space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">
                      Hue
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={Math.round(annotationColorHsv.hue)}
                      onChange={(event) => handleAnnotationColorHueChange(event.currentTarget.value)}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full"
                      style={{
                        background:
                          "linear-gradient(to right, #ef4444, #eab308, #22c55e, #38bdf8, #6366f1, #a855f7, #ef4444)",
                      }}
                      aria-label="Annotation color hue"
                    />
                  </label>
                  <div className="space-y-1">
                    {[
                      { channel: "red" as const, label: "R", value: annotationColorRgb.red },
                      { channel: "green" as const, label: "G", value: annotationColorRgb.green },
                      { channel: "blue" as const, label: "B", value: annotationColorRgb.blue },
                    ].map((colorChannel) => (
                      <label key={colorChannel.channel} className="flex items-center gap-2">
                        <span className="w-4 text-[10px] font-semibold text-custom-text-300">{colorChannel.label}</span>
                        <input
                          type="range"
                          min={0}
                          max={255}
                          value={colorChannel.value}
                          onChange={(event) =>
                            handleAnnotationColorChannelChange(colorChannel.channel, event.currentTarget.value)
                          }
                          className="h-1.5 min-w-0 flex-1 accent-custom-primary-100"
                          aria-label={`${colorChannel.label} color channel`}
                        />
                        <span className="w-6 text-right font-mono text-[10px] font-semibold text-custom-text-300">
                          {colorChannel.value}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {VIDEO_ANNOTATION_COLOR_PRESETS.map((colorPreset) => {
                      const isSelected = annotationColor.toLowerCase() === colorPreset;

                      return (
                        <button
                          key={colorPreset}
                          type="button"
                          onClick={() => handleAnnotationColorChange(colorPreset)}
                          className={[
                            "grid h-7 place-items-center rounded-[5px] border border-custom-border-200 bg-custom-background-100 transition-colors hover:bg-custom-background-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40",
                            isSelected ? "border-custom-primary-100 ring-2 ring-custom-primary-100/30" : "",
                          ].join(" ")}
                          aria-label={`Use ${colorPreset.toUpperCase()} annotation color`}
                          aria-pressed={isSelected}
                          title={colorPreset.toUpperCase()}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-custom-border-200 shadow-sm"
                            style={{ backgroundColor: colorPreset }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">Duration</div>
            <div className="grid grid-cols-1 gap-1">
              {VIDEO_ANNOTATION_DURATIONS.map((durationSeconds) => {
                const isSelected = annotationDurationSeconds === durationSeconds;

                return (
                  <button
                    key={durationSeconds}
                    type="button"
                    onClick={() => setAnnotationDurationSeconds(durationSeconds)}
                    className={[
                      annotationPanelOptionClass,
                      isSelected ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
                    ].join(" ")}
                    aria-label={`Show annotation for ${durationSeconds} seconds`}
                    aria-pressed={isSelected}
                    title={`${durationSeconds}s duration`}
                  >
                    {durationSeconds}s
                  </button>
                );
              })}
            </div>
          </div>

          {annotationTool === "text" ? (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">Text</div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-custom-text-300">Font</div>
                <div className="grid grid-cols-1 gap-1">
                  {VIDEO_ANNOTATION_TEXT_FONT_FAMILIES.map((fontFamilyOption) => {
                    const isSelected = annotationTextFontFamily === fontFamilyOption.value;

                    return (
                      <button
                        key={fontFamilyOption.value}
                        type="button"
                        onClick={() => setAnnotationTextFontFamily(fontFamilyOption.value)}
                        className={[
                          annotationPanelOptionClass,
                          isSelected
                            ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100"
                            : "",
                        ].join(" ")}
                        aria-label={`${fontFamilyOption.label} font`}
                        aria-pressed={isSelected}
                      >
                        {fontFamilyOption.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-custom-text-300">Size</div>
                <div className="grid grid-cols-1 gap-1">
                  {VIDEO_ANNOTATION_TEXT_FONT_SIZES.map((fontSize) => {
                    const isSelected = annotationTextFontSize === fontSize;

                    return (
                      <button
                        key={fontSize}
                        type="button"
                        onClick={() => setAnnotationTextFontSize(fontSize)}
                        className={[
                          annotationPanelOptionClass,
                          isSelected
                            ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100"
                            : "",
                        ].join(" ")}
                        aria-label={`${fontSize}px text size`}
                        aria-pressed={isSelected}
                      >
                        {fontSize}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-custom-text-300">Weight</div>
                <div className="grid grid-cols-1 gap-1">
                  {VIDEO_ANNOTATION_TEXT_FONT_WEIGHTS.map((fontWeightOption) => {
                    const isSelected = annotationTextFontWeight === fontWeightOption.value;

                    return (
                      <button
                        key={fontWeightOption.value}
                        type="button"
                        onClick={() => setAnnotationTextFontWeight(fontWeightOption.value)}
                        className={[
                          annotationPanelOptionClass,
                          isSelected
                            ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100"
                            : "",
                        ].join(" ")}
                        aria-label={`${fontWeightOption.label} text weight`}
                        aria-pressed={isSelected}
                      >
                        {fontWeightOption.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">Stroke</div>
              <div className="grid grid-cols-1 gap-1">
                {VIDEO_ANNOTATION_STROKE_WIDTHS.map((strokeWidth) => {
                  const isSelected = annotationStrokeWidth === strokeWidth;

                  return (
                    <button
                      key={strokeWidth}
                      type="button"
                      onClick={() => setAnnotationStrokeWidth(strokeWidth)}
                      className={[
                        annotationButtonClass,
                        "w-full",
                        isSelected ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
                      ].join(" ")}
                      aria-label={`${strokeWidth}px annotation stroke`}
                      aria-pressed={isSelected}
                      title={`${strokeWidth}px`}
                    >
                      <span
                        className="w-4 rounded-full bg-current"
                        style={{ height: Math.max(2, strokeWidth / 1.5) }}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 gap-1">
                {VIDEO_ANNOTATION_STROKE_STYLES.map((strokeStyleOption) => {
                  const isSelected = annotationStrokeStyle === strokeStyleOption.value;

                  return (
                    <button
                      key={strokeStyleOption.value}
                      type="button"
                      onClick={() => setAnnotationStrokeStyle(strokeStyleOption.value)}
                      className={[
                        annotationPanelOptionClass,
                        isSelected ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
                      ].join(" ")}
                      aria-label={`${strokeStyleOption.label} annotation stroke`}
                      aria-pressed={isSelected}
                      title={`${strokeStyleOption.label} stroke`}
                    >
                      <span
                        className={[
                          "w-8 border-t-2 border-current",
                          strokeStyleOption.value === "dotted" ? "border-dotted" : "border-solid",
                        ].join(" ")}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  ) : null;

  const annotationToolbarContent = canEdit ? (
    <div className="flex flex-col items-center gap-1 rounded-[7px] border border-custom-border-200 bg-custom-background-100 p-1 shadow-sm">
      <button
        type="button"
        onClick={handleToggleAnnotationMode}
        className={[
          annotationButtonClass,
          isAnnotationMode ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
        ].join(" ")}
        aria-label="Toggle annotation toolbar"
        aria-pressed={isAnnotationMode}
        title="Annotate"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {isAnnotationMode ? (
        <>
          <span className="my-0.5 h-px w-6 bg-custom-border-200" />
          {availableAnnotationTools.map((toolOption) => {
            const ToolIcon = toolOption.icon;
            const isSelected = annotationTool === toolOption.type;

            return (
              <button
                key={toolOption.type}
                type="button"
                onClick={() => handleSelectAnnotationTool(toolOption.type)}
                className={[
                  annotationButtonClass,
                  isSelected ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
                ].join(" ")}
                aria-label={toolOption.label}
                aria-pressed={isSelected}
                title={toolOption.label}
              >
                <ToolIcon className="h-4 w-4" />
              </button>
            );
          })}

          {!shouldRenderSeparateAnnotationProperties ? (
            <>
              <span className="my-0.5 h-px w-6 bg-custom-border-200" />
              {renderAnnotationColorPicker()}

              <span className="my-0.5 h-px w-6 bg-custom-border-200" />
              {VIDEO_ANNOTATION_DURATIONS.map((durationSeconds) => {
                const isSelected = annotationDurationSeconds === durationSeconds;

                return (
                  <button
                    key={durationSeconds}
                    type="button"
                    onClick={() => setAnnotationDurationSeconds(durationSeconds)}
                    className={[
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border border-custom-border-200 bg-custom-background-90 text-[10px] font-semibold text-custom-text-200 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40",
                      isSelected ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
                    ].join(" ")}
                    aria-label={`Show annotation for ${durationSeconds} seconds`}
                    aria-pressed={isSelected}
                    title={`${durationSeconds}s duration`}
                  >
                    {durationSeconds}s
                  </button>
                );
              })}

              <span className="my-0.5 h-px w-6 bg-custom-border-200" />
              {VIDEO_ANNOTATION_STROKE_WIDTHS.map((strokeWidth) => {
                const isSelected = annotationStrokeWidth === strokeWidth;

                return (
                  <button
                    key={strokeWidth}
                    type="button"
                    onClick={() => setAnnotationStrokeWidth(strokeWidth)}
                    className={[
                      annotationButtonClass,
                      isSelected ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
                    ].join(" ")}
                    aria-label={`${strokeWidth}px annotation stroke`}
                    aria-pressed={isSelected}
                    title={`${strokeWidth}px`}
                  >
                    <span className="w-4 rounded-full bg-current" style={{ height: Math.max(2, strokeWidth / 1.5) }} />
                  </button>
                );
              })}

              {VIDEO_ANNOTATION_STROKE_STYLES.map((strokeStyleOption) => {
                const isSelected = annotationStrokeStyle === strokeStyleOption.value;

                return (
                  <button
                    key={strokeStyleOption.value}
                    type="button"
                    onClick={() => setAnnotationStrokeStyle(strokeStyleOption.value)}
                    className={[
                      annotationButtonClass,
                      isSelected ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
                    ].join(" ")}
                    aria-label={`${strokeStyleOption.label} annotation stroke`}
                    aria-pressed={isSelected}
                    title={`${strokeStyleOption.label} stroke`}
                  >
                    <span
                      className={[
                        "w-4 border-t-2 border-current",
                        strokeStyleOption.value === "dotted" ? "border-dotted" : "border-solid",
                      ].join(" ")}
                    />
                  </button>
                );
              })}
            </>
          ) : null}

          <span className="my-0.5 h-px w-6 bg-custom-border-200" />
          <button
            type="button"
            onClick={handleUndoVisibleAnnotation}
            className={annotationButtonClass}
            disabled={!hasActiveAnnotations || isSavingAnnotations}
            aria-label="Undo last annotation at this timestamp"
            title="Undo timestamp"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleClearVisibleAnnotations}
            className={annotationButtonClass}
            disabled={!hasActiveAnnotations || isSavingAnnotations}
            aria-label="Clear annotations at this timestamp"
            title="Clear timestamp"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void handleSaveAnnotations()}
            className={[
              annotationButtonClass,
              hasAnnotationChanges ? "border-green-500/45 bg-green-500/10 text-green-600" : "",
            ].join(" ")}
            disabled={!hasAnnotationChanges || isSavingAnnotations}
            aria-label="Save annotations"
            title="Save"
          >
            <Save className="h-4 w-4" />
          </button>
        </>
      ) : null}
    </div>
  ) : null;

  return (
    <>
      <PlaylistAnnotationOverlay
        annotations={activeAnnotations}
        className={["z-10", className].filter(Boolean).join(" ")}
        color={annotationColor}
        durationSeconds={annotationDurationSeconds}
        enableAnnotationTransforms={enableAnnotationTransforms}
        enabled={canEdit && isAnnotationMode}
        fitToVideoBounds={fitToVideoBounds}
        onCreateAnnotation={handleCreateAnnotation}
        onUpdateAnnotation={handleUpdateAnnotation}
        startTime={effectiveCurrentTime}
        strokeStyle={annotationStrokeStyle}
        strokeWidth={annotationStrokeWidth}
        textFontFamily={annotationTextFontFamily}
        textFontSize={annotationTextFontSize}
        textFontWeight={annotationTextFontWeight}
        tool={annotationTool}
      />

      {canEdit && !toolbarHostElement && !showTimeline ? (
        <div className="absolute left-2 top-2 z-20 flex max-w-[calc(100%-1rem)] flex-wrap items-center gap-1 rounded-[6px] border border-custom-border-200 bg-custom-background-100/95 p-1 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={handleToggleAnnotationMode}
            className={[
              annotationButtonClass,
              isAnnotationMode ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
            ].join(" ")}
            aria-label="Toggle annotation toolbar"
            aria-pressed={isAnnotationMode}
            title="Annotate"
          >
            <Pencil className="h-4 w-4" />
          </button>

          {isAnnotationMode ? (
            <>
              <span className="inline-flex h-8 shrink-0 items-center rounded-[5px] border border-custom-border-200 bg-custom-background-90 px-2 text-[11px] font-medium text-custom-text-200">
                {formatAnnotationTime(effectiveCurrentTime)}-
                {formatAnnotationTime(effectiveCurrentTime + annotationDurationSeconds)}
              </span>
              <span className="mx-0.5 h-6 w-px bg-custom-border-200" />
              {availableAnnotationTools.map((toolOption) => {
                const ToolIcon = toolOption.icon;
                const isSelected = annotationTool === toolOption.type;

                return (
                  <button
                    key={toolOption.type}
                    type="button"
                    onClick={() => handleSelectAnnotationTool(toolOption.type)}
                    className={[
                      annotationButtonClass,
                      isSelected ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
                    ].join(" ")}
                    aria-label={toolOption.label}
                    aria-pressed={isSelected}
                    title={toolOption.label}
                  >
                    <ToolIcon className="h-4 w-4" />
                  </button>
                );
              })}

              <span className="mx-0.5 h-6 w-px bg-custom-border-200" />
              {renderAnnotationColorPicker()}

              <span className="mx-0.5 h-6 w-px bg-custom-border-200" />
              {VIDEO_ANNOTATION_DURATIONS.map((durationSeconds) => {
                const isSelected = annotationDurationSeconds === durationSeconds;

                return (
                  <button
                    key={durationSeconds}
                    type="button"
                    onClick={() => setAnnotationDurationSeconds(durationSeconds)}
                    className={[
                      "inline-flex h-8 shrink-0 items-center justify-center rounded-[5px] border border-custom-border-200 bg-custom-background-90 px-2 text-[11px] font-medium text-custom-text-200 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40",
                      isSelected ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
                    ].join(" ")}
                    aria-label={`Show annotation for ${durationSeconds} seconds`}
                    aria-pressed={isSelected}
                    title={`${durationSeconds}s duration`}
                  >
                    {durationSeconds}s
                  </button>
                );
              })}

              <span className="mx-0.5 h-6 w-px bg-custom-border-200" />
              {VIDEO_ANNOTATION_STROKE_WIDTHS.map((strokeWidth) => {
                const isSelected = annotationStrokeWidth === strokeWidth;

                return (
                  <button
                    key={strokeWidth}
                    type="button"
                    onClick={() => setAnnotationStrokeWidth(strokeWidth)}
                    className={[
                      annotationButtonClass,
                      isSelected ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
                    ].join(" ")}
                    aria-label={`${strokeWidth}px annotation stroke`}
                    aria-pressed={isSelected}
                    title={`${strokeWidth}px`}
                  >
                    <span className="w-4 rounded-full bg-current" style={{ height: Math.max(2, strokeWidth / 1.5) }} />
                  </button>
                );
              })}

              {VIDEO_ANNOTATION_STROKE_STYLES.map((strokeStyleOption) => {
                const isSelected = annotationStrokeStyle === strokeStyleOption.value;

                return (
                  <button
                    key={strokeStyleOption.value}
                    type="button"
                    onClick={() => setAnnotationStrokeStyle(strokeStyleOption.value)}
                    className={[
                      annotationButtonClass,
                      isSelected ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
                    ].join(" ")}
                    aria-label={`${strokeStyleOption.label} annotation stroke`}
                    aria-pressed={isSelected}
                    title={`${strokeStyleOption.label} stroke`}
                  >
                    <span
                      className={[
                        "w-4 border-t-2 border-current",
                        strokeStyleOption.value === "dotted" ? "border-dotted" : "border-solid",
                      ].join(" ")}
                    />
                  </button>
                );
              })}

              <span className="mx-0.5 h-6 w-px bg-custom-border-200" />
              <button
                type="button"
                onClick={handleUndoVisibleAnnotation}
                className={annotationButtonClass}
                disabled={!hasActiveAnnotations || isSavingAnnotations}
                aria-label="Undo last annotation at this timestamp"
                title="Undo timestamp"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleClearVisibleAnnotations}
                className={annotationButtonClass}
                disabled={!hasActiveAnnotations || isSavingAnnotations}
                aria-label="Clear annotations at this timestamp"
                title="Clear timestamp"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void handleSaveAnnotations()}
                className={[
                  annotationButtonClass,
                  hasAnnotationChanges ? "border-green-500/45 bg-green-500/10 text-green-600" : "",
                ].join(" ")}
                disabled={!hasAnnotationChanges || isSavingAnnotations}
                aria-label="Save annotations"
                title="Save"
              >
                <Save className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
      {annotationToolbarContent && toolbarHostElement
        ? createPortal(annotationToolbarContent, toolbarHostElement)
        : null}
      {annotationPropertyPanelContent && propertyHostElement
        ? createPortal(annotationPropertyPanelContent, propertyHostElement)
        : null}
      {timelineContent && timelineHostElement ? createPortal(timelineContent, timelineHostElement) : null}
    </>
  );
};
