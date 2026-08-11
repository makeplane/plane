"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { RotateCw } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import type {
  TCustomPlaylistAnnotation,
  TCustomPlaylistAnnotationPoint,
  TCustomPlaylistAnnotationStyle,
  TCustomPlaylistAnnotationStrokeStyle,
  TCustomPlaylistAnnotationTool,
} from "@/services/media-library.service";

type PlaylistAnnotationOverlayProps = {
  annotations: TCustomPlaylistAnnotation[];
  className?: string;
  color: string;
  durationSeconds: number;
  enableAnnotationTransforms?: boolean;
  enabled: boolean;
  fitToVideoBounds?: boolean;
  imageContent?: string | null;
  imageHeight: number;
  imageOpacity: number;
  imageTitle?: string;
  imageWidth: number;
  onCreateAnnotation: (annotation: TCustomPlaylistAnnotation) => void;
  onUpdateAnnotation?: (annotation: TCustomPlaylistAnnotation) => void;
  textFontFamily: string;
  textFontSize: number;
  textFontWeight: number;
  startTime: number;
  strokeStyle: TCustomPlaylistAnnotationStrokeStyle;
  strokeWidth: number;
  tool: TCustomPlaylistAnnotationTool;
};

const CANVAS_SIZE = 1000;
const MIN_POINT_DISTANCE = 3;
const MIN_RESIZE_DIMENSION = 8;
const MIN_SHAPE_DISTANCE = 6;
const MAX_POINT_COUNT = 700;
const MIN_ARROW_HEAD_LENGTH = 14;
const MAX_ARROW_HEAD_LENGTH = 34;
const MIN_TEXT_FONT_SIZE = 12;
const MAX_TEXT_FONT_SIZE = 140;
export const DEFAULT_PLAYLIST_ANNOTATION_DURATION_SECONDS = 4;
const VALID_ANNOTATION_TYPES = new Set<TCustomPlaylistAnnotationTool>([
  "text",
  "rectangle",
  "ellipse",
  "line",
  "arrow",
  "image",
  "pen",
]);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getPointDistance = (firstPoint: TCustomPlaylistAnnotationPoint, secondPoint: TCustomPlaylistAnnotationPoint) =>
  Math.hypot(firstPoint.x - secondPoint.x, firstPoint.y - secondPoint.y);

const normalizeNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizeRotation = (value: unknown) => {
  const numberValue = normalizeNumber(value);
  if (numberValue === null) return undefined;

  return ((numberValue % 360) + 360) % 360;
};

const normalizeCoordinate = (value: unknown) => {
  const numberValue = normalizeNumber(value);
  return numberValue === null ? 0 : clamp(numberValue, 0, CANVAS_SIZE);
};

const normalizeDimension = (value: unknown) => {
  const numberValue = normalizeNumber(value);
  return numberValue === null ? 0 : clamp(numberValue, -CANVAS_SIZE, CANVAS_SIZE);
};

const normalizeTime = (value: unknown) => {
  const numberValue = normalizeNumber(value);
  return numberValue === null || numberValue < 0 ? 0 : numberValue;
};

const normalizeTrackIndex = (value: unknown) => {
  const numberValue = normalizeNumber(value);
  if (numberValue === null || numberValue < 0) return undefined;

  return clamp(Math.floor(numberValue), 0, 99);
};

const normalizeStyle = (value: unknown): TCustomPlaylistAnnotationStyle => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return value as TCustomPlaylistAnnotationStyle;
};

const normalizeStroke = (style: TCustomPlaylistAnnotationStyle, legacyColor?: unknown) => {
  const stroke = typeof style.stroke === "string" ? style.stroke : undefined;
  const color = typeof style.color === "string" ? style.color : undefined;
  const fallback = typeof legacyColor === "string" ? legacyColor : undefined;
  return stroke ?? color ?? fallback ?? "#f97316";
};

const normalizeStrokeWidth = (style: TCustomPlaylistAnnotationStyle, legacyStrokeWidth?: unknown) => {
  const styleStrokeWidth = normalizeNumber(style.strokeWidth);
  const legacyValue = normalizeNumber(legacyStrokeWidth);
  const value = styleStrokeWidth ?? legacyValue ?? 4;
  return clamp(value, 2, 12);
};

const normalizeStrokeStyle = (style: TCustomPlaylistAnnotationStyle): TCustomPlaylistAnnotationStrokeStyle =>
  style.strokeStyle === "dotted" ? "dotted" : "solid";

const getStrokeLineDash = (strokeStyle: TCustomPlaylistAnnotationStrokeStyle, strokeWidth: number) =>
  strokeStyle === "dotted" ? [Math.max(1, strokeWidth * 0.1), Math.max(4, strokeWidth * 2.2)] : [];

const normalizePoint = (value: unknown): TCustomPlaylistAnnotationPoint | null => {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const x = normalizeNumber(record.x);
  const y = normalizeNumber(record.y);
  if (x === null || y === null) return null;

  return {
    x: clamp(x, 0, CANVAS_SIZE),
    y: clamp(y, 0, CANVAS_SIZE),
  };
};

const getPointBounds = (points: TCustomPlaylistAnnotationPoint[]) => {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);

  return {
    x,
    y,
    width: Math.max(...xs) - x,
    height: Math.max(...ys) - y,
  };
};

const normalizeAnnotationBox = (annotation: TCustomPlaylistAnnotation): TCustomPlaylistAnnotation => {
  if (annotation.type !== "rectangle" && annotation.type !== "ellipse" && annotation.type !== "image") {
    return annotation;
  }

  const width = annotation.width ?? 0;
  const height = annotation.height ?? 0;

  return {
    ...annotation,
    height: Math.abs(height),
    width: Math.abs(width),
    x: width < 0 ? annotation.x + width : annotation.x,
    y: height < 0 ? annotation.y + height : annotation.y,
  };
};

const hasValidTimeRange = (annotation: TCustomPlaylistAnnotation) => annotation.endTime > annotation.startTime;

const isAnnotationValid = (annotation: TCustomPlaylistAnnotation) => {
  if (!hasValidTimeRange(annotation)) return false;

  if (annotation.type === "pen") {
    const points = annotation.points ?? [];
    return points.length > 1 && getPointDistance(points[0], points[points.length - 1]) >= MIN_POINT_DISTANCE;
  }

  if (annotation.type === "text") return Boolean(annotation.content?.trim());
  if (annotation.type === "image") return Boolean(annotation.content?.trim()) && (annotation.width ?? 0) > 0;

  const width = annotation.width ?? 0;
  const height = annotation.height ?? 0;
  return Math.hypot(width, height) >= MIN_SHAPE_DISTANCE;
};

