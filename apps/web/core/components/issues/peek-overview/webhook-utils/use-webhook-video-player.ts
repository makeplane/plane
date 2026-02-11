import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";


import { buildSourceCandidates } from "./webhook-artifacts-utils";
import { TWebhookArtifact } from "./webhook-artifacts-types";

export const useWebhookVideoPlayer = (activeArtifact: TWebhookArtifact | null, videoElement: HTMLVideoElement | null) => {
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);

  useEffect(
    () => () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (activeArtifact?.mediaType !== "video" || !videoElement) {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      return;
    }

    const mountedVideoElement: HTMLVideoElement = videoElement;
    const rawSource = activeArtifact.openUrl.trim();
    if (!rawSource) return;

    const normalizedFormat = activeArtifact.format.toLowerCase().trim();
    const normalizedAction = activeArtifact.action.toLowerCase().trim();
    const normalizedSource = rawSource.toLowerCase();
    const normalizedPath = activeArtifact.path.toLowerCase();
    const isHlsStream =
      normalizedFormat === "m3u8" ||
      normalizedFormat === "stream" ||
      normalizedAction === "play_hls" ||
      normalizedAction === "play_streaming" ||
      normalizedAction === "stream" ||
      normalizedSource.includes(".m3u8") ||
      normalizedPath.includes(".m3u8");

    const sourceCandidates = buildSourceCandidates(rawSource, isHlsStream, normalizedFormat);
    if (sourceCandidates.length === 0) return;

    let candidateIndex = 0;
    let isDisposed = false;
    let sourceStartupTimer: ReturnType<typeof setTimeout> | null = null;

    function switchToCandidate(nextIndex: number) {
      if (isDisposed || nextIndex < 0 || nextIndex >= sourceCandidates.length) return;
      const nextCandidate = sourceCandidates[nextIndex];

      if (playerRef.current) {
        playerRef.current.off("error", handlePlayerError);
        playerRef.current.dispose();
        playerRef.current = null;
      }

      const player = videojs(mountedVideoElement, {
        controls: true,
        preload: "auto",
        autoplay: false,
        fluid: true,
        responsive: true,
        playsinline: true,
        crossOrigin: nextCandidate.crossOrigin,
        html5: {
          vhs: {
            withCredentials: nextCandidate.withCredentials,
            overrideNative: true,
          },
        },
      });

      playerRef.current = player;
      player.on("error", handlePlayerError);
      player.one("loadeddata", () => {
        if (sourceStartupTimer) {
          clearTimeout(sourceStartupTimer);
          sourceStartupTimer = null;
        }
      });

      player.src(nextCandidate.type ? { src: nextCandidate.src, type: nextCandidate.type } : { src: nextCandidate.src });
      player.load();

      const playAttempt = player.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        void playAttempt.catch(() => {
          // Ignore autoplay failures and let the user start playback manually.
        });
      }

      if (sourceStartupTimer) {
        clearTimeout(sourceStartupTimer);
      }
      sourceStartupTimer = setTimeout(() => {
        if (isDisposed) return;
        const currentPlayer = playerRef.current;
        if (!currentPlayer) return;
        const duration = currentPlayer.duration();
        const hasMetadata = typeof duration === "number" && Number.isFinite(duration) && duration > 0;
        if (!hasMetadata) {
          handlePlayerError();
        }
      }, 8000);
    }

    function handlePlayerError() {
      if (sourceStartupTimer) {
        clearTimeout(sourceStartupTimer);
        sourceStartupTimer = null;
      }
      const nextIndex = candidateIndex + 1;
      if (nextIndex >= sourceCandidates.length) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Unable to preview video",
          message: "No compatible source was found for this artifact.",
        });
        return;
      }

      candidateIndex = nextIndex;
      switchToCandidate(candidateIndex);
    }

    switchToCandidate(candidateIndex);

    return () => {
      isDisposed = true;
      if (sourceStartupTimer) {
        clearTimeout(sourceStartupTimer);
        sourceStartupTimer = null;
      }
      if (playerRef.current) {
        playerRef.current.off("error", handlePlayerError);
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [activeArtifact, videoElement]);
};
