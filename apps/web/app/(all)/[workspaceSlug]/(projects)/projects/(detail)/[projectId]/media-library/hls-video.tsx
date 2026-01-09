"use client";

import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import Hls from "hls.js";

type THlsVideoProps = {
  src: string;
  poster?: string;
  className?: string;
  controls?: boolean;
  videoRef?: RefObject<HTMLVideoElement>;
};

export const HlsVideo = ({ src, poster, className, controls = true, videoRef }: THlsVideoProps) => {
  const fallbackRef = useRef<HTMLVideoElement | null>(null);
  const targetRef = videoRef ?? fallbackRef;

  useEffect(() => {
    const video = targetRef.current;
    if (!video || !src) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.load();
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => {
        hls.destroy();
      };
    }

    video.src = src;
    video.load();
  }, [src, targetRef]);

  return (
    <video
      ref={targetRef}
      poster={poster}
      controls={controls}
      playsInline
      preload="metadata"
      className={className}
    />
  );
};
