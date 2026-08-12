"use client";

import { useEffect, useRef, useState } from "react";
import { clampTimelineValue, getTimelinePercent } from "../utils/video-annotation-timeline";

type VideoAnnotationTimelinePlayheadProps = {
  currentTime: number;
  durationSeconds: number;
  isPlaying: boolean;
  playbackRate: number;
  progressPercent: number;
};

const getClockNow = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export const VideoAnnotationTimelinePlayhead = ({
  currentTime,
  durationSeconds,
  isPlaying,
  playbackRate,
  progressPercent,
}: VideoAnnotationTimelinePlayheadProps) => {
  const [smoothProgressPercent, setSmoothProgressPercent] = useState(progressPercent);
  const clockOriginRef = useRef({
    mediaTime: currentTime,
    wallTime: getClockNow(),
  });
  const safePlaybackRate = Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1;

  useEffect(() => {
    clockOriginRef.current = {
      mediaTime: clampTimelineValue(currentTime, 0, durationSeconds),
      wallTime: getClockNow(),
    };

    if (!isPlaying) {
      setSmoothProgressPercent(progressPercent);
    }
  }, [currentTime, durationSeconds, isPlaying, progressPercent]);

  useEffect(() => {
    if (isPlaying || typeof window === "undefined") return;

    setSmoothProgressPercent(progressPercent);
  }, [isPlaying, progressPercent]);

  useEffect(() => {
    if (!isPlaying || typeof window === "undefined") return;

    let animationFrameId = 0;
    const updatePlayhead = () => {
      const elapsedSeconds = Math.max(0, (getClockNow() - clockOriginRef.current.wallTime) / 1000);
      const nextTime = clampTimelineValue(
        clockOriginRef.current.mediaTime + elapsedSeconds * safePlaybackRate,
        0,
        durationSeconds
      );

      setSmoothProgressPercent(getTimelinePercent(nextTime, durationSeconds));

      if (nextTime < durationSeconds) {
        animationFrameId = window.requestAnimationFrame(updatePlayhead);
      }
    };

    animationFrameId = window.requestAnimationFrame(updatePlayhead);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [currentTime, durationSeconds, isPlaying, safePlaybackRate]);

  return (
    <span
      className="pointer-events-none absolute bottom-0 top-0 z-20 w-0 -translate-x-1/2 border-l-2 border-[#ef4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]"
      style={{ left: `${smoothProgressPercent}%`, willChange: "left" }}
    >
      <span className="absolute -top-px left-1/2 h-2 w-2.5 -translate-x-1/2 rounded-[2px] bg-[#ef4444]" />
    </span>
  );
};
