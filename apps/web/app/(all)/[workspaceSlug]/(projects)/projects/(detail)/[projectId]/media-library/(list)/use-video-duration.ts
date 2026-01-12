"use client";

import { useEffect, useState } from "react";
import type { TMediaItem } from "./media-items";

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
};

export const useVideoDuration = (item: TMediaItem) => {
  const [durationLabel, setDurationLabel] = useState(item.duration);

  useEffect(() => {
    if (item.mediaType !== "video") return;
    if (!item.videoSrc) return;

    let isCancelled = false;
    const video = document.createElement("video");
    const handleLoaded = () => {
      if (isCancelled) return;
      const seconds = video.duration;
      if (Number.isFinite(seconds) && seconds > 0) {
        setDurationLabel(formatDuration(seconds));
      } else {
        setDurationLabel(item.duration);
      }
    };
    const handleError = () => {
      if (isCancelled) return;
      setDurationLabel(item.duration);
    };

    video.preload = "metadata";
    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("error", handleError);
    video.src = item.videoSrc;
    video.load();

    return () => {
      isCancelled = true;
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("error", handleError);
      video.src = "";
    };
  }, [item.duration, item.mediaType, item.videoSrc]);

  return item.mediaType === "video" ? durationLabel : "-";
};