export const createPlaylistAnnotationId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `annotation-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const normalizePlaylistAnnotations = (value: unknown): TCustomPlaylistAnnotation[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((annotation): TCustomPlaylistAnnotation | null => {
      if (!annotation || typeof annotation !== "object") return null;

      const record = annotation as Record<string, unknown>;
      const type = record.type;
      if (typeof type !== "string" || !VALID_ANNOTATION_TYPES.has(type as TCustomPlaylistAnnotationTool)) return null;

      const style = normalizeStyle(record.style);
      const legacyStartTime = normalizeTime(record.timestampSeconds);
      const legacyDurationSeconds =
        normalizeTime(record.durationSeconds) || DEFAULT_PLAYLIST_ANNOTATION_DURATION_SECONDS;
      const startTime = "startTime" in record ? normalizeTime(record.startTime) : legacyStartTime;
      const endTime =
        "endTime" in record
          ? normalizeTime(record.endTime)
          : Math.max(startTime, legacyStartTime + legacyDurationSeconds);
      const points = Array.isArray(record.points)
        ? record.points.map(normalizePoint).filter((point): point is TCustomPlaylistAnnotationPoint => Boolean(point))
        : [];
      const pointBounds = points.length > 0 ? getPointBounds(points) : null;
      const legacyStart = normalizePoint(record.start);
      const legacyEnd = normalizePoint(record.end);
      const x = "x" in record ? normalizeCoordinate(record.x) : (pointBounds?.x ?? legacyStart?.x ?? 0);
      const y = "y" in record ? normalizeCoordinate(record.y) : (pointBounds?.y ?? legacyStart?.y ?? 0);
      const width =
        "width" in record
          ? normalizeDimension(record.width)
          : (pointBounds?.width ?? (legacyStart && legacyEnd ? legacyEnd.x - legacyStart.x : 0));
      const height =
        "height" in record
          ? normalizeDimension(record.height)
          : (pointBounds?.height ?? (legacyStart && legacyEnd ? legacyEnd.y - legacyStart.y : 0));

      const normalizedAnnotation = normalizeAnnotationBox({
        content: typeof record.content === "string" ? record.content : undefined,
        createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
        endTime,
        height,
        id: typeof record.id === "string" && record.id.trim() ? record.id : createPlaylistAnnotationId(),
        points: points.slice(0, MAX_POINT_COUNT),
        rotation: normalizeRotation(record.rotation),
        startTime,
        style: {
          ...style,
          stroke: normalizeStroke(style, record.color),
          strokeStyle: normalizeStrokeStyle(style),
          strokeWidth: normalizeStrokeWidth(style, record.strokeWidth),
        },
        title:
          typeof record.title === "string" && record.title.trim()
            ? record.title.trim()
            : typeof record.timelineTitle === "string" && record.timelineTitle.trim()
              ? record.timelineTitle.trim()
              : undefined,
        trackIndex: normalizeTrackIndex(record.trackIndex),
        type: type as TCustomPlaylistAnnotationTool,
        width,
        x,
        y,
      });

      return normalizedAnnotation;
    })
    .filter((annotation): annotation is TCustomPlaylistAnnotation => Boolean(annotation))
    .filter(isAnnotationValid)
    .sort((first, second) => first.startTime - second.startTime || first.endTime - second.endTime);
};

export const arePlaylistAnnotationsEqual = (
  firstAnnotations: TCustomPlaylistAnnotation[],
  secondAnnotations: TCustomPlaylistAnnotation[]
) => JSON.stringify(firstAnnotations) === JSON.stringify(secondAnnotations);

export const isPlaylistAnnotationVisibleAtTime = (annotation: TCustomPlaylistAnnotation, currentTime: number) =>
  currentTime >= annotation.startTime && currentTime <= annotation.endTime;

export const getActivePlaylistAnnotations = (sortedAnnotations: TCustomPlaylistAnnotation[], currentTime: number) => {
  const activeAnnotations: TCustomPlaylistAnnotation[] = [];

  for (const annotation of sortedAnnotations) {
    if (annotation.startTime > currentTime) break;
    if (isPlaylistAnnotationVisibleAtTime(annotation, currentTime)) activeAnnotations.push(annotation);
  }

  return activeAnnotations;
};

const getAnnotationStyle = (annotation: TCustomPlaylistAnnotation) => {
  const style = annotation.style ?? {};
  return {
    fill: typeof style.color === "string" ? style.color : "#ffffff",
    fontFamily: typeof style.fontFamily === "string" ? style.fontFamily : "sans-serif",
    fontSize: typeof style.fontSize === "number" ? style.fontSize : 28,
    fontWeight: style.fontWeight,
    opacity: typeof style.opacity === "number" ? clamp(style.opacity, 0, 1) : undefined,
    stroke: normalizeStroke(style),
    strokeStyle: normalizeStrokeStyle(style),
    strokeWidth: normalizeStrokeWidth(style),
  };
};

const getAnnotationRotation = (annotation: TCustomPlaylistAnnotation) => normalizeRotation(annotation.rotation) ?? 0;

const getTextAnnotationSize = (annotation: TCustomPlaylistAnnotation, fontSize: number) => {
  const content = annotation.content?.trim() || "Text";

  return {
    height: Math.max(18, fontSize * 1.25),
    width: Math.max(48, content.length * fontSize * 0.62),
  };
};

const getAnnotationBounds = (annotation: TCustomPlaylistAnnotation): AnnotationBounds | null => {
  if (annotation.type === "pen") {
    const points = annotation.points ?? [];
    return points.length > 0 ? getPointBounds(points) : null;
  }

  if (annotation.type === "text") {
    const resolvedStyle = getAnnotationStyle(annotation);
    const textSize = getTextAnnotationSize(annotation, resolvedStyle.fontSize);

    return {
      height: textSize.height,
      width: textSize.width,
      x: annotation.x,
      y: annotation.y - textSize.height,
    };
  }

  const width = annotation.width ?? 0;
  const height = annotation.height ?? 0;

  return {
    height: Math.abs(height),
    width: Math.abs(width),
    x: Math.min(annotation.x, annotation.x + width),
    y: Math.min(annotation.y, annotation.y + height),
  };
};

const getAnnotationCenter = (annotation: TCustomPlaylistAnnotation) => {
  const bounds = getAnnotationBounds(annotation);
  if (!bounds) return null;

  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
};

const getPointAngle = (point: TCustomPlaylistAnnotationPoint, center: TCustomPlaylistAnnotationPoint) =>
  Math.atan2(point.y - center.y, point.x - center.x);

const rotatePointAroundCenter = (
  point: TCustomPlaylistAnnotationPoint,
  center: TCustomPlaylistAnnotationPoint,
  rotationDegrees: number
) => {
  const rotationRadians = (rotationDegrees * Math.PI) / 180;
  const cos = Math.cos(rotationRadians);
  const sin = Math.sin(rotationRadians);
  const offsetX = point.x - center.x;
  const offsetY = point.y - center.y;

  return {
    x: center.x + offsetX * cos - offsetY * sin,
    y: center.y + offsetX * sin + offsetY * cos,
  };
};

const rotateVector = (vector: TCustomPlaylistAnnotationPoint, rotationDegrees: number) => {
  const rotationRadians = (rotationDegrees * Math.PI) / 180;
  const cos = Math.cos(rotationRadians);
  const sin = Math.sin(rotationRadians);

  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
};

const isLinearAnnotation = (annotation: TCustomPlaylistAnnotation) =>
  annotation.type === "line" || annotation.type === "arrow";

const isAnnotationResizable = (annotation: TCustomPlaylistAnnotation) =>
  annotation.type !== "text" || Boolean(annotation.content?.trim());

const getLinearAnnotationEndpoints = (annotation: TCustomPlaylistAnnotation) => {
  const start = { x: annotation.x, y: annotation.y };
  const end = {
    x: annotation.x + (annotation.width ?? 0),
    y: annotation.y + (annotation.height ?? 0),
  };
  const rotation = getAnnotationRotation(annotation);
  const center = rotation ? getAnnotationCenter(annotation) : null;

  if (!center) return { end, start };

  return {
    end: rotatePointAroundCenter(end, center, rotation),
    start: rotatePointAroundCenter(start, center, rotation),
  };
};

const getPointToSegmentDistance = (
  point: TCustomPlaylistAnnotationPoint,
  start: TCustomPlaylistAnnotationPoint,
  end: TCustomPlaylistAnnotationPoint
) => {
  const segmentLengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  if (segmentLengthSquared <= 0) return getPointDistance(point, start);

  const position = clamp(
    ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / segmentLengthSquared,
    0,
    1
  );
  const closestPoint = {
    x: start.x + position * (end.x - start.x),
    y: start.y + position * (end.y - start.y),
  };

  return getPointDistance(point, closestPoint);
};

const getResizeHandlePoint = (bounds: AnnotationBounds, handle: AnnotationBoxResizeHandle) => {
  const right = bounds.x + bounds.width;
  const bottom = bounds.y + bounds.height;

  return {
    x: handle.includes("w") ? bounds.x : handle.includes("e") ? right : bounds.x + bounds.width / 2,
    y: handle.includes("n") ? bounds.y : handle.includes("s") ? bottom : bounds.y + bounds.height / 2,
  };
};

const getResizedBounds = ({
  bounds,
  center,
  handle,
  point,
  rotation,
}: {
  bounds: AnnotationBounds;
  center: TCustomPlaylistAnnotationPoint;
  handle: AnnotationBoxResizeHandle;
  point: TCustomPlaylistAnnotationPoint;
  rotation: number;
}) => {
  const fixedLocalPoint = getResizeHandlePoint(bounds, OPPOSITE_RESIZE_HANDLE[handle]);
  const fixedWorldPoint = rotatePointAroundCenter(fixedLocalPoint, center, rotation);
  const localDelta = rotateVector(
    {
      x: point.x - fixedWorldPoint.x,
      y: point.y - fixedWorldPoint.y,
    },
    -rotation
  );
  const draggedLocalPoint = {
    x: fixedLocalPoint.x + localDelta.x,
    y: fixedLocalPoint.y + localDelta.y,
  };
  let left = bounds.x;
  let right = bounds.x + bounds.width;
  let top = bounds.y;
  let bottom = bounds.y + bounds.height;

  if (handle.includes("w")) left = clamp(draggedLocalPoint.x, 0, Math.max(0, right - MIN_RESIZE_DIMENSION));
  if (handle.includes("e"))
    right = clamp(draggedLocalPoint.x, Math.min(CANVAS_SIZE, left + MIN_RESIZE_DIMENSION), CANVAS_SIZE);
  if (handle.includes("n")) top = clamp(draggedLocalPoint.y, 0, Math.max(0, bottom - MIN_RESIZE_DIMENSION));
  if (handle.includes("s"))
    bottom = clamp(draggedLocalPoint.y, Math.min(CANVAS_SIZE, top + MIN_RESIZE_DIMENSION), CANVAS_SIZE);

  return {
    height: Math.max(0, bottom - top),
    width: Math.max(0, right - left),
    x: left,
    y: top,
  };
};

const scalePointBetweenBounds = (
  point: TCustomPlaylistAnnotationPoint,
  originalBounds: AnnotationBounds,
  nextBounds: AnnotationBounds
) => {
  const relativeX = originalBounds.width > 0 ? (point.x - originalBounds.x) / originalBounds.width : 0.5;
  const relativeY = originalBounds.height > 0 ? (point.y - originalBounds.y) / originalBounds.height : 0.5;

  return {
    x: clamp(nextBounds.x + nextBounds.width * relativeX, 0, CANVAS_SIZE),
    y: clamp(nextBounds.y + nextBounds.height * relativeY, 0, CANVAS_SIZE),
  };
};

const getResizedTextAnnotation = (
  annotation: TCustomPlaylistAnnotation,
  originalBounds: AnnotationBounds,
  nextBounds: AnnotationBounds,
  handle: AnnotationBoxResizeHandle
): TCustomPlaylistAnnotation => {
  const resolvedStyle = getAnnotationStyle(annotation);
  const widthScale = originalBounds.width > 0 ? nextBounds.width / originalBounds.width : 1;
  const heightScale = originalBounds.height > 0 ? nextBounds.height / originalBounds.height : 1;
  const scale =
    handle.length === 2 ? (widthScale + heightScale) / 2 : handle === "e" || handle === "w" ? widthScale : heightScale;
  const fontSize = clamp(resolvedStyle.fontSize * scale, MIN_TEXT_FONT_SIZE, MAX_TEXT_FONT_SIZE);
  const textSize = getTextAnnotationSize(annotation, fontSize);
  const fixedPoint = getResizeHandlePoint(originalBounds, OPPOSITE_RESIZE_HANDLE[handle]);
  const x = handle.includes("w")
    ? fixedPoint.x - textSize.width
    : handle.includes("e")
      ? fixedPoint.x
      : fixedPoint.x - textSize.width / 2;
  const y = handle.includes("n")
    ? fixedPoint.y - textSize.height
    : handle.includes("s")
      ? fixedPoint.y
      : fixedPoint.y - textSize.height / 2;
  const clampedX = clamp(x, 0, Math.max(0, CANVAS_SIZE - textSize.width));
  const clampedY = clamp(y, 0, Math.max(0, CANVAS_SIZE - textSize.height));

  return {
    ...annotation,
    height: textSize.height,
    style: {
      ...annotation.style,
      fontSize,
    },
    width: textSize.width,
    x: clampedX,
    y: clampedY + textSize.height,
  };
};

const resizeAnnotation = (
  annotation: TCustomPlaylistAnnotation,
  originalBounds: AnnotationBounds,
  center: TCustomPlaylistAnnotationPoint,
  rotation: number,
  handle: AnnotationResizeHandle,
  point: TCustomPlaylistAnnotationPoint
): TCustomPlaylistAnnotation => {
  if (isLinearAnnotation(annotation)) {
    const endpoints = getLinearAnnotationEndpoints(annotation);
    const nextStart = handle === "start" ? point : endpoints.start;
    const nextEnd = handle === "end" ? point : endpoints.end;
    if (getPointDistance(nextStart, nextEnd) < MIN_RESIZE_DIMENSION) return annotation;

    return {
      ...annotation,
      height: nextEnd.y - nextStart.y,
      rotation: undefined,
      width: nextEnd.x - nextStart.x,
      x: nextStart.x,
      y: nextStart.y,
    };
  }

  if (!isBoxResizeHandle(handle)) return annotation;

  const nextBounds = getResizedBounds({ bounds: originalBounds, center, handle, point, rotation });

  if (annotation.type === "text") {
    return getResizedTextAnnotation(annotation, originalBounds, nextBounds, handle);
  }

  if (annotation.type === "pen") {
    const nextPoints = (annotation.points ?? []).map((annotationPoint) =>
      scalePointBetweenBounds(annotationPoint, originalBounds, nextBounds)
    );
    const nextPointBounds = getPointBounds(nextPoints);

    return {
      ...annotation,
      ...nextPointBounds,
      points: nextPoints,
    };
  }

  return normalizeAnnotationBox({
    ...annotation,
    height: nextBounds.height,
    width: nextBounds.width,
    x: nextBounds.x,
    y: nextBounds.y,
  });
};

const isPointInAnnotation = (point: TCustomPlaylistAnnotationPoint, annotation: TCustomPlaylistAnnotation) => {
  if (isLinearAnnotation(annotation)) {
    const endpoints = getLinearAnnotationEndpoints(annotation);
    return getPointToSegmentDistance(point, endpoints.start, endpoints.end) <= 18;
  }

  const bounds = getAnnotationBounds(annotation);
  const center = getAnnotationCenter(annotation);
  if (!bounds || !center) return false;

  const unrotatedPoint = rotatePointAroundCenter(point, center, -getAnnotationRotation(annotation));
  const hitPadding = annotation.type === "line" || annotation.type === "arrow" || annotation.type === "pen" ? 18 : 10;

  return (
    unrotatedPoint.x >= bounds.x - hitPadding &&
    unrotatedPoint.x <= bounds.x + bounds.width + hitPadding &&
    unrotatedPoint.y >= bounds.y - hitPadding &&
    unrotatedPoint.y <= bounds.y + bounds.height + hitPadding
  );
};

const moveAnnotation = (
  annotation: TCustomPlaylistAnnotation,
  deltaX: number,
  deltaY: number
): TCustomPlaylistAnnotation => {
  const bounds = getAnnotationBounds(annotation);
  if (!bounds) return annotation;

  const clampedDeltaX = clamp(deltaX, -bounds.x, CANVAS_SIZE - (bounds.x + bounds.width));
  const clampedDeltaY = clamp(deltaY, -bounds.y, CANVAS_SIZE - (bounds.y + bounds.height));

  return {
    ...annotation,
    points: annotation.points?.map((point) => ({
      x: clamp(point.x + clampedDeltaX, 0, CANVAS_SIZE),
      y: clamp(point.y + clampedDeltaY, 0, CANVAS_SIZE),
    })),
    x: clamp(annotation.x + clampedDeltaX, 0, CANVAS_SIZE),
    y: clamp(annotation.y + clampedDeltaY, 0, CANVAS_SIZE),
  };
};

type CanvasSize = {
  height: number;
  width: number;
};

type AnnotationBounds = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type AnnotationBoxResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

type AnnotationLinearResizeHandle = "start" | "end";

type AnnotationResizeHandle = AnnotationBoxResizeHandle | AnnotationLinearResizeHandle;

type AnnotationTransformMode = "move" | "resize" | "rotate";

type AnnotationTransformState = {
  annotationId: string;
  center: TCustomPlaylistAnnotationPoint;
  mode: AnnotationTransformMode;
  originalAnnotation: TCustomPlaylistAnnotation;
  originalBounds: AnnotationBounds;
  originalRotation: number;
  pointerId: number;
  resizeHandle?: AnnotationResizeHandle;
  startAngle: number;
  startPoint: TCustomPlaylistAnnotationPoint;
};

type OverlayBounds = {
  height: number;
  left: number;
  top: number;
  width: number;
};

const ANNOTATION_RESIZE_HANDLES: {
  className: string;
  cursorClassName: string;
  handle: AnnotationBoxResizeHandle;
  label: string;
}[] = [
  {
    className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
    cursorClassName: "cursor-nwse-resize",
    handle: "nw",
    label: "top left",
  },
  {
    className: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
    cursorClassName: "cursor-ns-resize",
    handle: "n",
    label: "top",
  },
  {
    className: "right-0 top-0 -translate-y-1/2 translate-x-1/2",
    cursorClassName: "cursor-nesw-resize",
    handle: "ne",
    label: "top right",
  },
  {
    className: "right-0 top-1/2 -translate-y-1/2 translate-x-1/2",
    cursorClassName: "cursor-ew-resize",
    handle: "e",
    label: "right",
  },
  {
    className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
    cursorClassName: "cursor-nwse-resize",
    handle: "se",
    label: "bottom right",
  },
  {
    className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
    cursorClassName: "cursor-ns-resize",
    handle: "s",
    label: "bottom",
  },
  {
    className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
    cursorClassName: "cursor-nesw-resize",
    handle: "sw",
    label: "bottom left",
  },
  {
    className: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
    cursorClassName: "cursor-ew-resize",
    handle: "w",
    label: "left",
  },
];

const OPPOSITE_RESIZE_HANDLE: Record<AnnotationBoxResizeHandle, AnnotationBoxResizeHandle> = {
  e: "w",
  n: "s",
  ne: "sw",
  nw: "se",
  s: "n",
  se: "nw",
  sw: "ne",
  w: "e",
};

const isBoxResizeHandle = (handle: AnnotationResizeHandle): handle is AnnotationBoxResizeHandle =>
  handle !== "start" && handle !== "end";

const toCanvasX = (value: number, size: CanvasSize) => (value / CANVAS_SIZE) * size.width;

const toCanvasY = (value: number, size: CanvasSize) => (value / CANVAS_SIZE) * size.height;

const toCanvasPoint = (point: TCustomPlaylistAnnotationPoint, size: CanvasSize) => ({
  x: toCanvasX(point.x, size),
  y: toCanvasY(point.y, size),
});

const toCanvasWidth = (value: number, size: CanvasSize) => (value / CANVAS_SIZE) * size.width;

const toCanvasHeight = (value: number, size: CanvasSize) => (value / CANVAS_SIZE) * size.height;

const getFittedVideoBounds = (root: HTMLElement): OverlayBounds | null => {
  const host = root.parentElement;
  const video = host?.querySelector<HTMLVideoElement>("video");
  if (!host || !video) return null;

  const hostRect = host.getBoundingClientRect();
  const videoRect = video.getBoundingClientRect();
  if (hostRect.width <= 0 || hostRect.height <= 0 || videoRect.width <= 0 || videoRect.height <= 0) return null;

  let left = videoRect.left - hostRect.left;
  let top = videoRect.top - hostRect.top;
  let width = videoRect.width;
  let height = videoRect.height;
  const videoAspectRatio = video.videoWidth > 0 && video.videoHeight > 0 ? video.videoWidth / video.videoHeight : 0;
  const objectFit = typeof window !== "undefined" ? window.getComputedStyle(video).objectFit : "";

  if (videoAspectRatio > 0 && objectFit !== "fill") {
    const elementAspectRatio = videoRect.width / videoRect.height;

    if (objectFit === "cover") {
      if (elementAspectRatio > videoAspectRatio) {
        height = videoRect.width / videoAspectRatio;
        top = videoRect.top - hostRect.top - (height - videoRect.height) / 2;
      } else {
        width = videoRect.height * videoAspectRatio;
        left = videoRect.left - hostRect.left - (width - videoRect.width) / 2;
      }
    } else if (elementAspectRatio > videoAspectRatio) {
      width = videoRect.height * videoAspectRatio;
      left = videoRect.left - hostRect.left + (videoRect.width - width) / 2;
    } else {
      height = videoRect.width / videoAspectRatio;
      top = videoRect.top - hostRect.top + (videoRect.height - height) / 2;
    }
  }

  return {
    height: Math.max(1, height),
    left,
    top,
    width: Math.max(1, width),
  };
};

const areOverlayBoundsEqual = (firstBounds: OverlayBounds | null, secondBounds: OverlayBounds | null) => {
  if (firstBounds === secondBounds) return true;
  if (!firstBounds || !secondBounds) return false;

  return (
    Math.abs(firstBounds.left - secondBounds.left) < 0.5 &&
    Math.abs(firstBounds.top - secondBounds.top) < 0.5 &&
    Math.abs(firstBounds.width - secondBounds.width) < 0.5 &&
    Math.abs(firstBounds.height - secondBounds.height) < 0.5
  );
};

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const resolvedRadius = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);

  context.beginPath();
  context.moveTo(x + resolvedRadius, y);
  context.lineTo(x + width - resolvedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + resolvedRadius);
  context.lineTo(x + width, y + height - resolvedRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - resolvedRadius, y + height);
  context.lineTo(x + resolvedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - resolvedRadius);
  context.lineTo(x, y + resolvedRadius);
  context.quadraticCurveTo(x, y, x + resolvedRadius, y);
  context.closePath();
};

const drawArrow = (
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  strokeWidth: number
) => {
  const length = Math.hypot(endX - startX, endY - startY);
  if (length <= 0) return;

  const directionX = (endX - startX) / length;
  const directionY = (endY - startY) / length;
  const headLength = Math.min(
    clamp(strokeWidth * 4.6, MIN_ARROW_HEAD_LENGTH, MAX_ARROW_HEAD_LENGTH),
    Math.max(MIN_ARROW_HEAD_LENGTH * 0.75, length * 0.45)
  );
  const headWidth = clamp(strokeWidth * 3.6, strokeWidth + 8, headLength * 0.9);
  const baseX = endX - directionX * headLength;
  const baseY = endY - directionY * headLength;
  const normalX = -directionY;
  const normalY = directionX;

  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(baseX, baseY);
  context.stroke();

  context.beginPath();
  context.moveTo(endX, endY);
  context.lineTo(baseX + normalX * (headWidth / 2), baseY + normalY * (headWidth / 2));
  context.lineTo(baseX - normalX * (headWidth / 2), baseY - normalY * (headWidth / 2));
  context.closePath();
  context.fill();
};

const drawImageAnnotation = ({
  annotation,
  context,
  imageCache,
  onImageLoad,
  size,
}: {
  annotation: TCustomPlaylistAnnotation;
  context: CanvasRenderingContext2D;
  imageCache: Map<string, HTMLImageElement>;
  onImageLoad: () => void;
  size: CanvasSize;
}) => {
  if (!annotation.content?.trim()) return;

  let image = imageCache.get(annotation.content);
  if (!image) {
    image = new Image();
    image.onload = onImageLoad;
    image.onerror = onImageLoad;
    image.src = annotation.content;
    imageCache.set(annotation.content, image);
  }

  if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return;

  context.drawImage(
    image,
    toCanvasX(annotation.x, size),
    toCanvasY(annotation.y, size),
    toCanvasWidth(annotation.width || 120, size),
    toCanvasHeight(annotation.height || 120, size)
  );
};

const drawCanvasAnnotation = ({
  annotation,
  context,
  imageCache,
  isDraft = false,
  onImageLoad,
  size,
}: {
  annotation: TCustomPlaylistAnnotation;
  context: CanvasRenderingContext2D;
  imageCache: Map<string, HTMLImageElement>;
  isDraft?: boolean;
  onImageLoad: () => void;
  size: CanvasSize;
}) => {
  const resolvedStyle = getAnnotationStyle(annotation);
  const rotation = getAnnotationRotation(annotation);
  const center = rotation ? getAnnotationCenter(annotation) : null;

  context.save();
  if (center) {
    context.translate(toCanvasX(center.x, size), toCanvasY(center.y, size));
    context.rotate((rotation * Math.PI) / 180);
    context.translate(-toCanvasX(center.x, size), -toCanvasY(center.y, size));
  }

  context.globalAlpha = (resolvedStyle.opacity ?? 1) * (isDraft ? 0.7 : 1);
  context.strokeStyle = resolvedStyle.stroke;
  context.fillStyle = resolvedStyle.stroke;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = resolvedStyle.strokeWidth;
  context.setLineDash(getStrokeLineDash(resolvedStyle.strokeStyle, resolvedStyle.strokeWidth));

  if (annotation.type === "pen") {
    const points = annotation.points ?? [];
    if (points.length < 2) {
      context.restore();
      return;
    }

    const firstPoint = toCanvasPoint(points[0], size);
    context.beginPath();
    context.moveTo(firstPoint.x, firstPoint.y);
    points.slice(1).forEach((point) => {
      const nextPoint = toCanvasPoint(point, size);
      context.lineTo(nextPoint.x, nextPoint.y);
    });
    context.stroke();
    context.restore();
    return;
  }

  if (annotation.type === "text") {
    const fontSize = Math.max(8, toCanvasHeight(resolvedStyle.fontSize, size));
    const fontWeight = resolvedStyle.fontWeight ? `${resolvedStyle.fontWeight} ` : "";
    context.fillStyle = resolvedStyle.fill;
    context.font = `${fontWeight}${fontSize}px ${resolvedStyle.fontFamily}`;
    context.textBaseline = "alphabetic";
    context.fillText(annotation.content ?? "", toCanvasX(annotation.x, size), toCanvasY(annotation.y, size));
    context.restore();
    return;
  }

  if (annotation.type === "image") {
    drawImageAnnotation({ annotation, context, imageCache, onImageLoad, size });
    context.restore();
    return;
  }

  if (annotation.type === "rectangle") {
    drawRoundedRect(
      context,
      toCanvasX(annotation.x, size),
      toCanvasY(annotation.y, size),
      toCanvasWidth(annotation.width ?? 0, size),
      toCanvasHeight(annotation.height ?? 0, size),
      6
    );
    context.stroke();
    context.restore();
    return;
  }

  if (annotation.type === "ellipse") {
    const width = toCanvasWidth(annotation.width ?? 0, size);
    const height = toCanvasHeight(annotation.height ?? 0, size);

    context.beginPath();
    context.ellipse(
      toCanvasX(annotation.x, size) + width / 2,
      toCanvasY(annotation.y, size) + height / 2,
      Math.abs(width) / 2,
      Math.abs(height) / 2,
      0,
      0,
      Math.PI * 2
    );
    context.stroke();
    context.restore();
    return;
  }

  const startX = toCanvasX(annotation.x, size);
  const startY = toCanvasY(annotation.y, size);
  const endX = toCanvasX(annotation.x + (annotation.width ?? 0), size);
  const endY = toCanvasY(annotation.y + (annotation.height ?? 0), size);

  if (annotation.type === "arrow") {
    drawArrow(context, startX, startY, endX, endY, resolvedStyle.strokeWidth);
    context.restore();
    return;
  }

  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();

  context.restore();
};

export const PlaylistAnnotationOverlay = ({
  annotations,
  className,
  color,
  durationSeconds,
  enableAnnotationTransforms = false,
  enabled,
  fitToVideoBounds = false,
  imageContent = null,
  imageHeight,
  imageOpacity,
  imageTitle,
  imageWidth,
  onCreateAnnotation,
  onUpdateAnnotation,
  textFontFamily,
  textFontSize,
  textFontWeight,
  startTime,
  strokeStyle,
  strokeWidth,
  tool,
}: PlaylistAnnotationOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const overlayRootRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const draftAnnotationRef = useRef<TCustomPlaylistAnnotation | null>(null);
  const draftOriginRef = useRef<TCustomPlaylistAnnotationPoint | null>(null);
  const annotationTransformStateRef = useRef<AnnotationTransformState | null>(null);
  const textDraftInputRef = useRef<HTMLInputElement | null>(null);
  const shouldSkipTextDraftCommitRef = useRef(false);
  const [draftAnnotation, setDraftAnnotation] = useState<TCustomPlaylistAnnotation | null>(null);
  const [overlayBounds, setOverlayBounds] = useState<OverlayBounds | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState<{ point: TCustomPlaylistAnnotationPoint; value: string } | null>(null);
  const [canvasRevision, setCanvasRevision] = useState(0);
  const [imageRevision, setImageRevision] = useState(0);

  const renderedAnnotations = useMemo(
    () => [...annotations, ...(draftAnnotation ? [draftAnnotation] : [])],
    [annotations, draftAnnotation]
  );
  const canTransformAnnotations = enabled && enableAnnotationTransforms && Boolean(onUpdateAnnotation);
  const selectedAnnotation = useMemo(
    () => annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null,
    [annotations, selectedAnnotationId]
  );
  const selectedAnnotationIsLinear = selectedAnnotation ? isLinearAnnotation(selectedAnnotation) : false;
  const selectedAnnotationBounds = selectedAnnotation ? getAnnotationBounds(selectedAnnotation) : null;
  const selectedAnnotationRotation = selectedAnnotation ? getAnnotationRotation(selectedAnnotation) : 0;
  const selectedAnnotationCanResize = selectedAnnotation ? isAnnotationResizable(selectedAnnotation) : false;
  const selectedLinearAnnotationEndpoints =
    selectedAnnotation && selectedAnnotationIsLinear ? getLinearAnnotationEndpoints(selectedAnnotation) : null;
  const selectedLinearAnnotationMidpoint = selectedLinearAnnotationEndpoints
    ? {
        x: (selectedLinearAnnotationEndpoints.start.x + selectedLinearAnnotationEndpoints.end.x) / 2,
        y: (selectedLinearAnnotationEndpoints.start.y + selectedLinearAnnotationEndpoints.end.y) / 2,
      }
    : null;

  useEffect(() => {
    if (enabled) return;
    draftAnnotationRef.current = null;
    draftOriginRef.current = null;
    annotationTransformStateRef.current = null;
    setDraftAnnotation(null);
    setSelectedAnnotationId(null);
    setTextDraft(null);
    pointerIdRef.current = null;
  }, [enabled]);

  useEffect(() => {
    if (!selectedAnnotationId || annotations.some((annotation) => annotation.id === selectedAnnotationId)) return;

    setSelectedAnnotationId(null);
  }, [annotations, selectedAnnotationId]);

  const updateOverlayBounds = useCallback(() => {
    if (!fitToVideoBounds) {
      setOverlayBounds(null);
      return;
    }

    const root = overlayRootRef.current;
    const nextBounds = root ? getFittedVideoBounds(root) : null;
    setOverlayBounds((currentBounds) =>
      areOverlayBoundsEqual(currentBounds, nextBounds) ? currentBounds : nextBounds
    );
  }, [fitToVideoBounds]);

  useEffect(() => {
    updateOverlayBounds();
    if (!fitToVideoBounds || typeof window === "undefined") return;

    const root = overlayRootRef.current;
    const host = root?.parentElement ?? null;
    const video = host?.querySelector<HTMLVideoElement>("video") ?? null;
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateOverlayBounds) : null;
    const animationFrameId = window.requestAnimationFrame(updateOverlayBounds);

    if (host && resizeObserver) resizeObserver.observe(host);
    if (video && resizeObserver) resizeObserver.observe(video);

    video?.addEventListener("loadedmetadata", updateOverlayBounds);
    video?.addEventListener("loadeddata", updateOverlayBounds);
    video?.addEventListener("resize", updateOverlayBounds);
    window.addEventListener("resize", updateOverlayBounds);
    document.addEventListener("fullscreenchange", updateOverlayBounds);

    return () => {
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(animationFrameId);
      video?.removeEventListener("loadedmetadata", updateOverlayBounds);
      video?.removeEventListener("loadeddata", updateOverlayBounds);
      video?.removeEventListener("resize", updateOverlayBounds);
      window.removeEventListener("resize", updateOverlayBounds);
      document.removeEventListener("fullscreenchange", updateOverlayBounds);
    };
  }, [fitToVideoBounds, updateOverlayBounds]);

  useEffect(() => {
    if (!textDraft) return;

    window.requestAnimationFrame(() => {
      textDraftInputRef.current?.focus();
    });
  }, [textDraft]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const nextWidth = Math.max(1, Math.round(rect.width * dpr));
      const nextHeight = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width === nextWidth && canvas.height === nextHeight) return;

      canvas.width = nextWidth;
      canvas.height = nextHeight;
      setCanvasRevision((currentValue) => currentValue + 1);
    };

    updateCanvasSize();

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(updateCanvasSize);
      resizeObserver.observe(canvas);
      return () => resizeObserver.disconnect();
    }

    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageRevision((currentValue) => currentValue + 1);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const nextWidth = Math.max(1, Math.round(rect.width * dpr));
    const nextHeight = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);

    const annotationsToDraw = selectedAnnotationId
      ? [
          ...renderedAnnotations.filter((annotation) => annotation.id !== selectedAnnotationId),
          ...renderedAnnotations.filter((annotation) => annotation.id === selectedAnnotationId),
        ]
      : renderedAnnotations;

    annotationsToDraw.forEach((annotation) => {
      drawCanvasAnnotation({
        annotation,
        context,
        imageCache: imageCacheRef.current,
        isDraft: annotation.id === draftAnnotation?.id,
        onImageLoad: handleImageLoad,
        size: {
          height: rect.height,
          width: rect.width,
        },
      });
    });
  }, [canvasRevision, draftAnnotation?.id, handleImageLoad, imageRevision, renderedAnnotations, selectedAnnotationId]);

  const getEventPoint = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;

    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * CANVAS_SIZE, 0, CANVAS_SIZE),
      y: clamp(((event.clientY - rect.top) / rect.height) * CANVAS_SIZE, 0, CANVAS_SIZE),
    };
  }, []);

  const buildAnnotation = useCallback(
    (point: TCustomPlaylistAnnotationPoint, content?: string): TCustomPlaylistAnnotation => ({
      content: tool === "image" ? (imageContent ?? undefined) : content,
      createdAt: new Date().toISOString(),
      endTime: startTime + durationSeconds,
      height: tool === "image" ? imageHeight : 0,
      id: createPlaylistAnnotationId(),
      points: tool === "pen" ? [point] : undefined,
      startTime,
      style: {
        color,
        stroke: color,
        strokeStyle,
        strokeWidth,
        ...(tool === "image" ? { opacity: imageOpacity } : {}),
        ...(tool === "text" ? { fontFamily: textFontFamily, fontSize: textFontSize, fontWeight: textFontWeight } : {}),
      },
      title: tool === "image" ? imageTitle || "Image" : undefined,
      type: tool,
      width: tool === "image" ? imageWidth : 0,
      x: point.x,
      y: point.y,
    }),
    [
      color,
      durationSeconds,
      imageContent,
      imageHeight,
      imageOpacity,
      imageTitle,
      imageWidth,
      startTime,
      strokeStyle,
      strokeWidth,
      textFontFamily,
      textFontSize,
      textFontWeight,
      tool,
    ]
  );

  const commitTextDraft = useCallback(() => {
    if (shouldSkipTextDraftCommitRef.current) {
      shouldSkipTextDraftCommitRef.current = false;
      setTextDraft(null);
      return;
    }

    if (!textDraft) return;

    const content = textDraft.value.trim();
    shouldSkipTextDraftCommitRef.current = false;
    setTextDraft(null);
    if (!content) return;

    const normalizedAnnotation = normalizePlaylistAnnotations([buildAnnotation(textDraft.point, content)])[0];
    if (normalizedAnnotation) onCreateAnnotation(normalizedAnnotation);
  }, [buildAnnotation, onCreateAnnotation, textDraft]);

  const handleTextDraftKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitTextDraft();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        shouldSkipTextDraftCommitRef.current = true;
        setTextDraft(null);
      }
    },
    [commitTextDraft]
  );

  const updateDraftAnnotation = useCallback(
    (annotation: TCustomPlaylistAnnotation, point: TCustomPlaylistAnnotationPoint): TCustomPlaylistAnnotation => {
      if (annotation.type === "pen") {
        const points = annotation.points ?? [];
        const lastPoint = points[points.length - 1];
        if (lastPoint && getPointDistance(lastPoint, point) < MIN_POINT_DISTANCE) return annotation;

        const nextPoints = [...points, point].slice(-MAX_POINT_COUNT);
        return {
          ...annotation,
          ...getPointBounds(nextPoints),
          points: nextPoints,
        };
      }

      const origin = draftOriginRef.current ?? { x: annotation.x, y: annotation.y };
      const width = point.x - origin.x;
      const height = point.y - origin.y;
      if (annotation.type === "rectangle" || annotation.type === "ellipse" || annotation.type === "image") {
        return normalizeAnnotationBox({
          ...annotation,
          height,
          width,
          x: origin.x,
          y: origin.y,
        });
      }

      return {
        ...annotation,
        height,
        width,
        x: origin.x,
        y: origin.y,
      };
    },
    []
  );

  const startAnnotationTransform = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      annotation: TCustomPlaylistAnnotation,
      mode: AnnotationTransformMode,
      resizeHandle?: AnnotationResizeHandle
    ) => {
      if (!canTransformAnnotations) return false;
      if (mode === "resize" && (!resizeHandle || !isAnnotationResizable(annotation))) return false;

      const point = getEventPoint(event);
      const bounds = getAnnotationBounds(annotation);
      const center = bounds
        ? {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2,
          }
        : null;
      if (!point || !bounds || !center) return false;

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      annotationTransformStateRef.current = {
        annotationId: annotation.id,
        center,
        mode,
        originalAnnotation: annotation,
        originalBounds: bounds,
        originalRotation: getAnnotationRotation(annotation),
        pointerId: event.pointerId,
        resizeHandle,
        startAngle: getPointAngle(point, center),
        startPoint: point,
      };
      pointerIdRef.current = null;
      draftAnnotationRef.current = null;
      draftOriginRef.current = null;
      setDraftAnnotation(null);
      setSelectedAnnotationId(annotation.id);

      return true;
    },
    [canTransformAnnotations, getEventPoint]
  );

  const handleAnnotationTransformPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const transformState = annotationTransformStateRef.current;
      if (!transformState || transformState.pointerId !== event.pointerId || !onUpdateAnnotation) return false;

      const point = getEventPoint(event);
      if (!point) return true;

      event.preventDefault();
      event.stopPropagation();

      const nextAnnotation =
        transformState.mode === "move"
          ? moveAnnotation(
              transformState.originalAnnotation,
              point.x - transformState.startPoint.x,
              point.y - transformState.startPoint.y
            )
          : transformState.mode === "resize" && transformState.resizeHandle
            ? resizeAnnotation(
                transformState.originalAnnotation,
                transformState.originalBounds,
                transformState.center,
                transformState.originalRotation,
                transformState.resizeHandle,
                point
              )
            : {
                ...transformState.originalAnnotation,
                rotation: normalizeRotation(
                  transformState.originalRotation +
                    ((getPointAngle(point, transformState.center) - transformState.startAngle) * 180) / Math.PI
                ),
              };

      onUpdateAnnotation(nextAnnotation);

      return true;
    },
    [getEventPoint, onUpdateAnnotation]
  );

  const finishAnnotationTransform = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const transformState = annotationTransformStateRef.current;
    if (!transformState || transformState.pointerId !== event.pointerId) return false;

    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    annotationTransformStateRef.current = null;

    return true;
  }, []);

  const cancelAnnotationTransform = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const transformState = annotationTransformStateRef.current;
    if (!transformState || transformState.pointerId !== event.pointerId) return false;

    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    annotationTransformStateRef.current = null;

    return true;
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!enabled || event.button !== 0) return;

      const point = getEventPoint(event);
      if (!point) return;

      if (tool === "image" && !imageContent) return;

      if (canTransformAnnotations) {
        const annotationToTransform = [...annotations]
          .reverse()
          .find((annotation) => isPointInAnnotation(point, annotation));
        if (annotationToTransform && startAnnotationTransform(event, annotationToTransform, "move")) return;
        setSelectedAnnotationId(null);
      }

      event.preventDefault();
      event.stopPropagation();

      if (tool === "text") {
        shouldSkipTextDraftCommitRef.current = false;
        setTextDraft({ point, value: "" });
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      pointerIdRef.current = event.pointerId;

      const nextDraftAnnotation = buildAnnotation(point);
      draftAnnotationRef.current = nextDraftAnnotation;
      draftOriginRef.current = point;
      setDraftAnnotation(nextDraftAnnotation);
    },
    [
      annotations,
      buildAnnotation,
      canTransformAnnotations,
      enabled,
      getEventPoint,
      imageContent,
      startAnnotationTransform,
      tool,
    ]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (handleAnnotationTransformPointerMove(event)) return;
      if (!enabled || pointerIdRef.current !== event.pointerId) return;

      const point = getEventPoint(event);
      if (!point) return;

      event.preventDefault();
      event.stopPropagation();
      const currentDraftAnnotation = draftAnnotationRef.current;
      if (!currentDraftAnnotation) return;

      const nextDraftAnnotation = updateDraftAnnotation(currentDraftAnnotation, point);
      if (nextDraftAnnotation === currentDraftAnnotation) return;

      draftAnnotationRef.current = nextDraftAnnotation;
      setDraftAnnotation(nextDraftAnnotation);
    },
    [enabled, getEventPoint, handleAnnotationTransformPointerMove, updateDraftAnnotation]
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (finishAnnotationTransform(event)) return;
      if (pointerIdRef.current !== event.pointerId) return;

      event.preventDefault();
      event.stopPropagation();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      pointerIdRef.current = null;
      const currentDraftAnnotation = draftAnnotationRef.current;
      draftAnnotationRef.current = null;
      draftOriginRef.current = null;
      setDraftAnnotation(null);

      if (currentDraftAnnotation && isAnnotationValid(currentDraftAnnotation)) {
        const normalizedAnnotation = normalizePlaylistAnnotations([currentDraftAnnotation])[0];
        if (normalizedAnnotation) onCreateAnnotation(normalizedAnnotation);
      }
    },
    [finishAnnotationTransform, onCreateAnnotation]
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (cancelAnnotationTransform(event)) return;
      if (pointerIdRef.current !== event.pointerId) return;

      pointerIdRef.current = null;
      draftAnnotationRef.current = null;
      draftOriginRef.current = null;
      setDraftAnnotation(null);
    },
    [cancelAnnotationTransform]
  );
  const overlayStyle = overlayBounds
    ? {
        height: `${overlayBounds.height}px`,
        left: `${overlayBounds.left}px`,
        top: `${overlayBounds.top}px`,
        width: `${overlayBounds.width}px`,
      }
    : { inset: 0 };

  return (
    <div
      ref={overlayRootRef}
      className={[
        "absolute touch-none select-none bg-transparent",
        enabled ? "pointer-events-auto" : "pointer-events-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={overlayStyle}
    >
      <canvas
        ref={canvasRef}
        aria-label="Video annotations"
        className={[
          "absolute inset-0 h-full w-full touch-none select-none bg-transparent",
          enabled ? (tool === "text" ? "cursor-text" : "cursor-crosshair") : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      {canTransformAnnotations &&
      selectedAnnotation &&
      selectedLinearAnnotationEndpoints &&
      selectedLinearAnnotationMidpoint ? (
        <div className="pointer-events-none absolute inset-0 z-10">
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full overflow-visible"
            preserveAspectRatio="none"
            viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          >
            <line
              x1={selectedLinearAnnotationEndpoints.start.x}
              y1={selectedLinearAnnotationEndpoints.start.y}
              x2={selectedLinearAnnotationEndpoints.end.x}
              y2={selectedLinearAnnotationEndpoints.end.y}
              stroke="#facc15"
              strokeDasharray="8 6"
              strokeLinecap="round"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {(
            [
              { handle: "start", label: "start", point: selectedLinearAnnotationEndpoints.start },
              { handle: "end", label: "end", point: selectedLinearAnnotationEndpoints.end },
            ] as const
          ).map(({ handle, label, point }) => (
            <span
              key={handle}
              className="pointer-events-none absolute flex h-5 w-5 items-center justify-center"
              style={{
                left: `${point.x / 10}%`,
                top: `${point.y / 10}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <button
                type="button"
                onPointerCancel={cancelAnnotationTransform}
                onPointerDown={(event) => startAnnotationTransform(event, selectedAnnotation, "resize", handle)}
                onPointerMove={handleAnnotationTransformPointerMove}
                onPointerUp={finishAnnotationTransform}
                className="pointer-events-auto flex h-5 w-5 cursor-move items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#facc15]/50"
                aria-label={`Resize annotation ${label}`}
              >
                <span className="block h-3 w-3 rounded-full border-2 border-[#facc15] bg-transparent shadow-[0_2px_8px_rgba(0,0,0,0.35)]" />
              </button>
            </span>
          ))}
          <span
            className="pointer-events-none absolute flex h-6 w-6 items-center justify-center"
            style={{
              left: `${selectedLinearAnnotationMidpoint.x / 10}%`,
              top: `${selectedLinearAnnotationMidpoint.y / 10}%`,
              transform: "translate(-50%, calc(-50% - 2rem))",
            }}
          >
            <Tooltip tooltipContent="Rotate annotation" position="top" sideOffset={8}>
              <button
                type="button"
                onPointerCancel={cancelAnnotationTransform}
                onPointerDown={(event) => startAnnotationTransform(event, selectedAnnotation, "rotate")}
                onPointerMove={handleAnnotationTransformPointerMove}
                onPointerUp={finishAnnotationTransform}
                className="pointer-events-auto flex h-6 w-6 cursor-grab items-center justify-center rounded-full border border-[#facc15] bg-custom-background-100 text-[13px] font-semibold leading-none text-[#facc15] shadow-[0_8px_20px_rgba(0,0,0,0.32)] outline-none transition-colors hover:bg-custom-background-90 focus-visible:ring-2 focus-visible:ring-[#facc15]/50 active:cursor-grabbing"
                aria-label="Rotate annotation"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </span>
        </div>
      ) : canTransformAnnotations && selectedAnnotation && selectedAnnotationBounds ? (
        <div
          className="pointer-events-none absolute z-10 rounded-[4px] border border-dashed border-[#facc15] shadow-[0_0_0_1px_rgba(0,0,0,0.36),0_0_18px_rgba(250,204,21,0.28)]"
          style={{
            height: `max(24px, ${selectedAnnotationBounds.height / 10}%)`,
            left: `${selectedAnnotationBounds.x / 10}%`,
            top: `${selectedAnnotationBounds.y / 10}%`,
            transform: `rotate(${selectedAnnotationRotation}deg)`,
            transformOrigin: "center",
            width: `max(28px, ${selectedAnnotationBounds.width / 10}%)`,
          }}
        >
          {selectedAnnotationCanResize
            ? ANNOTATION_RESIZE_HANDLES.map(({ className: handleClassName, cursorClassName, handle, label }) => (
                <span
                  key={handle}
                  className={`pointer-events-none absolute flex h-4 w-4 items-center justify-center ${handleClassName}`}
                >
                  <button
                    type="button"
                    onPointerCancel={cancelAnnotationTransform}
                    onPointerDown={(event) => startAnnotationTransform(event, selectedAnnotation, "resize", handle)}
                    onPointerMove={handleAnnotationTransformPointerMove}
                    onPointerUp={finishAnnotationTransform}
                    className={`pointer-events-auto flex h-4 w-4 items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#facc15]/50 ${cursorClassName}`}
                    style={{
                      transform: `rotate(${-selectedAnnotationRotation}deg)`,
                    }}
                    aria-label={`Resize annotation ${label}`}
                  >
                    <span className="block h-2.5 w-2.5 rounded-[2px] border border-[#facc15] bg-custom-background-100 shadow-[0_2px_8px_rgba(0,0,0,0.35)]" />
                  </button>
                </span>
              ))
            : null}
          <span className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 -translate-y-full bg-[#facc15]" />
          <span className="pointer-events-none absolute left-1/2 top-0 flex h-6 w-6 -translate-x-1/2 -translate-y-[calc(100%+1.5rem)] items-center justify-center">
            <Tooltip tooltipContent="Rotate annotation" position="top" sideOffset={8}>
              <button
                type="button"
                onPointerCancel={cancelAnnotationTransform}
                onPointerDown={(event) => startAnnotationTransform(event, selectedAnnotation, "rotate")}
                onPointerMove={handleAnnotationTransformPointerMove}
                onPointerUp={finishAnnotationTransform}
                className="pointer-events-auto flex h-6 w-6 cursor-grab items-center justify-center rounded-full border border-[#facc15] bg-custom-background-100 text-[13px] font-semibold leading-none text-[#facc15] shadow-[0_8px_20px_rgba(0,0,0,0.32)] outline-none transition-colors hover:bg-custom-background-90 focus-visible:ring-2 focus-visible:ring-[#facc15]/50 active:cursor-grabbing"
                style={{
                  transform: `rotate(${-selectedAnnotationRotation}deg)`,
                }}
                aria-label="Rotate annotation"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </span>
        </div>
      ) : null}
      {enabled && textDraft ? (
        <input
          ref={textDraftInputRef}
          type="text"
          value={textDraft.value}
          onBlur={commitTextDraft}
          onChange={(event) =>
            setTextDraft((currentValue) => currentValue && { ...currentValue, value: event.target.value })
          }
          onKeyDown={handleTextDraftKeyDown}
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute z-20 h-8 min-w-36 max-w-60 rounded-[4px] border border-custom-border-200 bg-custom-background-100 px-2 text-[14px] font-semibold shadow-lg outline-none ring-2 ring-custom-primary-100/35 placeholder:text-custom-text-400"
          placeholder="Text"
          style={{
            color,
            fontFamily: textFontFamily,
            fontSize: `${clamp(textFontSize, 12, 32)}px`,
            fontWeight: textFontWeight,
            left: `${textDraft.point.x / 10}%`,
            top: `${textDraft.point.y / 10}%`,
            transform: "translateY(-50%)",
          }}
        />
      ) : null}
    </div>
  );
};
