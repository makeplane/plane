"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import type { TCustomPlaylistAnnotation, TCustomPlaylistAnnotationPoint } from "../types/annotation.types";
import type {
  AnnotationBounds,
  AnnotationResizeHandle,
  AnnotationTransformMode,
  AnnotationTransformState,
  CanvasSize,
  OverlayBounds,
  PlaylistAnnotationOverlayProps,
} from "../types/playlist-annotation-overlay.types";
import {
  CANVAS_SIZE,
  MAX_POINT_COUNT,
  MIN_POINT_DISTANCE,
  clamp,
  createPlaylistAnnotationId,
  getAnnotationBounds,
  getAnnotationRotation,
  getAnnotationStyle,
  getLinearAnnotationEndpoints,
  getPointAngle,
  getPointBounds,
  getPointDistance,
  isAnnotationResizable,
  isAnnotationValid,
  isLinearAnnotation,
  isPointInAnnotation,
  isPointOnAnnotationEdge,
  moveAnnotation,
  normalizeAnnotationBox,
  normalizePlaylistAnnotations,
  normalizeRotation,
  resizeAnnotation,
} from "../utils/playlist-annotation-model";
import {
  areOverlayBoundsEqual,
  drawCanvasAnnotation,
  getFittedVideoBounds,
} from "../utils/playlist-annotation-rendering";
import { PlaylistAnnotationSelectionControls } from "./playlist-annotation-selection-controls";
import { PlaylistAnnotationTextDraftInput } from "./playlist-annotation-text-draft-input";
import type { PlaylistAnnotationTextDraft } from "./playlist-annotation-text-draft-input";

export {
  DEFAULT_PLAYLIST_ANNOTATION_DURATION_SECONDS,
  arePlaylistAnnotationsEqual,
  createPlaylistAnnotationId,
  getActivePlaylistAnnotations,
  isPlaylistAnnotationVisibleAtTime,
  normalizePlaylistAnnotations,
} from "../utils/playlist-annotation-model";

