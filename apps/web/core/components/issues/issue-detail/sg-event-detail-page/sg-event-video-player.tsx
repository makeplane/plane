"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import videojs from "video.js";
import { cn } from "@plane/utils";
import { useResolvedMediaSources } from "ce/features/media-library/hooks/media-detail-hooks";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import { getQualitySelection, getVideoRepresentations } from "ce/features/media-library/utils/media-detail-utils";
import { PLAYER_FRAME_CLASS, PLAYER_STAGE_CLASS, SG_PLAYER_STYLE } from "./constants";

type SgEventVideoPlayerProps = {
  item: TMediaItem | null;
  compactEmpty?: boolean;
  seekToSeconds?: number | null;
};

type TQualityRepresentation = {
  bandwidth?: number;
  bitrate?: number;
  enabled?: (enabled?: boolean) => boolean;
  height?: number;
  id?: string;
};

type TQualityOption = {
  disabled?: boolean;
  isAuto: boolean;
  key: string;
  label: string;
  rep: TQualityRepresentation | null;
  selected: boolean;
};

const HLS_MIME_TYPES = ["application/x-mpegURL", "application/vnd.apple.mpegurl"] as const;

export const SgEventVideoPlayer = ({ item, compactEmpty = false, seekToSeconds = null }: SgEventVideoPlayerProps) => {
  const normalizedAction = (item?.action ?? "").toLowerCase();
  const documentFormat = (item?.format ?? "").toLowerCase();
  const meta = (item?.meta ?? {}) as Record<string, unknown>;
  const isFiniteTagClip =
    typeof item?.id === "string" &&
    item.id.startsWith("sg-tag-") &&
    typeof meta.playlistFileName === "string" &&
    Boolean(meta.playlistFileName.trim());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playerTick, setPlayerTick] = useState(0);
  const [qualitySelection, setQualitySelection] = useState<string | null>(null);
  const { effectiveVideoSrc, isVideo, resolvedVideoFormat, useCredentials, crossOrigin } = useResolvedMediaSources({
    documentFormat,
    item,
    meta,
    normalizedAction,
  });

  useEffect(() => {
    if (!isVideo || !videoRef.current) {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      return;
    }

    if (!playerRef.current) {
      const skipBackButtonName = "SgSkipBackButton";
      const skipForwardButtonName = "SgSkipForwardButton";
      const previousButtonName = "SgPreviousButton";
      const nextButtonName = "SgPlayButton";
      const loopButtonName = "SgLoopButton";
      const settingsButtonName = "SgSettingsButton";

      if (!videojs.getComponent(previousButtonName)) {
        const Button = videojs.getComponent("Button");
        // video.js exposes component classes through an untyped registry API.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const PreviousButton = class extends (Button as any) {
          constructor(playerInstance: unknown, options: unknown) {
            super(playerInstance, options);
            this.controlText("Jump to start");
            this.addClass("vjs-previous-button");
          }

          handleClick() {
            this.player()?.currentTime?.(0);
          }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videojs.registerComponent(previousButtonName, PreviousButton as any);
      }

      if (!videojs.getComponent(skipBackButtonName)) {
        const Button = videojs.getComponent("Button");
        // video.js exposes component classes through an untyped registry API.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SkipBackButton = class extends (Button as any) {
          constructor(playerInstance: unknown, options: unknown) {
            super(playerInstance, options);
            this.controlText("Skip backward 10 seconds");
            this.addClass("vjs-skip-backward-button");
          }

          handleClick() {
            const player = this.player();
            const currentTime = Number(player?.currentTime?.() ?? 0);
            player?.currentTime?.(Math.max(0, currentTime - 10));
          }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videojs.registerComponent(skipBackButtonName, SkipBackButton as any);
      }

      if (!videojs.getComponent(skipForwardButtonName)) {
        const Button = videojs.getComponent("Button");
        // video.js exposes component classes through an untyped registry API.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SkipForwardButton = class extends (Button as any) {
          constructor(playerInstance: unknown, options: unknown) {
            super(playerInstance, options);
            this.controlText("Skip forward 10 seconds");
            this.addClass("vjs-skip-forward-button");
          }

          handleClick() {
            const player = this.player();
            const currentTime = Number(player?.currentTime?.() ?? 0);
            const duration = Number(player?.duration?.() ?? 0);
            const nextTime = duration > 0 ? Math.min(duration, currentTime + 10) : currentTime + 10;
            player?.currentTime?.(nextTime);
          }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videojs.registerComponent(skipForwardButtonName, SkipForwardButton as any);
      }

      if (!videojs.getComponent(nextButtonName)) {
        const Button = videojs.getComponent("Button");
        // video.js exposes component classes through an untyped registry API.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const NextButton = class extends (Button as any) {
          constructor(playerInstance: unknown, options: unknown) {
            super(playerInstance, options);
            this.controlText("Play");
            this.addClass("vjs-next-button");
          }

          handleClick() {
            const player = this.player();
            const duration = Number(player?.duration?.() ?? 0);
            if (Number.isFinite(duration) && duration > 0) {
              player?.currentTime?.(Math.max(0, duration - 0.01));
            }
          }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videojs.registerComponent(nextButtonName, NextButton as any);
      }

      if (!videojs.getComponent(loopButtonName)) {
        const Button = videojs.getComponent("Button");
        // video.js exposes component classes through an untyped registry API.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const LoopButton = class extends (Button as any) {
          constructor(playerInstance: unknown, options: unknown) {
            super(playerInstance, options);
            this.controlText("Toggle loop");
            this.addClass("vjs-loop-button");
            this.addClass("vjs-control-active");
          }

          handleClick() {
            const player = this.player();
            const nextLoopState = !Boolean(player?.loop?.());
            player?.loop?.(nextLoopState);
            this.toggleClass("vjs-control-active", nextLoopState);
          }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videojs.registerComponent(loopButtonName, LoopButton as any);
      }

      if (!videojs.getComponent(settingsButtonName)) {
        const Button = videojs.getComponent("Button");
        // video.js exposes component classes through an untyped registry API.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SettingsButton = class extends (Button as any) {
          constructor(playerInstance: unknown, options: unknown) {
            super(playerInstance, options);
            this.controlText("Player settings");
            this.addClass("vjs-settings-button");
          }

          handleClick() {
            const player = this.player();
            player?.trigger?.("sgsettingstoggle");
          }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videojs.registerComponent(settingsButtonName, SettingsButton as any);
      }

      playerRef.current = videojs(videoRef.current, {
        autoplay: false,
        controls: true,
        crossOrigin,
        fluid: false,
        html5: {
          nativeAudioTracks: false,
          nativeVideoTracks: false,
          nativeTextTracks: false,
          vhs: {
            overrideNative: true,
            withCredentials: useCredentials,
          },
        },
        muted: false,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        playsinline: true,
        preload: "auto",
        responsive: true,
        controlBar: {
          children: [
            "currentTimeDisplay",
            "progressControl",
            "durationDisplay",
            "volumePanel",
            previousButtonName,
            skipBackButtonName,
            "playToggle",
            skipForwardButtonName,
            nextButtonName,
            loopButtonName,
            "subsCapsButton",
            "pictureInPictureToggle",
            "fullscreenToggle",
            settingsButtonName,
          ],
        },
      });
      playerRef.current.loop(true);
      videoRef.current.removeAttribute("loop");

      const handleQualityStateChange = () => setPlayerTick((currentValue) => currentValue + 1);
      playerRef.current.on("loadedmetadata", handleQualityStateChange);
      playerRef.current.on("loadeddata", handleQualityStateChange);
      playerRef.current.on("canplay", handleQualityStateChange);
      playerRef.current.on("qualitychange", handleQualityStateChange);
      playerRef.current.on("sgsettingstoggle", () => {
        setIsSettingsOpen((currentValue) => !currentValue);
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [crossOrigin, isVideo, useCredentials]);

  useEffect(() => {
    if (!playerRef.current || !effectiveVideoSrc) return;
    const player = playerRef.current;
    const type =
      resolvedVideoFormat === "m3u8"
        ? "application/x-mpegURL"
        : resolvedVideoFormat === "mp4"
          ? "video/mp4"
          : undefined;
    const resolvedSource =
      effectiveVideoSrc ||
      (typeof item?.videoSrc === "string" && item.videoSrc.trim()) ||
      (typeof item?.fileSrc === "string" && item.fileSrc.trim()) ||
      "";
    const sourceCandidates =
      resolvedVideoFormat === "m3u8"
        ? HLS_MIME_TYPES.map((hlsType) => ({
            crossOrigin,
            src: resolvedSource,
            type: hlsType,
            withCredentials: useCredentials,
          }))
        : [
            {
              crossOrigin,
              src: effectiveVideoSrc,
              type,
              withCredentials: useCredentials,
            },
          ];
    let candidateIndex = 0;
    let startupTimer: ReturnType<typeof setTimeout> | null = null;

    const clearStartupTimer = () => {
      if (startupTimer) {
        clearTimeout(startupTimer);
        startupTimer = null;
      }
    };

    const handleLoadedData = () => {
      clearStartupTimer();
    };

    const applyCandidate = (nextIndex: number) => {
      const candidate = sourceCandidates[nextIndex];

      if (!candidate) {
        return;
      }

      const techElement = player.el()?.querySelector("video");
      if (techElement instanceof HTMLVideoElement) {
        if (candidate.crossOrigin) {
          techElement.crossOrigin = candidate.crossOrigin;
        } else {
          techElement.removeAttribute("crossorigin");
        }
      }

      player.src(candidate.type ? { src: candidate.src, type: candidate.type } : { src: candidate.src });
      player.poster(item?.thumbnail ?? "");
      player.load();

      const playAttempt = player.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        void playAttempt.catch(() => {
          // Ignore autoplay failures and let the user start playback manually.
        });
      }

      clearStartupTimer();
      startupTimer = setTimeout(() => {
        const readyState = Number(player.readyState?.() ?? 0);
        const seekable = Number(player.seekable?.().length ?? 0);
        const buffered = Number(player.buffered?.().length ?? 0);
        const duration = Number(player.duration?.() ?? 0);
        const hasStarted =
          readyState >= 1 || seekable > 0 || buffered > 0 || (Number.isFinite(duration) && duration > 0);

        if (!hasStarted) {
          handlePlayerError();
        }
      }, 8000);
    };

    const handlePlayerError = () => {
      clearStartupTimer();
      const nextIndex = candidateIndex + 1;

      if (nextIndex >= sourceCandidates.length) {
        return;
      }

      candidateIndex = nextIndex;
      applyCandidate(candidateIndex);
    };

    player.on("error", handlePlayerError);
    player.on("loadeddata", handleLoadedData);
    applyCandidate(candidateIndex);

    return () => {
      clearStartupTimer();
      player.off("error", handlePlayerError);
      player.off("loadeddata", handleLoadedData);
    };
  }, [
    crossOrigin,
    effectiveVideoSrc,
    item?.fileSrc,
    item?.thumbnail,
    item?.videoSrc,
    resolvedVideoFormat,
    useCredentials,
  ]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isFiniteTagClip) return;

    const handleEnded = () => {
      const duration = Number(player.duration?.() ?? 0);
      player.pause();
      if (Number.isFinite(duration) && duration > 0) {
        try {
          player.currentTime(Math.max(0, duration - 0.01));
        } catch {
          // Leave the player paused at the end if seeking is unavailable.
        }
      }
    };

    player.on("ended", handleEnded);
    return () => {
      player.off("ended", handleEnded);
    };
  }, [isFiniteTagClip, item?.id]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || seekToSeconds == null || seekToSeconds < 0) return;

    const seekAndPlay = () => {
      try {
        player.currentTime(seekToSeconds);
      } catch {
        return;
      }

      const playAttempt = player.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        void playAttempt.catch(() => {
          // Leave the current frame visible if autoplay is blocked.
        });
      }
    };

    if (player.readyState() >= 1) {
      seekAndPlay();
      return;
    }

    player.one("loadeddata", seekAndPlay);

    return () => {
      player.off("loadeddata", seekAndPlay);
    };
  }, [seekToSeconds]);

  const qualityOptions = useMemo(() => {
    const qualityRefreshKey = playerTick;
    void qualityRefreshKey;
    const player = playerRef.current;
    if (!player) {
      return [{ key: "auto", label: "Auto", isAuto: true, selected: true, rep: null, disabled: true }];
    }

    const reps = getVideoRepresentations(player) as TQualityRepresentation[];
    if (!reps.length) {
      return [{ key: "auto", label: "Auto", isAuto: true, selected: true, rep: null, disabled: true }];
    }

    const { isAuto, activeRep } = getQualitySelection(reps);
    const sorted = reps
      .map((rep, index) => ({
        rep,
        height: rep?.height ?? 0,
        bandwidth: rep?.bandwidth ?? rep?.bitrate ?? 0,
        index,
      }))
      .sort((left, right) => {
        if (left.height !== right.height) return right.height - left.height;
        if (left.bandwidth !== right.bandwidth) return right.bandwidth - left.bandwidth;
        return left.index - right.index;
      });
    const fallbackSelected = qualitySelection === null ? (isAuto ? "auto" : null) : qualitySelection;
    const options: TQualityOption[] = [
      {
        key: "auto",
        label: "Auto",
        isAuto: true,
        selected: fallbackSelected === "auto" || (qualitySelection === null && isAuto),
        rep: null,
      },
    ];

    sorted.forEach(({ rep, height, bandwidth }) => {
      const label = height ? `${height}p` : bandwidth ? `${Math.round(bandwidth / 1000)} kbps` : "Source";
      const key = `${label}-${bandwidth}-${height}-${rep?.id ?? ""}`;
      options.push({
        key,
        label,
        isAuto: false,
        selected: qualitySelection === key || (qualitySelection === null && !isAuto && activeRep === rep),
        rep,
      });
    });

    return options;
  }, [playerTick, qualitySelection]);

  const handleQualitySelect = useCallback((option: TQualityOption) => {
    if (option.disabled) return;
    const player = playerRef.current;
    if (!player) return;
    const reps = getVideoRepresentations(player) as TQualityRepresentation[];
    if (!reps.length) return;

    if (option.isAuto) {
      reps.forEach((rep) => rep?.enabled?.(true));
      setQualitySelection("auto");
    } else {
      reps.forEach((rep) => rep?.enabled?.(rep === option.rep));
      if (option.key) setQualitySelection(option.key);
    }

    player.trigger("qualitychange");
    setPlayerTick((currentValue) => currentValue + 1);
  }, []);

  if (!item || !isVideo) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-custom-border-200 bg-custom-background-90 text-sm text-custom-text-300",
          compactEmpty ? "min-h-[180px] px-6 py-8 lg:min-h-[220px]" : `${PLAYER_FRAME_CLASS} px-6 py-8`
        )}
      >
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="text-sm font-medium text-custom-text-200">No SG video available</div>
          <div className="mt-1 text-xs text-custom-text-400">
            This event has metadata and tags, but no playable video source is linked yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl border border-custom-border-200 bg-custom-background-90 p-2 shadow-sm sm:p-3",
        PLAYER_FRAME_CLASS
      )}
    >
      <div className={cn("sg-event-player relative", PLAYER_STAGE_CLASS)}>
        <style jsx global>
          {SG_PLAYER_STYLE}
        </style>
        <video ref={videoRef} className="video-js vjs-big-play-centered" playsInline loop />
        {isSettingsOpen && (
          <div className="absolute bottom-14 right-3 z-10 w-44 rounded-xl border border-custom-border-200 bg-custom-sidebar-background-100 p-3 shadow-2xl">
            <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-custom-text-400">Quality</div>
            <div className="grid grid-cols-2 gap-2">
              {qualityOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleQualitySelect(option)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs transition-colors",
                    option.selected
                      ? "border-custom-primary-100/30 bg-custom-primary-100/15 text-custom-primary-100"
                      : "border-custom-border-200 bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100",
                    option.disabled && "cursor-not-allowed opacity-60 hover:text-custom-text-300"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
