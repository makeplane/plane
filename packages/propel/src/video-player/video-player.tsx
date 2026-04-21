/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import {
  FastForward,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture,
  PictureInPicture2,
  Play,
  Rewind,
  Volume2,
  VolumeX,
} from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { useVideoActive } from "./hooks/use-video-active";
import { useVideoAutoHideControls } from "./hooks/use-video-auto-hide-controls";
import { useVideoControls } from "./hooks/use-video-controls";
import { useVideoFullscreen } from "./hooks/use-video-fullscreen";
import { useVideoKeyboard } from "./hooks/use-video-keyboard";
import { useVideoPlayer } from "./hooks/use-video-player";
import { useVideoProgress } from "./hooks/use-video-progress";
import { formatTime, PLAYBACK_SPEEDS } from "./utils";
import type { TPlaybackSpeed } from "./utils";

type Props = {
  src: string;
  className?: string;
  selected?: boolean;
  onLoadedMetadata?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onHandleKeyDown?: (event: KeyboardEvent) => boolean;
  useNativeControls?: boolean;
};

export type VideoPlayerRef = {
  videoElement: HTMLVideoElement | null;
};

export const VideoPlayer = forwardRef(function VideoPlayer(props: Props, ref: React.ForwardedRef<VideoPlayerRef>) {
  const {
    src,
    className,
    selected,
    onLoadedMetadata,
    onBlur,
    onFocus,
    onHandleKeyDown,
    useNativeControls = false,
  } = props;

  // refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  useImperativeHandle(ref, () => ({
    videoElement: videoRef.current,
  }));

  // hooks
  const { isActive, setIsActive, handleContainerClick } = useVideoActive({
    selected,
    onBlur,
    containerRef,
  });
  const {
    isPlaying,
    currentTime,
    duration,
    buffered,
    volume,
    isMuted,
    playbackSpeed,
    setCurrentTime,
    setIsMuted,
    setPlaybackSpeed,
    setVolume,
    handleLoadedMetadata,
    handleTimeUpdate: handleTimeUpdateBase,
    handleProgress,
    handlePlay,
    handlePause,
    handleEnded,
  } = useVideoPlayer({
    videoRef,
    onLoadedMetadata,
    isDragging: false, // Will be handled in component
  });
  const {
    progressRef,
    isDragging,
    hoverTime,
    hoverX,
    handleProgressHover,
    handleProgressLeave,
    handleProgressMouseDown,
    handleProgressTouchStart,
  } = useVideoProgress({
    videoRef,
    duration,
    currentTime,
    setCurrentTime,
  });

  // Create handleTimeUpdate that respects isDragging
  const handleTimeUpdate = useCallback(() => {
    if (!isDragging) {
      handleTimeUpdateBase();
    }
  }, [isDragging, handleTimeUpdateBase]);

  const { togglePlay, seekForward, seekBackward, toggleMute, handleVolumeChange, handleSpeedChange } = useVideoControls(
    {
      videoRef,
      isPlaying,
      isMuted,
      playbackSpeed,
      setIsMuted,
      setVolume,
      setPlaybackSpeed,
    }
  );

  const { isPiP, isFullscreen, togglePiP, toggleFullscreen } = useVideoFullscreen({
    videoRef,
    containerRef,
  });

  const { showControls, setShowControls, resetControlsTimeout } = useVideoAutoHideControls({
    isPlaying,
    isDragging,
    showSpeedMenu,
  });

  useVideoKeyboard({
    isActive,
    togglePlay,
    toggleMute,
    toggleFullscreen,
    seekForward,
    seekBackward,
    setIsActive,
    onFocus,
    onHandleKeyDown,
  });

  const handleSpeedChangeWithMenu = (speed: TPlaybackSpeed) => {
    handleSpeedChange(speed);
    setShowSpeedMenu(false);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  // For mobile devices, return a simple video with native controls
  if (useNativeControls) {
    return (
      <div
        className={cn("relative rounded-md overflow-hidden group !select-none !touch-select-none", className)}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain aspect-video !select-none !touch-select-none"
          preload="metadata"
          controls
          playsInline
          onLoadedMetadata={onLoadedMetadata}
          onCanPlay={handlePlay}
        >
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative group rounded-md overflow-hidden", className)}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={() => {
        setIsActive(true);
        onBlur?.();
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        preload="metadata"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onMouseDown={handleContainerClick}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
      >
        <track kind="captions" />
        Your browser does not support the video tag.
      </video>
      {/* Controls overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 transition-opacity duration-200",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onMouseDown={handleContainerClick}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-1 w-full mb-3 cursor-pointer group/progress"
          onMouseDown={handleProgressMouseDown}
          onTouchStart={handleProgressTouchStart}
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
        >
          {/* Time preview tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute bottom-full mb-2 pointer-events-none z-10"
              style={{
                left: hoverX,
                transform: "translateX(-50%)",
              }}
            >
              <div className="bg-black/90 text-white text-11 px-2 py-1 rounded font-medium tabular-nums">
                {formatTime(hoverTime)}
              </div>
            </div>
          )}
          {/* Background */}
          <div className="absolute inset-0 bg-white/30 rounded-full" />
          {/* Buffered */}
          <div
            className="absolute inset-y-0 left-0 bg-white/50 rounded-full"
            style={{ width: `${bufferedProgress}%` }}
          />
          {/* Progress */}
          <div className="absolute inset-y-0 left-0 bg-white rounded-full" style={{ width: `${progress}%` }} />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
        {/* Controls row */}
        <div className="flex items-center gap-2">
          {/* Left controls */}
          <div className="flex items-center gap-1 flex-1">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"
              title={isPlaying ? "Pause (K)" : "Play (K)"}
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            {/* Seek backward */}
            <button
              type="button"
              onClick={seekBackward}
              className="hidden sm:block p-1.5 rounded hover:bg-white/20 text-white transition-colors"
              title="Rewind 5s"
            >
              <Rewind className="size-4" />
            </button>
            {/* Seek forward */}
            <button
              type="button"
              onClick={seekForward}
              className="hidden sm:block p-1.5 rounded hover:bg-white/20 text-white transition-colors"
              title="Forward 5s"
            >
              <FastForward className="size-4" />
            </button>
            {/* Volume */}
            <div className="flex items-center gap-1 group/volume">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
              >
                {isMuted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="hidden sm:block w-0 opacity-0 group-hover/volume:w-16 group-hover/volume:opacity-100 transition-all duration-200 accent-white h-1 cursor-pointer"
              />
            </div>
            {/* Time display */}
            <span className="text-11 text-white ml-1 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Speed */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded hover:bg-white/20 text-white text-11 font-medium transition-colors"
                title="Playback speed"
              >
                {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-1 bg-surface-1 border border-subtle-1 rounded-md shadow-lg py-1 min-w-16">
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleSpeedChangeWithMenu(speed)}
                      className={cn(
                        "w-full px-3 py-1 text-11 text-left hover:bg-layer-1 transition-colors",
                        playbackSpeed === speed ? "text-accent-primary font-medium" : "text-secondary"
                      )}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* PiP */}
            {"pictureInPictureEnabled" in document && (
              <button
                type="button"
                onClick={togglePiP}
                className="hidden sm:block p-1.5 rounded hover:bg-white/20 text-white transition-colors"
                title="Picture in Picture (P)"
              >
                {isPiP ? <PictureInPicture2 className="size-4" /> : <PictureInPicture className="size-4" />}
              </button>
            )}
            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </button>
          </div>
        </div>
      </div>
      {/* Center play button overlay (when paused) */}
      {!isPlaying && showControls && (
        <button
          type="button"
          onClick={togglePlay}
          onMouseDown={handleContainerClick}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 sm:size-16 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
        >
          <Play className="size-6 sm:size-8 ml-1" />
        </button>
      )}
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";