const getDisplayImageAnnotationBounds = (
  annotation: TCustomPlaylistAnnotation,
  size: CanvasSize | null
): AnnotationBounds | null => {
  if (annotation.type !== "image" || !size || size.width <= 0 || size.height <= 0) return null;

  const width = Number(annotation.width);
  const height = Number(annotation.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;

  return {
    height: Math.max(1, (height / size.height) * CANVAS_SIZE),
    width: Math.max(1, (width / size.width) * CANVAS_SIZE),
    x: annotation.x,
    y: annotation.y,
  };
};

const getCenteredDisplayImageAnnotationPoint = (
  imageWidth: number,
  imageHeight: number,
  size: CanvasSize | null
): TCustomPlaylistAnnotationPoint => {
  if (!size || size.width <= 0 || size.height <= 0) {
    return {
      x: clamp((CANVAS_SIZE - imageWidth) / 2, 0, CANVAS_SIZE),
      y: clamp((CANVAS_SIZE - imageHeight) / 2, 0, CANVAS_SIZE),
    };
  }

  return {
    x: clamp(((size.width - imageWidth) / 2 / size.width) * CANVAS_SIZE, 0, CANVAS_SIZE),
    y: clamp(((size.height - imageHeight) / 2 / size.height) * CANVAS_SIZE, 0, CANVAS_SIZE),
  };
};

const getAspectLockedImageAnnotation = (
  annotation: TCustomPlaylistAnnotation,
  origin: TCustomPlaylistAnnotationPoint,
  point: TCustomPlaylistAnnotationPoint
) => {
  const baseWidth = Math.abs(annotation.width ?? 0);
  const baseHeight = Math.abs(annotation.height ?? 0);
  const aspectRatio = baseWidth > 0 && baseHeight > 0 ? baseWidth / baseHeight : 1;
  const rawWidth = point.x - origin.x;
  const rawHeight = point.y - origin.y;
  const widthDistance = Math.abs(rawWidth);
  const heightDistance = Math.abs(rawHeight);

  if (widthDistance === 0 && heightDistance === 0) return annotation;

  const widthDirection = rawWidth < 0 ? -1 : 1;
  const heightDirection = rawHeight < 0 ? -1 : 1;
  const isWidthDominant = widthDistance / aspectRatio >= heightDistance;
  const width = isWidthDominant ? rawWidth : heightDistance * aspectRatio * widthDirection;
  const height = isWidthDominant ? (widthDistance / aspectRatio) * heightDirection : rawHeight;

  return normalizeAnnotationBox({
    ...annotation,
    height,
    width,
    x: origin.x,
    y: origin.y,
  });
};

const getAnnotationStackTimestamp = (annotation: TCustomPlaylistAnnotation) => {
  if (typeof annotation.createdAt !== "string" || !annotation.createdAt.trim()) return 0;

  const timestamp = Date.parse(annotation.createdAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getStackedAnnotations = (annotationItems: TCustomPlaylistAnnotation[]) =>
  annotationItems
    .map((annotation, index) => ({
      annotation,
      index,
      timestamp: getAnnotationStackTimestamp(annotation),
    }))
    .sort((firstItem, secondItem) => firstItem.timestamp - secondItem.timestamp || firstItem.index - secondItem.index)
    .map((item) => item.annotation);

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
  imagePlacementKey,
  imageTitle,
  imageWidth,
  inputEnabled = enabled,
  opacity,
  onCreateAnnotation,
  onDeleteAnnotation,
  onSelectedAnnotationIdChange,
  onUpdateAnnotation,
  selectedAnnotationId: controlledSelectedAnnotationId,
  shapeBackgroundEnabled,
  shapeBackgroundOpacity,
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
  const lastImagePlacementKeyRef = useRef<number | undefined>(undefined);
  const textDraftInputRef = useRef<HTMLInputElement | null>(null);
  const shouldSkipTextDraftCommitRef = useRef(false);
  const [draftAnnotation, setDraftAnnotation] = useState<TCustomPlaylistAnnotation | null>(null);
  const [overlayBounds, setOverlayBounds] = useState<OverlayBounds | null>(null);
  const [internalSelectedAnnotationId, setInternalSelectedAnnotationId] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState<PlaylistAnnotationTextDraft | null>(null);
  const [canvasRevision, setCanvasRevision] = useState(0);
  const [imageRevision, setImageRevision] = useState(0);
  const isSelectedAnnotationIdControlled = controlledSelectedAnnotationId !== undefined;
  const selectedAnnotationId = isSelectedAnnotationIdControlled
    ? controlledSelectedAnnotationId
    : internalSelectedAnnotationId;

  const setSelectedAnnotationId = useCallback(
    (annotationId: string | null) => {
      if (!isSelectedAnnotationIdControlled) setInternalSelectedAnnotationId(annotationId);
      onSelectedAnnotationIdChange?.(annotationId);
    },
    [isSelectedAnnotationIdControlled, onSelectedAnnotationIdChange]
  );

  const renderedAnnotations = useMemo(
    () => [...annotations, ...(draftAnnotation ? [draftAnnotation] : [])],
    [annotations, draftAnnotation]
  );
  const stackedAnnotations = useMemo(() => getStackedAnnotations(annotations), [annotations]);
  const stackedRenderedAnnotations = useMemo(() => getStackedAnnotations(renderedAnnotations), [renderedAnnotations]);
  const canTransformAnnotations = inputEnabled && enableAnnotationTransforms && Boolean(onUpdateAnnotation);
  const selectedAnnotation = useMemo(
    () => annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null,
    [annotations, selectedAnnotationId]
  );
  const selectedAnnotationIsLinear = selectedAnnotation ? isLinearAnnotation(selectedAnnotation) : false;
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
  }, [enabled, setSelectedAnnotationId]);

  useEffect(() => {
    if (!selectedAnnotationId || annotations.some((annotation) => annotation.id === selectedAnnotationId)) return;

    setSelectedAnnotationId(null);
  }, [annotations, selectedAnnotationId, setSelectedAnnotationId]);

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
          ...stackedRenderedAnnotations.filter((annotation) => annotation.id !== selectedAnnotationId),
          ...stackedRenderedAnnotations.filter((annotation) => annotation.id === selectedAnnotationId),
        ]
      : stackedRenderedAnnotations;

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
  }, [
    canvasRevision,
    draftAnnotation?.id,
    handleImageLoad,
    imageRevision,
    selectedAnnotationId,
    stackedRenderedAnnotations,
  ]);

  const getEventPoint = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;

    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * CANVAS_SIZE, 0, CANVAS_SIZE),
      y: clamp(((event.clientY - rect.top) / rect.height) * CANVAS_SIZE, 0, CANVAS_SIZE),
    };
  }, []);

  const getCanvasSize = useCallback((): CanvasSize | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;

    return {
      height: rect.height,
      width: rect.width,
    };
  }, []);

  const getDisplayImageBounds = useCallback(
    (annotation: TCustomPlaylistAnnotation) => getDisplayImageAnnotationBounds(annotation, getCanvasSize()),
    [getCanvasSize]
  );

  const getDisplayImageAnnotationFromBounds = useCallback(
    (annotation: TCustomPlaylistAnnotation): TCustomPlaylistAnnotation => {
      if (annotation.type !== "image") return annotation;

      const size = getCanvasSize();
      if (!size) return annotation;

      return {
        ...annotation,
        height: Math.round(((annotation.height ?? 0) / CANVAS_SIZE) * size.height),
        width: Math.round(((annotation.width ?? 0) / CANVAS_SIZE) * size.width),
      };
    },
    [getCanvasSize]
  );

  const getMeasuredTextAnnotationBounds = useCallback((annotation: TCustomPlaylistAnnotation) => {
    if (annotation.type !== "text") return null;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !context || !rect || rect.width <= 0 || rect.height <= 0) return null;

    const resolvedStyle = getAnnotationStyle(annotation);
    const fontSize = Math.max(8, (resolvedStyle.fontSize / CANVAS_SIZE) * rect.height);
    const fontWeight = resolvedStyle.fontWeight ? `${resolvedStyle.fontWeight} ` : "";

    context.save();
    context.font = `${fontWeight}${fontSize}px ${resolvedStyle.fontFamily}`;
    context.textBaseline = "alphabetic";
    const metrics = context.measureText(annotation.content?.trim() || "Text");
    context.restore();

    const leftPx = metrics.actualBoundingBoxLeft || 0;
    const widthPx = Math.max(1, leftPx + (metrics.actualBoundingBoxRight || metrics.width));
    const ascentPx = metrics.actualBoundingBoxAscent || fontSize;
    const descentPx = metrics.actualBoundingBoxDescent || fontSize * 0.2;

    return {
      height: clamp(((ascentPx + descentPx) / rect.height) * CANVAS_SIZE, 1, CANVAS_SIZE),
      width: clamp((widthPx / rect.width) * CANVAS_SIZE, 1, CANVAS_SIZE),
      x: clamp(annotation.x - (leftPx / rect.width) * CANVAS_SIZE, 0, CANVAS_SIZE),
      y: clamp(annotation.y - (ascentPx / rect.height) * CANVAS_SIZE, 0, CANVAS_SIZE),
    };
  }, []);

  const getResolvedAnnotationBounds = useCallback(
    (annotation: TCustomPlaylistAnnotation) =>
      getMeasuredTextAnnotationBounds(annotation) ??
      getDisplayImageBounds(annotation) ??
      getAnnotationBounds(annotation),
    [getDisplayImageBounds, getMeasuredTextAnnotationBounds]
  );

  const selectedAnnotationBounds = selectedAnnotation ? getResolvedAnnotationBounds(selectedAnnotation) : null;

  const isPointInResolvedAnnotation = useCallback(
    (point: TCustomPlaylistAnnotationPoint, annotation: TCustomPlaylistAnnotation) =>
      isPointInAnnotation(point, annotation, getResolvedAnnotationBounds(annotation)),
    [getResolvedAnnotationBounds]
  );

  const isPointOnResolvedAnnotationEdge = useCallback(
    (point: TCustomPlaylistAnnotationPoint, annotation: TCustomPlaylistAnnotation) =>
      isPointOnAnnotationEdge(point, annotation, getResolvedAnnotationBounds(annotation)),
    [getResolvedAnnotationBounds]
  );

  const getAnnotationInteractionAtPoint = useCallback(
    (point: TCustomPlaylistAnnotationPoint) => {
      if (selectedAnnotation) {
        const isSelectedAnnotationHit =
          selectedAnnotation.type === "pen"
            ? isPointOnResolvedAnnotationEdge(point, selectedAnnotation)
            : isPointInResolvedAnnotation(point, selectedAnnotation) ||
              isPointOnResolvedAnnotationEdge(point, selectedAnnotation);

        if (isSelectedAnnotationHit) {
          return {
            annotation: selectedAnnotation,
            isSelected: true,
          };
        }
      }

      const annotation = [...stackedAnnotations]
        .reverse()
        .find(
          (currentAnnotation) =>
            currentAnnotation.id !== selectedAnnotationId && isPointOnResolvedAnnotationEdge(point, currentAnnotation)
        );

      return annotation
        ? {
            annotation,
            isSelected: false,
          }
        : null;
    },
    [
      isPointInResolvedAnnotation,
      isPointOnResolvedAnnotationEdge,
      selectedAnnotation,
      selectedAnnotationId,
      stackedAnnotations,
    ]
  );

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
        ...(shapeBackgroundEnabled && (tool === "rectangle" || tool === "ellipse")
          ? { backgroundColor: color, backgroundOpacity: shapeBackgroundOpacity }
          : {}),
        opacity: tool === "image" ? imageOpacity : opacity,
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
      opacity,
      shapeBackgroundEnabled,
      shapeBackgroundOpacity,
      startTime,
      strokeStyle,
      strokeWidth,
      textFontFamily,
      textFontSize,
      textFontWeight,
      tool,
    ]
  );

  useEffect(() => {
    if (!enabled || tool !== "image" || !imageContent || !imagePlacementKey) return;
    if (lastImagePlacementKeyRef.current === imagePlacementKey) return;

    lastImagePlacementKeyRef.current = imagePlacementKey;
    const point = getCenteredDisplayImageAnnotationPoint(imageWidth, imageHeight, getCanvasSize());
    const normalizedAnnotation = normalizePlaylistAnnotations([buildAnnotation(point)])[0];
    if (!normalizedAnnotation) return;

    draftAnnotationRef.current = null;
    draftOriginRef.current = null;
    pointerIdRef.current = null;
    setDraftAnnotation(null);
    setSelectedAnnotationId(normalizedAnnotation.id);
    onCreateAnnotation(normalizedAnnotation);
  }, [
    buildAnnotation,
    enabled,
    getCanvasSize,
    imageContent,
    imageHeight,
    imagePlacementKey,
    imageWidth,
    onCreateAnnotation,
    setSelectedAnnotationId,
    tool,
  ]);

  const buildTextDraftAnnotation = useCallback(
    (draft: PlaylistAnnotationTextDraft, content: string): TCustomPlaylistAnnotation => ({
      ...buildAnnotation(draft.point, content),
      id: draft.annotationId,
    }),
    [buildAnnotation]
  );

  const handleTextDraftChange = useCallback(
    (value: string) => {
      if (!textDraft) return;

      const content = value.trim();
      const nextDraft = { ...textDraft, value };

      if (!content) {
        if (textDraft.isCommitted && onUpdateAnnotation) {
          onUpdateAnnotation(buildTextDraftAnnotation(textDraft, ""));
        }
        setTextDraft({ ...nextDraft, isCommitted: false });
        setSelectedAnnotationId(null);
        return;
      }

      if (!onUpdateAnnotation) {
        setTextDraft(nextDraft);
        return;
      }

      const normalizedAnnotation = normalizePlaylistAnnotations([buildTextDraftAnnotation(textDraft, content)])[0];
      if (!normalizedAnnotation) {
        setTextDraft(nextDraft);
        return;
      }

      if (textDraft.isCommitted) {
        onUpdateAnnotation?.(normalizedAnnotation);
      } else {
        onCreateAnnotation(normalizedAnnotation);
      }

      setSelectedAnnotationId(normalizedAnnotation.id);
      setTextDraft({ ...nextDraft, isCommitted: true });
    },
    [buildTextDraftAnnotation, onCreateAnnotation, onUpdateAnnotation, setSelectedAnnotationId, textDraft]
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
    if (textDraft.isCommitted) return;

    const normalizedAnnotation = normalizePlaylistAnnotations([buildTextDraftAnnotation(textDraft, content)])[0];
    if (normalizedAnnotation) onCreateAnnotation(normalizedAnnotation);
  }, [buildTextDraftAnnotation, onCreateAnnotation, textDraft]);

  const handleTextDraftKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitTextDraft();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (textDraft?.isCommitted && onUpdateAnnotation) {
          onUpdateAnnotation(buildTextDraftAnnotation(textDraft, ""));
          setSelectedAnnotationId(null);
        }
        shouldSkipTextDraftCommitRef.current = true;
        setTextDraft(null);
      }
    },
    [buildTextDraftAnnotation, commitTextDraft, onUpdateAnnotation, setSelectedAnnotationId, textDraft]
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
      if (annotation.type === "image") {
        return getAspectLockedImageAnnotation(annotation, origin, point);
      }

      if (annotation.type === "rectangle" || annotation.type === "ellipse") {
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
      const bounds = getResolvedAnnotationBounds(annotation);
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
    [canTransformAnnotations, getEventPoint, getResolvedAnnotationBounds, setSelectedAnnotationId]
  );

  const handleAnnotationTransformPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const transformState = annotationTransformStateRef.current;
      if (!transformState || transformState.pointerId !== event.pointerId || !onUpdateAnnotation) return false;

      const point = getEventPoint(event);
      if (!point) return true;

      event.preventDefault();
      event.stopPropagation();

      let nextAnnotation: TCustomPlaylistAnnotation;

      if (transformState.mode === "move") {
        nextAnnotation = moveAnnotation(
          transformState.originalAnnotation,
          point.x - transformState.startPoint.x,
          point.y - transformState.startPoint.y,
          transformState.originalBounds
        );
      } else if (transformState.mode === "resize" && transformState.resizeHandle) {
        const resizedAnnotation = resizeAnnotation(
          transformState.originalAnnotation,
          transformState.originalBounds,
          transformState.center,
          transformState.originalRotation,
          transformState.resizeHandle,
          point
        );
        nextAnnotation = getDisplayImageAnnotationFromBounds(resizedAnnotation);
      } else {
        nextAnnotation = {
          ...transformState.originalAnnotation,
          rotation: normalizeRotation(
            transformState.originalRotation +
              ((getPointAngle(point, transformState.center) - transformState.startAngle) * 180) / Math.PI
          ),
        };
      }

      onUpdateAnnotation(nextAnnotation);

      return true;
    },
    [getDisplayImageAnnotationFromBounds, getEventPoint, onUpdateAnnotation]
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
      if (!inputEnabled || event.button !== 0) return;

      const point = getEventPoint(event);
      if (!point) return;

      if (canTransformAnnotations) {
        const annotationInteraction = getAnnotationInteractionAtPoint(point);
        if (annotationInteraction) {
          if (
            annotationInteraction.isSelected &&
            startAnnotationTransform(event, annotationInteraction.annotation, "move")
          ) {
            return;
          }

          setSelectedAnnotationId(annotationInteraction.annotation.id);
          return;
        }
        setSelectedAnnotationId(null);
      }

      event.preventDefault();
      event.stopPropagation();

      if (tool === "text") {
        shouldSkipTextDraftCommitRef.current = false;
        setTextDraft({
          annotationId: createPlaylistAnnotationId(),
          isCommitted: false,
          point,
          value: "",
        });
        return;
      }

      if (tool === "image") return;

      event.currentTarget.setPointerCapture(event.pointerId);
      pointerIdRef.current = event.pointerId;

      const nextDraftAnnotation = buildAnnotation(point);
      draftAnnotationRef.current = nextDraftAnnotation;
      draftOriginRef.current = point;
      setDraftAnnotation(nextDraftAnnotation);
    },
    [
      buildAnnotation,
      canTransformAnnotations,
      getAnnotationInteractionAtPoint,
      getEventPoint,
      inputEnabled,
      setSelectedAnnotationId,
      startAnnotationTransform,
      tool,
    ]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (handleAnnotationTransformPointerMove(event)) return;
      if (!inputEnabled || pointerIdRef.current !== event.pointerId) return;

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
    [getEventPoint, handleAnnotationTransformPointerMove, inputEnabled, updateDraftAnnotation]
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
        if (normalizedAnnotation) {
          setSelectedAnnotationId(normalizedAnnotation.id);
          onCreateAnnotation(normalizedAnnotation);
        }
      }
    },
    [finishAnnotationTransform, onCreateAnnotation, setSelectedAnnotationId]
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
        inputEnabled ? "pointer-events-auto" : "pointer-events-none",
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
          inputEnabled ? (tool === "text" ? "cursor-text" : "cursor-crosshair") : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <PlaylistAnnotationSelectionControls
        canTransformAnnotations={canTransformAnnotations}
        onCancelAnnotationTransform={cancelAnnotationTransform}
        onDeleteAnnotation={onDeleteAnnotation}
        onFinishAnnotationTransform={finishAnnotationTransform}
        onStartAnnotationTransform={startAnnotationTransform}
        onTransformPointerMove={handleAnnotationTransformPointerMove}
        selectedAnnotation={selectedAnnotation}
        selectedAnnotationBounds={selectedAnnotationBounds}
        selectedAnnotationCanResize={selectedAnnotationCanResize}
        selectedAnnotationRotation={selectedAnnotationRotation}
        selectedLinearAnnotationEndpoints={selectedLinearAnnotationEndpoints}
        selectedLinearAnnotationMidpoint={selectedLinearAnnotationMidpoint}
      />
      <PlaylistAnnotationTextDraftInput
        color={color}
        enabled={enabled}
        inputRef={textDraftInputRef}
        onBlur={commitTextDraft}
        onKeyDown={handleTextDraftKeyDown}
        onPointerDown={(event) => event.stopPropagation()}
        onTextDraftChange={handleTextDraftChange}
        textDraft={textDraft}
        textFontFamily={textFontFamily}
        textFontSize={textFontSize}
        textFontWeight={textFontWeight}
      />
    </div>
  );
};
