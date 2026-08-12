import { ArrowUpRight, Circle, Image as ImageIcon, Minus, Pencil, Square, Type } from "lucide-react";
import type { TCustomPlaylistAnnotation, TCustomPlaylistAnnotationTool } from "../types/annotation.types";
import { VIDEO_ANNOTATION_START_TIME_OFFSET_SECONDS } from "./video-annotation-editor-config";

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

const getAnnotationStartTimeWithCreationOffset = (playheadTime: number) =>
  Math.max(0, playheadTime - VIDEO_ANNOTATION_START_TIME_OFFSET_SECONDS);

const applyAnnotationCreationStartTimeOffset = (annotation: TCustomPlaylistAnnotation): TCustomPlaylistAnnotation => {
  const annotationDurationSeconds = Math.max(0, annotation.endTime - annotation.startTime);
  const startTime = getAnnotationStartTimeWithCreationOffset(annotation.startTime);

  return {
    ...annotation,
    endTime: startTime + annotationDurationSeconds,
    startTime,
  };
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
  if (annotation.type === "image") return annotation.title?.trim() || `Image ${index + 1}`;
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
  if (annotation.type === "image") return ImageIcon;
  if (annotation.type === "line") return Minus;
  if (annotation.type === "pen") return Pencil;
  if (annotation.type === "rectangle") return Square;
  if (annotation.type === "text") return Type;

  return Pencil;
};

const getAnnotationTimelineMomentTitle = (annotation: TCustomPlaylistAnnotation) =>
  annotation.title?.trim() || (annotation.type === "image" ? "Image moment" : annotation.content?.trim());

type AnnotationTimelineMomentItem = {
  annotation: TCustomPlaylistAnnotation;
  index: number;
};

export type AnnotationTimelineMoment = {
  annotations: AnnotationTimelineMomentItem[];
  id: string;
  startTime: number;
  title: string;
};

export type AnnotationTimelineResizeState = {
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

const ANNOTATION_TIMELINE_MAX_WIDTH_AT_DEFAULT_ZOOM_PX = 32000;

const getTimelineContentWidthPx = (durationSeconds: number, zoomPercent: number) => {
  const safeDurationSeconds = Math.max(1, durationSeconds);
  const zoomScale = clampTimelineValue(zoomPercent / 100, 0.5, 3);
  const baseTimelineWidth = Math.max(960, safeDurationSeconds * 4);
  const maxTimelineWidth = ANNOTATION_TIMELINE_MAX_WIDTH_AT_DEFAULT_ZOOM_PX * zoomScale;

  return Math.min(maxTimelineWidth, Math.max(760, Math.ceil(baseTimelineWidth * zoomScale)));
};

export {
  applyAnnotationCreationStartTimeOffset,
  buildAnnotationTimelineMoments,
  buildAnnotationTimelineTicks,
  clampTimelineValue,
  formatAnnotationTime,
  getAnnotationStartTimeWithCreationOffset,
  getAnnotationTimelineIcon,
  getAnnotationTimelineLabel,
  getAnnotationTimelineToolLabel,
  getTimelineContentWidthPx,
  getTimelineDuration,
  getTimelinePercent,
  resolveAnnotationTimelineLayers,
};
