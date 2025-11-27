import React from "react";
// image
import VideoFileIcon from "@/app/assets/attachment/video-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function VideoIcon({ width, height }: ImageIconPros) {
  return <img src={VideoFileIcon} width={width} height={height} alt="VideoFileIcon" />;
}
