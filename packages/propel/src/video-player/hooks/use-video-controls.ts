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

import { useCallback } from "react";
import type { TPlaybackSpeed } from "../utils";

const SEEK_SECONDS = 5;

type UseVideoControlsProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  isPlaying: boolean;
  isMuted: boolean;
  playbackSpeed: TPlaybackSpeed;
  setIsMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setPlaybackSpeed: (speed: TPlaybackSpeed) => void;
};

export const useVideoControls = ({
  videoRef,
  isPlaying,
  isMuted,
  setIsMuted,
  setVolume,
  setPlaybackSpeed,
}: UseVideoControlsProps) => {
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [videoRef, isPlaying]);

  const seekForward = useCallback(() => {
    if (!videoRef.current) return;
    if (!Number.isFinite(videoRef.current.duration)) return;
    videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + SEEK_SECONDS);
  }, [videoRef]);

  const seekBackward = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - SEEK_SECONDS);
  }, [videoRef]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [videoRef, isMuted, setIsMuted]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!videoRef.current) return;
      const newVolume = parseFloat(e.target.value);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    },
    [videoRef, isMuted, setIsMuted, setVolume]
  );

  const handleSpeedChange = useCallback(
    (speed: TPlaybackSpeed) => {
      if (!videoRef.current) return;
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    },
    [videoRef, setPlaybackSpeed]
  );

  return {
    togglePlay,
    seekForward,
    seekBackward,
    toggleMute,
    handleVolumeChange,
    handleSpeedChange,
  };
};
