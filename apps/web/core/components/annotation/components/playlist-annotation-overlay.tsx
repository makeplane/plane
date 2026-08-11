"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import type { TCustomPlaylistAnnotation, TCustomPlaylistAnnotationPoint } from "../types/annotation.types";
import type {
  AnnotationResizeHandle,
  AnnotationTransformMode,
  AnnotationTransformState,
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
  getLinearAnnotationEndpoints,
  getPointAngle,
  getPointBounds,
  getPointDistance,
  isAnnotationResizable,
  isAnnotationValid,
  isLinearAnnotation,
  isPointInAnnotation,
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

export {
  DEFAULT_PLAYLIST_ANNOTATION_DURATION_SECONDS,
  arePlaylistAnnotationsEqual,
  createPlaylistAnnotationId,
  getActivePlaylistAnnotations,
  isPlaylistAnnotationVisibleAtTime,
  normalizePlaylistAnnotations,
} from "../utils/playlist-annotation-model";

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
      <PlaylistAnnotationSelectionControls
        canTransformAnnotations={canTransformAnnotations}
        onCancelAnnotationTransform={cancelAnnotationTransform}
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
        onTextDraftChange={setTextDraft}
        textDraft={textDraft}
        textFontFamily={textFontFamily}
        textFontSize={textFontSize}
        textFontWeight={textFontWeight}
      />
    </div>
  );
};
