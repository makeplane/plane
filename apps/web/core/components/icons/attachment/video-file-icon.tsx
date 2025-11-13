import React from "react";
// image
import VideoFileIcon from "@/app/assets/attachment/video-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const VideoIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={VideoFileIcon} width={width} height={height} className="h-full w-full object-contain" alt="VideoFileIcon" />
);
