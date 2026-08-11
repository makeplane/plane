import { useEffect, useMemo, useRef, useState } from "react";
import type { TCustomPlaylistAnnotation } from "../types/annotation.types";

type UseVideoAnnotationClockParams = {
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  showTimeline: boolean;
  sortedAnnotations: TCustomPlaylistAnnotation[];
};

export const useVideoAnnotationClock = ({
  currentTime,
  isPlaying,
  playbackRate,
  showTimeline,
  sortedAnnotations,
}: UseVideoAnnotationClockParams) => {
  const [annotationClockTick, setAnnotationClockTick] = useState(0);
  const clockOriginRef = useRef({
    mediaTime: currentTime,
    wallTime: typeof performance !== "undefined" ? performance.now() : Date.now(),
  });
  const safePlaybackRate = Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1;
  const effectiveCurrentTime = useMemo(() => {
    void annotationClockTick;

    if (!isPlaying) return currentTime;

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const elapsedSeconds = Math.max(0, (now - clockOriginRef.current.wallTime) / 1000);
    return Math.max(0, clockOriginRef.current.mediaTime + elapsedSeconds * safePlaybackRate);
  }, [annotationClockTick, currentTime, isPlaying, safePlaybackRate]);

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

  return {
    effectiveCurrentTime,
  };
};
