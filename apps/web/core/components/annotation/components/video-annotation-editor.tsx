"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useNarrationDucking } from "../hooks/use-narration-ducking";
import { useNarrationWorkflow } from "../hooks/use-narration-workflow";
import { useVideoAnnotationClock } from "../hooks/use-video-annotation-clock";
import { useVideoAnnotationColorControls } from "../hooks/use-video-annotation-color-controls";
import { useVideoAnnotationImageControls } from "../hooks/use-video-annotation-image-controls";
import { useVideoAnnotationTimeline } from "../hooks/use-video-annotation-timeline";
import { useVideoAnnotationVoiceNarration } from "../hooks/use-video-annotation-voice-narration";
import type {
  TCustomPlaylistAnnotation,
  TCustomPlaylistAnnotationStrokeStyle,
  TCustomPlaylistAnnotationTool,
} from "../types/annotation.types";
import type { VideoAnnotationEditorProps } from "../types/video-annotation-editor.types";
import {
  applyAnnotationCreationStartTimeOffset,
  getAnnotationStartTimeWithCreationOffset,
} from "../utils/playlist-annotation-creation-time";
import { getAnnotationRotation, moveAnnotation } from "../utils/playlist-annotation-model";
import {
  getAnnotationColor,
  getHexColorFromHsv,
  getHexColorFromRgb,
  getHsvFromRgb,
  getRgbFromHexColor,
  normalizeAnnotationHexColor,
} from "../utils/video-annotation-colors";
import {
  DEFAULT_VIDEO_ANNOTATION_COLOR,
  DEFAULT_VIDEO_ANNOTATION_SHAPE_BACKGROUND_OPACITY,
  VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS,
  VIDEO_ANNOTATION_SHAPE_BACKGROUND_OPACITY_LIMITS,
  VIDEO_ANNOTATION_TOOLS,
} from "../utils/video-annotation-editor-config";
import { clampTimelineValue, resolveAnnotationTimelineLayers } from "../utils/video-annotation-timeline";
import {
  PlaylistAnnotationOverlay,
  arePlaylistAnnotationsEqual,
  getActivePlaylistAnnotations,
  normalizePlaylistAnnotations,
} from "./playlist-annotation-overlay";
import { VideoAnnotationAudioPlayback } from "./video-annotation-audio-playback";
import { VideoAnnotationColorPickerButton } from "./video-annotation-color-picker-button";
import { VideoAnnotationInlineToolbar } from "./video-annotation-inline-toolbar";
import { VideoAnnotationPropertiesPanel } from "./video-annotation-properties-panel";
import { VideoAnnotationRecordingIndicator } from "./video-annotation-recording-indicator";
import { VideoAnnotationTimelinePanel } from "./video-annotation-timeline-panel";
import { VideoAnnotationToolbar } from "./video-annotation-toolbar";
import { VoiceNarrationPanel } from "./voice-narration-panel";

const getImageAnnotationAspectRatio = (width: number, height: number) =>
  Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 ? width / height : 1;

const getAspectLockedImageAnnotationSize = ({
  currentHeight,
  currentWidth,
  dimension,
  value,
}: {
  currentHeight: number;
  currentWidth: number;
  dimension: "height" | "width";
  value: string;
}) => {
  const nextValue = Math.round(
    clampTimelineValue(Number(value), VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS.min, VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS.max)
  );
  if (!Number.isFinite(nextValue)) return null;

  const aspectRatio = getImageAnnotationAspectRatio(currentWidth, currentHeight);

  if (dimension === "height") {
    return {
      height: nextValue,
      width: Math.round(nextValue * aspectRatio),
    };
  }

  return {
    height: Math.round(nextValue / aspectRatio),
    width: nextValue,
  };
};

const isShapeAnnotationTool = (tool: TCustomPlaylistAnnotationTool | null | undefined) =>
  tool === "rectangle" || tool === "ellipse";

const hasExplicitShapeBackground = (annotation: TCustomPlaylistAnnotation | null | undefined) =>
  typeof annotation?.style?.backgroundColor === "string" && annotation.style.backgroundColor.trim().length > 0;

const isStyleEditableAnnotation = (annotation: TCustomPlaylistAnnotation | null | undefined) =>
  Boolean(annotation && annotation.type !== "image" && annotation.type !== "audio");

const getAnnotationHexColor = (annotation: TCustomPlaylistAnnotation, fallback: string) =>
  normalizeAnnotationHexColor(getAnnotationColor(annotation)) ?? fallback;

const getAnnotationDurationSeconds = (annotation: TCustomPlaylistAnnotation | null | undefined, fallback: number) => {
  if (!annotation) return fallback;

  const durationSeconds = annotation.endTime - annotation.startTime;
  return Number.isFinite(durationSeconds) && durationSeconds > 0 ? Math.round(durationSeconds) : fallback;
};

const getShapeBackgroundOpacity = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? clampTimelineValue(
        value,
        VIDEO_ANNOTATION_SHAPE_BACKGROUND_OPACITY_LIMITS.min / 100,
        VIDEO_ANNOTATION_SHAPE_BACKGROUND_OPACITY_LIMITS.max / 100
      )
    : DEFAULT_VIDEO_ANNOTATION_SHAPE_BACKGROUND_OPACITY;

const getAnnotationStrokeWidth = (annotation: TCustomPlaylistAnnotation | null | undefined, fallback: number) => {
  const value = annotation?.style?.strokeWidth;
  return typeof value === "number" && Number.isFinite(value) ? Math.round(clampTimelineValue(value, 2, 12)) : fallback;
};

const getAnnotationStrokeStyle = (
  annotation: TCustomPlaylistAnnotation | null | undefined,
  fallback: TCustomPlaylistAnnotationStrokeStyle
): TCustomPlaylistAnnotationStrokeStyle => (annotation?.style?.strokeStyle === "dotted" ? "dotted" : fallback);

const getAnnotationTextFontFamily = (annotation: TCustomPlaylistAnnotation | null | undefined, fallback: string) =>
  typeof annotation?.style?.fontFamily === "string" && annotation.style.fontFamily.trim()
    ? annotation.style.fontFamily
    : fallback;

const getAnnotationTextFontSize = (annotation: TCustomPlaylistAnnotation | null | undefined, fallback: number) => {
  const value = annotation?.style?.fontSize;
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
};

const getAnnotationTextFontWeight = (annotation: TCustomPlaylistAnnotation | null | undefined, fallback: number) => {
  const value = Number(annotation?.style?.fontWeight);
  return Number.isFinite(value) ? value : fallback;
};

const getAnnotationSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (!error || typeof error !== "object") return "Unable to save video annotations. Please try again.";

  const record = error as Record<string, unknown>;
  for (const value of [record.message, record.error, record.detail]) {
    if (typeof value === "string" && value.trim()) return value;
  }

  return "Unable to save video annotations. Please try again.";
};

export const VideoAnnotationEditor = ({
  annotationKey,
  annotations: savedAnnotationValue,
  autoEnableAnnotationModeKey,
  canEdit,
  className,
  currentTime,
  getCurrentTime,
  videoElement,
  onRecordingLockChange,
  durationSeconds = null,
  enableAnnotationTransforms = false,
  enableTextTool = false,
  fitToVideoBounds = false,
  isPlaying = false,
  modeResetKey,
  onModeChange,
  onRegisterSaveHandler,
  onUnsavedChangesChange,
  onRequestPause,
  onRequestPlay,
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
  const [annotationOpacity, setAnnotationOpacity] = useState(1);
  const [annotationStrokeWidth, setAnnotationStrokeWidth] = useState(5);
  const [annotationStrokeStyle, setAnnotationStrokeStyle] = useState<TCustomPlaylistAnnotationStrokeStyle>("solid");
  const [annotationShapeBackgroundEnabled, setAnnotationShapeBackgroundEnabled] = useState(false);
  const [annotationShapeBackgroundOpacity, setAnnotationShapeBackgroundOpacity] = useState(
    DEFAULT_VIDEO_ANNOTATION_SHAPE_BACKGROUND_OPACITY
  );
  const [annotationDurationSeconds, setAnnotationDurationSeconds] = useState(2);
  const [annotationTextFontSize, setAnnotationTextFontSize] = useState(28);
  const [annotationTextFontWeight, setAnnotationTextFontWeight] = useState(700);
  const [annotationTextFontFamily, setAnnotationTextFontFamily] = useState("sans-serif");
  const [isSavingAnnotations, setIsSavingAnnotations] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const hasAnnotationChanges = useMemo(
    () => !arePlaylistAnnotationsEqual(annotations, baselineAnnotations),
    [annotations, baselineAnnotations]
  );
  const annotationSessionRef = useRef(annotationKey);
  const preserveEditsRef = useRef(false);
  const availableAnnotationTools = useMemo(
    () => VIDEO_ANNOTATION_TOOLS.filter((toolOption) => enableTextTool || toolOption.type !== "text"),
    [enableTextTool]
  );
  const sortedAnnotations = useMemo(
    () =>
      [...annotations].sort((first, second) => first.startTime - second.startTime || first.endTime - second.endTime),
    [annotations]
  );
  const {
    annotationColor,
    annotationColorHsv,
    annotationColorInputValue,
    annotationColorRgb,
    handleAnnotationColorChange,
    handleAnnotationColorInputBlur,
    handleAnnotationColorInputChange,
    handleAnnotationColorPickerPointerDown,
    handleAnnotationColorPickerPointerMove,
    isAnnotationColorPickerOpen,
    setIsAnnotationColorPickerOpen,
  } = useVideoAnnotationColorControls();
  const {
    annotationImageContent,
    annotationImageHeight,
    annotationImageInputRef,
    annotationImageName,
    annotationImageOpacity,
    annotationImagePlacementKey,
    annotationImageWidth,
    handleAnnotationImageChange,
    handleAnnotationImageOpacityChange: handleDefaultAnnotationImageOpacityChange,
    handleAnnotationImageSizeChange: handleDefaultAnnotationImageSizeChange,
  } = useVideoAnnotationImageControls({
    onModeChange,
    onRequestPause,
    setAnnotationTool,
    setIsAnnotationMode,
  });
  const { effectiveCurrentTime } = useVideoAnnotationClock({
    currentTime,
    isPlaying,
    playbackRate,
    showTimeline,
    sortedAnnotations,
  });
  const activeAnnotations = useMemo(
    () => getActivePlaylistAnnotations(sortedAnnotations, effectiveCurrentTime),
    [effectiveCurrentTime, sortedAnnotations]
  );
  const visualActiveAnnotations = useMemo(
    () => activeAnnotations.filter((annotation) => annotation.type !== "audio"),
    [activeAnnotations]
  );
  const selectedAnnotation = useMemo(
    () => annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null,
    [annotations, selectedAnnotationId]
  );
  const selectedImageAnnotation = selectedAnnotation?.type === "image" ? selectedAnnotation : null;
  const selectedShapeAnnotation = isShapeAnnotationTool(selectedAnnotation?.type) ? selectedAnnotation : null;
  const selectedStyleAnnotation = isStyleEditableAnnotation(selectedAnnotation) ? selectedAnnotation : null;
  const selectedTextAnnotation = selectedAnnotation?.type === "text" ? selectedAnnotation : null;
  const selectedAnnotationColor = selectedStyleAnnotation
    ? getAnnotationHexColor(selectedStyleAnnotation, DEFAULT_VIDEO_ANNOTATION_COLOR)
    : DEFAULT_VIDEO_ANNOTATION_COLOR;
  const effectiveAnnotationColor = selectedStyleAnnotation ? selectedAnnotationColor : annotationColor;
  const effectiveAnnotationColorRgb = selectedStyleAnnotation
    ? getRgbFromHexColor(effectiveAnnotationColor)
    : annotationColorRgb;
  const effectiveAnnotationColorHsv = selectedStyleAnnotation
    ? getHsvFromRgb(
        effectiveAnnotationColorRgb.red,
        effectiveAnnotationColorRgb.green,
        effectiveAnnotationColorRgb.blue
      )
    : annotationColorHsv;
  const effectiveAnnotationColorInputValue = selectedStyleAnnotation
    ? effectiveAnnotationColor.toUpperCase()
    : annotationColorInputValue;
  const effectiveAnnotationDurationSeconds = getAnnotationDurationSeconds(
    selectedAnnotation,
    annotationDurationSeconds
  );
  const effectiveAnnotationStrokeStyle = selectedStyleAnnotation
    ? getAnnotationStrokeStyle(selectedStyleAnnotation, annotationStrokeStyle)
    : annotationStrokeStyle;
  const effectiveAnnotationStrokeWidth = selectedStyleAnnotation
    ? getAnnotationStrokeWidth(selectedStyleAnnotation, annotationStrokeWidth)
    : annotationStrokeWidth;
  const effectiveShapeBackgroundEnabled = selectedShapeAnnotation
    ? hasExplicitShapeBackground(selectedShapeAnnotation)
    : annotationShapeBackgroundEnabled;
  const effectiveShapeBackgroundOpacity = selectedShapeAnnotation
    ? getShapeBackgroundOpacity(selectedShapeAnnotation.style?.backgroundOpacity)
    : annotationShapeBackgroundOpacity;
  const effectiveAnnotationTextFontFamily = selectedTextAnnotation
    ? getAnnotationTextFontFamily(selectedTextAnnotation, annotationTextFontFamily)
    : annotationTextFontFamily;
  const effectiveAnnotationTextFontSize = selectedTextAnnotation
    ? getAnnotationTextFontSize(selectedTextAnnotation, annotationTextFontSize)
    : annotationTextFontSize;
  const effectiveAnnotationTextFontWeight = selectedTextAnnotation
    ? getAnnotationTextFontWeight(selectedTextAnnotation, annotationTextFontWeight)
    : annotationTextFontWeight;
  const selectedImageAnnotationOpacity =
    typeof selectedImageAnnotation?.style?.opacity === "number"
      ? clampTimelineValue(selectedImageAnnotation.style.opacity, 0, 1)
      : annotationImageOpacity;
  const selectedVisualAnnotationOpacity =
    typeof selectedAnnotation?.style?.opacity === "number"
      ? clampTimelineValue(selectedAnnotation.style.opacity, 0.1, 1)
      : annotationTool === "image"
        ? selectedImageAnnotationOpacity
        : annotationOpacity;
  const selectedImageAnnotationHeight =
    typeof selectedImageAnnotation?.height === "number"
      ? Math.round(selectedImageAnnotation.height)
      : annotationImageHeight;
  const selectedImageAnnotationWidth =
    typeof selectedImageAnnotation?.width === "number"
      ? Math.round(selectedImageAnnotation.width)
      : annotationImageWidth;

  useEffect(() => {
    if (!selectedShapeAnnotation || !hasExplicitShapeBackground(selectedShapeAnnotation)) return;

    setAnnotationShapeBackgroundOpacity(getShapeBackgroundOpacity(selectedShapeAnnotation.style?.backgroundOpacity));
  }, [selectedShapeAnnotation]);

  const handleVoiceNarrationError = useCallback((message: string) => {
    setToast({ type: TOAST_TYPE.ERROR, title: "Voice narration", message });
  }, []);
  const narration = useVideoAnnotationVoiceNarration({
    currentTime,
    durationSeconds,
    getCurrentTime,
    videoElement,
    onRequestPause,
    onRequestPlay,
    onSeek,
    playbackRate,
  });
  const isVoiceNarrationRecording = narration.locked;
  const isVoiceNarrationSupported = narration.supported;
  const { recorder: voiceRecorder, setReplacement: setNarrationReplacement } = narration;
  const workflow = useNarrationWorkflow({
    controls: narration,
    annotations,
    setAnnotations,
    setSelectedId: setSelectedAnnotationId,
    setTool: setAnnotationTool,
    tool: annotationTool,
    duration: durationSeconds ?? 0,
    canEdit,
    saving: isSavingAnnotations,
    dirty: hasAnnotationChanges,
    onPause: onRequestPause,
    onSeek,
    isPlaying,
    onError: handleVoiceNarrationError,
  });
  const { stop: stopNarrationPreview } = workflow.preview;
  const { open: openNarration } = workflow;
  preserveEditsRef.current = hasAnnotationChanges || narration.locked || workflow.needsReview || isSavingAnnotations;
  const narrationClips = useMemo(() => sortedAnnotations.filter((clip) => clip.type === "audio"), [sortedAnnotations]);
  const playingNarrationsRef = useRef(new Set<string>());
  const handleNarrationPlaybackChange = useCallback((id: string, playing: boolean) => {
    if (playing) playingNarrationsRef.current.add(id);
    else playingNarrationsRef.current.delete(id);
  }, []);
  const isNarrationPlaying = useCallback((id: string) => playingNarrationsRef.current.has(id), []);
  useNarrationDucking(
    videoElement,
    narrationClips,
    narration.readTime,
    narration.state.stage === "recording" ? narration.ducking : null,
    isNarrationPlaying
  );
  useEffect(() => {
    onRecordingLockChange?.(narration.locked);
    return () => onRecordingLockChange?.(false);
  }, [narration.locked, onRecordingLockChange]);

  const activeAnnotationIds = useMemo(
    () => new Set(activeAnnotations.map((annotation) => annotation.id)),
    [activeAnnotations]
  );
  const hasActiveAnnotations = activeAnnotations.length > 0;
  const annotationInputEnabled =
    canEdit && isAnnotationMode && !isPlaying && annotationTool !== "audio" && !narration.locked;
  const {
    annotationTimelineMoments,
    beginEditingTimelineMoment,
    canZoomTimelineIn,
    canZoomTimelineOut,
    commitTimelineMomentTitle,
    editingTimelineMoment,
    handleAnnotationTimelineResizePointerEnd,
    handleAnnotationTimelineResizePointerDown,
    handleAnnotationTimelineResizePointerMove,
    handleTimelineBodyScroll,
    handleTimelineHeaderScroll,
    handleTimelineKeyDown,
    handleTimelinePointerDown,
    handleTimelineSeek,
    jumpToNearestAnnotation,
    jumpToRelativeTimelineTime,
    minimumVisibleAnnotationDurationSeconds,
    openTimelineMomentIds,
    setEditingTimelineMoment,
    stepTimelineZoom,
    timelineContentWidthPx,
    timelineDurationSeconds,
    timelineHeaderScrollableElementRef,
    timelineProgressPercent,
    timelineResizeId,
    timelineScrollableElementRef,
    timelineTicks,
    timelineZoomPercent,
    toggleTimelineMoment,
  } = useVideoAnnotationTimeline({
    durationSeconds,
    effectiveCurrentTime,
    isSavingAnnotations: isSavingAnnotations || narration.locked,
    onSeek: narration.locked ? undefined : onSeek,
    setAnnotations,
    sortedAnnotations,
  });

  useEffect(() => {
    const changedSession = annotationSessionRef.current !== annotationKey;
    if (!changedSession && preserveEditsRef.current) return;
    annotationSessionRef.current = annotationKey;
    if (changedSession) {
      voiceRecorder.cancel();
      setNarrationReplacement(null);
      stopNarrationPreview();
      setAnnotationTool("pen");
    }
    const shouldOpenAnnotationMode = canEdit;
    setAnnotations(savedAnnotations);
    setBaselineAnnotations(savedAnnotations);
    setIsAnnotationMode(shouldOpenAnnotationMode);
    setIsSavingAnnotations(false);
    setSelectedAnnotationId(null);
    setAnnotationShapeBackgroundEnabled(false);
    setAnnotationShapeBackgroundOpacity(DEFAULT_VIDEO_ANNOTATION_SHAPE_BACKGROUND_OPACITY);
    onModeChange?.(shouldOpenAnnotationMode);
  }, [
    annotationKey,
    canEdit,
    voiceRecorder,
    setNarrationReplacement,
    onModeChange,
    savedAnnotations,
    stopNarrationPreview,
  ]);

  useEffect(() => {
    if (enableTextTool || annotationTool !== "text") return;

    setAnnotationTool("pen");
  }, [annotationTool, enableTextTool]);

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

  useEffect(() => {
    if (
      !selectedAnnotationId ||
      workflow.draft?.id === selectedAnnotationId ||
      annotations.some((annotation) => annotation.id === selectedAnnotationId)
    )
      return;

    setSelectedAnnotationId(null);
  }, [annotations, selectedAnnotationId, workflow.draft?.id]);

  const handleSelectAnnotationTool = useCallback(
    (tool: TCustomPlaylistAnnotationTool) => {
      if (narration.locked || workflow.needsReview) {
        handleVoiceNarrationError("Finish or cancel the current narration before switching tools.");
        return;
      }
      onRequestPause?.();
      setSelectedAnnotationId(null);
      setAnnotationTool(tool);
      if (tool === "image") {
        annotationImageInputRef.current?.click();
      }
      if (isAnnotationMode) return;

      setIsAnnotationMode(true);
      onModeChange?.(true);
    },
    [
      annotationImageInputRef,
      handleVoiceNarrationError,
      isAnnotationMode,
      narration.locked,
      onModeChange,
      onRequestPause,
      workflow.needsReview,
    ]
  );

  const handleUndoVisibleAnnotation = useCallback(() => {
    if (narration.locked || workflow.needsReview || isSavingAnnotations) return;
    stopNarrationPreview();
    setAnnotations((currentAnnotations) => {
      const annotationToRemove = activeAnnotations[activeAnnotations.length - 1];
      if (!annotationToRemove) return currentAnnotations;

      return currentAnnotations.filter((annotation) => annotation.id !== annotationToRemove.id);
    });
  }, [activeAnnotations, isSavingAnnotations, narration.locked, stopNarrationPreview, workflow.needsReview]);

  const handleClearVisibleAnnotations = useCallback(() => {
    if (narration.locked || workflow.needsReview || isSavingAnnotations) return;
    stopNarrationPreview();
    const activeAnnotationIds = new Set(activeAnnotations.map((annotation) => annotation.id));
    setAnnotations((currentAnnotations) =>
      currentAnnotations.filter((annotation) => !activeAnnotationIds.has(annotation.id))
    );
  }, [activeAnnotations, isSavingAnnotations, narration.locked, stopNarrationPreview, workflow.needsReview]);

  const handleDeleteAnnotation = useCallback(
    (annotationId: string) => {
      if (narration.locked || workflow.needsReview || isSavingAnnotations) return;
      stopNarrationPreview();
      setAnnotations((currentAnnotations) => currentAnnotations.filter((annotation) => annotation.id !== annotationId));
      setSelectedAnnotationId((currentAnnotationId) =>
        currentAnnotationId === annotationId ? null : currentAnnotationId
      );
      if (selectedAnnotation?.id === annotationId && selectedAnnotation.type === "audio") openNarration();
    },
    [
      isSavingAnnotations,
      narration.locked,
      openNarration,
      selectedAnnotation,
      stopNarrationPreview,
      workflow.needsReview,
    ]
  );

  const handleCreateAnnotation = useCallback(
    (annotation: TCustomPlaylistAnnotation) => {
      const offsetAnnotation =
        annotation.type === "audio" ? annotation : applyAnnotationCreationStartTimeOffset(annotation);

      setAnnotations((currentAnnotations) =>
        resolveAnnotationTimelineLayers(
          normalizePlaylistAnnotations([...currentAnnotations, offsetAnnotation]),
          offsetAnnotation.id,
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

  const handleAnnotationDurationChange = useCallback(
    (durationSeconds: number) => {
      if (!selectedAnnotation) {
        setAnnotationDurationSeconds(durationSeconds);
        return;
      }

      handleUpdateAnnotation({
        ...selectedAnnotation,
        endTime: selectedAnnotation.startTime + durationSeconds,
      });
    },
    [handleUpdateAnnotation, selectedAnnotation]
  );

  const handleAnnotationStartTimeChange = useCallback(
    (value: string) => {
      if (!selectedAnnotation || selectedAnnotation.type === "audio" || value === "") return;
      const nextStartTime = Math.max(0, Number(value));
      if (!Number.isFinite(nextStartTime)) return;
      const annotationDuration = selectedAnnotation.endTime - selectedAnnotation.startTime;
      handleUpdateAnnotation({
        ...selectedAnnotation,
        endTime: nextStartTime + annotationDuration,
        startTime: nextStartTime,
      });
    },
    [handleUpdateAnnotation, selectedAnnotation]
  );

  const handleAnnotationOpacityChange = useCallback(
    (value: string) => {
      const nextOpacity = clampTimelineValue(Number(value), 10, 100) / 100;
      if (!Number.isFinite(nextOpacity)) return;
      if (!selectedAnnotation) {
        if (annotationTool === "image") {
          handleDefaultAnnotationImageOpacityChange(value);
        } else {
          setAnnotationOpacity(nextOpacity);
        }
        return;
      }
      if (selectedAnnotation.type === "audio") return;
      if (selectedAnnotation.type === "image") handleDefaultAnnotationImageOpacityChange(value);
      handleUpdateAnnotation({
        ...selectedAnnotation,
        style: { ...selectedAnnotation.style, opacity: nextOpacity },
      });
    },
    [annotationTool, handleDefaultAnnotationImageOpacityChange, handleUpdateAnnotation, selectedAnnotation]
  );

  const handleAnnotationPositionChange = useCallback(
    (axis: "x" | "y", value: string) => {
      if (!selectedAnnotation || selectedAnnotation.type === "audio" || value === "") return;
      const nextCoordinate = clampTimelineValue(Number(value), 0, 100) * 10;
      if (!Number.isFinite(nextCoordinate)) return;
      const deltaX = axis === "x" ? nextCoordinate - selectedAnnotation.x : 0;
      const deltaY = axis === "y" ? nextCoordinate - selectedAnnotation.y : 0;
      handleUpdateAnnotation(moveAnnotation(selectedAnnotation, deltaX, deltaY));
    },
    [handleUpdateAnnotation, selectedAnnotation]
  );

  const handleAnnotationRotationChange = useCallback(
    (value: string) => {
      if (!selectedAnnotation || selectedAnnotation.type === "audio" || value === "") return;
      const rotation = clampTimelineValue(Number(value), 0, 359);
      if (!Number.isFinite(rotation)) return;
      handleUpdateAnnotation({ ...selectedAnnotation, rotation });
    },
    [handleUpdateAnnotation, selectedAnnotation]
  );

  const handlePanelAnnotationColorChange = useCallback(
    (colorValue: string) => {
      if (!selectedStyleAnnotation) {
        handleAnnotationColorChange(colorValue);
        return;
      }

      const normalizedColor = normalizeAnnotationHexColor(colorValue);
      if (!normalizedColor) return;

      handleUpdateAnnotation({
        ...selectedStyleAnnotation,
        style: {
          ...selectedStyleAnnotation.style,
          color: normalizedColor,
          ...(hasExplicitShapeBackground(selectedStyleAnnotation) ? { backgroundColor: normalizedColor } : {}),
          stroke: normalizedColor,
        },
      });
    },
    [handleAnnotationColorChange, handleUpdateAnnotation, selectedStyleAnnotation]
  );

  const handlePanelAnnotationColorInputChange = useCallback(
    (colorValue: string) => {
      if (!selectedStyleAnnotation) {
        handleAnnotationColorInputChange(colorValue);
        return;
      }

      handlePanelAnnotationColorChange(colorValue);
    },
    [handleAnnotationColorInputChange, handlePanelAnnotationColorChange, selectedStyleAnnotation]
  );

  const handlePanelAnnotationColorInputBlur = useCallback(() => {
    if (selectedStyleAnnotation) return;

    handleAnnotationColorInputBlur();
  }, [handleAnnotationColorInputBlur, selectedStyleAnnotation]);

  const handlePanelAnnotationColorChannelChange = useCallback(
    (channel: "blue" | "green" | "red", colorValue: string) => {
      const channelValue = clampTimelineValue(Number(colorValue), 0, 255);
      const nextColor = {
        ...effectiveAnnotationColorRgb,
        [channel]: channelValue,
      };

      handlePanelAnnotationColorChange(getHexColorFromRgb(nextColor.red, nextColor.green, nextColor.blue));
    },
    [effectiveAnnotationColorRgb, handlePanelAnnotationColorChange]
  );

  const handlePanelAnnotationColorHueChange = useCallback(
    (hueValue: string) => {
      const nextHue = clampTimelineValue(Number(hueValue), 0, 360);
      handlePanelAnnotationColorChange(
        getHexColorFromHsv(nextHue, effectiveAnnotationColorHsv.saturation, effectiveAnnotationColorHsv.value)
      );
    },
    [effectiveAnnotationColorHsv.saturation, effectiveAnnotationColorHsv.value, handlePanelAnnotationColorChange]
  );

  const updateSelectedAnnotationColorFromPickerPoint = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const pickerRect = event.currentTarget.getBoundingClientRect();
      const saturation = clampTimelineValue((event.clientX - pickerRect.left) / pickerRect.width, 0, 1);
      const value = 1 - clampTimelineValue((event.clientY - pickerRect.top) / pickerRect.height, 0, 1);

      handlePanelAnnotationColorChange(getHexColorFromHsv(effectiveAnnotationColorHsv.hue, saturation, value));
    },
    [effectiveAnnotationColorHsv.hue, handlePanelAnnotationColorChange]
  );

  const handlePanelAnnotationColorPickerPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!selectedStyleAnnotation) {
        handleAnnotationColorPickerPointerDown(event);
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      updateSelectedAnnotationColorFromPickerPoint(event);
    },
    [handleAnnotationColorPickerPointerDown, selectedStyleAnnotation, updateSelectedAnnotationColorFromPickerPoint]
  );

  const handlePanelAnnotationColorPickerPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!selectedStyleAnnotation) {
        handleAnnotationColorPickerPointerMove(event);
        return;
      }
      if (event.buttons !== 1) return;

      updateSelectedAnnotationColorFromPickerPoint(event);
    },
    [handleAnnotationColorPickerPointerMove, selectedStyleAnnotation, updateSelectedAnnotationColorFromPickerPoint]
  );

  const handleAnnotationStrokeStyleChange = useCallback(
    (strokeStyle: TCustomPlaylistAnnotationStrokeStyle) => {
      if (!selectedStyleAnnotation) {
        setAnnotationStrokeStyle(strokeStyle);
        return;
      }

      handleUpdateAnnotation({
        ...selectedStyleAnnotation,
        style: {
          ...selectedStyleAnnotation.style,
          strokeStyle,
        },
      });
    },
    [handleUpdateAnnotation, selectedStyleAnnotation]
  );

  const handleAnnotationStrokeWidthChange = useCallback(
    (strokeWidth: number) => {
      if (!selectedStyleAnnotation) {
        setAnnotationStrokeWidth(strokeWidth);
        return;
      }

      handleUpdateAnnotation({
        ...selectedStyleAnnotation,
        style: {
          ...selectedStyleAnnotation.style,
          strokeWidth,
        },
      });
    },
    [handleUpdateAnnotation, selectedStyleAnnotation]
  );

  const handleTextFontFamilyChange = useCallback(
    (fontFamily: string) => {
      if (!selectedTextAnnotation) {
        setAnnotationTextFontFamily(fontFamily);
        return;
      }

      handleUpdateAnnotation({
        ...selectedTextAnnotation,
        style: {
          ...selectedTextAnnotation.style,
          fontFamily,
        },
      });
    },
    [handleUpdateAnnotation, selectedTextAnnotation]
  );

  const handleTextFontSizeChange = useCallback(
    (fontSize: number) => {
      if (!selectedTextAnnotation) {
        setAnnotationTextFontSize(fontSize);
        return;
      }

      handleUpdateAnnotation({
        ...selectedTextAnnotation,
        style: {
          ...selectedTextAnnotation.style,
          fontSize,
        },
      });
    },
    [handleUpdateAnnotation, selectedTextAnnotation]
  );

  const handleTextFontWeightChange = useCallback(
    (fontWeight: number) => {
      if (!selectedTextAnnotation) {
        setAnnotationTextFontWeight(fontWeight);
        return;
      }

      handleUpdateAnnotation({
        ...selectedTextAnnotation,
        style: {
          ...selectedTextAnnotation.style,
          fontWeight,
        },
      });
    },
    [handleUpdateAnnotation, selectedTextAnnotation]
  );

  const handleShapeBackgroundToggle = useCallback(
    (enabled: boolean) => {
      setAnnotationShapeBackgroundEnabled(enabled);
      if (!selectedShapeAnnotation) return;

      const nextStyle = { ...selectedShapeAnnotation.style };
      if (enabled) {
        nextStyle.backgroundColor =
          typeof nextStyle.backgroundColor === "string" && nextStyle.backgroundColor.trim()
            ? nextStyle.backgroundColor
            : typeof nextStyle.stroke === "string" && nextStyle.stroke.trim()
              ? nextStyle.stroke
              : effectiveAnnotationColor;
        nextStyle.backgroundOpacity = getShapeBackgroundOpacity(
          nextStyle.backgroundOpacity ?? annotationShapeBackgroundOpacity
        );
      } else {
        delete nextStyle.backgroundColor;
        delete nextStyle.backgroundOpacity;
      }

      handleUpdateAnnotation({
        ...selectedShapeAnnotation,
        style: nextStyle,
      });
    },
    [effectiveAnnotationColor, annotationShapeBackgroundOpacity, handleUpdateAnnotation, selectedShapeAnnotation]
  );

  const handleShapeBackgroundOpacityChange = useCallback(
    (value: string) => {
      const nextOpacity = getShapeBackgroundOpacity(Number(value) / 100);
      setAnnotationShapeBackgroundOpacity(nextOpacity);
      if (!selectedShapeAnnotation || !hasExplicitShapeBackground(selectedShapeAnnotation)) return;

      handleUpdateAnnotation({
        ...selectedShapeAnnotation,
        style: {
          ...selectedShapeAnnotation.style,
          backgroundOpacity: nextOpacity,
        },
      });
    },
    [handleUpdateAnnotation, selectedShapeAnnotation]
  );

  const handleAnnotationImageSizeChange = useCallback(
    (dimension: "height" | "width", value: string) => {
      if (!selectedImageAnnotation) {
        handleDefaultAnnotationImageSizeChange(dimension, value);
        return;
      }

      handleDefaultAnnotationImageSizeChange(dimension, value);

      const nextSize = getAspectLockedImageAnnotationSize({
        currentHeight: selectedImageAnnotationHeight,
        currentWidth: selectedImageAnnotationWidth,
        dimension,
        value,
      });
      if (!nextSize) return;

      handleUpdateAnnotation({
        ...selectedImageAnnotation,
        height: nextSize.height,
        width: nextSize.width,
      });
    },
    [
      handleDefaultAnnotationImageSizeChange,
      handleUpdateAnnotation,
      selectedImageAnnotation,
      selectedImageAnnotationHeight,
      selectedImageAnnotationWidth,
    ]
  );

  const handleSaveAnnotations = useCallback(async () => {
    if (isSavingAnnotations) return false;
    if (isVoiceNarrationRecording || workflow.needsReview) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Narration not ready",
        message: "Stop recording and wait for narration processing before saving annotations.",
      });
      return false;
    }
    if (!hasAnnotationChanges) return true;

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
      return true;
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Save annotations failed",
        message: getAnnotationSaveErrorMessage(error),
      });
      return false;
    } finally {
      setIsSavingAnnotations(false);
    }
  }, [
    annotations,
    hasAnnotationChanges,
    isSavingAnnotations,
    isVoiceNarrationRecording,
    workflow.needsReview,
    minimumVisibleAnnotationDurationSeconds,
    onSave,
  ]);

  useEffect(() => {
    if (!onRegisterSaveHandler) return;

    onRegisterSaveHandler(canEdit ? handleSaveAnnotations : null);

    return () => {
      onRegisterSaveHandler(null);
    };
  }, [canEdit, handleSaveAnnotations, onRegisterSaveHandler]);

  useEffect(() => {
    onUnsavedChangesChange?.(canEdit && (hasAnnotationChanges || isVoiceNarrationRecording || workflow.needsReview));
  }, [canEdit, hasAnnotationChanges, isVoiceNarrationRecording, onUnsavedChangesChange, workflow.needsReview]);

  useEffect(
    () => () => {
      onUnsavedChangesChange?.(false);
    },
    [onUnsavedChangesChange]
  );

  const timelineContent =
    showTimeline && timelineHostElement ? (
      <fieldset disabled={narration.locked || isSavingAnnotations}>
        <VideoAnnotationTimelinePanel
          key={annotationKey}
          narrationActions={{
            selectedId: selectedAnnotationId,
            previewId: workflow.preview.previewId,
            disabled: narration.locked || isSavingAnnotations || workflow.needsReview,
            onSelect: workflow.select,
            onChange: workflow.change,
            onPreview: workflow.preview.play,
            onReplace: workflow.replace,
            onDuplicate: workflow.duplicate,
          }}
          activeAnnotationIds={activeAnnotationIds}
          annotationTimelineMoments={annotationTimelineMoments}
          canZoomTimelineIn={canZoomTimelineIn}
          canZoomTimelineOut={canZoomTimelineOut}
          editingTimelineMoment={editingTimelineMoment}
          effectiveCurrentTime={effectiveCurrentTime}
          isPlaying={isPlaying}
          onBeginEditingTimelineMoment={beginEditingTimelineMoment}
          onCommitTimelineMomentTitle={commitTimelineMomentTitle}
          onDeleteAnnotation={handleDeleteAnnotation}
          onEditingTimelineMomentChange={setEditingTimelineMoment}
          onJumpToNearestAnnotation={jumpToNearestAnnotation}
          onJumpToRelativeTimelineTime={jumpToRelativeTimelineTime}
          onSeek={narration.locked ? undefined : onSeek}
          onStepTimelineZoom={stepTimelineZoom}
          onTimelineBodyScroll={handleTimelineBodyScroll}
          onTimelineHeaderScroll={handleTimelineHeaderScroll}
          onTimelineKeyDown={handleTimelineKeyDown}
          onTimelinePointerDown={handleTimelinePointerDown}
          onTimelineResizePointerEnd={handleAnnotationTimelineResizePointerEnd}
          onTimelineResizePointerDown={handleAnnotationTimelineResizePointerDown}
          onTimelineResizePointerMove={handleAnnotationTimelineResizePointerMove}
          onTimelineSeek={handleTimelineSeek}
          onToggleTimelineMoment={toggleTimelineMoment}
          openTimelineMomentIds={openTimelineMomentIds}
          playbackRate={playbackRate}
          sortedAnnotations={workflow.draft ? [...sortedAnnotations, workflow.draft] : sortedAnnotations}
          timelineContentWidthPx={timelineContentWidthPx}
          timelineDurationSeconds={timelineDurationSeconds}
          timelineHeaderScrollableElementRef={timelineHeaderScrollableElementRef}
          timelineProgressPercent={timelineProgressPercent}
          timelineResizeId={timelineResizeId}
          timelineScrollableElementRef={timelineScrollableElementRef}
          timelineTicks={timelineTicks}
          timelineZoomPercent={timelineZoomPercent}
        />
      </fieldset>
    ) : null;

  const annotationColorPicker = (
    <VideoAnnotationColorPickerButton
      annotationColor={effectiveAnnotationColor}
      onColorChange={handlePanelAnnotationColorChange}
    />
  );

  const shouldRenderSeparateAnnotationProperties = showTimeline && Boolean(propertyHostElement);
  const propertiesPanelTool = selectedAnnotation?.type ?? annotationTool;
  const highlightedAnnotationTool =
    selectedAnnotation?.type ?? (annotationTool === "image" && !selectedImageAnnotation ? null : annotationTool);
  const selectedAnnotationToolOption =
    (selectedAnnotation ? VIDEO_ANNOTATION_TOOLS : availableAnnotationTools).find(
      (toolOption) => toolOption.type === propertiesPanelTool
    ) ?? availableAnnotationTools[0];
  const annotationPreviewStartTime = getAnnotationStartTimeWithCreationOffset(effectiveCurrentTime);
  const annotationPreviewEndTime = annotationPreviewStartTime + effectiveAnnotationDurationSeconds;
  const narrationPanel = (
    <VoiceNarrationPanel
      controls={narration}
      selected={selectedAnnotation?.type === "audio" ? selectedAnnotation : null}
      draft={workflow.draft}
      currentTime={effectiveCurrentTime}
      duration={timelineDurationSeconds}
      previewId={workflow.preview.previewId}
      previewError={workflow.preview.error}
      dirty={hasAnnotationChanges || workflow.needsReview}
      disabled={isSavingAnnotations}
      onChange={workflow.change}
      onReplace={workflow.replace}
      onDelete={handleDeleteAnnotation}
      onPreview={workflow.preview.play}
      onNew={workflow.open}
    />
  );
  const annotationPropertyPanelContent =
    canEdit && annotationTool === "audio" ? (
      narrationPanel
    ) : canEdit ? (
      <VideoAnnotationPropertiesPanel
        annotationColor={effectiveAnnotationColor}
        annotationColorHsv={effectiveAnnotationColorHsv}
        annotationColorInputValue={effectiveAnnotationColorInputValue}
        annotationColorRgb={effectiveAnnotationColorRgb}
        annotationDurationSeconds={effectiveAnnotationDurationSeconds}
        annotationImageContent={selectedImageAnnotation?.content ?? annotationImageContent}
        annotationImageHeight={selectedImageAnnotationHeight}
        annotationImageWidth={selectedImageAnnotationWidth}
        annotationOpacity={selectedVisualAnnotationOpacity}
        annotationPositionX={(selectedAnnotation?.x ?? 0) / 10}
        annotationPositionY={(selectedAnnotation?.y ?? 0) / 10}
        annotationRotation={selectedAnnotation ? getAnnotationRotation(selectedAnnotation) : 0}
        annotationStartTime={selectedAnnotation?.startTime ?? 0}
        annotationShapeBackgroundEnabled={effectiveShapeBackgroundEnabled}
        annotationShapeBackgroundOpacity={effectiveShapeBackgroundOpacity}
        annotationStrokeStyle={effectiveAnnotationStrokeStyle}
        annotationStrokeWidth={effectiveAnnotationStrokeWidth}
        annotationTextFontFamily={effectiveAnnotationTextFontFamily}
        annotationTextFontSize={effectiveAnnotationTextFontSize}
        annotationTextFontWeight={effectiveAnnotationTextFontWeight}
        annotationTool={propertiesPanelTool}
        isAnnotationColorPickerOpen={isAnnotationColorPickerOpen}
        isAnnotationMode={isAnnotationMode}
        isVisualAnnotationSelected={Boolean(selectedAnnotation && selectedAnnotation.type !== "audio")}
        onAnnotationColorChange={handlePanelAnnotationColorChange}
        onAnnotationColorChannelChange={handlePanelAnnotationColorChannelChange}
        onAnnotationColorHueChange={handlePanelAnnotationColorHueChange}
        onAnnotationColorInputBlur={handlePanelAnnotationColorInputBlur}
        onAnnotationColorInputChange={handlePanelAnnotationColorInputChange}
        onAnnotationColorPickerPointerDown={handlePanelAnnotationColorPickerPointerDown}
        onAnnotationColorPickerPointerMove={handlePanelAnnotationColorPickerPointerMove}
        onAnnotationImageSizeChange={handleAnnotationImageSizeChange}
        onAnnotationOpacityChange={handleAnnotationOpacityChange}
        onAnnotationPositionChange={handleAnnotationPositionChange}
        onAnnotationRotationChange={handleAnnotationRotationChange}
        onAnnotationStartTimeChange={handleAnnotationStartTimeChange}
        onDurationChange={handleAnnotationDurationChange}
        onShapeBackgroundOpacityChange={handleShapeBackgroundOpacityChange}
        onShapeBackgroundToggle={handleShapeBackgroundToggle}
        onStrokeStyleChange={handleAnnotationStrokeStyleChange}
        onStrokeWidthChange={handleAnnotationStrokeWidthChange}
        onTextFontFamilyChange={handleTextFontFamilyChange}
        onTextFontSizeChange={handleTextFontSizeChange}
        onTextFontWeightChange={handleTextFontWeightChange}
        selectedAnnotationToolOption={selectedAnnotationToolOption}
        setIsAnnotationColorPickerOpen={setIsAnnotationColorPickerOpen}
      />
    ) : null;

  const annotationToolbarContent = canEdit ? (
    <VideoAnnotationToolbar
      annotationColorPicker={annotationColorPicker}
      annotationDurationSeconds={effectiveAnnotationDurationSeconds}
      annotationShapeBackgroundEnabled={effectiveShapeBackgroundEnabled}
      annotationStrokeStyle={effectiveAnnotationStrokeStyle}
      annotationStrokeWidth={effectiveAnnotationStrokeWidth}
      annotationTool={highlightedAnnotationTool}
      availableAnnotationTools={availableAnnotationTools}
      hasActiveAnnotations={hasActiveAnnotations}
      hasAnnotationChanges={hasAnnotationChanges}
      isAnnotationMode={isAnnotationMode}
      isSavingAnnotations={isSavingAnnotations}
      isVoiceNarrationRecording={isVoiceNarrationRecording}
      isVoiceNarrationSupported={isVoiceNarrationSupported}
      onClearVisibleAnnotations={handleClearVisibleAnnotations}
      onDurationChange={handleAnnotationDurationChange}
      onSaveAnnotations={handleSaveAnnotations}
      onSelectAnnotationTool={handleSelectAnnotationTool}
      onShapeBackgroundToggle={handleShapeBackgroundToggle}
      onStartVoiceNarration={workflow.open}
      onStrokeStyleChange={handleAnnotationStrokeStyleChange}
      onStrokeWidthChange={handleAnnotationStrokeWidthChange}
      onUndoVisibleAnnotation={handleUndoVisibleAnnotation}
      shouldRenderSeparateAnnotationProperties={shouldRenderSeparateAnnotationProperties}
    />
  ) : null;

  return (
    <>
      <input
        ref={annotationImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleAnnotationImageChange(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      <PlaylistAnnotationOverlay
        annotations={visualActiveAnnotations}
        className={["z-10", className].filter(Boolean).join(" ")}
        color={annotationColor}
        durationSeconds={annotationDurationSeconds}
        enableAnnotationTransforms={enableAnnotationTransforms}
        enabled={canEdit && isAnnotationMode}
        fitToVideoBounds={fitToVideoBounds}
        imageContent={annotationImageContent}
        imageHeight={annotationImageHeight}
        imageOpacity={annotationImageOpacity}
        imagePlacementKey={annotationImagePlacementKey}
        imageTitle={annotationImageName}
        imageWidth={annotationImageWidth}
        inputEnabled={annotationInputEnabled}
        onCreateAnnotation={handleCreateAnnotation}
        onDeleteAnnotation={handleDeleteAnnotation}
        onSelectedAnnotationIdChange={setSelectedAnnotationId}
        onUpdateAnnotation={handleUpdateAnnotation}
        opacity={annotationOpacity}
        selectedAnnotationId={annotationTool === "audio" ? null : selectedAnnotationId}
        shapeBackgroundEnabled={annotationShapeBackgroundEnabled}
        shapeBackgroundOpacity={annotationShapeBackgroundOpacity}
        startTime={effectiveCurrentTime}
        strokeStyle={annotationStrokeStyle}
        strokeWidth={annotationStrokeWidth}
        textFontFamily={annotationTextFontFamily}
        textFontSize={annotationTextFontSize}
        textFontWeight={annotationTextFontWeight}
        tool={annotationTool}
      />

      {isVoiceNarrationRecording ? (
        <VideoAnnotationRecordingIndicator recorder={narration.recorder} state={narration.state} />
      ) : null}

      {sortedAnnotations
        .filter((annotation) => annotation.type === "audio" && Boolean(annotation.content))
        .map((annotation) => (
          <VideoAnnotationAudioPlayback
            key={annotation.id}
            annotation={annotation}
            currentTime={effectiveCurrentTime}
            isPlaying={isPlaying && !narration.locked && !workflow.preview.previewId}
            playbackRate={playbackRate}
            getCurrentTime={getCurrentTime}
            videoElement={videoElement}
            onError={handleVoiceNarrationError}
            onPlaybackChange={handleNarrationPlaybackChange}
          />
        ))}

      {canEdit && !toolbarHostElement && !showTimeline ? (
        <VideoAnnotationInlineToolbar
          annotationColorPicker={annotationColorPicker}
          annotationDurationSeconds={effectiveAnnotationDurationSeconds}
          annotationPreviewEndTime={annotationPreviewEndTime}
          annotationPreviewStartTime={annotationPreviewStartTime}
          annotationShapeBackgroundEnabled={effectiveShapeBackgroundEnabled}
          annotationStrokeStyle={effectiveAnnotationStrokeStyle}
          annotationStrokeWidth={effectiveAnnotationStrokeWidth}
          annotationTool={highlightedAnnotationTool}
          availableAnnotationTools={availableAnnotationTools}
          hasActiveAnnotations={hasActiveAnnotations}
          hasAnnotationChanges={hasAnnotationChanges}
          isAnnotationMode={isAnnotationMode}
          isSavingAnnotations={isSavingAnnotations}
          isVoiceNarrationRecording={isVoiceNarrationRecording}
          isVoiceNarrationSupported={isVoiceNarrationSupported}
          onClearVisibleAnnotations={handleClearVisibleAnnotations}
          onDurationChange={handleAnnotationDurationChange}
          onSaveAnnotations={handleSaveAnnotations}
          onSelectAnnotationTool={handleSelectAnnotationTool}
          onShapeBackgroundToggle={handleShapeBackgroundToggle}
          onStartVoiceNarration={workflow.open}
          onStrokeStyleChange={handleAnnotationStrokeStyleChange}
          onStrokeWidthChange={handleAnnotationStrokeWidthChange}
          onUndoVisibleAnnotation={handleUndoVisibleAnnotation}
        />
      ) : null}
      {annotationToolbarContent && toolbarHostElement
        ? createPortal(annotationToolbarContent, toolbarHostElement)
        : null}
      {canEdit && annotationTool === "audio" && !propertyHostElement ? (
        <div className="absolute bottom-12 right-2 z-20 max-h-[70%] w-64 max-w-[calc(100%-1rem)] overflow-auto rounded-md border border-custom-border-200 bg-custom-background-100">
          {narrationPanel}
        </div>
      ) : null}
      {annotationPropertyPanelContent && propertyHostElement
        ? createPortal(annotationPropertyPanelContent, propertyHostElement)
        : null}
      {timelineContent && timelineHostElement ? createPortal(timelineContent, timelineHostElement) : null}
    </>
  );
};
