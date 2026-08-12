import type {
  TCustomPlaylistAnnotation,
  TCustomPlaylistAnnotationPoint,
  TCustomPlaylistAnnotationStyle,
  TCustomPlaylistAnnotationStrokeStyle,
  TCustomPlaylistAnnotationTool,
} from "../types/annotation.types";
import type {
  AnnotationBounds,
  AnnotationBoxResizeHandle,
  AnnotationResizeHandle,
} from "../types/playlist-annotation-overlay.types";
import { OPPOSITE_RESIZE_HANDLE, isBoxResizeHandle } from "./playlist-annotation-transform";

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

const isPointNearPolyline = (point: TCustomPlaylistAnnotationPoint, points: TCustomPlaylistAnnotationPoint[]) => {
  if (points.length === 0) return false;
  if (points.length === 1) return getPointDistance(point, points[0]) <= 18;

  return points.some((currentPoint, index) => {
    const nextPoint = points[index + 1];
    if (!nextPoint) return false;

    return getPointToSegmentDistance(point, currentPoint, nextPoint) <= 18;
  });
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

const getAspectLockedResizeBounds = (
  originalBounds: AnnotationBounds,
  nextBounds: AnnotationBounds,
  handle: AnnotationBoxResizeHandle
): AnnotationBounds => {
  const aspectRatio =
    originalBounds.width > 0 && originalBounds.height > 0 ? originalBounds.width / originalBounds.height : 1;
  const fixedPoint = getResizeHandlePoint(originalBounds, OPPOSITE_RESIZE_HANDLE[handle]);
  let width = Math.max(MIN_RESIZE_DIMENSION, nextBounds.width);
  let height = Math.max(MIN_RESIZE_DIMENSION, nextBounds.height);

  if (handle === "e" || handle === "w") {
    height = width / aspectRatio;
  } else if (handle === "n" || handle === "s") {
    width = height * aspectRatio;
  } else if (width / aspectRatio >= height) {
    height = width / aspectRatio;
  } else {
    width = height * aspectRatio;
  }

  const maxWidth = handle.includes("w")
    ? fixedPoint.x
    : handle.includes("e")
      ? CANVAS_SIZE - fixedPoint.x
      : Math.min(fixedPoint.x, CANVAS_SIZE - fixedPoint.x) * 2;
  const maxHeight = handle.includes("n")
    ? fixedPoint.y
    : handle.includes("s")
      ? CANVAS_SIZE - fixedPoint.y
      : Math.min(fixedPoint.y, CANVAS_SIZE - fixedPoint.y) * 2;
  const fitScale = Math.min(maxWidth / Math.max(width, 1), maxHeight / Math.max(height, 1), 1);
  width = Math.max(MIN_RESIZE_DIMENSION, width * fitScale);
  height = Math.max(MIN_RESIZE_DIMENSION, height * fitScale);

  return {
    height,
    width,
    x: handle.includes("w") ? fixedPoint.x - width : handle.includes("e") ? fixedPoint.x : fixedPoint.x - width / 2,
    y: handle.includes("n") ? fixedPoint.y - height : handle.includes("s") ? fixedPoint.y : fixedPoint.y - height / 2,
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

  if (annotation.type === "image") {
    const nextImageBounds = getAspectLockedResizeBounds(originalBounds, nextBounds, handle);

    return normalizeAnnotationBox({
      ...annotation,
      height: nextImageBounds.height,
      width: nextImageBounds.width,
      x: nextImageBounds.x,
      y: nextImageBounds.y,
    });
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

const isPointOnAnnotationEdge = (point: TCustomPlaylistAnnotationPoint, annotation: TCustomPlaylistAnnotation) => {
  if (isLinearAnnotation(annotation)) {
    const endpoints = getLinearAnnotationEndpoints(annotation);
    return getPointToSegmentDistance(point, endpoints.start, endpoints.end) <= 18;
  }

  if (annotation.type === "pen") {
    return isPointNearPolyline(point, annotation.points ?? []);
  }

  const bounds = getAnnotationBounds(annotation);
  const center = getAnnotationCenter(annotation);
  if (!bounds || !center) return false;

  const hitPadding = annotation.type === "text" ? 12 : 18;
  const unrotatedPoint = rotatePointAroundCenter(point, center, -getAnnotationRotation(annotation));
  const isInsidePaddedBounds =
    unrotatedPoint.x >= bounds.x - hitPadding &&
    unrotatedPoint.x <= bounds.x + bounds.width + hitPadding &&
    unrotatedPoint.y >= bounds.y - hitPadding &&
    unrotatedPoint.y <= bounds.y + bounds.height + hitPadding;
  if (!isInsidePaddedBounds) return false;

  if (annotation.type === "ellipse") {
    const radiusX = bounds.width / 2;
    const radiusY = bounds.height / 2;
    if (radiusX <= 0 || radiusY <= 0) return false;

    const localX = unrotatedPoint.x - (bounds.x + radiusX);
    const localY = unrotatedPoint.y - (bounds.y + radiusY);
    const ellipseAngle = Math.atan2(localY / radiusY, localX / radiusX);
    const edgePoint = {
      x: radiusX * Math.cos(ellipseAngle),
      y: radiusY * Math.sin(ellipseAngle),
    };

    return getPointDistance({ x: localX, y: localY }, edgePoint) <= hitPadding;
  }

  const right = bounds.x + bounds.width;
  const bottom = bounds.y + bounds.height;
  const distanceToBoxEdge = Math.min(
    Math.abs(unrotatedPoint.x - bounds.x),
    Math.abs(unrotatedPoint.x - right),
    Math.abs(unrotatedPoint.y - bounds.y),
    Math.abs(unrotatedPoint.y - bottom)
  );

  return distanceToBoxEdge <= hitPadding;
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

export {
  CANVAS_SIZE,
  MAX_ARROW_HEAD_LENGTH,
  MAX_POINT_COUNT,
  MIN_ARROW_HEAD_LENGTH,
  MIN_POINT_DISTANCE,
  clamp,
  getAnnotationBounds,
  getAnnotationCenter,
  getAnnotationRotation,
  getAnnotationStyle,
  getLinearAnnotationEndpoints,
  getPointAngle,
  getPointBounds,
  getPointDistance,
  getStrokeLineDash,
  isAnnotationResizable,
  isAnnotationValid,
  isLinearAnnotation,
  isPointInAnnotation,
  isPointOnAnnotationEdge,
  moveAnnotation,
  normalizeAnnotationBox,
  normalizeRotation,
  resizeAnnotation,
};
