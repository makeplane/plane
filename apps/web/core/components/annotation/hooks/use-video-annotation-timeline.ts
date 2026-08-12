import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
  UIEvent as ReactUIEvent,
} from "react";
import type { TCustomPlaylistAnnotation } from "../types/annotation.types";
import {
  VIDEO_ANNOTATION_TIMELINE_CLIP_GAP_PX,
  VIDEO_ANNOTATION_TIMELINE_CLIP_MIN_WIDTH_PX,
  VIDEO_ANNOTATION_TIMELINE_DEFAULT_ZOOM_PERCENT,
  VIDEO_ANNOTATION_TIMELINE_MIN_DURATION_SECONDS,
  VIDEO_ANNOTATION_TIMELINE_ZOOM_STEPS,
} from "../utils/video-annotation-editor-config";
import type { AnnotationTimelineMoment, AnnotationTimelineResizeState } from "../utils/video-annotation-timeline";
import {
  buildAnnotationTimelineMoments,
  buildAnnotationTimelineTicks,
  clampTimelineValue,
  getTimelineContentWidthPx,
  getTimelineDuration,
  getTimelinePercent,
} from "../utils/video-annotation-timeline";

type UseVideoAnnotationTimelineParams = {
  durationSeconds?: number | null;
  effectiveCurrentTime: number;
  isSavingAnnotations: boolean;
  onSeek?: (seconds: number) => void;
  setAnnotations: Dispatch<SetStateAction<TCustomPlaylistAnnotation[]>>;
  sortedAnnotations: TCustomPlaylistAnnotation[];
};

export const useVideoAnnotationTimeline = ({
  durationSeconds,
  effectiveCurrentTime,
  isSavingAnnotations,
  onSeek,
  setAnnotations,
  sortedAnnotations,
}: UseVideoAnnotationTimelineParams) => {
  const [timelineZoomPercent, setTimelineZoomPercent] = useState(VIDEO_ANNOTATION_TIMELINE_DEFAULT_ZOOM_PERCENT);
  const [openTimelineMomentIds, setOpenTimelineMomentIds] = useState<Set<string>>(() => new Set());
  const [editingTimelineMoment, setEditingTimelineMoment] = useState<{ id: string; value: string } | null>(null);
  const [timelineResizeId, setTimelineResizeId] = useState<string | null>(null);
  const timelineHeaderScrollableElementRef = useRef<HTMLDivElement | null>(null);
  const timelineScrollableElementRef = useRef<HTMLDivElement | null>(null);
  const timelineResizeStateRef = useRef<AnnotationTimelineResizeState | null>(null);
  const annotationTimelineMoments = useMemo(
    () => buildAnnotationTimelineMoments(sortedAnnotations),
    [sortedAnnotations]
  );
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
  const minimumResizableAnnotationDurationSeconds =
    (VIDEO_ANNOTATION_TIMELINE_CLIP_MIN_WIDTH_PX / Math.max(1, timelineContentWidthPx)) * timelineDurationSeconds;
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

  const updateAnnotationTimelineResizeByClientX = useCallback(
    (pointerId: number, clientX: number, preventDefault: () => void) => {
      const resizeState = timelineResizeStateRef.current;
      if (!resizeState || resizeState.pointerId !== pointerId) return false;

      preventDefault();
      if (!resizeState.hasMoved && Math.abs(clientX - resizeState.startClientX) <= 2) {
        return true;
      }

      if (!resizeState.hasMoved) {
        resizeState.hasMoved = true;
      }

      const timelineResizeWidthPx = Math.max(
        1,
        timelineScrollableElementRef.current?.scrollWidth ?? timelineContentWidthPx
      );
      const deltaSeconds = ((clientX - resizeState.startClientX) / timelineResizeWidthPx) * timelineDurationSeconds;
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

      return true;
    },
    [setAnnotations, timelineContentWidthPx, timelineDurationSeconds]
  );

  const updateAnnotationTimelineResize = useCallback(
    (event: PointerEvent) => {
      updateAnnotationTimelineResizeByClientX(event.pointerId, event.clientX, () => event.preventDefault());
    },
    [updateAnnotationTimelineResizeByClientX]
  );

  const finishAnnotationTimelineResize = useCallback((pointerId: number, preventDefault: () => void) => {
    const resizeState = timelineResizeStateRef.current;
    if (!resizeState || resizeState.pointerId !== pointerId) return false;

    if (resizeState.hasMoved) {
      preventDefault();
    }

    timelineResizeStateRef.current = null;
    setTimelineResizeId(null);
    return true;
  }, []);

  useEffect(() => {
    const handleWindowPointerEnd = (event: PointerEvent) => {
      finishAnnotationTimelineResize(event.pointerId, () => event.preventDefault());
    };

    window.addEventListener("pointermove", updateAnnotationTimelineResize);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    return () => {
      window.removeEventListener("pointermove", updateAnnotationTimelineResize);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, [finishAnnotationTimelineResize, updateAnnotationTimelineResize]);

  const handleAnnotationTimelineResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, annotation: TCustomPlaylistAnnotation) => {
      if (event.button !== 0 || isSavingAnnotations) return;

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      const resizeStartEndTime = clampTimelineValue(
        Math.max(annotation.endTime, annotation.startTime + minimumResizableAnnotationDurationSeconds),
        annotation.startTime + VIDEO_ANNOTATION_TIMELINE_MIN_DURATION_SECONDS,
        timelineDurationSeconds
      );
      timelineResizeStateRef.current = {
        annotationId: annotation.id,
        hasMoved: false,
        originalEndTime: resizeStartEndTime,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startTime: annotation.startTime,
      };
      setTimelineResizeId(annotation.id);
    },
    [isSavingAnnotations, minimumResizableAnnotationDurationSeconds, timelineDurationSeconds]
  );

  const handleAnnotationTimelineResizePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (updateAnnotationTimelineResizeByClientX(event.pointerId, event.clientX, () => event.preventDefault())) {
        event.stopPropagation();
      }
    },
    [updateAnnotationTimelineResizeByClientX]
  );

  const handleAnnotationTimelineResizePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (finishAnnotationTimelineResize(event.pointerId, () => event.preventDefault())) {
        event.stopPropagation();
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [finishAnnotationTimelineResize]
  );

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

  return {
    annotationTimelineMoments,
    beginEditingTimelineMoment,
    canZoomTimelineIn,
    canZoomTimelineOut,
    commitTimelineMomentTitle,
    editingTimelineMoment,
    handleAnnotationTimelineResizePointerEnd,
    handleAnnotationTimelineResizePointerMove,
    handleAnnotationTimelineResizePointerDown,
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
  };
};
