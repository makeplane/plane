"use client";
import React, { FC, useRef, useState } from "react";
import { Pause, Play, RotateCw } from "lucide-react";

type Props = { src: string };

export const MusicPlayer: FC<Props> = (props) => {
  const { src } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isEnded, setIsEnded] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleReplay = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      setIsEnded(false);
    }
  };

  const togglePlay = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
        setIsEnded(false);
        setShowControls(true);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current && audioRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newTime = pos * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div
      className={`flex items-center bg-custom-background-90 group-hover:bg-custom-background-100 rounded py-1 px-2 transition-all  ease-linear ${
        showControls || isHovered ? "min-w-[200px]" : "w-fit"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      {isEnded ? (
        <button onClick={handleReplay}>
          <RotateCw className="size-3.5" />
        </button>
      ) : (
        <button onClick={togglePlay}>
          {isPlaying ? (
            <Pause className="size-3.5 text-custom-text-300 group-hover:text-custom-text-200 fill-current cursor-pointer" />
          ) : (
            <Play className="size-3.5 text-custom-text-300 group-hover:text-custom-text-200 fill-current cursor-pointer" />
          )}
        </button>
      )}
      <div
        className={`flex items-center gap-2 flex-1 overflow-hidden transition-all  ease-linear  origin-left ${
          showControls || isHovered
            ? "opacity-100 translate-x-0 max-w-full ml-2 "
            : "opacity-0 -translate-x-2 max-w-0  pointer-events-none"
        }`}
      >
        <>
          <span className="text-xs text-custom-text-300 group-hover:text-custom-text-200 whitespace-nowrap">
            {formatTime(currentTime)}/{formatTime(duration)}
          </span>
          <div
            ref={timelineRef}
            className="flex-1 relative h-1 bg-custom-border-200 rounded cursor-pointer"
            onClick={handleTimelineClick}
          >
            <div
              className="absolute h-full bg-custom-text-300 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </>
      </div>
    </div>
  );
};
