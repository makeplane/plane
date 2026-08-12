"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useVideoAnnotationClock } from "../hooks/use-video-annotation-clock";
import { useVideoAnnotationColorControls } from "../hooks/use-video-annotation-color-controls";
import { useVideoAnnotationImageControls } from "../hooks/use-video-annotation-image-controls";
import { useVideoAnnotationTimeline } from "../hooks/use-video-annotation-timeline";
import type {
  TCustomPlaylistAnnotation,
  TCustomPlaylistAnnotationStrokeStyle,
  TCustomPlaylistAnnotationTool,
} from "../types/annotation.types";
import type { VideoAnnotationEditorProps } from "../types/video-annotation-editor.types";
import { VIDEO_ANNOTATION_TOOLS } from "../utils/video-annotation-editor-config";
import {
  applyAnnotationCreationStartTimeOffset,
  getAnnotationStartTimeWithCreationOffset,
  resolveAnnotationTimelineLayers,
} from "../utils/video-annotation-timeline";
import {
  PlaylistAnnotationOverlay,
  arePlaylistAnnotationsEqual,
  getActivePlaylistAnnotations,
  normalizePlaylistAnnotations,
} from "./playlist-annotation-overlay";
import { VideoAnnotationColorPickerButton } from "./video-annotation-color-picker-button";
import { VideoAnnotationInlineToolbar } from "./video-annotation-inline-toolbar";
import { VideoAnnotationPropertiesPanel } from "./video-annotation-properties-panel";
import { VideoAnnotationTimelinePanel } from "./video-annotation-timeline-panel";
import { VideoAnnotationToolbar } from "./video-annotation-toolbar";

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
  onRegisterSaveHandler,
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
  const [annotationStrokeWidth, setAnnotationStrokeWidth] = useState(5);
  const [annotationStrokeStyle, setAnnotationStrokeStyle] = useState<TCustomPlaylistAnnotationStrokeStyle>("solid");
  const [annotationDurationSeconds, setAnnotationDurationSeconds] = useState(2);
  const [annotationTextFontSize, setAnnotationTextFontSize] = useState(28);
  const [annotationTextFontWeight, setAnnotationTextFontWeight] = useState(700);
  const [annotationTextFontFamily, setAnnotationTextFontFamily] = useState("sans-serif");
  const [isSavingAnnotations, setIsSavingAnnotations] = useState(false);
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
  const {
    annotationColor,
    annotationColorHsv,
    annotationColorInputValue,
    annotationColorRgb,
    handleAnnotationColorChange,
    handleAnnotationColorChannelChange,
    handleAnnotationColorHueChange,
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
    handleAnnotationImageOpacityChange,
    handleAnnotationImageSizeChange,
    handleChooseAnnotationImage,
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
  const activeAnnotationIds = useMemo(
    () => new Set(activeAnnotations.map((annotation) => annotation.id)),
    [activeAnnotations]
  );
  const hasActiveAnnotations = activeAnnotations.length > 0;
  const annotationInputEnabled = canEdit && isAnnotationMode && !isPlaying;
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
    isSavingAnnotations,
    onSeek,
    setAnnotations,
    sortedAnnotations,
  });

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

  const handleSelectAnnotationTool = useCallback(
    (tool: TCustomPlaylistAnnotationTool) => {
      onRequestPause?.();
      setAnnotationTool(tool);
      if (tool === "image" && !annotationImageContent) {
        annotationImageInputRef.current?.click();
      }
      if (isAnnotationMode) return;

      setIsAnnotationMode(true);
      onModeChange?.(true);
    },
    [annotationImageContent, annotationImageInputRef, isAnnotationMode, onModeChange, onRequestPause]
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
      const offsetAnnotation = applyAnnotationCreationStartTimeOffset(annotation);

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

  const handleSaveAnnotations = useCallback(async () => {
    if (isSavingAnnotations) return false;
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
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Save annotations failed",
        message: "Unable to save video annotations. Please try again.",
      });
      return false;
    } finally {
      setIsSavingAnnotations(false);
    }
  }, [annotations, hasAnnotationChanges, isSavingAnnotations, minimumVisibleAnnotationDurationSeconds, onSave]);

  useEffect(() => {
    if (!onRegisterSaveHandler) return;

    onRegisterSaveHandler(canEdit ? handleSaveAnnotations : null);

    return () => {
      onRegisterSaveHandler(null);
    };
  }, [canEdit, handleSaveAnnotations, onRegisterSaveHandler]);

  const timelineContent =
    showTimeline && timelineHostElement ? (
      <VideoAnnotationTimelinePanel
        activeAnnotationIds={activeAnnotationIds}
        annotationTimelineMoments={annotationTimelineMoments}
        canZoomTimelineIn={canZoomTimelineIn}
        canZoomTimelineOut={canZoomTimelineOut}
        editingTimelineMoment={editingTimelineMoment}
        effectiveCurrentTime={effectiveCurrentTime}
        isPlaying={isPlaying}
        onBeginEditingTimelineMoment={beginEditingTimelineMoment}
        onCommitTimelineMomentTitle={commitTimelineMomentTitle}
        onEditingTimelineMomentChange={setEditingTimelineMoment}
        onJumpToNearestAnnotation={jumpToNearestAnnotation}
        onJumpToRelativeTimelineTime={jumpToRelativeTimelineTime}
        onSeek={onSeek}
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
        sortedAnnotations={sortedAnnotations}
        timelineContentWidthPx={timelineContentWidthPx}
        timelineDurationSeconds={timelineDurationSeconds}
        timelineHeaderScrollableElementRef={timelineHeaderScrollableElementRef}
        timelineProgressPercent={timelineProgressPercent}
        timelineResizeId={timelineResizeId}
        timelineScrollableElementRef={timelineScrollableElementRef}
        timelineTicks={timelineTicks}
        timelineZoomPercent={timelineZoomPercent}
      />
    ) : null;

  const annotationColorPicker = (
    <VideoAnnotationColorPickerButton annotationColor={annotationColor} onColorChange={handleAnnotationColorChange} />
  );

  const shouldRenderSeparateAnnotationProperties = showTimeline && Boolean(propertyHostElement);
  const selectedAnnotationToolOption =
    availableAnnotationTools.find((toolOption) => toolOption.type === annotationTool) ?? availableAnnotationTools[0];
  const annotationPreviewStartTime = getAnnotationStartTimeWithCreationOffset(effectiveCurrentTime);
  const annotationPreviewEndTime = annotationPreviewStartTime + annotationDurationSeconds;
  const annotationPropertyPanelContent = canEdit ? (
    <VideoAnnotationPropertiesPanel
      annotationColor={annotationColor}
      annotationColorHsv={annotationColorHsv}
      annotationColorInputValue={annotationColorInputValue}
      annotationColorRgb={annotationColorRgb}
      annotationDurationSeconds={annotationDurationSeconds}
      annotationImageContent={annotationImageContent}
      annotationImageHeight={annotationImageHeight}
      annotationImageName={annotationImageName}
      annotationImageOpacity={annotationImageOpacity}
      annotationImageWidth={annotationImageWidth}
      annotationStrokeStyle={annotationStrokeStyle}
      annotationStrokeWidth={annotationStrokeWidth}
      annotationTextFontFamily={annotationTextFontFamily}
      annotationTextFontSize={annotationTextFontSize}
      annotationTextFontWeight={annotationTextFontWeight}
      annotationTool={annotationTool}
      isAnnotationColorPickerOpen={isAnnotationColorPickerOpen}
      isAnnotationMode={isAnnotationMode}
      onAnnotationColorChange={handleAnnotationColorChange}
      onAnnotationColorChannelChange={handleAnnotationColorChannelChange}
      onAnnotationColorHueChange={handleAnnotationColorHueChange}
      onAnnotationColorInputBlur={handleAnnotationColorInputBlur}
      onAnnotationColorInputChange={handleAnnotationColorInputChange}
      onAnnotationColorPickerPointerDown={handleAnnotationColorPickerPointerDown}
      onAnnotationColorPickerPointerMove={handleAnnotationColorPickerPointerMove}
      onAnnotationImageOpacityChange={handleAnnotationImageOpacityChange}
      onAnnotationImageSizeChange={handleAnnotationImageSizeChange}
      onChooseAnnotationImage={handleChooseAnnotationImage}
      onDurationChange={setAnnotationDurationSeconds}
      onStrokeStyleChange={setAnnotationStrokeStyle}
      onStrokeWidthChange={setAnnotationStrokeWidth}
      onTextFontFamilyChange={setAnnotationTextFontFamily}
      onTextFontSizeChange={setAnnotationTextFontSize}
      onTextFontWeightChange={setAnnotationTextFontWeight}
      selectedAnnotationToolOption={selectedAnnotationToolOption}
      setIsAnnotationColorPickerOpen={setIsAnnotationColorPickerOpen}
    />
  ) : null;

  const annotationToolbarContent = canEdit ? (
    <VideoAnnotationToolbar
      annotationColorPicker={annotationColorPicker}
      annotationDurationSeconds={annotationDurationSeconds}
      annotationStrokeStyle={annotationStrokeStyle}
      annotationStrokeWidth={annotationStrokeWidth}
      annotationTool={annotationTool}
      availableAnnotationTools={availableAnnotationTools}
      hasActiveAnnotations={hasActiveAnnotations}
      hasAnnotationChanges={hasAnnotationChanges}
      isAnnotationMode={isAnnotationMode}
      isSavingAnnotations={isSavingAnnotations}
      onClearVisibleAnnotations={handleClearVisibleAnnotations}
      onDurationChange={setAnnotationDurationSeconds}
      onSaveAnnotations={handleSaveAnnotations}
      onSelectAnnotationTool={handleSelectAnnotationTool}
      onStrokeStyleChange={setAnnotationStrokeStyle}
      onStrokeWidthChange={setAnnotationStrokeWidth}
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
        annotations={activeAnnotations}
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
        <VideoAnnotationInlineToolbar
          annotationColorPicker={annotationColorPicker}
          annotationDurationSeconds={annotationDurationSeconds}
          annotationPreviewEndTime={annotationPreviewEndTime}
          annotationPreviewStartTime={annotationPreviewStartTime}
          annotationStrokeStyle={annotationStrokeStyle}
          annotationStrokeWidth={annotationStrokeWidth}
          annotationTool={annotationTool}
          availableAnnotationTools={availableAnnotationTools}
          hasActiveAnnotations={hasActiveAnnotations}
          hasAnnotationChanges={hasAnnotationChanges}
          isAnnotationMode={isAnnotationMode}
          isSavingAnnotations={isSavingAnnotations}
          onClearVisibleAnnotations={handleClearVisibleAnnotations}
          onDurationChange={setAnnotationDurationSeconds}
          onSaveAnnotations={handleSaveAnnotations}
          onSelectAnnotationTool={handleSelectAnnotationTool}
          onStrokeStyleChange={setAnnotationStrokeStyle}
          onStrokeWidthChange={setAnnotationStrokeWidth}
          onUndoVisibleAnnotation={handleUndoVisibleAnnotation}
        />
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
